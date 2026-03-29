/**
 * Integration Hub — Config Store
 *
 * Loads non-bootstrap config from app_config_852 (Supabase) and overlays
 * values onto process.env so all existing code (ai-provider.ts, mailer.ts,
 * notifications.ts, etc.) picks them up without any changes.
 *
 * Bootstrap (never stored in DB):
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - CONFIG_ENCRYPTION_KEY
 *
 * All other keys can be managed via /admin/integrations.
 *
 * Usage: call `await ensureConfigLoaded()` at the top of any API route handler.
 * Subsequent calls within the TTL window are instant (no-op).
 */

import { getSupabase } from '@/lib/supabase';
import { decryptConfig } from '@/lib/crypto-config';

const TTL_MS = 5 * 60 * 1000; // 5 minutes
let lastLoadedAt = 0;

/** Load config from Supabase into process.env (with TTL cache). */
export async function ensureConfigLoaded(): Promise<void> {
  const now = Date.now();
  if (now - lastLoadedAt < TTL_MS) return;

  try {
    const sb = getSupabase();
    if (!sb) return;

    const { data, error } = await sb
      .from('app_config_852')
      .select('config_key, config_value, is_configured')
      .eq('is_configured', true);

    if (error) {
      // Table might not exist yet (pre-migration) — fail silently
      if (error.code !== '42P01') {
        console.error('[config-store] Failed to load config:', error.message);
      }
      return;
    }

    for (const row of data || []) {
      if (!row.config_value) continue;
      const plain = decryptConfig(row.config_value);
      if (plain) {
        process.env[row.config_key] = plain;
      }
    }

    lastLoadedAt = now;
  } catch (err) {
    console.error('[config-store] Unexpected error loading config:', err);
  }
}

/** Force a cache invalidation (call after saving a new config value). */
export function invalidateConfigCache(): void {
  lastLoadedAt = 0;
}

/** Read a single config value: DB cache → process.env → fallback. */
export function getConfigValue(key: string, fallback?: string): string | undefined {
  return process.env[key] ?? fallback;
}
