import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { LeaderboardService } from './leaderboard.service';

class SetOptInDto {
  @IsBoolean()
  opted_in: boolean;
}

@Controller('leaderboard')
@UseGuards(SupabaseAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Get('weekly')
  weekly(@CurrentUser('id') userId: string) {
    return this.leaderboard.getWeekly(userId);
  }

  @Get('opt-in')
  optInStatus(@CurrentUser('id') userId: string) {
    return this.leaderboard.isOptedIn(userId).then((opted_in) => ({ opted_in }));
  }

  @Put('opt-in')
  setOptIn(@CurrentUser('id') userId: string, @Body() dto: SetOptInDto) {
    return this.leaderboard.setOptIn(userId, dto.opted_in);
  }
}