import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { TestsService } from './tests.service';
import { StartTestDto, SubmitAnswerDto } from '../common/dto';

@Controller('tests')
@UseGuards(SupabaseAuthGuard)
export class TestsController {
  constructor(private readonly tests: TestsService) {}

  @Get()
  list() {
    return this.tests.listMockTests();
  }

  @Post('start')
  start(@CurrentUser('id') userId: string, @Body() dto: StartTestDto) {
    return this.tests.startAttempt(userId, dto);
  }

  @Post('answer')
  saveAnswer(@CurrentUser('id') userId: string, @Body() dto: SubmitAnswerDto) {
    return this.tests.saveAnswer(userId, dto);
  }

  @Post(':attemptId/submit')
  submit(@CurrentUser('id') userId: string, @Param('attemptId') attemptId: string, @Body() body: { duration_seconds?: number }) {
    return this.tests.submitAttempt(userId, attemptId, body);
  }

  @Get(':attemptId/result')
  result(@CurrentUser('id') userId: string, @Param('attemptId') attemptId: string) {
    return this.tests.getResult(userId, attemptId);
  }
}
