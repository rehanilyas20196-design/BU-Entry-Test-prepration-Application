import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { EngagementService } from './engagement.service';
import { ReportQuestionDto } from '../common/dto';

@Controller()
@UseGuards(SupabaseAuthGuard)
export class EngagementController {
  constructor(private readonly engagement: EngagementService) {}

  @Get('bookmarks')
  bookmarks(
    @CurrentUser('id') userId: string,
    @Query('subject_id') subjectId?: string,
    @Query('topic_id') topicId?: string,
    @Query('difficulty') difficulty?: string,
  ) {
    return this.engagement.listBookmarks(userId, { subject_id: subjectId, topic_id: topicId, difficulty });
  }

  @Get('bookmarks/:questionId')
  bookmarked(@CurrentUser('id') userId: string, @Param('questionId') questionId: string) {
    return this.engagement.isBookmarked(userId, questionId);
  }

  @Post('bookmarks')
  addBookmark(@CurrentUser('id') userId: string, @Body() body: { question_id: string }) {
    return this.engagement.addBookmark(userId, body.question_id);
  }

  @Delete('bookmarks/:questionId')
  removeBookmark(@CurrentUser('id') userId: string, @Param('questionId') questionId: string) {
    return this.engagement.removeBookmark(userId, questionId);
  }

  @Get('mistakes')
  mistakes(
    @CurrentUser('id') userId: string,
    @Query('subject_id') subjectId?: string,
    @Query('topic_id') topicId?: string,
    @Query('resolved') resolved?: string,
  ) {
    return this.engagement.listMistakes(userId, { subject_id: subjectId, topic_id: topicId, resolved });
  }

  @Get('mistakes/smart-retry')
  smartRetry(@CurrentUser('id') userId: string) {
    return this.engagement.getSmartRetrySet(userId);
  }

  @Post('questions/report')
  report(@CurrentUser('id') userId: string, @Body() dto: ReportQuestionDto) {
    return this.engagement.reportQuestion(userId, dto);
  }
}
