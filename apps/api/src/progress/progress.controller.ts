import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { ProgressService } from './progress.service';
import { RecordAnswerDto } from '../common/dto';

@Controller('progress')
@UseGuards(SupabaseAuthGuard)
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Post('answer')
  record(@CurrentUser('id') userId: string, @Body() dto: RecordAnswerDto) {
    return this.progress.recordAnswer(userId, dto);
  }

  @Get('topics')
  topics(@CurrentUser('id') userId: string) {
    return this.progress.getTopicBreakdown(userId);
  }

  @Get('summary')
  summary(@CurrentUser('id') userId: string) {
    return this.progress.getSummary(userId);
  }
}
