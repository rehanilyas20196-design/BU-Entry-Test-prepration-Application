import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * CORS origin resolver.
 *
 * Accepts origins that are either:
 *  1. explicitly listed in ALLOWED_ORIGINS (exact match), or
 *  2. served from Vercel under the app's own project prefix.
 *
 * The site is deployed on Vercel and Vercel mints fresh *.vercel.app URLs per
 * deployment/project, so an exact-only allowlist goes stale every time the site
 * is redeployed under a new URL. Accepting the project's own Vercel subdomains
 * keeps CORS working across those renames while still blocking unrelated hosts.
 */
export function buildCorsOptions(allowedOriginsEnv: string | undefined): CorsOptions {
  const explicit = (allowedOriginsEnv ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const PROJECT_PREFIX = 'bu-entry-test-prepration-applicatio';

  return {
    origin: (origin, callback) => {
      // Non-browser requests (curl, servers, same-origin) carry no Origin header.
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
          (hostname.startsWith(PROJECT_PREFIX) && hostname.endsWith('.vercel.app'))
        ) {
          callback(null, true);
          return;
        }
      } catch {
        // fall through to deny
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  };
}