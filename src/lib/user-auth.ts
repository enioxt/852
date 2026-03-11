/**
 * 🔐 User Auth — 852 Inteligência
 *
 * Optional user authentication for cross-device chat persistence.
 * Uses PBKDF2 hashing (Web Crypto API) + session tokens in Supabase.
 */

import { getSupabase } from './supabase';
import { recordEvent } from './telemetry';
import { cookies } from 'next/headers';

const SESSION_COOKIE = '852_user_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const EMAIL_VERIFICATION_WINDOW_MS = 24 * 60 * 60 * 1000;

type AuthUser = {
  id: string;
  email: string;
  display_name: string | null;
  masp: string | null;
  lotacao: string | null;
  validation_status: string | null;
  email_verified_at: string | null;
};

function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

function getPublicBaseUrl() {
  if (process.env.PUBLIC_BASE_URL) {
    return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
  }
  return process.env.NODE_ENV === 'production' ? 'https://852.egos.ia.br' : 'http://localhost:3000';
}

async function sha256(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function issueEmailVerification(params: { userId: string; email: string; displayName?: string | null }) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase não configurado' };

  const token = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
  const tokenHash = await sha256(token);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_WINDOW_MS).toISOString();
  const verificationUrl = `${getPublicBaseUrl()}/verificar-email?token=${encodeURIComponent(token)}`;

  const { error: updateError } = await sb
    .from('user_accounts_852')
    .update({
      email_verification_token_hash: tokenHash,
      email_verification_expires_at: expiresAt,
      email_verification_sent_at: now,
    })
    .eq('id', params.userId);

  if (updateError) return { error: updateError.message };

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;
  if (!resendApiKey || !resendFromEmail) {
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

// ── Password Hashing (PBKDF2) ───────────────────────────

async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const useSalt = salt || crypto.randomUUID();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(useSalt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const hashHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return { hash: hashHex, salt: useSalt };
}

async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  const { hash } = await hashPassword(password, salt);
  return hash === storedHash;
}

// ── User Registration ────────────────────────────────────

export async function registerUser(
  email: string,
  password: string,
  displayName?: string,
  masp?: string,
  lotacao?: string,
) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase não configurado' };
  const normalizedEmail = normalizeEmail(email);

  // Validate MASP format (numeric, 5-9 chars)
  if (masp && !/^\d{5,9}$/.test(masp.trim())) {
    return { error: 'MASP inválido — deve conter apenas números (5 a 9 dígitos)' };
  }

  // Check if email already exists
  const { data: existing } = await sb
    .from('user_accounts_852')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existing) return { error: 'Este email já está cadastrado' };

  // Check if MASP already exists
  if (masp) {
    const { data: maspExisting } = await sb
      .from('user_accounts_852')
      .select('id')
      .eq('masp', masp.trim())
      .maybeSingle();
    if (maspExisting) return { error: 'Este MASP já está cadastrado' };
  }

  const { hash, salt } = await hashPassword(password);

  const { data, error } = await sb
    .from('user_accounts_852')
    .insert({
      email: normalizedEmail,
      password_hash: `${salt}:${hash}`,
      display_name: displayName || null,
      masp: masp?.trim() || null,
      lotacao: lotacao?.trim() || null,
      validation_status: masp ? 'pending' : 'none',
      email_verified_at: null,
    })
    .select('id, email, display_name, masp, lotacao, validation_status, email_verified_at')
    .single();

  if (error) return { error: error.message };

  const verificationResult = await issueEmailVerification({ userId: data.id, email: data.email, displayName: data.display_name });
  if ('error' in verificationResult) return { error: verificationResult.error };

  return {
    user: data as AuthUser,
    requiresEmailVerification: true,
    verificationEmailSent: verificationResult.sent,
    warning: verificationResult.sent ? undefined : verificationResult.warning,
    debugVerificationUrl: verificationResult.debugVerificationUrl,
  };
}

// ── User Login ───────────────────────────────────────────

export async function loginUser(email: string, password: string) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase não configurado' };
  const normalizedEmail = normalizeEmail(email);

  const { data: user } = await sb
    .from('user_accounts_852')
    .select('id, email, display_name, password_hash, is_active, email_verified_at, email_verification_sent_at')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (!user) return { error: 'Email ou senha incorretos' };
  if (!user.is_active) return { error: 'Conta desativada' };

  const [salt, storedHash] = user.password_hash.split(':');
  const valid = await verifyPassword(password, storedHash, salt);
  if (!valid) return { error: 'Email ou senha incorretos' };
  if (!user.email_verified_at && user.email_verification_sent_at) {
    return {
      error: 'Verifique seu email antes de entrar.',
      status: 403,
      needsEmailVerification: true,
      email: user.email,
    };
  }

  // Create session
  const token = crypto.randomUUID() + '-' + crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  await sb.from('user_sessions_852').insert({
    user_id: user.id,
    token,
    expires_at: expiresAt,
  });

  // Update last login
  await sb.from('user_accounts_852').update({ last_login: new Date().toISOString() }).eq('id', user.id);

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS / 1000,
    path: '/',
  });

  return {
    user: { id: user.id, email: user.email, displayName: user.display_name },
  };
}

// ── Session Check ────────────────────────────────────────

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

  const { data: user } = await sb
    .from('user_accounts_852')
    .select('id, email, display_name, masp, lotacao, validation_status, email_verified_at')
    .eq('id', session.user_id)
    .maybeSingle();

  return user || null;
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

export async function resendVerificationEmail(email: string) {
  const sb = getSupabase();
  if (!sb) return { success: false, error: 'Supabase não configurado' };

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return { success: false, error: 'Email obrigatório' };

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
  });

  if ('error' in verificationResult) return { success: false, error: verificationResult.error };

  return {
    success: true,
    verificationEmailSent: verificationResult.sent,
    warning: verificationResult.sent ? undefined : verificationResult.warning,
    debugVerificationUrl: verificationResult.debugVerificationUrl,
  };
}

// ── Logout ───────────────────────────────────────────────

export async function logoutUser() {
  const sb = getSupabase();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token && sb) {
    await sb.from('user_sessions_852').delete().eq('token', token);
  }

  cookieStore.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' });
}
