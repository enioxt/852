/**
 * 🔐 User Auth — 852 Inteligência
 *
 * Optional user authentication for cross-device chat persistence.
 * Uses PBKDF2 hashing (Web Crypto API) + session tokens in Supabase.
 */

import { getSupabase } from './supabase';
import { cookies } from 'next/headers';

const SESSION_COOKIE = '852_user_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

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

export async function registerUser(email: string, password: string, displayName?: string) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase não configurado' };

  // Check if email already exists
  const { data: existing } = await sb
    .from('user_accounts_852')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (existing) return { error: 'Este email já está cadastrado' };

  const { hash, salt } = await hashPassword(password);

  const { data, error } = await sb
    .from('user_accounts_852')
    .insert({
      email: email.toLowerCase().trim(),
      password_hash: `${salt}:${hash}`,
      display_name: displayName || null,
    })
    .select('id, email, display_name')
    .single();

  if (error) return { error: error.message };
  return { user: data };
}

// ── User Login ───────────────────────────────────────────

export async function loginUser(email: string, password: string) {
  const sb = getSupabase();
  if (!sb) return { error: 'Supabase não configurado' };

  const { data: user } = await sb
    .from('user_accounts_852')
    .select('id, email, display_name, password_hash, is_active')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (!user) return { error: 'Email ou senha incorretos' };
  if (!user.is_active) return { error: 'Conta desativada' };

  const [salt, storedHash] = user.password_hash.split(':');
  const valid = await verifyPassword(password, storedHash, salt);
  if (!valid) return { error: 'Email ou senha incorretos' };

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
    .select('id, email, display_name')
    .eq('id', session.user_id)
    .maybeSingle();

  return user || null;
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
