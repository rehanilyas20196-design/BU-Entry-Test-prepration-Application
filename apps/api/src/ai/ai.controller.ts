import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AIService } from './ai.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { HintRequestDto, StudyPlanDto, TutorRequestDto } from '../common/dto';

@Controller('ai')
@UseGuards(SupabaseAuthGuard)
export class AIController {
  constructor(private readonly ai: AIService) {}

  @Post('tutor')
  tutor(@CurrentUser('id') userId: string, @Body() dto: TutorRequestDto) {
    return this.ai.tutor(userId, dto);
  }

  @Post('hint')
  hint(@CurrentUser('id') userId: string, @Body() dto: HintRequestDto) {
    return this.ai.getHint(userId, dto);
  }

  @Post('similar-question')
  similar(@CurrentUser('id') userId: string, @Body() body: { question_id: string }) {
    return this.ai.generateSimilarQuestion(userId, body.question_id);
  }

  @Post('study-plan')
  studyPlan(@CurrentUser('id') userId: string, @Body() dto: StudyPlanDto) {
    return this.ai.generateStudyPlan(userId, dto);
  }
}
