import { cookies } from 'next/headers';

const GOOGLE_STATE_COOKIE = '852_google_oauth';
const GOOGLE_AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const GOOGLE_STATE_TTL_MS = 10 * 60 * 1000;

type GoogleStatePayload = {
  state: string;
  codeVerifier: string;
  nextPath: string;
  mode: 'login' | 'register';
  createdAt: number;
};

export type GoogleUserProfile = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

function getGoogleClientId() {
  return process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID || '';
}

function getGoogleClientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET || '';
}

function getBaseUrl() {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
  return process.env.NODE_ENV === 'production' ? 'https://852.egos.ia.br' : 'http://localhost:3000';
}

function getRedirectUri() {
  return `${getBaseUrl()}/api/auth/google/callback`;
}

function toBase64Url(buffer: Uint8Array) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function sha256Base64Url(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return toBase64Url(new Uint8Array(digest));
}

function normalizeNextPath(nextPath?: string | null) {
  if (!nextPath || !nextPath.startsWith('/')) return '/conta';
  if (nextPath.startsWith('//')) return '/conta';
  return nextPath;
}

export function hasGoogleOAuthConfig() {
  return Boolean(getGoogleClientId() && getGoogleClientSecret());
}

export async function createGoogleAuthUrl(input?: { nextPath?: string | null; mode?: 'login' | 'register' }) {
  const clientId = getGoogleClientId();
  if (!clientId) throw new Error('Google OAuth não configurado. Defina GOOGLE_CLIENT_ID.');

  const state = crypto.randomUUID();
  const codeVerifier = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const payload: GoogleStatePayload = {
    state,
    codeVerifier,
    nextPath: normalizeNextPath(input?.nextPath),
    mode: input?.mode || 'login',
    createdAt: Date.now(),
  };

  const cookieStore = await cookies();
  cookieStore.set(GOOGLE_STATE_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(GOOGLE_STATE_TTL_MS / 1000),
  });

  const url = new URL(GOOGLE_AUTH_BASE);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', getRedirectUri());
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'select_account');

  return url.toString();
}

export async function consumeGoogleOAuthState(expectedState: string) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(GOOGLE_STATE_COOKIE)?.value;
  cookieStore.set(GOOGLE_STATE_COOKIE, '', { maxAge: 0, path: '/' });

  if (!raw) throw new Error('Sessão OAuth não encontrada. Tente novamente.');

  let parsed: GoogleStatePayload;
  try {
    parsed = JSON.parse(raw) as GoogleStatePayload;
  } catch {
    throw new Error('Sessão OAuth inválida. Tente novamente.');
  }

  if (!parsed.state || parsed.state !== expectedState) {
    throw new Error('State OAuth inválido. Tente novamente.');
  }

  if (!parsed.codeVerifier || !parsed.createdAt || Date.now() - parsed.createdAt > GOOGLE_STATE_TTL_MS) {
    throw new Error('Sessão OAuth expirada. Tente novamente.');
  }

  return parsed;
}

export async function exchangeGoogleCode(code: string, codeVerifier: string) {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth não configurado. Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET.');
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    }).toString(),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.access_token) {
    throw new Error(data?.error_description || data?.error || 'Falha ao trocar o código do Google.');
  }

  return data as { access_token: string; id_token?: string; refresh_token?: string };
}

export async function fetchGoogleUserProfile(accessToken: string): Promise<GoogleUserProfile> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  const profile = await response.json().catch(() => null);
  if (!response.ok || !profile?.sub || !profile?.email) {
    throw new Error('Google não retornou um perfil válido.');
  }

  return profile as GoogleUserProfile;
}
