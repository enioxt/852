import { NextResponse } from 'next/server';
import { createGoogleAuthUrl, hasGoogleOAuthConfig } from '@/lib/google-oauth';

export async function GET(req: Request) {
  if (!hasGoogleOAuthConfig()) {
    return NextResponse.redirect(new URL('/conta?auth=login&error=google_not_configured', req.url));
  }

  const requestUrl = new URL(req.url);
  const { searchParams } = requestUrl;
  const nextPath = searchParams.get('next');
  const mode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const redirectUrl = await createGoogleAuthUrl({ nextPath, mode, baseUrl: requestUrl.origin });
  return NextResponse.redirect(redirectUrl);
}
