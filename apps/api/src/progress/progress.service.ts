import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { RecordAnswerDto } from '../common/dto';

@Injectable()
export class ProgressService {
  constructor(private readonly supabase: SupabaseService) {}

  /** Record an answer and update rollups: user_progress, topic_progress, mistakes, daily stats, XP. */
  async recordAnswer(userId: string, dto: RecordAnswerDto) {
    const now = new Date().toISOString();

    await this.supabase.admin.from('user_progress').insert({
      user_id: userId,
      question_id: dto.question_id,
      subject_id: dto.subject_id,
      topic_id: dto.topic_id ?? null,
      difficulty: dto.difficulty,
      is_correct: dto.is_correct,
      time_spent_seconds: dto.time_spent_seconds ?? null,
      answered_at: now,
    });

    if (dto.topic_id) {
      await this.upsertTopicProgress(userId, dto.topic_id, dto.is_correct, dto.time_spent_seconds);
    }
    await this.upsertMistake(userId, dto);
    const xpEarned = dto.is_correct ? 10 : 2;
    await this.upsertDailyStats(userId, dto.is_correct, dto.time_spent_seconds, xpEarned);
    await this.addXp(userId, xpEarned);
    await this.updateStreak(userId);

    return { recorded: true };
  }

  private async upsertTopicProgress(userId: string, topicId: string, correct: boolean, timeSpent?: number) {
    const { data } = await this.supabase.admin
      .from('topic_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .maybeSingle();

    if (!data) {
      await this.supabase.admin.from('topic_progress').insert({
        user_id: userId,
        topic_id: topicId,
        attempted: 1,
        correct: correct ? 1 : 0,
        last_accuracy: correct ? 100 : 0,
        best_streak: correct ? 1 : 0,
        current_streak: correct ? 1 : 0,
        avg_time_seconds: timeSpent ?? 0,
      });
      return;
    }

    const attempted = data.attempted + 1;
    const correctCount = data.correct + (correct ? 1 : 0);
    const accuracy = Math.round((correctCount / attempted) * 10000) / 100;
    const avgTime = data.avg_time_seconds
      ? (data.avg_time_seconds * data.attempted + (timeSpent ?? 0)) / attempted
      : (timeSpent ?? 0);

    await this.supabase.admin
      .from('topic_progress')
      .update({
        attempted,
        correct: correctCount,
        last_accuracy: accuracy,
        current_streak: correct ? (data.current_streak ?? 0) + 1 : 0,
        best_streak: correct ? Math.max(data.best_streak ?? 0, (data.current_streak ?? 0) + 1) : data.best_streak,
        avg_time_seconds: Math.round(avgTime * 100) / 100,
      })
      .eq('id', data.id);
  }

  private async upsertMistake(userId: string, dto: RecordAnswerDto) {
    if (dto.is_correct) {
      const { data } = await this.supabase.admin
        .from('mistakes')
        .select('*')
        .eq('user_id', userId)
        .eq('question_id', dto.question_id)
        .maybeSingle();
      if (data) {
        const correctCount = data.correct_count + 1;
        const total = data.wrong_count + correctCount;
        await this.supabase.admin
          .from('mistakes')
          .update({
            correct_count: correctCount,
            last_accuracy: Math.round((correctCount / total) * 10000) / 100,
            resolved: correctCount >= data.wrong_count,
          })
          .eq('id', data.id);
      }
      return;
    }

    const { data } = await this.supabase.admin
      .from('mistakes')
      .select('*')
      .eq('user_id', userId)
      .eq('question_id', dto.question_id)
      .maybeSingle();

    if (data) {
      await this.supabase.admin
        .from('mistakes')
        .update({
          wrong_count: data.wrong_count + 1,
          last_wrong_at: new Date().toISOString(),
          resolved: false,
          topic_id: dto.topic_id ?? data.topic_id,
        })
        .eq('id', data.id);
    } else {
      await this.supabase.admin.from('mistakes').insert({
        user_id: userId,
        question_id: dto.question_id,
        topic_id: dto.topic_id ?? null,
        last_wrong_at: new Date().toISOString(),
        wrong_count: 1,
        correct_count: 0,
        last_accuracy: 0,
        resolved: false,
      });
    }
  }

  private async upsertDailyStats(userId: string, correct: boolean, timeSpent?: number, xpEarned?: number) {
    const date = new Date().toISOString().slice(0, 10);
    const { data } = await this.supabase.admin
      .from('daily_user_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle();

    if (!data) {
      await this.supabase.admin.from('daily_user_stats').insert({
        user_id: userId,
        date,
        questions_answered: 1,
        questions_correct: correct ? 1 : 0,
        minutes_studied: Math.max(1, Math.round((timeSpent ?? 60) / 60)),
        xp_earned: xpEarned ?? 0,
      });
    } else {
      await this.supabase.admin
        .from('daily_user_stats')
        .update({
          questions_answered: data.questions_answered + 1,
          questions_correct: data.questions_correct + (correct ? 1 : 0),
          minutes_studied: data.minutes_studied + Math.max(1, Math.round((timeSpent ?? 60) / 60)),
          xp_earned: (data.xp_earned ?? 0) + (xpEarned ?? 0),
        })
        .eq('id', data.id);
    }
  }

  /** Recompute and persist the daily streak (consecutive study days) for the user. */
  private async updateStreak(userId: string) {
    const { data } = await this.supabase.admin
      .from('daily_user_stats')
      .select('date')
      .eq('user_id', userId)
      .order('date', { ascending: true });
    if (!data || data.length === 0) return;

    const days = new Set(data.map((d) => d.date));
    const today = new Date().toISOString().slice(0, 10);

    // Current streak: count consecutive days ending today (or yesterday if today has no activity yet).
    let currentStreak = 0;
    const cursor = new Date();
    const cursorKey = cursor.toISOString().slice(0, 10);
    if (!days.has(cursorKey)) cursor.setDate(cursor.getDate() - 1);
    while (days.has(cursor.toISOString().slice(0, 10))) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    // Longest streak: walk sorted dates and count runs.
    const sorted = Array.from(days).sort();
    let longestStreak = 0;
    let run = 0;
    let prev: string | null = null;
    for (const d of sorted) {
      if (prev) {
        const gap = Math.round((new Date(d).getTime() - new Date(prev).getTime()) / 86400000);
        run = gap === 1 ? run + 1 : 1;
      } else {
        run = 1;
      }
      longestStreak = Math.max(longestStreak, run);
      prev = d;
    }

    const hasToday = days.has(today);
    await this.supabase.admin
      .from('user_stats')
      .update({
        current_streak: currentStreak,
        longest_streak: hasToday ? Math.max(longestStreak, currentStreak) : longestStreak,
      })
      .eq('user_id', userId);
  }

  private async addXp(userId: string, amount: number) {
    const { data } = await this.supabase.admin
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data) {
      await this.supabase.admin.from('user_stats').insert({
        user_id: userId,
        xp: amount,
        level: 1,
        total_questions_answered: 1,
        total_questions_correct: amount >= 10 ? 1 : 0,
      });
      return;
    }

    const xp = data.xp + amount;
    const level = Math.floor(xp / 100) + 1;
    await this.supabase.admin
      .from('user_stats')
      .update({
        xp,
        level,
        total_questions_answered: data.total_questions_answered + 1,
        total_questions_correct: data.total_questions_correct + (amount >= 10 ? 1 : 0),
      })
      .eq('id', data.id);

    await this.supabase.admin.from('xp_events').insert({ user_id: userId, amount, reason: amount >= 10 ? 'correct_answer' : 'answer' });
  }

  /** Aggregate per-topic accuracy for the user (weak/strong areas). */
  async getTopicBreakdown(userId: string) {
    const { data, error } = await this.supabase.admin
      .from('topic_progress')
      .select('topic_id, attempted, correct, last_accuracy, topic:topics(id, name, subject:subjects(id, name))')
      .eq('user_id', userId)
      .gt('attempted', 0)
      .order('last_accuracy', { ascending: true });
    if (error) throw error;
    return data;
  }

  /** Global stats rollup for the user. */
  async getSummary(userId: string) {
    const [stats, attempts, streak] = await Promise.all([
      this.supabase.admin.from('user_stats').select('*').eq('user_id', userId).maybeSingle(),
      this.supabase.admin
        .from('test_attempts')
        .select('score, correct_count, total_questions, submitted_at')
        .eq('user_id', userId)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false }),
      this.supabase.admin
        .from('daily_user_stats')
        .select('date, questions_answered')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(30),
    ]);

    const attemptRows = attempts.data ?? [];
    const accuracy = (() => {
      let correct = 0;
      let total = 0;
      for (const a of attemptRows) {
        correct += a.correct_count ?? 0;
        total += a.total_questions ?? 0;
      }
      return total > 0 ? Math.round((correct / total) * 100) : null;
    })();

    // compute streak from consecutive days
    let currentStreak = 0;
    const dates = new Set((streak.data ?? []).map((d) => d.date));
    const cursor = new Date();
    while (dates.has(cursor.toISOString().slice(0, 10))) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return {
      stats: stats.data ?? null,
      accuracy,
      current_streak: currentStreak,
      recent_attempts: attemptRows.slice(0, 10),
    };
  }
}
