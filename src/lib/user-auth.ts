/**
 * 🔐 User Auth — 852 Inteligência
 *
 * Optional user authentication for cross-device chat persistence.
 * Uses PBKDF2 hashing (Web Crypto API) + session tokens in Supabase.
 */

import { cookies } from 'next/headers';
import { validateDisplayName } from './name-validator';
import { getSupabase } from './supabase';
import { recordEvent } from './telemetry';

const SESSION_COOKIE = '852_user_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const EMAIL_VERIFICATION_WINDOW_MS = 24 * 60 * 60 * 1000;

type AuthUserRow = {
  id: string;
  email: string;
  display_name: string | null;
  masp: string | null;
  lotacao: string | null;
  validation_status: string | null;
  email_verified_at: string | null;
  email_verification_sent_at?: string | null;
  password_set_at?: string | null;
  password_hash: string | null;
  auth_provider: string | null;
  google_sub: string | null;
  avatar_url: string | null;
  profile_completed_at: string | null;
  reputation_points?: number | null;
  is_active?: boolean | null;
};

export type CurrentAuthUser = {
  id: string;
  email: string;
  display_name: string | null;
  displayName: string | null;
  masp: string | null;
  lotacao: string | null;
  validation_status: string | null;
  email_verified_at: string | null;
  auth_provider: string | null;
  avatar_url: string | null;
  profile_completed_at: string | null;
  reputation_points: number;
  has_password: boolean;
  is_profile_complete: boolean;
};

function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

function normalizeDisplayName(displayName?: string | null) {
  const trimmed = displayName?.trim() || '';
  return trimmed || null;
}

function normalizeMasp(masp?: string | null) {
  const digits = (masp || '').replace(/\D/g, '');
  return digits || null;
}

function normalizeBaseUrl(baseUrl?: string | null) {
  const trimmed = baseUrl?.trim() || '';
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return '';
  return trimmed.replace(/\/$/, '');
}

function getPublicBaseUrl(baseUrl?: string | null) {
  const runtimeBaseUrl = normalizeBaseUrl(baseUrl);
  if (runtimeBaseUrl) {
    return runtimeBaseUrl;
  }
  if (process.env.PUBLIC_BASE_URL) {
    return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
  }
  return process.env.NODE_ENV === 'production' ? 'https://852.egos.ia.br' : 'http://localhost:3000';
}

function buildPublicUser(user: AuthUserRow): CurrentAuthUser {
  const isProfileComplete = Boolean(user.profile_completed_at || user.display_name);
  return {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    displayName: user.display_name,
    masp: user.masp,
    lotacao: user.lotacao,
    validation_status: user.validation_status,
    email_verified_at: user.email_verified_at,
    auth_provider: user.auth_provider,
    avatar_url: user.avatar_url,
    profile_completed_at: user.profile_completed_at,
    reputation_points: user.reputation_points || 0,
    has_password: Boolean(user.password_hash),
    is_profile_complete: isProfileComplete,
  };
}

