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
    // Decode the Google id_token to get the email before attempting sign-in.
    // If an email/password user already exists with this email, block the
    // Google sign-in to prevent duplicate accounts.
    const payload = this.jwt.decode<{ email?: string }>(credential);
    const email = payload?.email;
    if (email) {
      const supabaseUrl = this.config.getOrThrow<string>('SUPABASE_URL');
      const serviceRoleKey = this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');
      const res = await fetch(
        `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
          },
        },
      );
      if (res.ok) {
        const body = (await res.json()) as { users?: Array<{ identities?: Array<{ provider: string }> }> };
        const existing = body.users?.[0];
        if (existing) {
          const hasGoogle = existing.identities?.some((id) => id.provider === 'google');
          if (!hasGoogle) {
            throw new UnauthorizedException(
              'An account with this email already exists. Please sign in with your email and password.',
            );
          }
        }
      }
    }

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
