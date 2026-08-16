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
      progressRows,
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
      this.supabase.admin
        .from('user_progress')
        .select('is_correct, subject:subjects(id, name)')
        .eq('user_id', userId)
        .limit(5000),
    ]);

    const topicRows = (topicProgress.data ?? []).filter((t) => t.topic);
    const weakTopics = topicRows.filter((t) => t.last_accuracy !== null && t.last_accuracy < 60).slice(0, 5);
    const strongTopics = [...topicRows].reverse().filter((t) => t.last_accuracy !== null && t.last_accuracy >= 75).slice(0, 5);

    const subjectBreakdown = this.aggregateBySubject(progressRows.data ?? []);

    return {
      stats: stats.data ?? null,
      current_streak: stats.data?.current_streak ?? 0,
      longest_streak: stats.data?.longest_streak ?? 0,
      weak_topics: weakTopics,
      strong_topics: strongTopics,
      topic_breakdown: topicRows,
      subject_breakdown: subjectBreakdown,
      overall_accuracy: subjectBreakdown.reduce((s, x) => s + x.correct, 0) /
        Math.max(subjectBreakdown.reduce((s, x) => s + x.attempted, 0), 1) * 100,
      mock_tests: attempts.data ?? [],
      daily_activity: dailyStats.data ?? [],
    };
  }

  /** Aggregate answer accuracy per subject (Overall Score / per-subject performance). */
  private aggregateBySubject(rows: any[]) {
    const map = new Map<string, { attempted: number; correct: number }>();
    for (const r of rows) {
      const subject = r.subject ? (Array.isArray(r.subject) ? r.subject[0] : r.subject) : undefined;
      const name = subject?.name ?? 'General';
      const entry = map.get(name) ?? { attempted: 0, correct: 0 };
      entry.attempted++;
      if (r.is_correct) entry.correct++;
      map.set(name, entry);
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({
        name,
        attempted: v.attempted,
        correct: v.correct,
        accuracy: Math.round((v.correct / Math.max(v.attempted, 1)) * 10000) / 100,
      }))
      .sort((a, b) => a.accuracy - b.accuracy);
  }
}
