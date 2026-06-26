import { NextRequest, NextResponse } from 'next/server';

/**
 * ISO 3166-1 alpha-2 country codes for EU/EEA member states.
 * Includes the United Kingdom (GB) for post-Brexit continuity.
 */
const EU_COUNTRY_CODES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB',
]);

/**
 * Edge Middleware for geo-aware routing to Aurora DSQL clusters.
 *
 * - Intercepts all requests to `/api/*`.
 * - Uses Vercel's `req.geo` to detect the user's country.
 * - Sets `x-dsql-region: eu` for EU countries, `x-dsql-region: us` otherwise.
 *
 * To add a new region (e.g. `apac`):
 *   1. Define the country set here.
 *   2. Add `DSQL_ENDPOINT_APAC` env var.
 *   3. Add routing case in `lib/db.ts`.
 *   No code changes required in API routes.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // `geo` is injected by Vercel at runtime on Edge Network — type-assert for TS
  const { geo } = request as NextRequest & { geo?: { country?: string } };
  const country = geo?.country ?? null;
  const region = country && EU_COUNTRY_CODES.has(country) ? 'eu' : 'us';

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-dsql-region', region);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: '/api/:path*',
};