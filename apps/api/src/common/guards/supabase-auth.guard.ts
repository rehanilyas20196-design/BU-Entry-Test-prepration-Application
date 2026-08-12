import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

export interface RequestUser {
  id: string;
  email: string;
  fullName?: string;
}

export interface AuthenticatedRequest {
  user: RequestUser;
  headers: Record<string, string>;
}

/**
 * Validates the Bearer token against Supabase Auth on every request.
 * The mobile client sends the Supabase access token it received at login.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = req.headers['authorization'] ?? req.headers['Authorization'] ?? '';
    const [scheme, token] = String(header).split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const { data, error } = await this.supabase.admin.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    req.user = {
      id: data.user.id,
      email: data.user.email ?? '',
      fullName: (data.user.user_metadata as { full_name?: string })?.full_name,
    };
    return true;
  }
}