async function sha256(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function issueEmailVerification(params: { userId: string; email: string; displayName?: string | null; baseUrl?: string | null }) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase não configurado', status: 503 };

  const token = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
  const tokenHash = await sha256(token);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_WINDOW_MS).toISOString();
  const verificationUrl = `${getPublicBaseUrl(params.baseUrl)}/verificar-email?token=${encodeURIComponent(token)}`;

  const { error: updateError } = await sb
    .from('user_accounts_852')
    .update({
      email_verification_token_hash: tokenHash,
      email_verification_expires_at: expiresAt,
      email_verification_sent_at: now,
    })
    .eq('id', params.userId);

  if (updateError) return { error: updateError.message, status: 500 };

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'Tira-Voz <onboarding@resend.dev>';
  if (!resendApiKey) {
    return {
      sent: false,
      warning: 'Conta criada, mas o envio de email não está configurado neste ambiente.',
      debugVerificationUrl: process.env.NODE_ENV === 'production' ? undefined : verificationUrl,
    };
  }

  const greeting = params.displayName?.trim() ? `Olá, ${params.displayName.trim()}!` : 'Olá!';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [params.email],
      subject: 'Confirme seu email — Tira-Voz',
      html: `
        <div style="background:#0a0a0a;padding:32px;font-family:Inter,Arial,sans-serif;color:#e5e7eb;line-height:1.6;">
          <div style="max-width:560px;margin:0 auto;border:1px solid #262626;border-radius:18px;padding:32px;background:#111111;">
            <p style="margin:0 0 16px;font-size:14px;color:#93c5fd;">Tira-Voz</p>
            <h1 style="margin:0 0 16px;font-size:24px;color:#ffffff;">Confirme seu email para ativar sua conta</h1>
            <p style="margin:0 0 16px;font-size:15px;color:#d4d4d8;">${greeting}</p>
            <p style="margin:0 0 24px;font-size:15px;color:#d4d4d8;">Clique no botão abaixo para verificar seu email. O link expira em 24 horas.</p>
            <a href="${verificationUrl}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;">Verificar email</a>
            <p style="margin:24px 0 8px;font-size:13px;color:#a1a1aa;">Se o botão não abrir, copie e cole este link:</p>
            <p style="margin:0;font-size:13px;word-break:break-all;color:#93c5fd;">${verificationUrl}</p>
          </div>
        </div>
      `,
      text: `${greeting}\n\nVerifique seu email para ativar sua conta no Tira-Voz:\n${verificationUrl}\n\nEsse link expira em 24 horas.`,
    }),
  });

  if (!response.ok) {
    console.error('[852-auth] verification email error:', await response.text());
    return {
      sent: false,
      warning: 'Conta criada, mas não foi possível enviar o email de verificação agora.',
      debugVerificationUrl: process.env.NODE_ENV === 'production' ? undefined : verificationUrl,
    };
  }

  await recordEvent({ event_type: 'email_verification_sent', metadata: { userId: params.userId } });

  return {
    sent: true,
    debugVerificationUrl: process.env.NODE_ENV === 'production' ? undefined : verificationUrl,
  };
}

async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const useSalt = salt || crypto.randomUUID();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(useSalt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256,
  );
  const hashHex = Array.from(new Uint8Array(bits)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return { hash: hashHex, salt: useSalt };
}

async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  const { hash } = await hashPassword(password, salt);
  return hash === storedHash;
}

async function createSession(userId: string) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase não configurado');

  const token = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  await sb.from('user_sessions_852').insert({
    user_id: userId,
    token,
    expires_at: expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS / 1000,
    path: '/',
  });
}

async function updateLastLogin(userId: string) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('user_accounts_852').update({ last_login: new Date().toISOString() }).eq('id', userId);
}

async function getUserById(userId: string) {
  const sb = getSupabase();
  if (!sb) return null;

  const { data: user } = await sb
    .from('user_accounts_852')
    .select('id, email, display_name, masp, lotacao, validation_status, email_verified_at, password_set_at, password_hash, auth_provider, google_sub, avatar_url, profile_completed_at, reputation_points, is_active')
    .eq('id', userId)
    .maybeSingle();

  return (user as AuthUserRow | null) || null;
}

export async function registerUser(
  email: string,
  password: string,
  displayName?: string,
  masp?: string,
  lotacao?: string,
  options?: { baseUrl?: string | null },
) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase não configurado', status: 503 };

  const normalizedEmail = normalizeEmail(email);
  const normalizedDisplayName = normalizeDisplayName(displayName);
  const normalizedMasp = normalizeMasp(masp);

  if (!normalizedDisplayName) {
    return { error: 'Codinome obrigatório', status: 400 };
  }

  if (normalizedDisplayName) {
    const nameValidation = await validateDisplayName(normalizedDisplayName);
    if (!nameValidation.valid) {
      return { error: nameValidation.reason || 'Codinome inválido', status: 400 };
    }
  }

  if (normalizedMasp && !/^\d{8}$/.test(normalizedMasp)) {
    return { error: 'MASP inválido. Use o número com 8 dígitos. Exemplo: 12571402.', status: 400 };
  }

  const { data: existing } = await sb
    .from('user_accounts_852')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existing) return { error: 'Este email já está cadastrado', status: 409 };

  if (normalizedMasp) {
    const { data: maspExisting } = await sb
      .from('user_accounts_852')
      .select('id')
      .eq('masp', normalizedMasp)
      .maybeSingle();
    if (maspExisting) return { error: 'Este MASP já está cadastrado', status: 409 };
  }

  const { hash, salt } = await hashPassword(password);
  const now = new Date().toISOString();

  const { data, error } = await sb
    .from('user_accounts_852')
    .insert({
      email: normalizedEmail,
      password_hash: `${salt}:${hash}`,
      display_name: normalizedDisplayName,
      masp: normalizedMasp,
      lotacao: lotacao?.trim() || null,
      validation_status: normalizedMasp ? 'pending' : 'none',
      email_verified_at: null,
      auth_provider: 'password',
      profile_completed_at: normalizedDisplayName ? now : null,
      password_set_at: now,
    })
    .select('id, email, display_name, masp, lotacao, validation_status, email_verified_at, password_hash, auth_provider, google_sub, avatar_url, profile_completed_at, reputation_points')
    .single();

  if (error) return { error: error.message, status: 500 };

  const verificationResult = await issueEmailVerification({
    userId: data.id,
    email: data.email,
    displayName: data.display_name,
    baseUrl: options?.baseUrl,
  });
  if ('error' in verificationResult) return { error: verificationResult.error, status: verificationResult.status ?? 500 };

  return {
    user: buildPublicUser(data as AuthUserRow),
    requiresEmailVerification: true,
    verificationEmailSent: verificationResult.sent,
    warning: verificationResult.sent ? undefined : verificationResult.warning,
    debugVerificationUrl: verificationResult.debugVerificationUrl,
  };
}

