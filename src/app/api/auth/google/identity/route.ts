import { loginWithGoogleIdentity } from '@/lib/user-auth';
import { hasGoogleIdentityConfig, verifyGoogleIdToken } from '@/lib/google-oauth';
import { recordEvent } from '@/lib/telemetry';

function normalizeNextPath(nextPath?: string | null) {
  if (!nextPath || !nextPath.startsWith('/')) return '/conta';
  if (nextPath.startsWith('//')) return '/conta';
  return nextPath;
}

export async function POST(req: Request) {
  try {
    if (!hasGoogleIdentityConfig()) {
      return Response.json({ error: 'Google não configurado neste ambiente.' }, { status: 503 });
    }

    const { credential, nextPath } = await req.json();
    const profile = await verifyGoogleIdToken(String(credential || ''));
    const result = await loginWithGoogleIdentity(profile);

    if ('error' in result) {
      return Response.json({ error: result.error }, { status: 400 });
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

    return Response.json({
      user: result.user,
      created: result.created,
      linked: result.linked,
      needsOnboarding: result.needsOnboarding,
      nextPath: result.needsOnboarding ? '/conta?onboarding=1' : normalizeNextPath(nextPath),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao entrar com Google.';
    return Response.json({ error: message }, { status: 400 });
  }
}
