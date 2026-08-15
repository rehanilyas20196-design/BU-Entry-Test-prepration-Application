import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

export interface AdminPrincipal {
  email: string;
  displayName?: string;
}

export interface AdminRequest {
  admin: AdminPrincipal;
  headers: Record<string, string>;
}

/**
 * Verifies the admin JWT (signed with ADMIN_JWT_SECRET) on every
 * /admin-dash/* request. The token is only ever issued by the login
 * endpoint after verifying email + password against admin_credentials.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AdminRequest>();
    const header = req.headers['authorization'] ?? req.headers['Authorization'] ?? '';
    const [scheme, token] = String(header).split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Missing admin token');
    }

    const secret = this.config.get<string>('ADMIN_JWT_SECRET');
    if (!secret) {
      throw new UnauthorizedException('Admin auth is not configured');
    }

    try {
      const payload = jwt.verify(token, secret) as {
        sub?: string;
        email?: string;
        display_name?: string;
        role?: string;
      };
      if (payload?.role !== 'admin' || !payload.email) {
        throw new UnauthorizedException('Invalid admin token');
      }
      req.admin = {
        email: payload.email,
        displayName: payload.display_name,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired admin session');
    }
  }
}
