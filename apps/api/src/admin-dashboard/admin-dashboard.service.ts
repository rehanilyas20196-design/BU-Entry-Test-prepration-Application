import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { parse } from 'csv-parse/sync';
import { SupabaseService } from '../supabase/supabase.service';
import { AdminPrincipal } from './admin-auth.guard';
import { CreateQuestionDto, UpdateQuestionDto } from './admin-dashboard.dto';

const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  // ============================================================
  // AUTH
  // ============================================================

  async login(email: string, password: string) {
    const secret = this.config.get<string>('ADMIN_JWT_SECRET');
    if (!secret) {
      throw new UnauthorizedException('Admin auth is not configured (ADMIN_JWT_SECRET missing)');
    }

    const { data: cred } = await this.supabase.admin
      .from('admin_credentials')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (!cred || !cred.is_active) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, cred.password_hash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.supabase.admin
      .from('admin_credentials')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', cred.id);

    const token = jwt.sign(
      { email: cred.email, role: 'admin', display_name: cred.display_name },
      secret,
      { expiresIn: '12h', subject: cred.email },
    );

    await this.log(cred.email, 'admin.login', 'admin', cred.id, {});

    return {
      token,
      email: cred.email,
      display_name: cred.display_name,
      expires_in: 12 * 60 * 60,
    };
  }

  async logout(admin: AdminPrincipal) {
    await this.log(admin.email, 'admin.logout', 'admin', null, {});
    return { logged_out: true };
  }

  // ============================================================
  // STATS
  // ============================================================

  async stats() {
    const today = new Date();
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startWeek = new Date(startToday.getTime() - 7 * 86400000);

    const [{ count: totalUsers }, { count: totalPremium }, { count: totalTests }, { count: totalQuestions }] =
      await Promise.all([
        this.supabase.admin.from('profiles').select('id', { count: 'exact', head: true }),
        this.supabase.admin.from('profiles').select('id', { count: 'exact', head: true }).eq('is_premium', true),
        this.supabase.admin.from('test_attempts').select('id', { count: 'exact', head: true }).not('submitted_at', 'is', null),
        this.supabase.admin.from('questions').select('id', { count: 'exact', head: true }),
      ]);

    // New signups from auth.users
    const users = await this.listAllAuthUsers();
    const signupsToday = users.filter((u) => new Date(u.created_at) >= startToday).length;
    const signupsThisWeek = users.filter((u) => new Date(u.created_at) >= startWeek).length;

    const { count: paymentsToday } = await this.supabase.admin
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startToday.toISOString());

    const { count: testsToday } = await this.supabase.admin
      .from('test_attempts')
      .select('id', { count: 'exact', head: true })
      .not('submitted_at', 'is', null)
      .gte('submitted_at', startToday.toISOString());

    return {
      total_users: totalUsers ?? 0,
      total_premium: totalPremium ?? 0,
      total_tests: totalTests ?? 0,
      total_questions: totalQuestions ?? 0,
      signups_today: signupsToday,
      signups_this_week: signupsThisWeek,
      payments_today: paymentsToday ?? 0,
      tests_today: testsToday ?? 0,
    };
  }

  // ============================================================
  // USERS
  // ============================================================

  private async listAllAuthUsers() {
    const all: any[] = [];
    let page = 1;
    for (let i = 0; i < 20; i++) {
      const { data } = await this.supabase.admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (!data || data.users.length === 0) break;
      all.push(...data.users);
      if (data.users.length < 1000) break;
      page++;
    }
    return all;
  }

  async listUsers(params: { q?: string; premium?: string; onboarded?: string; date_from?: string; date_to?: string; page?: number; page_size?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(params.page_size ?? 20, 100);

    const [authUsers, profiles] = await Promise.all([
      this.listAllAuthUsers(),
      this.supabase.admin.from('profiles').select('user_id, full_name, campus, test_date, is_premium, onboarded, preparation_level, created_at'),
    ]);

    const emailById = new Map(authUsers.map((u) => [u.id, u.email]));
    const signupById = new Map(authUsers.map((u) => [u.id, u.created_at]));

    const rows = (profiles.data ?? []).map((p: any) => {
      const attempts = 0; // filled below if needed (per-user test count is computed lazily)
      return {
        user_id: p.user_id,
        email: emailById.get(p.user_id) ?? '',
        full_name: p.full_name,
        campus: p.campus,
        test_date: p.test_date,
        is_premium: p.is_premium,
        onboarded: p.onboarded,
        preparation_level: p.preparation_level,
        created_at: signupById.get(p.user_id) ?? p.created_at,
        tests_completed: attempts,
      };
    });

    let filtered = rows;
    if (params.q) {
      const q = params.q.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.email || '').toLowerCase().includes(q) ||
          (r.full_name || '').toLowerCase().includes(q),
      );
    }
    if (params.premium === 'true' || params.premium === 'false') {
      filtered = filtered.filter((r) => String(r.is_premium) === params.premium);
    }
    if (params.onboarded === 'true' || params.onboarded === 'false') {
      filtered = filtered.filter((r) => String(r.onboarded) === params.onboarded);
    }
    if (params.date_from) {
      const from = new Date(params.date_from);
      filtered = filtered.filter((r) => new Date(r.created_at) >= from);
    }
    if (params.date_to) {
      const to = new Date(params.date_to);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((r) => new Date(r.created_at) <= to);
    }

    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const total = filtered.length;
    const data = filtered.slice((page - 1) * pageSize, page * pageSize);

    // Attach test counts for the page
    if (data.length > 0) {
      const ids = data.map((r) => r.user_id);
      const { data: attemptRows } = await this.supabase.admin
        .from('test_attempts')
        .select('user_id')
        .not('submitted_at', 'is', null)
        .in('user_id', ids);
      const counts = new Map<string, number>();
      for (const a of attemptRows ?? []) counts.set(a.user_id, (counts.get(a.user_id) ?? 0) + 1);
      for (const row of data) row.tests_completed = counts.get(row.user_id) ?? 0;
    }

    return { data, total, page, page_size: pageSize };
  }

  async getUserDetail(userId: string) {
    const [authUser, profile, attempts, mistakes, payments, progress] = await Promise.all([
      this.supabase.admin.auth.admin.getUserById(userId),
      this.supabase.admin.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
      this.supabase.admin
        .from('test_attempts')
        .select('id, mode, status, started_at, submitted_at, score, max_score, correct_count, incorrect_count, unanswered_count, total_questions, mock_test:mock_tests(name)')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(100),
      this.supabase.admin.from('mistakes').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      this.supabase.admin
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      this.supabase.admin.from('user_progress').select('question_id, is_correct, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(200),
    ]);

    if (!authUser.data?.user && !profile.data) {
      throw new NotFoundException('User not found');
    }

    const correctCount = (progress.data ?? []).filter((p: any) => p.is_correct).length;
    const activityByDay = new Map<string, number>();
    for (const p of progress.data ?? []) {
      const day = (p.created_at as string).slice(0, 10);
      activityByDay.set(day, (activityByDay.get(day) ?? 0) + 1);
    }

    return {
      user: {
        user_id: userId,
        email: authUser.data?.user?.email ?? '',
        created_at: authUser.data?.user?.created_at ?? null,
        last_sign_in_at: authUser.data?.user?.last_sign_in_at ?? null,
      },
      profile: profile.data ?? null,
      mistakes_count: mistakes.count ?? 0,
      attempts: attempts.data ?? [],
      payments: payments.data ?? [],
      activity: [...activityByDay.entries()].map(([date, count]) => ({ date, count })),
      questions_answered: progress.data?.length ?? 0,
      questions_correct: correctCount,
    };
  }

  // ============================================================
  // TESTS
  // ============================================================

  async listTests(params: { mode?: string; status?: string; page?: number; page_size?: number; q?: string }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(params.page_size ?? 25, 100);

    const [authUsers, attempts] = await Promise.all([
      this.listAllAuthUsers(),
      this.supabase.admin
        .from('test_attempts')
        .select(
          'id, user_id, mode, status, started_at, submitted_at, score, max_score, correct_count, incorrect_count, unanswered_count, total_questions, duration_seconds, mock_test:mock_tests(name), test_config:test_configurations(name)',
          { count: 'exact' },
        )
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1),
    ]);

    if (attempts.error) throw attempts.error;

    const emailById = new Map(authUsers.map((u) => [u.id, u.email]));
    const data = (attempts.data ?? []).map((a: any) => ({
      ...a,
      email: emailById.get(a.user_id) ?? '',
    }));

    let filtered = data;
    if (params.mode) filtered = filtered.filter((a) => a.mode === params.mode);
    if (params.status) filtered = filtered.filter((a) => a.status === params.status);
    if (params.q) {
      const q = params.q.toLowerCase();
      filtered = filtered.filter((a) => (a.email || '').toLowerCase().includes(q));
    }

    return { data: filtered, total: attempts.count ?? 0, page, page_size: pageSize };
  }

  // ============================================================
  // QUESTIONS (CRUD + CSV)
  // ============================================================

  async listQuestions(params: { subject_id?: string; topic_id?: string; difficulty?: string; review_status?: string; q?: string; page?: number; page_size?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(params.page_size ?? 25, 100);
    let query = this.supabase.admin
      .from('questions')
      .select(
        'id, subject_id, topic_id, difficulty, question_text, correct_option, review_status, explanation, hint, created_at, updated_at, subject:subjects(name), topic:topics(name), options:question_options(option_key, option_text, is_correct)',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (params.subject_id) query = query.eq('subject_id', params.subject_id);
    if (params.topic_id) query = query.eq('topic_id', params.topic_id);
    if (params.difficulty) query = query.eq('difficulty', params.difficulty);
    if (params.review_status) query = query.eq('review_status', params.review_status);
    if (params.q) query = query.ilike('question_text', `%${params.q}%`);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data, total: count ?? 0, page, page_size: pageSize };
  }

  async getQuestion(id: string) {
    const { data, error } = await this.supabase.admin
      .from('questions')
      .select(
        'id, subject_id, topic_id, difficulty, question_text, correct_option, explanation, hint, review_status, created_at, updated_at, subject:subjects(name), topic:topics(name), options:question_options(option_key, option_text, is_correct)',
      )
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Question not found');
    return data;
  }

  async createQuestion(admin: AdminPrincipal, dto: CreateQuestionDto) {
    const options = (dto.options ?? []).filter((o) => o.option_text?.trim());
    if (options.length < 2) throw new BadRequestException('Provide at least 2 options');
    if (!options.some((o) => o.option_key === dto.correct_option)) {
      throw new BadRequestException('correct_option must match one of the options');
    }

    const { data, error } = await this.supabase.admin
      .from('questions')
      .insert({
        subject_id: dto.subject_id,
        topic_id: dto.topic_id ?? null,
        difficulty: dto.difficulty ?? 'medium',
        question_text: dto.question_text,
        correct_option: dto.correct_option,
        explanation: dto.explanation ?? null,
        hint: dto.hint ?? null,
        review_status: dto.review_status ?? 'approved',
      })
      .select('id')
      .single();
    if (error) throw error;

    await this.supabase.admin.from('question_options').insert(
      options.map((o) => ({
        question_id: data.id,
        option_key: o.option_key,
        option_text: o.option_text,
        is_correct: o.option_key === dto.correct_option,
      })),
    );

    await this.log(admin.email, 'question.created', 'question', data.id, { question_text: dto.question_text.slice(0, 80) });
    return this.getQuestion(data.id);
  }

  async updateQuestion(admin: AdminPrincipal, id: string, dto: UpdateQuestionDto) {
    const patch: Record<string, unknown> = {};
    if (dto.subject_id !== undefined) patch.subject_id = dto.subject_id;
    if (dto.topic_id !== undefined) patch.topic_id = dto.topic_id || null;
    if (dto.difficulty !== undefined) patch.difficulty = dto.difficulty;
    if (dto.question_text !== undefined) patch.question_text = dto.question_text;
    if (dto.correct_option !== undefined) patch.correct_option = dto.correct_option;
    if (dto.explanation !== undefined) patch.explanation = dto.explanation || null;
    if (dto.hint !== undefined) patch.hint = dto.hint || null;
    if (dto.review_status !== undefined) patch.review_status = dto.review_status;

    if (Object.keys(patch).length > 0) {
      const { error } = await this.supabase.admin.from('questions').update(patch).eq('id', id);
      if (error) throw error;
    }

    if (dto.options && dto.options.length > 0) {
      const options = dto.options.filter((o) => o.option_text?.trim());
      if (options.length < 2) throw new BadRequestException('Provide at least 2 options');
      await this.supabase.admin.from('question_options').delete().eq('question_id', id);
      await this.supabase.admin.from('question_options').insert(
        options.map((o) => ({
          question_id: id,
          option_key: o.option_key,
          option_text: o.option_text,
          is_correct: o.option_key === (dto.correct_option ?? patch.correct_option),
        })),
      );
    }

    await this.log(admin.email, 'question.updated', 'question', id, { fields: Object.keys(patch) });
    return this.getQuestion(id);
  }

  async deleteQuestion(admin: AdminPrincipal, id: string) {
    const { error } = await this.supabase.admin.from('questions').delete().eq('id', id);
    if (error) throw error;
    await this.log(admin.email, 'question.deleted', 'question', id, {});
    return { deleted: true };
  }

  async importQuestions(admin: AdminPrincipal, csv: string) {
    let records: any[];
    try {
      records = parse(csv, { columns: true, skip_empty_lines: true, trim: true }) as any[];
    } catch (e: any) {
      throw new BadRequestException(`Could not parse CSV: ${e.message}`);
    }

    const [subjects, topics] = await Promise.all([
      this.supabase.admin.from('subjects').select('id, name'),
      this.supabase.admin.from('topics').select('id, subject_id, name'),
    ]);

    const subjectIdByName = new Map<string, string>();
    for (const s of subjects.data ?? []) subjectIdByName.set(s.name.toLowerCase(), s.id);
    const topicIdByKey = new Map<string, string>();
    for (const t of topics.data ?? []) topicIdByKey.set(`${t.subject_id}|${t.name.toLowerCase()}`, t.id);

    let created = 0;
    const errors: string[] = [];

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const rowNum = i + 2; // header is row 1
      try {
        const subjectId = subjectIdByName.get((r.subject || '').trim().toLowerCase());
        if (!subjectId) {
          errors.push(`Row ${rowNum}: unknown subject "${r.subject}"`);
          continue;
        }
        if (!r.question_text) {
          errors.push(`Row ${rowNum}: missing question_text`);
          continue;
        }
        const correct = (r.correct_option || '').trim().toUpperCase();
        if (!['A', 'B', 'C', 'D'].includes(correct)) {
          errors.push(`Row ${rowNum}: correct_option must be A/B/C/D`);
          continue;
        }
        const opts = ['A', 'B', 'C', 'D']
          .map((k) => ({ option_key: k, option_text: (r[`option_${k.toLowerCase()}`] || '').trim() }))
          .filter((o) => o.option_text);
        if (opts.length < 2) {
          errors.push(`Row ${rowNum}: provide at least 2 options (option_a, option_b, ...)`);
          continue;
        }

        let topicId: string | null = null;
        if (r.topic?.trim()) {
          topicId = topicIdByKey.get(`${subjectId}|${r.topic.trim().toLowerCase()}`) ?? null;
          if (!topicId) {
            const { data: newTopic, error: tErr } = await this.supabase.admin
              .from('topics')
              .insert({ subject_id: subjectId, name: r.topic.trim() })
              .select('id')
              .single();
            if (!tErr && newTopic) {
              topicId = newTopic.id;
              topicIdByKey.set(`${subjectId}|${r.topic.trim().toLowerCase()}`, newTopic.id);
            }
          }
        }

        const difficulty = DIFFICULTIES.includes((r.difficulty || '').trim().toLowerCase())
          ? (r.difficulty as string).trim().toLowerCase()
          : 'medium';

        const { data: q, error: qErr } = await this.supabase.admin
          .from('questions')
          .insert({
            subject_id: subjectId,
            topic_id: topicId,
            difficulty,
            question_text: r.question_text.trim(),
            correct_option: correct,
            explanation: r.explanation?.trim() || null,
            hint: r.hint?.trim() || null,
            review_status: (r.review_status || 'approved').trim().toLowerCase(),
          })
          .select('id')
          .single();

        if (qErr) throw qErr;
        await this.supabase.admin.from('question_options').insert(
          opts.map((o) => ({ question_id: q.id, option_key: o.option_key, option_text: o.option_text, is_correct: o.option_key === correct })),
        );
        created++;
      } catch (e: any) {
        errors.push(`Row ${rowNum}: ${e.message}`);
      }
    }

    await this.log(admin.email, 'question.import', 'question', null, { created, errors: errors.length });
    return { created, errors: errors.slice(0, 50), total: records.length };
  }

  // ============================================================
  // PREMIUM
  // ============================================================

  async listPremium(params: { page?: number; page_size?: number; q?: string }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(params.page_size ?? 25, 100);

    const [authUsers, payments] = await Promise.all([
      this.listAllAuthUsers(),
      this.supabase.admin
        .from('payments')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1),
    ]);

    const emailById = new Map(authUsers.map((u) => [u.id, u.email]));
    const data = (payments.data ?? []).map((p: any) => ({
      ...p,
      email: emailById.get(p.user_id) ?? '',
    }));

    let filtered = data;
    if (params.q) {
      const q = params.q.toLowerCase();
      filtered = filtered.filter((p) => (p.email || '').toLowerCase().includes(q) || (p.trx_id || '').toLowerCase().includes(q));
    }

    return { data: filtered, total: payments.count ?? 0, page, page_size: pageSize };
  }

  async grantPremium(admin: AdminPrincipal, userId: string) {
    const { data, error } = await this.supabase.admin
      .from('profiles')
      .upsert({ user_id: userId, is_premium: true }, { onConflict: 'user_id' })
      .select('user_id, is_premium')
      .single();
    if (error) throw error;
    await this.log(admin.email, 'premium.granted', 'user', userId, {});
    return data;
  }

  async revokePremium(admin: AdminPrincipal, userId: string) {
    const { data, error } = await this.supabase.admin
      .from('profiles')
      .update({ is_premium: false })
      .eq('user_id', userId)
      .select('user_id, is_premium')
      .single();
    if (error) throw error;
    await this.log(admin.email, 'premium.revoked', 'user', userId, {});
    return data;
  }

  // ============================================================
  // ANALYTICS
  // ============================================================

  async analytics(period: 'day' | 'week' | 'month') {
    const buckets = period === 'day' ? 30 : period === 'week' ? 12 : 12;
    const labels: string[] = [];
    const starts: Date[] = [];
    const now = new Date();
    for (let i = buckets - 1; i >= 0; i--) {
      const d = new Date(now);
      if (period === 'day') {
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        labels.push(d.toISOString().slice(0, 10));
      } else if (period === 'week') {
        const dayOffset = (d.getDay() + 6) % 7; // Monday start
        d.setDate(d.getDate() - dayOffset - i * 7);
        d.setHours(0, 0, 0, 0);
        labels.push(`${d.toISOString().slice(0, 10)}`);
      } else {
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        labels.push(d.toISOString().slice(0, 7));
      }
      starts.push(d);
    }

    const [authUsers, attempts, payments] = await Promise.all([
      this.listAllAuthUsers(),
      this.supabase.admin.from('test_attempts').select('submitted_at').not('submitted_at', 'is', null),
      this.supabase.admin.from('payments').select('created_at'),
    ]);

    const countIn = (items: any[], field: string, index: number, periodType: string) =>
      items.filter((it) => {
        const d = new Date(it[field]);
        const s = starts[index];
        const e = index + 1 < buckets ? starts[index + 1] : new Date(now.getTime() + 86400000);
        if (periodType === 'month') {
          return d.getFullYear() === s.getFullYear() && d.getMonth() === s.getMonth();
        }
        return d >= s && d < e;
      }).length;

    const signups = labels.map((_, i) => countIn(authUsers, 'created_at', i, period));
    const testsCompleted = labels.map((_, i) => countIn(attempts.data ?? [], 'submitted_at', i, period));
    const premiumConversions = labels.map((_, i) => countIn(payments.data ?? [], 'created_at', i, period));

    return { period, labels, signups, tests_completed: testsCompleted, premium_conversions: premiumConversions };
  }

  // ============================================================
  // ACTIVITY LOG
  // ============================================================

  private async log(adminEmail: string, action: string, entityType: string | null, entityId: string | null, details: Record<string, unknown>) {
    try {
      await this.supabase.admin.from('admin_activity_log').insert({
        admin_email: adminEmail,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
      });
    } catch {
      // logging must never break the main request
    }
  }

  async listActivity(params: { page?: number; page_size?: number; q?: string }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(params.page_size ?? 50, 200);
    let query = this.supabase.admin
      .from('admin_activity_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (params.q) query = query.ilike('action', `%${params.q}%`);
    const { data, error, count } = await query;
    if (error) throw error;
    return { data, total: count ?? 0, page, page_size: pageSize };
  }

  // ============================================================
  // CATALOG (for question filters)
  // ============================================================

  async catalog() {
    const [subjects, topics, programs] = await Promise.all([
      this.supabase.admin.from('subjects').select('id, name').eq('is_active', true).order('sort_order'),
      this.supabase.admin.from('topics').select('id, subject_id, name').eq('is_active', true).order('name'),
      this.supabase.admin.from('programs').select('id, name').eq('is_active', true).order('name'),
    ]);
    return {
      subjects: subjects.data ?? [],
      topics: topics.data ?? [],
      programs: programs.data ?? [],
    };
  }
}