export async function loginUser(email: string, password: string) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase não configurado', status: 503 };

  const normalizedEmail = normalizeEmail(email);
  const { data: user } = await sb
    .from('user_accounts_852')
    .select('id, email, display_name, masp, lotacao, validation_status, email_verified_at, email_verification_sent_at, password_set_at, password_hash, auth_provider, google_sub, avatar_url, profile_completed_at, reputation_points, is_active')
    .eq('email', normalizedEmail)
    .maybeSingle();

  const authUser = user as AuthUserRow | null;
  if (!authUser) return { error: 'Email ou senha incorretos', status: 401 };
  if (!authUser.is_active) return { error: 'Conta desativada', status: 403 };
  if (!authUser.password_hash) {
    return {
      error: 'Esta conta foi criada com Google. Entre com Google ou defina uma senha na sua conta.',
      status: 400,
    };
  }

  const [salt, storedHash] = authUser.password_hash.split(':');
  const valid = await verifyPassword(password, storedHash, salt);
  if (!valid) return { error: 'Email ou senha incorretos', status: 401 };

  if (!authUser.email_verified_at && authUser.email_verification_sent_at) {
    return {
      error: 'Verifique seu email antes de entrar.',
      status: 403,
      needsEmailVerification: true,
      email: authUser.email,
    };
  }

  await createSession(authUser.id);
  await updateLastLogin(authUser.id);

  return {
    user: buildPublicUser(authUser),
  };
}

