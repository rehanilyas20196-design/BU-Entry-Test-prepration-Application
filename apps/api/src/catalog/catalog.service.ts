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

  async getSubjects(userId?: string) {
    const { data, error } = await this.supabase.admin
      .from('subjects')
      .select('*, questions(count)')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;

    const subjects = (data ?? []).map((s: any) => ({
      ...s,
      question_count: Array.isArray(s.questions) && s.questions[0] ? (s.questions[0].count ?? 0) : 0,
      _count: {
        questions: Array.isArray(s.questions) && s.questions[0] ? (s.questions[0].count ?? 0) : 0,
      },
    }));

    if (!userId) return subjects;

    const { data: progress } = await this.supabase.admin
      .from('user_progress')
      .select('subject_id, is_correct')
      .eq('user_id', userId)
      .limit(5000);

    const bySubject = new Map<string, { attempted: number; correct: number }>();
    for (const row of progress ?? []) {
      const entry = bySubject.get(row.subject_id) ?? { attempted: 0, correct: 0 };
      entry.attempted++;
      if (row.is_correct) entry.correct++;
      bySubject.set(row.subject_id, entry);
    }

    return subjects.map((s: any) => {
      const p = bySubject.get(s.id) ?? { attempted: 0, correct: 0 };
      return {
        ...s,
        attempted: p.attempted,
        correct: p.correct,
        progress: p.attempted > 0 ? Math.min(1, p.correct / p.attempted) : 0,
      };
    });
  }

  async getTopics(subjectId?: string, userId?: string) {
    let query = this.supabase.admin
      .from('topics')
      .select('*, subject:subjects(*), questions(count)')
      .eq('is_active', true)
      .order('name');
    if (subjectId) query = query.eq('subject_id', subjectId);
    const { data, error } = await query;
    if (error) throw error;

    const topics = (data ?? []).map((t: any) => ({
      ...t,
      question_count: Array.isArray(t.questions) && t.questions[0] ? (t.questions[0].count ?? 0) : 0,
      _count: {
        questions: Array.isArray(t.questions) && t.questions[0] ? (t.questions[0].count ?? 0) : 0,
      },
    }));

    if (!userId) return topics;

    const { data: progress } = await this.supabase.admin
      .from('topic_progress')
      .select('topic_id, attempted, correct')
      .eq('user_id', userId);

    const byTopic = new Map<string, { attempted: number; correct: number }>();
    for (const row of progress ?? []) {
      byTopic.set(row.topic_id, { attempted: row.attempted ?? 0, correct: row.correct ?? 0 });
    }

    return topics.map((t: any) => {
      const p = byTopic.get(t.id) ?? { attempted: 0, correct: 0 };
      return {
        ...t,
        attempted: p.attempted,
        correct: p.correct,
        accuracy: p.attempted > 0 ? Math.round((p.correct / p.attempted) * 10000) / 100 : null,
        completed: p.attempted >= 5 && p.attempted > 0 && p.correct / p.attempted >= 0.75,
      };
    });
  }
}
