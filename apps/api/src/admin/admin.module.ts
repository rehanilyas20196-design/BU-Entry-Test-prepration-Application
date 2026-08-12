import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminContentService } from './admin-content.service';
import { QuestionGenService } from './question-gen.service';

@Module({
  controllers: [AdminController],
  providers: [AdminContentService, QuestionGenService],
  exports: [AdminContentService, QuestionGenService],
})
export class AdminModule {}
