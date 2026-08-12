import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Optional,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { RequestUser } from './supabase-auth.guard';

/**
 * Restricts access to users present in admin_users with an active role.
 * Optionally restrict to a specific role (admin vs content_editor).
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    @Optional() private readonly requiredRole?: 'admin' | 'content_editor',
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    if (!req.user) throw new ForbiddenException('Not authenticated');

    const { data, error } = await this.supabase.admin
      .from('admin_users')
      .select('role, is_active')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error || !data || !data.is_active) {
      throw new ForbiddenException('Admin access required');
    }
    if (this.requiredRole === 'admin' && data.role !== 'admin') {
      throw new ForbiddenException('Administrator access required');
    }
    return true;
  }
}
