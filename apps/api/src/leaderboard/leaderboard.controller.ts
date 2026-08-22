import { Body, Controller, Get, Query, Put, UseGuards } from '@nestjs/common';
import { IsBoolean, IsEnum } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { LeaderboardService } from './leaderboard.service';

enum LeaderboardMetric {
  XP = 'xp',
  Questions = 'questions',
}

class SetOptInDto {
  @IsBoolean()
  opted_in: boolean;
}

class GetWeeklyQuery {
  @IsEnum(LeaderboardMetric)
  metric: LeaderboardMetric;

  @IsBoolean()
  opted_in_only: boolean;
}

@Controller('leaderboard')
@UseGuards(SupabaseAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Get('weekly')
  weekly(@CurrentUser('id') userId: string, @Query() query: GetWeeklyQuery) {
    return this.leaderboard.getWeekly(userId, 50, query.metric, query.opted_in_only);
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