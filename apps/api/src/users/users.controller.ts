import { Body, Controller, Delete, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from '../common/dto';

@Controller('users')
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me/profile')
  getProfile(@CurrentUser('id') userId: string) {
    return this.users.getProfile(userId);
  }

  @Patch('me/profile')
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(userId, dto);
  }

  @Get('me/stats')
  getStats(@CurrentUser('id') userId: string) {
    return this.users.getStats(userId);
  }

  @Delete('me')
  deleteAccount(@CurrentUser('id') userId: string) {
    return this.users.deleteAccount(userId);
  }
}
