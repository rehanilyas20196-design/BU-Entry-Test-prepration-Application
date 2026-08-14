import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PremiumService } from '../premium/premium.service';

export interface PracticeQuery {
  subject_id?: string;
  topic_id?: string;
  difficulty?: string;
  exclude_answered?: boolean;
  limit?: number;
  seed?: string;
}

@Injectable()
export class QuestionsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly premium: PremiumService,
  ) {}

  /** Fetch a page of approved questions (RLS ensures only approved are returned). */
  async list(params: { subject_id?: string; topic_id?: string; difficulty?: string; page?: number; page_size?: number; q?: string }) {
    const page = params.page ?? 1;
    const pageSize = Math.min(params.page_size ?? 20, 100);
    let query = this.supabase.admin
      .from('questions')
      .select(
        'id, subject_id, topic_id, difficulty, question_text, correct_option, explanation, hint, solution_steps, learning_objective, is_original, is_official_sample, source_type, source_reference, review_status, created_at, updated_at, topic:topics(id, name), subject:subjects(id, name), options:question_options(option_key, option_text, is_correct)',
        { count: 'exact' },
      )
      .eq('review_status', 'approved')
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (params.subject_id) query = query.eq('subject_id', params.subject_id);
    if (params.topic_id) query = query.eq('topic_id', params.topic_id);
    if (params.difficulty) query = query.eq('difficulty', params.difficulty);
    if (params.q) query = query.ilike('question_text', `%${params.q}%`);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data, total: count ?? 0, page, page_size: pageSize };
  }

  /** Fetch a single question with full metadata. */
  async getOne(id: string) {
    const { data, error } = await this.supabase.admin
      .from('questions')
      .select(
        'id, subject_id, topic_id, difficulty, question_text, correct_option, explanation, hint, solution_steps, learning_objective, is_original, is_official_sample, source_type, source_reference, copyright_status, review_status, question_date, valid_from, valid_until, created_at, updated_at, topic:topics(id, name), subject:subjects(id, name), options:question_options(option_key, option_text, is_correct)',
      )
      .eq('id', id)
      .eq('review_status', 'approved')
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  /** Random selection of approved questions for practice sessions. */
  async getPracticeSet(userId: string, query: PracticeQuery) {
    const limit = Math.min(query.limit ?? 20, 50);

    // Hard Mode is a premium feature.
    if (query.difficulty === 'hard' || query.difficulty === 'expert') {
      await this.premium.requirePremium(userId);
    }

    let builder = this.supabase.admin
      .from('questions')
      .select('id')
      .eq('review_status', 'approved');

    if (query.subject_id) builder = builder.eq('subject_id', query.subject_id);
    if (query.topic_id) builder = builder.eq('topic_id', query.topic_id);
    if (query.difficulty) builder = builder.eq('difficulty', query.difficulty);
    if (query.exclude_answered) {
      const answered = await this.answeredIds(userId);
      if (answered.length > 0) {
        builder = builder.not('id', 'in', `(${answered.join(',')})`);
      }
    }
    // Deterministic-ish random sampling via setseed is not available in PostgREST;
    // we fetch a larger candidate pool and shuffle in-memory for low-end safety.
    builder = builder.limit(500);
    const { data, error } = await builder;
    if (error) throw error;

    if (!data || data.length === 0) {
      return [];
    }

    const ids = this.shuffle(data.map((r) => r.id)).slice(0, limit);
    const { data: questions, error: qErr } = await this.supabase.admin
      .from('questions')
      .select(
        'id, subject_id, topic_id, difficulty, question_text, correct_option, explanation, hint, solution_steps, learning_objective, is_original, is_official_sample, source_type, source_reference, topic:topics(id, name), subject:subjects(id, name), options:question_options(option_key, option_text, is_correct)',
      )
      .in('id', ids);
    if (qErr) throw qErr;

    return this.shuffle(questions ?? []);
  }

  private async answeredIds(userId: string): Promise<string[]> {
    const { data } = await this.supabase.admin
      .from('user_progress')
      .select('question_id')
      .eq('user_id', userId)
      .limit(5000);
    return (data ?? []).map((r) => r.question_id);
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Similar questions on the same topic at similar difficulty (for "practice another like this"). */
  async getSimilar(questionId: string, excludeId: string) {
    const base = await this.getOne(questionId);
    if (!base) return [];
    const { data, error } = await this.supabase.admin
      .from('questions')
      .select('id, subject_id, topic_id, difficulty, question_text, correct_option, explanation, hint, topic:topics(id, name), subject:subjects(id, name), options:question_options(option_key, option_text, is_correct)')
      .eq('review_status', 'approved')
      .eq('topic_id', base.topic_id)
      .neq('id', excludeId)
      .limit(10);
    if (error) throw error;
    return data;
  }
}
