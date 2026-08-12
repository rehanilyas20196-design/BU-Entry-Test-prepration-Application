import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class CatalogService {
  constructor(private readonly supabase: SupabaseService) {}

  async getPrograms() {
    const { data, error } = await this.supabase.admin
      .from('programs')
      .select('*, university:universities(*)')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data;
  }

  async getProgram(id: string) {
    const { data, error } = await this.supabase.admin
      .from('programs')
      .select('*, university:universities(*), test_configurations(*)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  /** Test structure for a program (config + section distribution). */
  async getTestConfigForProgram(programId: string) {
    const { data, error } = await this.supabase.admin
      .from('test_configurations')
      .select('*, sections:test_sections(*, subject:subjects(*))')
      .eq('program_id', programId)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async getSubjects() {
    const { data, error } = await this.supabase.admin
      .from('subjects')
      .select('*, questions(count)')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return (data ?? []).map((s: any) => ({
      ...s,
      question_count: Array.isArray(s.questions) && s.questions[0] ? (s.questions[0].count ?? 0) : 0,
      _count: {
        questions: Array.isArray(s.questions) && s.questions[0] ? (s.questions[0].count ?? 0) : 0,
      },
    }));
  }

  async getTopics(subjectId?: string) {
    let query = this.supabase.admin
      .from('topics')
      .select('*, subject:subjects(*)')
      .eq('is_active', true)
      .order('name');
    if (subjectId) query = query.eq('subject_id', subjectId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
}
