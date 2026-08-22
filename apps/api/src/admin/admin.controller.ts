import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminGuard } from '../common/guards/admin.guard';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { AdminContentService, UpdateQuestionDto } from './admin-content.service';
import { QuestionGenService } from './question-gen.service';
import { SupabaseService } from '../supabase/supabase.service';
import { GenerateQuestionsDto } from '../common/dto';

enum LeaderboardMetric {
  XP = 'xp',
  Questions = 'questions',
}

class GetWeeklyQueryDto {
  @IsEnum(LeaderboardMetric)
  metric: LeaderboardMetric;

  @IsBoolean()
  opted_in_only: boolean;
}

@Controller('admin')
@UseGuards(SupabaseAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly content: AdminContentService,
    private readonly gen: QuestionGenService,
    private readonly supabase: SupabaseService,
  ) {}

  // ---- Overview ----

  @Get('overview')
  async overview() {
    const [questions, users, attempts, reports, queue] = await Promise.all([
      this.supabase.admin.from('questions').select('id', { count: 'exact', head: true }),
      this.supabase.admin.from('profiles').select('id', { count: 'exact', head: true }),
      this.supabase.admin.from('test_attempts').select('id', { count: 'exact', head: true }),
      this.supabase.admin.from('question_reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      this.content.getReviewQueueStats(),
    ]);
    return {
      total_questions: questions.count ?? 0,
      total_users: users.count ?? 0,
      total_attempts: attempts.count ?? 0,
      open_reports: reports.count ?? 0,
      review_queue: queue,
    };
  }

  // ---- Question review ----

  @Get('questions')
  listForReview(
    @Query('status') status?: string,
    @Query('subject_id') subjectId?: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
  ) {
    return this.content.listForReview({
      status,
      subject_id: subjectId,
      page: page ? Number(page) : undefined,
      page_size: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Patch('questions/:id')
  updateQuestion(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.content.updateQuestion(id, dto);
  }

  @Post('questions/:id/review')
  review(
    @CurrentUser('id') adminUserId: string,
    @Param('id') id: string,
    @Body() body: { status: string; comment?: string },
  ) {
    return this.content.setReviewStatus(adminUserId, id, body.status, body.comment);
  }

  @Post('questions/:id/regenerate')
  regenerate(@Param('id') id: string) {
    return this.content.regenerate(id);
  }

  // ---- AI Generator ----

  @Post('generate')
  generate(@CurrentUser('id') adminUserId: string, @Body() dto: GenerateQuestionsDto) {
    return this.gen.generateBatch(adminUserId, dto);
  }

  // ---- Content taxonomy (admin CRUD) ----

  @Post('subjects')
  async createSubject(@Body() body: { code: string; name: string; category: string; description?: string }) {
    const { data, error } = await this.supabase.admin.from('subjects').insert(body).select().single();
    if (error) throw error;
    return data;
  }

  @Post('topics')
  async createTopic(@Body() body: { subject_id: string; name: string; description?: string }) {
    const { data, error } = await this.supabase.admin.from('topics').insert(body).select().single();
    if (error) throw error;
    return data;
  }

  @Post('programs')
  async createProgram(@Body() body: { university_id: string; code: string; name: string; description?: string; campus?: string }) {
    const { data, error } = await this.supabase.admin.from('programs').insert(body).select().single();
    if (error) throw error;
    return data;
  }

  @Post('test-configs')
  async createTestConfig(
    @Body() body: { program_id: string; university_id: string; name: string; total_questions: number; total_marks: number; duration_minutes: number; negative_marking?: boolean; pass_percentage?: number },
  ) {
    const { data, error } = await this.supabase.admin.from('test_configurations').insert(body).select().single();
    if (error) throw error;
    return data;
  }

  // ---- Reports ----

  @Get('reports')
  async listReports() {
    const { data, error } = await this.supabase.admin
      .from('question_reports')
      .select('id, question_id, reason, detail, status, created_at, question:questions(question_text), user:profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return data;
  }

  @Patch('reports/:id')
  async updateReport(@Param('id') id: string, @Body() body: { status: string }) {
    const { data, error } = await this.supabase.admin
      .from('question_reports')
      .update({ status: body.status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // ---- AI usage ----

  @Get('ai-usage')
  async aiUsage() {
    const { data, error } = await this.supabase.admin
      .from('ai_usage')
      .select('id, user_id, feature, model, prompt_tokens, completion_tokens, status, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return data;
  }

  // ---- Audit log ----

  @Get('audit-log')
  async auditLog() {
    const { data, error } = await this.supabase.admin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return data;
  }

  // ---- Leaderboard stats ----

  @Get('leaderboard/stats')
  async leaderboardStats() {
    const [{ data: events }, { data: stats }, { data: profiles }] = await Promise.all([
      this.supabase.admin
        .from('xp_events')
        .select('user_id')
        .gte('created_at', this.startOfWeek(new Date()).toISOString()),
      this.supabase.admin.from('user_stats').select('user_id, leaderboard_opt_in'),
      this.supabase.admin.from('profiles').select('user_id, full_name'),
    ]);

    const optedIn = new Set(
      (stats ?? [])
        .filter((s) => s.leaderboard_opt_in)
        .map((s) => s.user_id),
    );
    const nameByUser = new Map(
      (profiles ?? []).map((p) => [p.user_id, p.full_name]),
    );

    const correctByUser = new Map<string, number>();
    const incorrectByUser = new Map<string, number>();

    for (const e of events ?? []) {
      if (!optedIn.has(e.user_id)) continue;
      if (!correctByUser.has(e.user_id)) correctByUser.set(e.user_id, 0);
      if (!incorrectByUser.has(e.user_id)) incorrectByUser.set(e.user_id, 0);
      if ((e.amount ?? 0) > 0) {
        correctByUser.set(e.user_id, (correctByUser.get(e.user_id) ?? 0) + 1);
      } else {
        incorrectByUser.set(e.user_id, (incorrectByUser.get(e.user_id) ?? 0) + 1);
      }
    }

    const results = Array.from(correctByUser.entries())
      .map(([uid, correct]) => ({
        user_id: uid,
        full_name: nameByUser.get(uid) ?? 'Student',
        correct,
        incorrect: incorrectByUser.get(uid) ?? 0,
        total: (correctByUser.get(uid) ?? 0) + (incorrectByUser.get(uid) ?? 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 100);

    return results;
  }

  @Get('leaderboard/opt-in-status')
  async leaderboardOptInStatus() {
    const [{ data: stats }, { data: profiles }] = await Promise.all([
      this.supabase.admin.from('user_stats').select('user_id, leaderboard_opt_in'),
      this.supabase.admin.from('profiles').select('user_id, full_name'),
    ]);

    const optedInMap = new Map(
      (stats ?? []).map((s) => [s.user_id, s.leaderboard_opt_in]),
    );
    const results = (profiles ?? []).map((p) => ({
      user_id: p.user_id,
      full_name: p.full_name ?? 'Unknown',
      opted_in: optedInMap.get(p.user_id) ?? false,
    }));

    return results;
  }

  private startOfWeek(now: Date): Date {
    const d = new Date(now);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
