import { NextResponse } from 'next/server';
import { consumeGoogleOAuthState, exchangeGoogleCode, fetchGoogleUserProfile } from '@/lib/google-oauth';
import { loginWithGoogleIdentity } from '@/lib/user-auth';
import { recordEvent } from '@/lib/telemetry';

function buildRedirect(req: Request, path: string, params?: Record<string, string>) {
  const url = new URL(path, req.url);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }
  return url;
}

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const oauthError = requestUrl.searchParams.get('error');

  if (oauthError) {
    return NextResponse.redirect(buildRedirect(req, '/conta', { auth: 'login', error: oauthError }));
  }

  if (!code || !state) {
    return NextResponse.redirect(buildRedirect(req, '/conta', { auth: 'login', error: 'google_callback_invalid' }));
  }

  try {
    const oauthState = await consumeGoogleOAuthState(state);
    const tokens = await exchangeGoogleCode(code, oauthState.codeVerifier, requestUrl.origin);
    const profile = await fetchGoogleUserProfile(tokens.access_token);
    const result = await loginWithGoogleIdentity(profile);

    if ('error' in result) {
      return NextResponse.redirect(buildRedirect(req, '/conta', { auth: oauthState.mode, error: 'google_identity_failed' }));
    }

    await recordEvent({
      event_type: result.created ? 'user_registered' : 'user_login',
      metadata: {
        provider: 'google',
        userId: result.user.id,
        created: result.created,
        linked: result.linked,
      },
    });

    if (result.needsOnboarding) {
      return NextResponse.redirect(buildRedirect(req, '/conta', {
        onboarding: '1',
        next: oauthState.nextPath,
        provider: 'google',
      }));
    }

    return NextResponse.redirect(new URL(oauthState.nextPath || '/conta', req.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'google_callback_failed';
    return NextResponse.redirect(buildRedirect(req, '/conta', {
      auth: 'login',
      error: message.slice(0, 80),
    }));
  }
}
