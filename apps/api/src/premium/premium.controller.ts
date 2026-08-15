import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { PremiumService, VerifyPaymentDto } from './premium.service';

@Controller('premium')
@UseGuards(SupabaseAuthGuard)
export class PremiumController {
  constructor(private readonly premium: PremiumService) {}

  @Get('status')
  status(@CurrentUser('id') userId: string) {
    return this.premium.getStatus(userId);
  }

  /** Verifies JazzCash / Raast payment using Trx ID / TID and activates Premium. */
  @Post('verify')
  verify(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.premium.verifyAndActivate(userId, dto);
  }

  /** Direct / legacy purchase endpoint. */
  @Post('activate')
  activate(@CurrentUser('id') userId: string) {
    return this.premium.activate(userId);
  }
}