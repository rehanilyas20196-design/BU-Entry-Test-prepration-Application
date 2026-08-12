import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { StartTestDto, SubmitAnswerDto } from '../common/dto';

@Injectable()
export class TestsService {
  constructor(private readonly supabase: SupabaseService) {}

  async listMockTests() {
    const { data, error } = await this.supabase.admin
      .from('mock_tests')
      .select('id, name, description, question_count, duration_minutes, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  /** Start a test attempt: creates attempt + snapshots the question set in order. */
  async startAttempt(userId: string, dto: StartTestDto) {
    const { data: mockTest, error: mtErr } = await this.supabase.admin
      .from('mock_tests')
      .select('*')
      .eq('id', dto.mock_test_id)
      .eq('is_active', true)
      .maybeSingle();
    if (mtErr) throw mtErr;
    if (!mockTest) throw new NotFoundException('Mock test not found');

    const { data: questions, error: qErr } = await this.supabase.admin
      .from('mock_test_questions')
      .select('question_id, order_index, question:questions(id, subject_id, topic_id, difficulty, question_text, correct_option, options:question_options(option_key, option_text, is_correct))')
      .eq('mock_test_id', dto.mock_test_id)
      .order('order_index', { ascending: true });
    if (qErr) throw qErr;

    if (!questions || questions.length === 0) {
      throw new BadRequestException('This mock test has no questions configured');
    }

    // Randomize question order in full_mock mode to reduce cheating.
    const ordered = dto.mode === 'full_mock' ? this.shuffle(questions) : questions;

    const { data: attempt, error: aErr } = await this.supabase.admin
      .from('test_attempts')
      .insert({
        user_id: userId,
        mock_test_id: dto.mock_test_id,
        test_config_id: mockTest.test_config_id,
        mode: dto.mode ?? 'practice',
        status: 'in_progress',
        total_questions: ordered.length,
        max_score: mockTest.question_count,
      })
      .select()
      .single();
    if (aErr) throw aErr;

    return {
      attempt,
      duration_minutes: mockTest.duration_minutes,
      questions: ordered.map((row, i) => {
        const q = (Array.isArray((row as any).question) ? (row as any).question[0] : (row as any).question) as any;
        return {
          order: i,
          question: {
            id: q.id,
            subject_id: q.subject_id,
            topic_id: q.topic_id,
            difficulty: q.difficulty,
            question_text: q.question_text,
            options: (q.options ?? []).map((o: any) => ({
              key: o.option_key,
              text: o.option_text,
            })),
          },
        };
      }),
    };
  }

  /** Record a single answer mid-attempt (optionally shuffled-safe by server). */
  async saveAnswer(userId: string, dto: SubmitAnswerDto) {
    const { data: attempt, error: aErr } = await this.supabase.admin
      .from('test_attempts')
      .select('*')
      .eq('id', dto.attempt_id)
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .maybeSingle();
    if (aErr) throw aErr;
    if (!attempt) throw new NotFoundException('Attempt not found or already submitted');

    const { data: question, error: qErr } = await this.supabase.admin
      .from('questions')
      .select('correct_option')
      .eq('id', dto.question_id)
      .maybeSingle();
    if (qErr) throw qErr;
    if (!question) throw new NotFoundException('Question not found');

    const isCorrect = dto.selected_option != null && dto.selected_option === question.correct_option;

    const { data, error } = await this.supabase.admin
      .from('test_answers')
      .upsert(
        {
          attempt_id: dto.attempt_id,
          question_id: dto.question_id,
          selected_option: dto.selected_option,
          is_correct: isCorrect,
          time_spent_seconds: dto.time_spent_seconds ?? null,
          answered_at: new Date().toISOString(),
        },
        { onConflict: 'attempt_id,question_id' },
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /** Finalize an attempt. Scoring is 100% server-side. */
  async submitAttempt(userId: string, attemptId: string, dto: { duration_seconds?: number }) {
    const { data: attempt, error: aErr } = await this.supabase.admin
      .from('test_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', userId)
      .maybeSingle();
    if (aErr) throw aErr;
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.status === 'submitted') {
      return this.getResult(userId, attemptId);
    }

    const { data: answers, error: ansErr } = await this.supabase.admin
      .from('test_answers')
      .select('question_id, selected_option, is_correct, time_spent_seconds')
      .eq('attempt_id', attemptId);
    if (ansErr) throw ansErr;

    const correct = (answers ?? []).filter((a) => a.is_correct).length;
    const incorrect = (answers ?? []).filter((a) => a.is_correct === false).length;
    const unanswered = attempt.total_questions - (answers ?? []).length;
    const score = attempt.max_score > 0 ? Math.round((correct / attempt.total_questions) * attempt.max_score * 100) / 100 : 0;

    const { error: upErr } = await this.supabase.admin
      .from('test_attempts')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        duration_seconds: dto.duration_seconds ?? null,
        score,
        correct_count: correct,
        incorrect_count: incorrect,
        unanswered_count: unanswered,
      })
      .eq('id', attemptId);
    if (upErr) throw upErr;

    // Update aggregate user stats
    const { data: stats } = await this.supabase.admin
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (stats) {
      await this.supabase.admin
        .from('user_stats')
        .update({
          total_mock_tests: (stats.total_mock_tests ?? 0) + 1,
          best_mock_score: Math.max(stats.best_mock_score ?? 0, score),
        })
        .eq('id', stats.id);
    }

    return this.getResult(userId, attemptId);
  }

  /** Full result breakdown: score, per-subject/topic/difficulty performance. */
  async getResult(userId: string, attemptId: string) {
    const { data: attempt, error: aErr } = await this.supabase.admin
      .from('test_attempts')
      .select('*, mock_test:mock_tests(*)')
      .eq('id', attemptId)
      .eq('user_id', userId)
      .maybeSingle();
    if (aErr) throw aErr;
    if (!attempt) throw new NotFoundException('Attempt not found');

    const { data: answers, error: ansErr } = await this.supabase.admin
      .from('test_answers')
      .select('question_id, selected_option, is_correct, question:questions(subject_id, topic_id, difficulty, correct_option, explanation, question_text, topic:topics(name), subject:subjects(name))')
      .eq('attempt_id', attemptId);
    if (ansErr) throw ansErr;

    const rows = (answers ?? []).map((a: any) => {
      const question = Array.isArray(a.question) ? a.question[0] : a.question;
      const subject = question?.subject ? (Array.isArray(question.subject) ? question.subject[0] : question.subject) : undefined;
      const topic = question?.topic ? (Array.isArray(question.topic) ? question.topic[0] : question.topic) : undefined;
      return { ...a, question: { ...question, subject, topic } };
    });

    const avgTime =
      rows.reduce((s, a) => s + (a.time_spent_seconds ?? 0), 0) / Math.max(rows.length, 1);

    const subjectPerf = this.groupBy(rows, (a) => a.question?.subject?.name ?? 'Unknown');
    const topicPerf = this.groupBy(rows, (a) => a.question?.topic?.name ?? 'Unknown');
    const difficultyPerf = this.groupBy(rows, (a) => a.question?.difficulty);

    const incorrect = rows.filter((a) => a.is_correct === false);

    return {
      attempt,
      summary: {
        score: attempt.score,
        percentage: attempt.max_score > 0 ? Math.round((attempt.score / attempt.max_score) * 10000) / 100 : 0,
        correct_count: attempt.correct_count,
        incorrect_count: attempt.incorrect_count,
        unanswered_count: attempt.unanswered_count,
        duration_seconds: attempt.duration_seconds,
        avg_time_per_question_seconds: Math.round(avgTime * 100) / 100,
      },
      subject_performance: subjectPerf,
      topic_performance: topicPerf,
      difficulty_performance: difficultyPerf,
      incorrect_questions: incorrect.map((a) => ({
        question_id: a.question_id,
        question_text: a.question?.question_text,
        selected_option: a.selected_option,
        correct_option: a.question?.correct_option,
        explanation: a.question?.explanation,
        subject: a.question?.subject?.name,
        topic: a.question?.topic?.name,
      })),
    };
  }

  private groupBy<T, K>(arr: T[], keyFn: (item: T) => K) {
    const map = new Map<K, { attempted: number; correct: number }>();
    for (const item of arr) {
      const key = keyFn(item);
      const entry = map.get(key) ?? { attempted: 0, correct: 0 };
      entry.attempted++;
      if ((item as { is_correct?: boolean }).is_correct) entry.correct++;
      map.set(key, entry);
    }
    return Array.from(map.entries()).map(([key, v]) => ({
      name: String(key),
      attempted: v.attempted,
      correct: v.correct,
      accuracy: v.attempted > 0 ? Math.round((v.correct / v.attempted) * 10000) / 100 : 0,
    }));
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
