import { ForbiddenException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class PremiumService {
  constructor(private readonly supabase: SupabaseService) {}

  async isPremium(userId: string): Promise<boolean> {
    const { data } = await this.supabase.admin
      .from('profiles')
      .select('is_premium')
      .eq('user_id', userId)
      .maybeSingle();
    return data?.is_premium ?? false;
  }

  async requirePremium(userId: string): Promise<void> {
    const premium = await this.isPremium(userId);
    if (!premium) {
      throw new ForbiddenException('This is a premium feature. Upgrade to unlock it.');
    }
  }

  async getStatus(userId: string) {
    return { is_premium: await this.isPremium(userId) };
  }

  /** Simulated purchase — marks the profile as premium. */
  async activate(userId: string) {
    await this.supabase.admin
      .from('profiles')
      .update({ is_premium: true })
      .eq('user_id', userId);
    return { is_premium: true };
  }
}