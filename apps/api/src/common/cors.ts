import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * CORS origin resolver.
 *
 * Accepts origins that are either:
 *  1. explicitly listed in ALLOWED_ORIGINS (exact match), or
 *  2. served from Vercel subdomains (*.vercel.app), or
 *  3. local development (localhost / 127.0.0.1).
 */
export function buildCorsOptions(allowedOriginsEnv: string | undefined): CorsOptions {
  const explicit = (allowedOriginsEnv ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const PROJECT_PREFIX = 'bu-entry-test-prepration-applicatio';

  return {
    origin: (origin, callback) => {
      // Non-browser requests (curl, mobile native apps, same-origin) carry no Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }
      if (explicit.includes(origin)) {
        callback(null, true);
        return;
      }
      try {
        const { hostname } = new URL(origin);
        if (
          hostname === `${PROJECT_PREFIX}.vercel.app` ||
          hostname.endsWith(`-${PROJECT_PREFIX}.vercel.app`) ||
          (hostname.startsWith(PROJECT_PREFIX) && hostname.endsWith('.vercel.app')) ||
          hostname.endsWith('.vercel.app') ||
          hostname === 'localhost' ||
          hostname === '127.0.0.1'
        ) {
          callback(null, true);
          return;
        }
      } catch {
        // fall through to deny
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With', 'X-Api-Version'],
  };
}