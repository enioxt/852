/**
 * 🔐 Admin Auth — 852 Inteligência
 *
 * Email/password authentication for admin panel.
 * Uses bcrypt-compatible hashing via Web Crypto API.
 * Sessions stored in Supabase (admin_sessions_852).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const SESSION_COOKIE = '852_admin_session';
const SESSION_DURATION_HOURS = 24;

// ── Supabase Client ──────────────────────────────────────

let _sb: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (_sb) return _sb;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _sb = createClient(url, key);
  return _sb;
}

// ── Password Hashing (Web Crypto - no native deps) ──────

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2:${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':');
  if (parts[0] !== 'pbkdf2' || parts.length !== 3) return false;
  const salt = new Uint8Array(parts[1].match(/.{2}/g)!.map(h => parseInt(h, 16)));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === parts[2];
}

// ── Token Generation ─────────────────────────────────────

function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Public API ───────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

/**
 * Create an admin user (for initial setup)
 */
export async function createAdminUser(
  email: string,
  password: string,
  name?: string
): Promise<{ success: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { success: false, error: 'Supabase não configurado' };

  const passwordHash = await hashPassword(password);

  const { error } = await sb.from('admin_users_852').insert({
    email: email.toLowerCase().trim(),
    password_hash: passwordHash,
    name: name || null,
    role: 'admin',
  });

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Email já cadastrado' };
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Login: verify credentials, create session, set cookie
 */
export async function login(
  email: string,
  password: string,
  ipHash?: string
): Promise<{ success: boolean; error?: string; user?: AdminUser }> {
  const sb = getSupabase();
  if (!sb) return { success: false, error: 'Supabase não configurado' };

  // Find user
  const { data: user, error: findErr } = await sb
    .from('admin_users_852')
    .select('id, email, password_hash, name, role, is_active')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (findErr || !user) return { success: false, error: 'Credenciais inválidas' };
  if (!user.is_active) return { success: false, error: 'Conta desativada' };

  // Verify password
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return { success: false, error: 'Credenciais inválidas' };

  // Create session
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  await sb.from('admin_sessions_852').insert({
    admin_id: user.id,
    token,
    expires_at: expiresAt.toISOString(),
    ip_hash: ipHash || null,
  });

  // Update last_login
  await sb.from('admin_users_852').update({ last_login: new Date().toISOString() }).eq('id', user.id);

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_HOURS * 60 * 60,
  });

  return {
    success: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

/**
 * Logout: delete session, clear cookie
 */
export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const sb = getSupabase();
    if (sb) await sb.from('admin_sessions_852').delete().eq('token', token);
  }
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Get current admin from session cookie
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const sb = getSupabase();
  if (!sb) return null;

  // Find valid session
  const { data: session } = await sb
    .from('admin_sessions_852')
    .select('admin_id, expires_at')
    .eq('token', token)
    .single();

  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) {
    // Expired — clean up
    await sb.from('admin_sessions_852').delete().eq('token', token);
    return null;
  }

  // Get admin user
  const { data: user } = await sb
    .from('admin_users_852')
    .select('id, email, name, role, is_active')
    .eq('id', session.admin_id)
    .single();

  if (!user || !user.is_active) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

/**
 * Require admin auth — returns user or throws redirect
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    throw new Error('UNAUTHORIZED');
  }
  return admin;
}
