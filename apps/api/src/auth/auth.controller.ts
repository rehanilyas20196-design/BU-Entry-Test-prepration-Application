import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthDto, TokenExchangeDto } from '../common/dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Verify a Supabase access token and return the app user identity. */
  @Post('verify')
  async verify(@Body() dto: TokenExchangeDto) {
    const user = await this.auth.exchangeSession(dto.access_token);
    return { user };
  }

  /** Verify a Google ID token and exchange it for an app session. */
  @Post('google')
  async google(@Body() dto: GoogleAuthDto) {
    return this.auth.signInWithGoogle(dto.credential);
  }
}
