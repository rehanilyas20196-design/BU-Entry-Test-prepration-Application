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
import {
  CreateQuestionDto,
  UpdateCatalogDto,
  UpdateQuestionDto,
} from './admin-dashboard.dto';

const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];

function toCsv(headers: (string | number)[], rows: (string | number | null | undefined)[][]): string {
  const esc = (v: string | number | null | undefined) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(esc).join(',')];
  for (const row of rows) lines.push(row.map(esc).join(','));
  return lines.join('\n');
}

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

    const [paymentsTodayRows, testsToday, questionsTodayRows, xpTodayRows, activeTodayRows] = await Promise.all([
      this.supabase.admin.from('payments').select('amount').gte('created_at', startToday.toISOString()),
      this.supabase.admin.from('test_attempts').select('id', { count: 'exact', head: true }).not('submitted_at', 'is', null).gte('submitted_at', startToday.toISOString()),
      this.supabase.admin.from('user_progress').select('id').gte('created_at', startToday.toISOString()),
      this.supabase.admin.from('xp_events').select('amount').gte('created_at', startToday.toISOString()),
      this.supabase.admin.from('user_progress').select('user_id').gte('created_at', startToday.toISOString()),
    ]);

    const paymentsToday = paymentsTodayRows.data ?? [];
    const revenueToday = paymentsToday.reduce((acc: number, p: any) => acc + Number(p.amount ?? 0), 0);
    const xpToday = (xpTodayRows.data ?? []).reduce((acc: number, x: any) => acc + Number(x.amount ?? 0), 0);
    const activeUsersToday = new Set((activeTodayRows.data ?? []).map((a: any) => a.user_id)).size;

    return {
      total_users: totalUsers ?? 0,
      total_premium: totalPremium ?? 0,
      total_tests: totalTests ?? 0,
      total_questions: totalQuestions ?? 0,
      signups_today: signupsToday,
      signups_this_week: signupsThisWeek,
      payments_today: paymentsToday.length,
      revenue_today: revenueToday,
      tests_today: testsToday.count ?? 0,
      questions_answered_today: questionsTodayRows.data?.length ?? 0,
      xp_earned_today: xpToday,
      active_users_today: activeUsersToday,
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
  // EXPORTS (CSV)
  // ============================================================

  async exportUsers() {
    const [authUsers, profiles] = await Promise.all([
      this.listAllAuthUsers(),
      this.supabase.admin.from('profiles').select('user_id, full_name, campus, test_date, is_premium, onboarded, preparation_level, created_at'),
    ]);
    const emailById = new Map(authUsers.map((u) => [u.id, u.email]));
    const signupById = new Map(authUsers.map((u) => [u.id, u.created_at]));
    const rows = (profiles.data ?? []).map((p: any) => [
      emailById.get(p.user_id) ?? '',
      p.full_name ?? '',
      p.campus ?? '',
      p.test_date ?? '',
      p.is_premium ? 'yes' : 'no',
      p.onboarded ? 'yes' : 'no',
      p.preparation_level ?? '',
      signupById.get(p.user_id) ?? p.created_at ?? '',
    ]);
    return toCsv(
      ['email', 'full_name', 'campus', 'test_date', 'is_premium', 'onboarded', 'preparation_level', 'created_at'],
      rows,
    );
  }

  async exportTests() {
    const [authUsers, attempts] = await Promise.all([
      this.listAllAuthUsers(),
      this.supabase.admin
        .from('test_attempts')
        .select('user_id, mode, status, started_at, submitted_at, score, max_score, correct_count, incorrect_count, unanswered_count, total_questions, duration_seconds')
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false })
        .limit(5000),
    ]);
    const emailById = new Map(authUsers.map((u) => [u.id, u.email]));
    const rows = (attempts.data ?? []).map((a: any) => [
      emailById.get(a.user_id) ?? a.user_id,
      a.mode ?? '',
      a.status ?? '',
      a.started_at ?? '',
      a.submitted_at ?? '',
      a.score ?? '',
      a.max_score ?? '',
      a.correct_count ?? '',
      a.incorrect_count ?? '',
      a.unanswered_count ?? '',
      a.total_questions ?? '',
      a.duration_seconds ?? '',
    ]);
    return toCsv(
      ['email', 'mode', 'status', 'started_at', 'submitted_at', 'score', 'max_score', 'correct', 'incorrect', 'unanswered', 'total_questions', 'duration_seconds'],
      rows,
    );
  }

  async exportPayments() {
    const [authUsers, payments] = await Promise.all([
      this.listAllAuthUsers(),
      this.supabase.admin.from('payments').select('*').order('created_at', { ascending: false }).limit(5000),
    ]);
    const emailById = new Map(authUsers.map((u) => [u.id, u.email]));
    const rows = (payments.data ?? []).map((p: any) => [
      emailById.get(p.user_id) ?? p.user_id,
      p.trx_id ?? '',
      p.sender_phone ?? '',
      p.amount ?? '',
      p.payment_method ?? '',
      p.status ?? '',
      p.created_at ?? '',
    ]);
    return toCsv(['email', 'trx_id', 'sender_phone', 'amount', 'payment_method', 'status', 'created_at'], rows);
  }

  // ============================================================
  // ANNOUNCEMENTS (broadcast)
  // ============================================================

  async createAnnouncement(admin: AdminPrincipal, dto: { title: string; body?: string; type?: string }) {
    const type = ['info', 'success', 'warning', 'promo', 'update'].includes(dto.type ?? '') ? (dto.type as string) : 'info';
    const users = await this.listAllAuthUsers();

    let inserted = 0;
    const chunkSize = 500;
    for (let i = 0; i < users.length; i += chunkSize) {
      const chunk = users.slice(i, i + chunkSize).map((u) => ({
        user_id: u.id,
        type,
        title: dto.title,
        body: dto.body ?? null,
        data: { source: 'broadcast' },
      }));
      const { error } = await this.supabase.admin.from('notifications').insert(chunk);
      if (!error) inserted += chunk.length;
    }

    const { data: record, error } = await this.supabase.admin
      .from('broadcasts')
      .insert({ title: dto.title, body: dto.body ?? null, type, recipient_count: inserted, created_by: admin.email })
      .select()
      .single();
    if (error) throw error;

    await this.log(admin.email, 'broadcast.created', 'broadcast', record.id, { recipients: inserted });
    return record;
  }

  async listAnnouncements() {
    const { data, error } = await this.supabase.admin
      .from('broadcasts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return data ?? [];
  }

  // ============================================================
  // COUPONS
  // ============================================================

  async createCoupon(admin: AdminPrincipal, dto: { code: string; discount_type: string; discount_value?: number; max_uses?: number | null; expires_at?: string | null }) {
    const code = dto.code.trim().toUpperCase();
    if (!code) throw new BadRequestException('Coupon code is required');
    const { data, error } = await this.supabase.admin
      .from('premium_coupons')
      .insert({
        code,
        discount_type: dto.discount_type,
        discount_value: dto.discount_value ?? 0,
        max_uses: dto.max_uses ?? null,
        expires_at: dto.expires_at ?? null,
        created_by: admin.email,
      })
      .select()
      .single();
    if (error) throw error;
    await this.log(admin.email, 'coupon.created', 'coupon', data.id, { code });
    return data;
  }

  async listCoupons() {
    const { data, error } = await this.supabase.admin
      .from('premium_coupons')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  }

  async toggleCoupon(admin: AdminPrincipal, id: string, isActive: boolean) {
    const { data, error } = await this.supabase.admin
      .from('premium_coupons')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    await this.log(admin.email, isActive ? 'coupon.activated' : 'coupon.deactivated', 'coupon', id, { code: data.code });
    return data;
  }

  // ============================================================
  // CATALOG MANAGEMENT
  // ============================================================

  async manageCatalog() {
    const [subjects, topics, programs, universities, questions] = await Promise.all([
      this.supabase.admin.from('subjects').select('*').order('sort_order'),
      this.supabase.admin.from('topics').select('*').order('name'),
      this.supabase.admin.from('programs').select('*, university:universities(name)').order('name'),
      this.supabase.admin.from('universities').select('*').order('name'),
      this.supabase.admin.from('questions').select('subject_id, topic_id'),
    ]);
    const qBySubject = new Map<string, number>();
    const qByTopic = new Map<string, number>();
    for (const q of questions.data ?? []) {
      if (q.subject_id) qBySubject.set(q.subject_id, (qBySubject.get(q.subject_id) ?? 0) + 1);
      if (q.topic_id) qByTopic.set(q.topic_id, (qByTopic.get(q.topic_id) ?? 0) + 1);
    }
    return {
      subjects: (subjects.data ?? []).map((s: any) => ({ ...s, question_count: qBySubject.get(s.id) ?? 0 })),
      topics: (topics.data ?? []).map((t: any) => ({ ...t, question_count: qByTopic.get(t.id) ?? 0 })),
      programs: programs.data ?? [],
      universities: universities.data ?? [],
    };
  }

  async createSubject(admin: AdminPrincipal, dto: { code: string; name: string; category?: string; description?: string; sort_order?: number }) {
    const { data, error } = await this.supabase.admin
      .from('subjects')
      .insert({
        code: dto.code.trim(),
        name: dto.name.trim(),
        category: dto.category ?? 'verbal',
        description: dto.description ?? null,
        sort_order: dto.sort_order ?? 0,
      })
      .select()
      .single();
    if (error) throw error;
    await this.log(admin.email, 'subject.created', 'subject', data.id, { name: data.name });
    return data;
  }

  async updateSubject(admin: AdminPrincipal, id: string, dto: UpdateCatalogDto) {
    const { data, error } = await this.supabase.admin.from('subjects').update(dto).eq('id', id).select().single();
    if (error) throw error;
    await this.log(admin.email, 'subject.updated', 'subject', id, { fields: Object.keys(dto) });
    return data;
  }

  async toggleSubject(admin: AdminPrincipal, id: string, isActive: boolean) {
    const { data, error } = await this.supabase.admin.from('subjects').update({ is_active: isActive }).eq('id', id).select().single();
    if (error) throw error;
    await this.log(admin.email, isActive ? 'subject.activated' : 'subject.deactivated', 'subject', id, { name: data.name });
    return data;
  }

  async createTopic(admin: AdminPrincipal, dto: { subject_id: string; name: string; description?: string }) {
    const { data, error } = await this.supabase.admin
      .from('topics')
      .insert({ subject_id: dto.subject_id, name: dto.name.trim(), description: dto.description ?? null })
      .select()
      .single();
    if (error) throw error;
    await this.log(admin.email, 'topic.created', 'topic', data.id, { name: data.name });
    return data;
  }

  async updateTopic(admin: AdminPrincipal, id: string, dto: UpdateCatalogDto) {
    const { data, error } = await this.supabase.admin.from('topics').update(dto).eq('id', id).select().single();
    if (error) throw error;
    await this.log(admin.email, 'topic.updated', 'topic', id, { fields: Object.keys(dto) });
    return data;
  }

  async toggleTopic(admin: AdminPrincipal, id: string, isActive: boolean) {
    const { data, error } = await this.supabase.admin.from('topics').update({ is_active: isActive }).eq('id', id).select().single();
    if (error) throw error;
    await this.log(admin.email, isActive ? 'topic.activated' : 'topic.deactivated', 'topic', id, { name: data.name });
    return data;
  }

  async createProgram(admin: AdminPrincipal, dto: { university_id: string; code: string; name: string; description?: string; campus?: string }) {
    const { data, error } = await this.supabase.admin
      .from('programs')
      .insert({
        university_id: dto.university_id,
        code: dto.code.trim(),
        name: dto.name.trim(),
        description: dto.description ?? null,
        campus: dto.campus ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    await this.log(admin.email, 'program.created', 'program', data.id, { name: data.name });
    return data;
  }

  async updateProgram(admin: AdminPrincipal, id: string, dto: UpdateCatalogDto) {
    const { data, error } = await this.supabase.admin.from('programs').update(dto).eq('id', id).select().single();
    if (error) throw error;
    await this.log(admin.email, 'program.updated', 'program', id, { fields: Object.keys(dto) });
    return data;
  }

  async toggleProgram(admin: AdminPrincipal, id: string, isActive: boolean) {
    const { data, error } = await this.supabase.admin.from('programs').update({ is_active: isActive }).eq('id', id).select().single();
    if (error) throw error;
    await this.log(admin.email, isActive ? 'program.activated' : 'program.deactivated', 'program', id, { name: data.name });
    return data;
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