export async function loginWithGoogleIdentity(profile: {
  sub: string;
  email: string;
  email_verified?: boolean;
  picture?: string;
}) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase não configurado' };

  if (!profile.sub || !profile.email) {
    return { error: 'Google não retornou identidade suficiente.' };
  }

  if (profile.email_verified === false) {
    return { error: 'O email retornado pelo Google não está verificado.' };
  }

  const normalizedEmail = normalizeEmail(profile.email);
  let finalUser: AuthUserRow | null = null;
  let created = false;
  let linked = false;

  const { data: byGoogle } = await sb
    .from('user_accounts_852')
    .select('id, email, display_name, masp, lotacao, validation_status, email_verified_at, password_set_at, password_hash, auth_provider, google_sub, avatar_url, profile_completed_at, reputation_points, is_active')
    .eq('google_sub', profile.sub)
    .maybeSingle();

  if (byGoogle) {
    const { data: updated } = await sb
      .from('user_accounts_852')
      .update({
        email: normalizedEmail,
        avatar_url: profile.picture || byGoogle.avatar_url || null,
        email_verified_at: byGoogle.email_verified_at || new Date().toISOString(),
        auth_provider: byGoogle.password_hash ? 'hybrid' : 'google',
      })
      .eq('id', byGoogle.id)
      .select('id, email, display_name, masp, lotacao, validation_status, email_verified_at, password_set_at, password_hash, auth_provider, google_sub, avatar_url, profile_completed_at, reputation_points, is_active')
      .single();

    finalUser = (updated as AuthUserRow | null) || null;
  } else {
    const { data: byEmail } = await sb
      .from('user_accounts_852')
      .select('id, email, display_name, masp, lotacao, validation_status, email_verified_at, password_set_at, password_hash, auth_provider, google_sub, avatar_url, profile_completed_at, reputation_points, is_active')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (byEmail?.google_sub && byEmail.google_sub !== profile.sub) {
      return { error: 'Este email já está vinculado a outra conta Google.' };
    }

    if (byEmail) {
      linked = true;
      const { data: updated } = await sb
        .from('user_accounts_852')
        .update({
          google_sub: profile.sub,
          avatar_url: profile.picture || byEmail.avatar_url || null,
          email_verified_at: byEmail.email_verified_at || new Date().toISOString(),
          auth_provider: byEmail.password_hash ? 'hybrid' : 'google',
        })
        .eq('id', byEmail.id)
        .select('id, email, display_name, masp, lotacao, validation_status, email_verified_at, password_set_at, password_hash, auth_provider, google_sub, avatar_url, profile_completed_at, reputation_points, is_active')
        .single();

      finalUser = (updated as AuthUserRow | null) || null;
    } else {
      created = true;
      const { data: inserted, error } = await sb
        .from('user_accounts_852')
        .insert({
          email: normalizedEmail,
          password_hash: null,
          display_name: null,
          validation_status: 'none',
          email_verified_at: new Date().toISOString(),
          auth_provider: 'google',
          google_sub: profile.sub,
          avatar_url: profile.picture || null,
          profile_completed_at: null,
        })
        .select('id, email, display_name, masp, lotacao, validation_status, email_verified_at, password_set_at, password_hash, auth_provider, google_sub, avatar_url, profile_completed_at, reputation_points')
        .single();

      if (error) return { error: error.message };
      finalUser = inserted as AuthUserRow;
    }
  }

  if (!finalUser) {
    return { error: 'Não foi possível concluir o login com Google.' };
  }
  if (finalUser.is_active === false) {
    return { error: 'Conta desativada' };
  }

  await createSession(finalUser.id);
  await updateLastLogin(finalUser.id);

  return {
    user: buildPublicUser(finalUser),
    created,
    linked,
    needsOnboarding: !Boolean(finalUser.profile_completed_at || finalUser.display_name),
  };
}

export async function getCurrentUser() {
  const sb = getSupabase();
  if (!sb) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const { data: session } = await sb
    .from('user_sessions_852')
    .select('user_id, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (!session || new Date(session.expires_at) < new Date()) return null;

  const user = await getUserById(session.user_id);
  if (!user) return null;
  return buildPublicUser(user);
}

export async function updateCurrentUserProfile(input: {
  displayName: string;
  masp?: string | null;
  lotacao?: string | null;
}) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase não configurado' };

  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: 'Sessão inválida', status: 401 };

  const normalizedDisplayName = normalizeDisplayName(input.displayName);
  if (!normalizedDisplayName) return { error: 'Codinome obrigatório', status: 400 };

  const nameValidation = await validateDisplayName(normalizedDisplayName);
  if (!nameValidation.valid) {
    return { error: nameValidation.reason || 'Codinome inválido', status: 400, suggestions: nameValidation.suggestions };
  }

  const normalizedMasp = normalizeMasp(input.masp);
  if (normalizedMasp && !/^\d{8}$/.test(normalizedMasp)) {
    return { error: 'MASP inválido. Use o número com 8 dígitos.', status: 400 };
  }

  const { data: existing } = await sb
    .from('user_accounts_852')
    .select('id, masp, validation_status')
    .eq('id', currentUser.id)
    .single();

  if (!existing) {
    return { error: 'Conta não encontrada', status: 404 };
  }

  if (normalizedMasp && normalizedMasp !== existing.masp) {
    const { data: maspExisting } = await sb
      .from('user_accounts_852')
      .select('id')
      .eq('masp', normalizedMasp)
      .neq('id', currentUser.id)
      .maybeSingle();

    if (maspExisting) {
      return { error: 'Este MASP já está vinculado a outra conta.', status: 400 };
    }
  }

  let validationStatus = existing.validation_status || 'none';
  if (!normalizedMasp) {
    validationStatus = 'none';
  } else if (normalizedMasp !== existing.masp || validationStatus === 'none' || validationStatus === 'rejected') {
    validationStatus = 'pending';
  }

  const { data: updated, error } = await sb
    .from('user_accounts_852')
    .update({
      display_name: normalizedDisplayName,
      masp: normalizedMasp,
      lotacao: input.lotacao?.trim() || null,
      validation_status: validationStatus,
      profile_completed_at: new Date().toISOString(),
    })
    .eq('id', currentUser.id)
    .select('id, email, display_name, masp, lotacao, validation_status, email_verified_at, password_set_at, password_hash, auth_provider, google_sub, avatar_url, profile_completed_at, reputation_points, is_active')
    .single();

  if (error) return { error: error.message, status: 500 };

  await recordEvent({ event_type: 'user_registered', metadata: { userId: currentUser.id, action: 'profile_completed' } });

  return { user: buildPublicUser(updated as AuthUserRow) };
}

