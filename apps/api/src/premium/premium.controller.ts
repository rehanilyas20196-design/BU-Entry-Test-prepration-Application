import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { PremiumService } from './premium.service';

@Controller('premium')
@UseGuards(SupabaseAuthGuard)
export class PremiumController {
  constructor(private readonly premium: PremiumService) {}

  @Get('status')
  status(@CurrentUser('id') userId: string) {
    return this.premium.getStatus(userId);
  }

  /** Simulated one-time purchase that unlocks all premium features. */
  @Post('activate')
  activate(@CurrentUser('id') userId: string) {
    return this.premium.activate(userId);
  }
}