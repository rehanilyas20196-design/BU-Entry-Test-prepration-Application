import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly supabase: SupabaseService) {}

  /** Full dashboard analytics for a student. */
  async getStudentAnalytics(userId: string) {
    const [
      stats,
      topicProgress,
      attempts,
      dailyStats,
    ] = await Promise.all([
      this.supabase.admin.from('user_stats').select('*').eq('user_id', userId).maybeSingle(),
      this.supabase.admin
        .from('topic_progress')
        .select('topic_id, attempted, correct, last_accuracy, avg_time_seconds, topic:topics(id, name, subject:subjects(id, name))')
        .eq('user_id', userId)
        .gt('attempted', 0)
        .order('last_accuracy', { ascending: true }),
      this.supabase.admin
        .from('test_attempts')
        .select('id, score, correct_count, incorrect_count, unanswered_count, total_questions, mode, status, duration_seconds, started_at, submitted_at')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(20),
      this.supabase.admin
        .from('daily_user_stats')
        .select('date, questions_answered, questions_correct, minutes_studied, xp_earned')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(30),
    ]);

    const topicRows = (topicProgress.data ?? []).filter((t) => t.topic);
    const weakTopics = topicRows.filter((t) => t.last_accuracy !== null && t.last_accuracy < 60).slice(0, 5);
    const strongTopics = [...topicRows].reverse().filter((t) => t.last_accuracy !== null && t.last_accuracy >= 75).slice(0, 5);

    return {
      stats: stats.data ?? null,
      weak_topics: weakTopics,
      strong_topics: strongTopics,
      topic_breakdown: topicRows,
      mock_tests: attempts.data ?? [],
      daily_activity: dailyStats.data ?? [],
    };
  }
}
