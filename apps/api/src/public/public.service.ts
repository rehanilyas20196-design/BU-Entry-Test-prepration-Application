import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class PublicService {
  constructor(private readonly supabase: SupabaseService) {}

  /** A free 5-question sample quiz for first-time visitors (no login required). */
  async getSampleQuiz() {
    const limit = 5;

    const builder = this.supabase.admin
      .from('questions')
      .select(
        'id, subject_id, topic_id, difficulty, question_text, correct_option, explanation, hint, topic:topics(id, name), subject:subjects(id, name), options:question_options(option_key, option_text, is_correct)',
      )
      .eq('review_status', 'approved');

    // Prefer a few easy/medium questions so the sample quiz feels approachable.
    const { data, error } = await builder
      .in('difficulty', ['easy', 'medium'])
      .limit(100);
    if (error) throw error;

    const pool = (data ?? []).filter(
      (q) => q.options && q.options.length > 0 && q.correct_option,
    );
    if (pool.length === 0) {
      return [];
    }

    const picked = this.shuffle(pool).slice(0, limit);
    return picked.map((q: any) => ({
      id: q.id,
      difficulty: q.difficulty,
      question_text: q.question_text,
      correct_option: q.correct_option,
      explanation: q.explanation,
      hint: q.hint,
      subject: Array.isArray(q.subject) ? q.subject[0] : q.subject,
      topic: Array.isArray(q.topic) ? q.topic[0] : q.topic,
      options: (q.options ?? []).map((o: any) => ({
        key: o.option_key,
        text: o.option_text,
      })),
    }));
  }

  /** Real social-proof stats. Returns null-ish when counts are too small to look credible. */
  async getPublicStats() {
    const today = new Date().toISOString().slice(0, 10);

    const [{ data: daily }, { data: users }, { data: questionsToday }] = await Promise.all([
      this.supabase.admin
        .from('daily_user_stats')
        .select('user_id')
        .eq('date', today),
      this.supabase.admin
        .from('user_stats')
        .select('user_id')
        .gt('total_questions_answered', 0),
      this.supabase.admin
        .from('daily_user_stats')
        .select('questions_answered')
        .eq('date', today),
    ]);

    const activeToday = new Set((daily ?? []).map((d) => d.user_id)).size;
    const activeUsers = new Set((users ?? []).map((u) => u.user_id)).size;
    const questionsAnsweredToday = (questionsToday ?? []).reduce(
      (sum, d) => sum + (d.questions_answered ?? 0),
      0,
    );

    // Hide the stat gracefully when the numbers are too low to look credible.
    const visible = activeUsers >= 20;

    return {
      visible,
      active_users: activeUsers,
      active_today: activeToday,
      questions_answered_today: questionsAnsweredToday,
    };
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