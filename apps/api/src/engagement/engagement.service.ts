import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class EngagementService {
  constructor(private readonly supabase: SupabaseService) {}

  // ---- Bookmarks ----

  async listBookmarks(userId: string, filters: { subject_id?: string; topic_id?: string; difficulty?: string }) {
    let query = this.supabase.admin
      .from('bookmarks')
      .select('id, created_at, question:questions(id, subject_id, topic_id, difficulty, question_text, correct_option, subject:subjects(name), topic:topics(name))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (filters.subject_id) query = query.eq('question.subject_id', filters.subject_id);
    if (filters.topic_id) query = query.eq('question.topic_id', filters.topic_id);
    if (filters.difficulty) query = query.eq('question.difficulty', filters.difficulty);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async addBookmark(userId: string, questionId: string) {
    const { data, error } = await this.supabase.admin
      .from('bookmarks')
      .insert({ user_id: userId, question_id: questionId })
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async isBookmarked(userId: string, questionId: string) {
    const { data, error } = await this.supabase.admin
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .maybeSingle();
    if (error) throw error;
    return { bookmarked: !!data };
  }

  async removeBookmark(userId: string, questionId: string) {
    const { error } = await this.supabase.admin
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('question_id', questionId);
    if (error) throw error;
    return { removed: true };
  }

  // ---- Mistakes ----

  async listMistakes(userId: string, filters: { subject_id?: string; topic_id?: string; resolved?: string }) {
    let query = this.supabase.admin
      .from('mistakes')
      .select('id, wrong_count, correct_count, last_accuracy, resolved, last_wrong_at, question:questions(id, subject_id, topic_id, difficulty, question_text, correct_option, subject:subjects(name), topic:topics(name))')
      .eq('user_id', userId)
      .order('last_wrong_at', { ascending: false });
    if (filters.subject_id) query = query.eq('question.subject_id', filters.subject_id);
    if (filters.topic_id) query = query.eq('question.topic_id', filters.topic_id);
    if (filters.resolved !== undefined) query = query.eq('resolved', filters.resolved === 'true');
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /** Build a smart retry set: questions from topics the user keeps getting wrong. */
  async getSmartRetrySet(userId: string, limit = 15) {
    const { data: weak, error } = await this.supabase.admin
      .from('topic_progress')
      .select('topic_id, attempted, correct, last_accuracy')
      .eq('user_id', userId)
      .gt('attempted', 3)
      .lt('last_accuracy', 60)
      .order('last_accuracy', { ascending: true })
      .limit(5);
    if (error) throw error;

    const topicIds = (weak ?? []).map((t) => t.topic_id).filter(Boolean);
    if (topicIds.length === 0) return [];

    const { data: questions, error: qErr } = await this.supabase.admin
      .from('questions')
      .select('id, subject_id, topic_id, difficulty, question_text, correct_option, explanation, hint, topic:topics(name), subject:subjects(name), options:question_options(option_key, option_text, is_correct)')
      .eq('review_status', 'approved')
      .in('topic_id', topicIds)
      .limit(200);
    if (qErr) throw qErr;

    const seen = await this.recentlyAnswered(userId);
    const pool = (questions ?? []).filter((q) => !seen.has(q.id));
    const easy = pool.filter((q) => q.difficulty === 'easy');
    const medium = pool.filter((q) => q.difficulty === 'medium');
    const hard = pool.filter((q) => q.difficulty === 'hard');

    return [
      ...this.take(easy, 5),
      ...this.take(medium, 5),
      ...this.take(hard, 5),
    ].slice(0, limit);
  }

  private async recentlyAnswered(userId: string): Promise<Set<string>> {
    const { data } = await this.supabase.admin
      .from('user_progress')
      .select('question_id')
      .eq('user_id', userId)
      .limit(2000);
    return new Set((data ?? []).map((r) => r.question_id));
  }

  private take<T>(arr: T[], n: number): T[] {
    return this.shuffle(arr).slice(0, n);
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---- Question reports ----

  async reportQuestion(userId: string, dto: { question_id: string; reason: string; detail?: string }) {
    const { data, error } = await this.supabase.admin
      .from('question_reports')
      .insert({ user_id: userId, question_id: dto.question_id, reason: dto.reason, detail: dto.detail ?? null })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
