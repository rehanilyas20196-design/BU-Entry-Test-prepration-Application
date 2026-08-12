import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';

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
  getSubjects() {
    return this.catalog.getSubjects();
  }

  @Get('topics')
  getTopics(@Query('subject_id') subjectId?: string) {
    return this.catalog.getTopics(subjectId);
  }
}
