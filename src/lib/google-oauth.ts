import { cookies } from 'next/headers';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const GOOGLE_STATE_COOKIE = '852_google_oauth';
const GOOGLE_AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const GOOGLE_STATE_TTL_MS = 10 * 60 * 1000;
const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

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

function getGoogleClientIds() {
  return Array.from(new Set([
    process.env.GOOGLE_CLIENT_ID,
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.AUTH_GOOGLE_ID,
  ].filter((value): value is string => Boolean(value && value.trim())).map((value) => value.trim())));
}

function getGoogleClientId() {
  return getGoogleClientIds()[0] || '';
}

function getGoogleClientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET || '';
}

function normalizeBaseUrl(baseUrl?: string | null) {
  const trimmed = baseUrl?.trim() || '';
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return '';
  return trimmed.replace(/\/$/, '');
}

function getBaseUrl(baseUrl?: string | null) {
  const runtimeBaseUrl = normalizeBaseUrl(baseUrl);
  if (runtimeBaseUrl) return runtimeBaseUrl;
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
  return process.env.NODE_ENV === 'production' ? 'https://852.egos.ia.br' : 'http://localhost:3000';
}

function getRedirectUri(baseUrl?: string | null) {
  return `${getBaseUrl(baseUrl)}/api/auth/google/callback`;
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

export function hasGoogleIdentityConfig() {
  return getGoogleClientIds().length > 0;
}

export function hasGoogleOAuthConfig() {
  return Boolean(getGoogleClientId() && getGoogleClientSecret());
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleUserProfile> {
  const audiences = getGoogleClientIds();
  if (!idToken?.trim()) {
    throw new Error('Credencial Google ausente.');
  }
  if (audiences.length === 0) {
    throw new Error('Google Identity não configurado. Defina GOOGLE_CLIENT_ID ou NEXT_PUBLIC_GOOGLE_CLIENT_ID.');
  }

  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: audiences,
  });

  if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
    throw new Error('Google não retornou identidade suficiente.');
  }

  return {
    sub: payload.sub,
    email: payload.email,
    email_verified: Boolean(payload.email_verified),
    name: typeof payload.name === 'string' ? payload.name : undefined,
    given_name: typeof payload.given_name === 'string' ? payload.given_name : undefined,
    family_name: typeof payload.family_name === 'string' ? payload.family_name : undefined,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined,
  };
}

export async function createGoogleAuthUrl(input?: { nextPath?: string | null; mode?: 'login' | 'register'; baseUrl?: string | null }) {
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
  url.searchParams.set('redirect_uri', getRedirectUri(input?.baseUrl));
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

export async function exchangeGoogleCode(code: string, codeVerifier: string, baseUrl?: string | null) {
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
      redirect_uri: getRedirectUri(baseUrl),
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
