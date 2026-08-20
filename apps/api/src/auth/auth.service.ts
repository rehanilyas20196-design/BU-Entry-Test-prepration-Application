import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../supabase/supabase.service';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Verify a raw JWT issued by Supabase Auth. */
  async verifyToken(token: string): Promise<AuthUser> {
    const { data, error } = await this.supabase.admin.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired session');
    }
    return {
      id: data.user.id,
      email: data.user.email ?? '',
      fullName: data.user.user_metadata?.full_name,
    };
  }

  /** Exchange a Supabase session (email/password or Google) for app session info. */
  async exchangeSession(accessToken: string) {
    return this.verifyToken(accessToken);
  }

  /**
   * Verify a Google Identity Services ID token and exchange it for a Supabase
   * session. The token is NEVER trusted on the client — Supabase verifies the
   * JWT signature/audience against Google here on the server before we hand a
   * session back to the app.
   */
  async signInWithGoogle(credential: string) {
    const { data, error } = await this.supabase.admin.auth.signInWithIdToken({
      provider: 'google',
      token: credential,
    });
    if (error || !data.session || !data.user) {
      throw new UnauthorizedException(error?.message ?? 'Google sign-in failed');
    }
    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: {
        id: data.user.id,
        email: data.user.email ?? '',
        fullName: data.user.user_metadata?.full_name,
      },
    };
  }

  async getJwtSecret(): Promise<string> {
    return this.config.getOrThrow<string>('JWT_SECRET');
  }
}
