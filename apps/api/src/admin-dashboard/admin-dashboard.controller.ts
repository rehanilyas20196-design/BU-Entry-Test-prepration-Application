import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard, AdminRequest } from './admin-auth.guard';
import { Public } from './admin-public.decorator';
import { AdminDashboardService } from './admin-dashboard.service';
import {
  AdminLoginDto,
  CreateAnnouncementDto,
  CreateCouponDto,
  CreateProgramDto,
  CreateQuestionDto,
  CreateSubjectDto,
  CreateTopicDto,
  ImportQuestionsDto,
  ToggleDto,
  UpdateCatalogDto,
  UpdateQuestionDto,
} from './admin-dashboard.dto';

@Controller('admin-dash')
@UseGuards(AdminAuthGuard)
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  // ---- Auth ----

  @Public()
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

  // ---- Exports (CSV) ----

  @Get('export/users')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="users.csv"')
  exportUsers() {
    return this.service.exportUsers();
  }

  @Get('export/tests')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="tests.csv"')
  exportTests() {
    return this.service.exportTests();
  }

  @Get('export/payments')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="payments.csv"')
  exportPayments() {
    return this.service.exportPayments();
  }

  // ---- Announcements ----

  @Post('announcements')
  createAnnouncement(@Req() req: AdminRequest, @Body() dto: CreateAnnouncementDto) {
    return this.service.createAnnouncement(req.admin, dto);
  }

  @Get('announcements')
  listAnnouncements() {
    return this.service.listAnnouncements();
  }

  // ---- Coupons ----

  @Post('coupons')
  createCoupon(@Req() req: AdminRequest, @Body() dto: CreateCouponDto) {
    return this.service.createCoupon(req.admin, dto);
  }

  @Get('coupons')
  listCoupons() {
    return this.service.listCoupons();
  }

  @Post('coupons/:id/toggle')
  toggleCoupon(@Req() req: AdminRequest, @Param('id') id: string, @Body() dto: ToggleDto) {
    return this.service.toggleCoupon(req.admin, id, dto.is_active ?? false);
  }

  // ---- Catalog management ----

  @Get('catalog/manage')
  manageCatalog() {
    return this.service.manageCatalog();
  }

  @Post('catalog/subjects')
  createSubject(@Req() req: AdminRequest, @Body() dto: CreateSubjectDto) {
    return this.service.createSubject(req.admin, dto);
  }

  @Patch('catalog/subjects/:id')
  updateSubject(@Req() req: AdminRequest, @Param('id') id: string, @Body() dto: UpdateCatalogDto) {
    return this.service.updateSubject(req.admin, id, dto);
  }

  @Post('catalog/subjects/:id/toggle')
  toggleSubject(@Req() req: AdminRequest, @Param('id') id: string, @Body() dto: ToggleDto) {
    return this.service.toggleSubject(req.admin, id, dto.is_active ?? false);
  }

  @Post('catalog/topics')
  createTopic(@Req() req: AdminRequest, @Body() dto: CreateTopicDto) {
    return this.service.createTopic(req.admin, dto);
  }

  @Patch('catalog/topics/:id')
  updateTopic(@Req() req: AdminRequest, @Param('id') id: string, @Body() dto: UpdateCatalogDto) {
    return this.service.updateTopic(req.admin, id, dto);
  }

  @Post('catalog/topics/:id/toggle')
  toggleTopic(@Req() req: AdminRequest, @Param('id') id: string, @Body() dto: ToggleDto) {
    return this.service.toggleTopic(req.admin, id, dto.is_active ?? false);
  }

  @Post('catalog/programs')
  createProgram(@Req() req: AdminRequest, @Body() dto: CreateProgramDto) {
    return this.service.createProgram(req.admin, dto);
  }

  @Patch('catalog/programs/:id')
  updateProgram(@Req() req: AdminRequest, @Param('id') id: string, @Body() dto: UpdateCatalogDto) {
    return this.service.updateProgram(req.admin, id, dto);
  }

  @Post('catalog/programs/:id/toggle')
  toggleProgram(@Req() req: AdminRequest, @Param('id') id: string, @Body() dto: ToggleDto) {
    return this.service.toggleProgram(req.admin, id, dto.is_active ?? false);
  }
}
