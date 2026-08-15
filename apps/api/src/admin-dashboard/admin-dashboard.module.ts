import { Module } from '@nestjs/common';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminAuthGuard } from './admin-auth.guard';

@Module({
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService, AdminAuthGuard],
  exports: [AdminDashboardService],
})
export class AdminDashboardModule {}