export async function updateCurrentUserPassword(input: {
  currentPassword?: string;
  newPassword: string;
}) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase não configurado' };

  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: 'Sessão inválida', status: 401 };
  if (!input.newPassword || input.newPassword.length < 8) {
    return { error: 'A nova senha deve ter pelo menos 8 caracteres.', status: 400 };
  }

  const { data: user } = await sb
    .from('user_accounts_852')
    .select('id, password_hash, google_sub')
    .eq('id', currentUser.id)
    .single();

  if (!user) {
    return { error: 'Conta não encontrada', status: 404 };
  }

  if (user.password_hash) {
    if (!input.currentPassword) {
      return { error: 'Informe a senha atual para alterá-la.', status: 400 };
    }
    const [salt, storedHash] = user.password_hash.split(':');
    const valid = await verifyPassword(input.currentPassword, storedHash, salt);
    if (!valid) return { error: 'Senha atual incorreta.', status: 400 };
  }

  const { hash, salt } = await hashPassword(input.newPassword);
  const { error } = await sb
    .from('user_accounts_852')
    .update({
      password_hash: `${salt}:${hash}`,
      password_set_at: new Date().toISOString(),
      auth_provider: user.google_sub ? 'hybrid' : 'password',
    })
    .eq('id', currentUser.id);

  if (error) return { error: error.message, status: 500 };
  return { success: true };
}

type PasswordResetTokenPayload = {
  sub: string;
  email: string;
  purpose: 'password_reset';
  exp: number;
  passwordSetAt: string | null;
};

function getAuthTokenSecret() {
  return process.env.AUTH_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

function encodeTokenPart(value: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function decodeTokenPart<T>(value: string) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
}

async function signToken(value: string) {
  const secret = getAuthTokenSecret();
  if (!secret) throw new Error('AUTH_TOKEN_SECRET não configurado.');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return Buffer.from(signature).toString('base64url');
}

async function createSignedToken(payload: PasswordResetTokenPayload) {
  const header = encodeTokenPart({ alg: 'HS256', typ: 'JWT' });
  const body = encodeTokenPart(payload);
  const signature = await signToken(`${header}.${body}`);
  return `${header}.${body}.${signature}`;
}

async function verifySignedToken(token: string): Promise<PasswordResetTokenPayload> {
  const [header, body, signature] = token.split('.');
  if (!header || !body || !signature) {
    throw new Error('Token inválido.');
  }
  const expectedSignature = await signToken(`${header}.${body}`);
  if (expectedSignature !== signature) {
    throw new Error('Token inválido.');
  }
  const payload = decodeTokenPart<PasswordResetTokenPayload>(body);
  if (payload.purpose !== 'password_reset' || !payload.sub || !payload.email) {
    throw new Error('Token inválido.');
  }
  if (!payload.exp || payload.exp * 1000 < Date.now()) {
    throw new Error('Token expirado.');
  }
  return payload;
}

async function issuePasswordReset(params: { userId: string; email: string; displayName?: string | null; passwordSetAt: string | null; baseUrl?: string | null }) {
  const token = await createSignedToken({
    sub: params.userId,
    email: params.email,
    purpose: 'password_reset',
    exp: Math.floor((Date.now() + EMAIL_VERIFICATION_WINDOW_MS) / 1000),
    passwordSetAt: params.passwordSetAt,
  });
  const resetUrl = `${getPublicBaseUrl(params.baseUrl)}/conta?auth=reset&token=${encodeURIComponent(token)}`;

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'Tira-Voz <onboarding@resend.dev>';
  if (!resendApiKey) {
    return {
      sent: false,
      warning: 'Recuperação criada, mas o envio de email não está configurado neste ambiente.',
      debugResetUrl: process.env.NODE_ENV === 'production' ? undefined : resetUrl,
    };
  }

  const greeting = params.displayName?.trim() ? `Olá, ${params.displayName.trim()}!` : 'Olá!';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [params.email],
      subject: 'Redefina sua senha — Tira-Voz',
      html: `
        <div style="background:#0a0a0a;padding:32px;font-family:Inter,Arial,sans-serif;color:#e5e7eb;line-height:1.6;">
          <div style="max-width:560px;margin:0 auto;border:1px solid #262626;border-radius:18px;padding:32px;background:#111111;">
            <p style="margin:0 0 16px;font-size:14px;color:#93c5fd;">Tira-Voz</p>
            <h1 style="margin:0 0 16px;font-size:24px;color:#ffffff;">Redefina sua senha de acesso</h1>
            <p style="margin:0 0 16px;font-size:15px;color:#d4d4d8;">${greeting}</p>
            <p style="margin:0 0 24px;font-size:15px;color:#d4d4d8;">Use o botão abaixo para criar uma nova senha. O link expira em 24 horas e deixa de valer assim que você salvar outra senha.</p>
            <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;">Redefinir senha</a>
            <p style="margin:24px 0 8px;font-size:13px;color:#a1a1aa;">Se o botão não abrir, copie e cole este link:</p>
            <p style="margin:0;font-size:13px;word-break:break-all;color:#93c5fd;">${resetUrl}</p>
          </div>
        </div>
      `,
      text: `${greeting}\n\nRedefina sua senha do Tira-Voz em:\n${resetUrl}\n\nEsse link expira em 24 horas e deixa de valer depois que você salvar uma nova senha.`,
    }),
  });

  if (!response.ok) {
    console.error('[852-auth] password reset email error:', await response.text());
    return {
      sent: false,
      warning: 'Não foi possível enviar o email de recuperação agora.',
      debugResetUrl: process.env.NODE_ENV === 'production' ? undefined : resetUrl,
    };
  }

  return {
    sent: true,
    debugResetUrl: process.env.NODE_ENV === 'production' ? undefined : resetUrl,
  };
}

