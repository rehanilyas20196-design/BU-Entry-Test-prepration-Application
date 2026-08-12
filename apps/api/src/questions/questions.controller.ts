import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { QuestionsService, PracticeQuery } from './questions.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('questions')
@UseGuards(SupabaseAuthGuard)
export class QuestionsController {
  constructor(private readonly questions: QuestionsService) {}

  @Get()
  list(
    @Query('subject_id') subjectId?: string,
    @Query('topic_id') topicId?: string,
    @Query('difficulty') difficulty?: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
    @Query('q') q?: string,
  ) {
    return this.questions.list({
      subject_id: subjectId,
      topic_id: topicId,
      difficulty,
      page: page ? Number(page) : undefined,
      page_size: pageSize ? Number(pageSize) : undefined,
      q,
    });
  }

  @Get('practice')
  practice(@CurrentUser('id') userId: string, @Query() query: PracticeQuery) {
    return this.questions.getPracticeSet(userId, query);
  }

  @Get('similar')
  similar(@Query('question_id') questionId: string, @Query('exclude_id') excludeId: string) {
    return this.questions.getSimilar(questionId, excludeId);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.questions.getOne(id);
  }
}
