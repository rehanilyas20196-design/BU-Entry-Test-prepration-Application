import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateProfileDto } from '../common/dto';

@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) {}

  async getProfile(userId: string) {
    // First, fetch the profile without any embeds to avoid PostgREST schema
    // cache issues (PGRST200) that can crash the entire request.
    const { data, error } = await this.supabase.admin
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      const { data: created, error: createError } = await this.supabase.admin
        .from('profiles')
        .insert({ user_id: userId })
        .select()
        .single();
      if (createError) throw createError;
      return created;
    }

    // If the profile has a program_id, fetch the program separately.
    if (data.program_id) {
      const { data: program } = await this.supabase.admin
        .from('programs')
        .select('*')
        .eq('id', data.program_id)
        .maybeSingle();
      return { ...data, program: program ?? null };
    }

    return data;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { data, error } = await this.supabase.admin
      .from('profiles')
      .update(dto)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getStats(userId: string) {
    const { data, error } = await this.supabase.admin
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return {
        user_id: userId,
        xp: 0,
        level: 1,
        current_streak: 0,
        longest_streak: 0,
        total_questions_answered: 0,
        total_questions_correct: 0,
        total_mock_tests: 0,
        total_study_minutes: 0,
        best_accuracy: 0,
        best_mock_score: 0,
      };
    }
    return data;
  }

  async deleteAccount(userId: string) {
    const { error } = await this.supabase.admin.auth.admin.deleteUser(userId);
    if (error) throw error;
    return { deleted: true };
  }
}