export async function requestPasswordReset(email: string, options?: { baseUrl?: string | null }) {
  const sb = getSupabase();
  if (!sb) return { success: false, error: 'Supabase não configurado', status: 503 };

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return { success: false, error: 'Email obrigatório', status: 400 };

  const { data: user } = await sb
    .from('user_accounts_852')
    .select('id, email, display_name, password_set_at, is_active')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (!user || user.is_active === false) {
    return { success: true };
  }

  const resetResult = await issuePasswordReset({
    userId: user.id,
    email: user.email,
    displayName: user.display_name,
    passwordSetAt: user.password_set_at,
    baseUrl: options?.baseUrl,
  });

  return {
    success: true,
    resetEmailSent: resetResult.sent,
    warning: resetResult.sent ? undefined : resetResult.warning,
    debugResetUrl: resetResult.debugResetUrl,
  };
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase não configurado', status: 500 };
  if (!newPassword || newPassword.length < 8) {
    return { error: 'A nova senha deve ter pelo menos 8 caracteres.', status: 400 };
  }

  let payload: PasswordResetTokenPayload;
  try {
    payload = await verifySignedToken(token.trim());
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Token inválido.', status: 400 };
  }

  const { data: user } = await sb
    .from('user_accounts_852')
    .select('id, email, email_verified_at, password_set_at, google_sub, is_active')
    .eq('id', payload.sub)
    .eq('email', normalizeEmail(payload.email))
    .maybeSingle();

  if (!user) {
    return { error: 'Link inválido ou expirado.', status: 400 };
  }
  if (user.is_active === false) {
    return { error: 'Conta desativada.', status: 403 };
  }
  if ((user.password_set_at || null) !== (payload.passwordSetAt || null)) {
    return { error: 'Este link já foi substituído por uma senha mais recente.', status: 400 };
  }

  const { hash, salt } = await hashPassword(newPassword);
  const { error } = await sb
    .from('user_accounts_852')
    .update({
      password_hash: `${salt}:${hash}`,
      password_set_at: new Date().toISOString(),
      auth_provider: user.google_sub ? 'hybrid' : 'password',
      email_verified_at: user.email_verified_at || new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return { error: error.message, status: 500 };
  }

  await createSession(user.id);
  await updateLastLogin(user.id);
  const finalUser = await getUserById(user.id);

  return {
    success: true,
    user: finalUser ? buildPublicUser(finalUser) : null,
  };
}

export async function verifyEmailToken(token: string) {
  const sb = getSupabase();
  if (!sb) return { status: 'error' as const };

  const normalizedToken = token.trim();
  if (!normalizedToken) return { status: 'missing' as const };

  const tokenHash = await sha256(normalizedToken);
  const { data: user } = await sb
    .from('user_accounts_852')
    .select('id, email, validation_status, email_verified_at, email_verification_expires_at')
    .eq('email_verification_token_hash', tokenHash)
    .maybeSingle();

  if (!user) return { status: 'invalid' as const };
  if (user.email_verified_at) {
    return {
      status: 'already_verified' as const,
      email: user.email,
      validationStatus: user.validation_status,
    };
  }
  if (!user.email_verification_expires_at || new Date(user.email_verification_expires_at) < new Date()) {
    return {
      status: 'expired' as const,
      email: user.email,
      validationStatus: user.validation_status,
    };
  }

  const { error } = await sb
    .from('user_accounts_852')
    .update({
      email_verified_at: new Date().toISOString(),
      email_verification_token_hash: null,
      email_verification_expires_at: null,
    })
    .eq('id', user.id);

  if (error) {
    return {
      status: 'error' as const,
      email: user.email,
      validationStatus: user.validation_status,
    };
  }

  await recordEvent({ event_type: 'email_verified', metadata: { userId: user.id } });

  return {
    status: 'success' as const,
    email: user.email,
    validationStatus: user.validation_status,
  };
}

export async function resendVerificationEmail(email: string, options?: { baseUrl?: string | null }) {
  const sb = getSupabase();
  if (!sb) return { success: false, error: 'Supabase não configurado', status: 503 };

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return { success: false, error: 'Email obrigatório', status: 400 };

  const { data: user } = await sb
    .from('user_accounts_852')
    .select('id, email, display_name, email_verified_at')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (!user) return { success: true };
  if (user.email_verified_at) return { success: true, alreadyVerified: true };

  const verificationResult = await issueEmailVerification({
    userId: user.id,
    email: user.email,
    displayName: user.display_name,
    baseUrl: options?.baseUrl,
  });

  if ('error' in verificationResult) {
    return {
      success: false,
      error: verificationResult.error,
      status: verificationResult.status ?? 500,
    };
  }

  return {
    success: true,
    verificationEmailSent: verificationResult.sent,
    warning: verificationResult.sent ? undefined : verificationResult.warning,
    debugVerificationUrl: verificationResult.debugVerificationUrl,
  };
}

// ── Email Code (OTP) Login ──────────────────────────────────────────

const EMAIL_CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const EMAIL_CODE_MAX_ACTIVE = 3; // max pending codes per email in window

function generateOtpCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, '0');
}

