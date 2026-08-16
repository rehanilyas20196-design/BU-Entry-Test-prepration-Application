import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateProfileDto } from '../common/dto';

@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) {}

  async getProfile(userId: string) {
    const { data, error } = await this.supabase.admin
      .from('profiles')
      .select('*, program:programs(*)')
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
