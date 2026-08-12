import { Injectable, NotFoundException } from '@nestjs/common';
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
    if (!data) throw new NotFoundException('No stats yet');
    return data;
  }

  async deleteAccount(userId: string) {
    const { error } = await this.supabase.admin.auth.admin.deleteUser(userId);
    if (error) throw error;
    return { deleted: true };
  }
}
