import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface UpdateQuestionDto {
  question_text?: string;
  correct_option?: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  hint?: string;
  difficulty?: string;
  topic_id?: string | null;
  review_status?: string;
  valid_until?: string | null;
}

@Injectable()
export class AdminContentService {
  constructor(private readonly supabase: SupabaseService) {}

  /** List questions for review (any status). */
  async listForReview(params: { status?: string; subject_id?: string; page?: number; page_size?: number }) {
    const page = params.page ?? 1;
    const pageSize = Math.min(params.page_size ?? 25, 100);
    let query = this.supabase.admin
      .from('questions')
      .select(
        'id, subject_id, topic_id, difficulty, question_text, correct_option, review_status, generated_by, source_type, created_at, updated_at, subject:subjects(name), topic:topics(name), options:question_options(option_key, option_text, is_correct)',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (params.status) query = query.eq('review_status', params.status);
    if (params.subject_id) query = query.eq('subject_id', params.subject_id);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data, total: count ?? 0, page, page_size: pageSize };
  }

  async updateQuestion(questionId: string, dto: UpdateQuestionDto) {
    const { data, error } = await this.supabase.admin
      .from('questions')
      .update(dto)
      .eq('id', questionId)
      .select('id, question_text, review_status, correct_option')
      .single();
    if (error) throw error;
    return data;
  }

  async setReviewStatus(adminUserId: string, questionId: string, status: string, comment?: string) {
    const allowed = ['approved', 'rejected', 'archived', 'needs_review'];
    if (!allowed.includes(status)) throw new BadRequestException('Invalid status');

    const { data: adminUser } = await this.supabase.admin
      .from('admin_users')
      .select('id')
      .eq('user_id', adminUserId)
      .maybeSingle();

    const { error } = await this.supabase.admin
      .from('questions')
      .update({ review_status: status, reviewed: true, reviewer_id: adminUser?.id ?? null })
      .eq('id', questionId);
    if (error) throw error;

    await this.supabase.admin.from('question_reviews').insert({
      question_id: questionId,
      reviewer_id: adminUser?.id ?? null,
      status,
      comment: comment ?? null,
      reviewed_at: new Date().toISOString(),
    });
    return { reviewed: true, status };
  }

  /** Regenerate a question: mark needs_review + clear fields. */
  async regenerate(questionId: string) {
    const { data, error } = await this.supabase.admin
      .from('questions')
      .update({ review_status: 'draft' })
      .eq('id', questionId)
      .select('id')
      .single();
    if (error) throw error;
    return data;
  }

  async getReviewQueueStats() {
    const statuses = ['draft', 'ai_generated', 'needs_review', 'approved', 'rejected', 'archived'];
    const out: Record<string, number> = {};
    for (const s of statuses) {
      const { count } = await this.supabase.admin
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('review_status', s);
      out[s] = count ?? 0;
    }
    return out;
  }
}