export async function sendEmailCode(
  email: string,
  options?: { baseUrl?: string | null; ip?: string | null },
) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase não configurado', status: 503 };

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { error: 'Email inválido', status: 400 };
  }

  // Rate limit: max 3 active codes per email
  const windowStart = new Date(Date.now() - EMAIL_CODE_EXPIRY_MS).toISOString();
  const { count } = await sb
    .from('auth_codes_852')
    .select('id', { count: 'exact', head: true })
    .eq('email', normalizedEmail)
    .is('used_at', null)
    .gte('created_at', windowStart);

  if ((count ?? 0) >= EMAIL_CODE_MAX_ACTIVE) {
    return { error: 'Muitos códigos enviados. Aguarde alguns minutos.', status: 429 };
  }

  const code = generateOtpCode();
  const codeHash = await sha256(code);
  const expiresAt = new Date(Date.now() + EMAIL_CODE_EXPIRY_MS).toISOString();

  const { error: insertError } = await sb.from('auth_codes_852').insert({
    email: normalizedEmail,
    code_hash: codeHash,
    expires_at: expiresAt,
    ip_address: options?.ip || null,
  });

  if (insertError) return { error: insertError.message, status: 500 };

  // Send email via Resend
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'Tira-Voz <onboarding@resend.dev>';

  if (!resendApiKey) {
    return {
      sent: false,
      warning: 'Envio de email não está configurado neste ambiente.',
      debugCode: process.env.NODE_ENV === 'production' ? undefined : code,
    };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [normalizedEmail],
      subject: 'Seu código de acesso — Tira-Voz',
      html: `
        <div style="background:#0a0a0a;padding:32px;font-family:Inter,Arial,sans-serif;color:#e5e7eb;line-height:1.6;">
          <div style="max-width:560px;margin:0 auto;border:1px solid #262626;border-radius:18px;padding:32px;background:#111111;">
            <p style="margin:0 0 16px;font-size:14px;color:#93c5fd;">Tira-Voz</p>
            <h1 style="margin:0 0 16px;font-size:24px;color:#ffffff;">Seu código de acesso</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#d4d4d8;">Use o código abaixo para entrar. Ele expira em 10 minutos.</p>
            <div style="background:#1a1a2e;border:2px solid #2563eb;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
              <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#ffffff;font-family:monospace;">${code}</span>
            </div>
            <p style="margin:0;font-size:13px;color:#a1a1aa;">Se você não solicitou este código, ignore este email.</p>
          </div>
        </div>
      `,
      text: `Seu código de acesso ao Tira-Voz: ${code}\n\nEle expira em 10 minutos. Se você não solicitou, ignore este email.`,
    }),
  });

  if (!response.ok) {
    console.error('[852-auth] code email error:', await response.text());
    return {
      sent: false,
      warning: 'Não foi possível enviar o email agora. Tente novamente.',
      debugCode: process.env.NODE_ENV === 'production' ? undefined : code,
    };
  }

  await recordEvent({ event_type: 'email_code_sent', metadata: { email: normalizedEmail } });

  return {
    sent: true,
    debugCode: process.env.NODE_ENV === 'production' ? undefined : code,
  };
}

