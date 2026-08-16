import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('catalog')
@UseGuards(SupabaseAuthGuard)
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('programs')
  getPrograms() {
    return this.catalog.getPrograms();
  }

  @Get('programs/:id')
  getProgram(@Param('id') id: string) {
    return this.catalog.getProgram(id);
  }

  @Get('programs/:id/test-config')
  getTestConfig(@Param('id') id: string) {
    return this.catalog.getTestConfigForProgram(id);
  }

  @Get('subjects')
  getSubjects(@CurrentUser('id') userId: string) {
    return this.catalog.getSubjects(userId);
  }

  @Get('topics')
  getTopics(@Query('subject_id') subjectId?: string, @CurrentUser('id') userId?: string) {
    return this.catalog.getTopics(subjectId, userId);
  }
}
