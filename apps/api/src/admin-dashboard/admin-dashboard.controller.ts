import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard, AdminRequest } from './admin-auth.guard';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminLoginDto, CreateQuestionDto, ImportQuestionsDto, UpdateQuestionDto } from './admin-dashboard.dto';

@Controller('admin-dash')
@UseGuards(AdminAuthGuard)
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  // ---- Auth ----

  @Post('auth/login')
  login(@Body() dto: AdminLoginDto) {
    return this.service.login(dto.email, dto.password);
  }

  @Post('auth/logout')
  logout(@Req() req: AdminRequest) {
    return this.service.logout(req.admin);
  }

  // ---- Stats ----

  @Get('stats')
  stats() {
    return this.service.stats();
  }

  // ---- Users ----

  @Get('users')
  listUsers(
    @Query('q') q?: string,
    @Query('premium') premium?: string,
    @Query('onboarded') onboarded?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
  ) {
    return this.service.listUsers({
      q,
      premium,
      onboarded,
      date_from: dateFrom,
      date_to: dateTo,
      page: page ? Number(page) : undefined,
      page_size: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.service.getUserDetail(id);
  }

  // ---- Tests ----

  @Get('tests')
  listTests(
    @Query('mode') mode?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
  ) {
    return this.service.listTests({
      mode,
      status,
      q,
      page: page ? Number(page) : undefined,
      page_size: pageSize ? Number(pageSize) : undefined,
    });
  }

  // ---- Questions ----

  @Get('questions')
  listQuestions(
    @Query('subject_id') subjectId?: string,
    @Query('topic_id') topicId?: string,
    @Query('difficulty') difficulty?: string,
    @Query('review_status') reviewStatus?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
  ) {
    return this.service.listQuestions({
      subject_id: subjectId,
      topic_id: topicId,
      difficulty,
      review_status: reviewStatus,
      q,
      page: page ? Number(page) : undefined,
      page_size: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get('questions/:id')
  getQuestion(@Param('id') id: string) {
    return this.service.getQuestion(id);
  }

  @Post('questions')
  createQuestion(@Req() req: AdminRequest, @Body() dto: CreateQuestionDto) {
    return this.service.createQuestion(req.admin, dto);
  }

  @Patch('questions/:id')
  updateQuestion(@Req() req: AdminRequest, @Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.service.updateQuestion(req.admin, id, dto);
  }

  @Delete('questions/:id')
  deleteQuestion(@Req() req: AdminRequest, @Param('id') id: string) {
    return this.service.deleteQuestion(req.admin, id);
  }

  @Post('questions/import')
  importQuestions(@Req() req: AdminRequest, @Body() dto: ImportQuestionsDto) {
    return this.service.importQuestions(req.admin, dto.csv);
  }

  // ---- Premium ----

  @Get('premium')
  listPremium(@Query('q') q?: string, @Query('page') page?: string, @Query('page_size') pageSize?: string) {
    return this.service.listPremium({
      q,
      page: page ? Number(page) : undefined,
      page_size: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Post('premium/:userId/grant')
  grantPremium(@Req() req: AdminRequest, @Param('userId') userId: string) {
    return this.service.grantPremium(req.admin, userId);
  }

  @Post('premium/:userId/revoke')
  revokePremium(@Req() req: AdminRequest, @Param('userId') userId: string) {
    return this.service.revokePremium(req.admin, userId);
  }

  // ---- Analytics ----

  @Get('analytics')
  analytics(@Query('period') period?: string) {
    const p = period === 'week' || period === 'month' ? period : 'day';
    return this.service.analytics(p);
  }

  // ---- Activity ----

  @Get('activity')
  listActivity(@Query('q') q?: string, @Query('page') page?: string, @Query('page_size') pageSize?: string) {
    return this.service.listActivity({
      q,
      page: page ? Number(page) : undefined,
      page_size: pageSize ? Number(pageSize) : undefined,
    });
  }

  // ---- Catalog ----

  @Get('catalog')
  catalog() {
    return this.service.catalog();
  }
}