export async function verifyEmailCode(
  email: string,
  code: string,
  options?: { baseUrl?: string | null },
) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase não configurado', status: 503 };

  const normalizedEmail = normalizeEmail(email);
  const codeHash = await sha256(code.trim());
  const now = new Date().toISOString();

  // Find matching unused code
  const { data: codeRow } = await sb
    .from('auth_codes_852')
    .select('id, expires_at')
    .eq('email', normalizedEmail)
    .eq('code_hash', codeHash)
    .is('used_at', null)
    .gte('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!codeRow) {
    return { error: 'Código inválido ou expirado.', status: 401 };
  }

  // Mark code as used
  await sb.from('auth_codes_852').update({ used_at: now }).eq('id', codeRow.id);

  // Invalidate other pending codes for this email
  await sb
    .from('auth_codes_852')
    .update({ used_at: now })
    .eq('email', normalizedEmail)
    .is('used_at', null);

  // Check if user exists
  const { data: existingUser } = await sb
    .from('user_accounts_852')
    .select('id, email, display_name, masp, lotacao, validation_status, email_verified_at, password_set_at, password_hash, auth_provider, google_sub, avatar_url, profile_completed_at, reputation_points, is_active')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existingUser) {
    const authUser = existingUser as AuthUserRow;
    if (!authUser.is_active) return { error: 'Conta desativada', status: 403 };

    // Mark email as verified if not already
    if (!authUser.email_verified_at) {
      await sb
        .from('user_accounts_852')
        .update({ email_verified_at: now })
        .eq('id', authUser.id);
      authUser.email_verified_at = now;
    }

    await createSession(authUser.id);
    await updateLastLogin(authUser.id);
    await recordEvent({ event_type: 'user_login', metadata: { userId: authUser.id, method: 'email_code' } });

    return {
      user: buildPublicUser(authUser),
      isNewUser: false,
    };
  }

  // Create new account (no password, will need nickname onboarding)
  const { data: newUser, error: insertError } = await sb
    .from('user_accounts_852')
    .insert({
      email: normalizedEmail,
      password_hash: null,
      display_name: null,
      validation_status: 'none',
      email_verified_at: now,
      auth_provider: 'email_code',
      profile_completed_at: null,
    })
    .select('id, email, display_name, masp, lotacao, validation_status, email_verified_at, password_set_at, password_hash, auth_provider, google_sub, avatar_url, profile_completed_at, reputation_points')
    .single();

  if (insertError) return { error: insertError.message, status: 500 };

  await createSession(newUser.id);
  await recordEvent({ event_type: 'user_registered', metadata: { userId: newUser.id, method: 'email_code' } });

  return {
    user: buildPublicUser(newUser as AuthUserRow),
    isNewUser: true,
  };
}

export async function logoutUser() {
  const sb = getSupabase();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token && sb) {
    await sb.from('user_sessions_852').delete().eq('token', token);
  }

  cookieStore.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' });
}
