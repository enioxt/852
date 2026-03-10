/**
 * 📊 Telemetry Module — 852 Inteligência
 *
 * Structured telemetry with dual output:
 * 1. Supabase persistence (when configured)
 * 2. Structured JSON console logs (always — parseable from docker logs)
 *
 * Events: chat_completion, chat_error, rate_limit_hit, page_view, report_generation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ── Types ──────────────────────────────────────────────────

export type TelemetryEventType =
  | 'chat_completion'
  | 'chat_error'
  | 'rate_limit_hit'
  | 'report_generation'
  | 'report_error'
  | 'report_shared'
  | 'report_deleted'
  | 'report_review'
  | 'provider_unavailable'
  | 'atrian_violation';

export interface TelemetryEvent {
  event_type: TelemetryEventType;
  model_id?: string;
  provider?: string;
  tokens_in?: number;
  tokens_out?: number;
  cost_usd?: number;
  duration_ms?: number;
  client_ip_hash?: string;
  status_code?: number;
  error_message?: string;
  metadata?: Record<string, unknown>;
}

// ── Supabase Client (lazy, nullable) ──────────────────────

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _supabase = createClient(url, key);
  return _supabase;
}

// ── IP Hashing (privacy-safe) ─────────────────────────────

function hashIp(ip: string): string {
  // Simple deterministic hash — NOT cryptographic, just for grouping
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// ── Core: Record Event ────────────────────────────────────

export async function recordEvent(event: TelemetryEvent): Promise<void> {
  const timestamp = new Date().toISOString();
  const ipHash = event.client_ip_hash ? hashIp(event.client_ip_hash) : undefined;

  // 1. Always emit structured JSON log (parseable from docker logs)
  const logEntry = {
    t: timestamp,
    ev: event.event_type,
    model: event.model_id,
    provider: event.provider,
    in: event.tokens_in,
    out: event.tokens_out,
    cost: event.cost_usd,
    ms: event.duration_ms,
    ip: ipHash,
    status: event.status_code,
    err: event.error_message,
  };
  // Remove undefined keys for cleaner logs
  const clean = Object.fromEntries(Object.entries(logEntry).filter(([, v]) => v !== undefined));
  console.log(`[852-telemetry] ${JSON.stringify(clean)}`);

  // 2. Persist to Supabase if configured
  const sb = getSupabase();
  if (!sb) return;

  try {
    await sb.from('telemetry_852').insert({
      event_type: event.event_type,
      model_id: event.model_id || null,
      provider: event.provider || null,
      tokens_in: event.tokens_in || null,
      tokens_out: event.tokens_out || null,
      cost_usd: event.cost_usd || null,
      duration_ms: event.duration_ms || null,
      client_ip_hash: ipHash || null,
      status_code: event.status_code || null,
      error_message: event.error_message || null,
      metadata: event.metadata || null,
      created_at: timestamp,
    });
  } catch {
    // Silent fail — telemetry must never break the app
  }
}

// ── Convenience helpers ───────────────────────────────────

export function recordChatCompletion(opts: {
  modelId: string;
  provider: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  durationMs?: number;
  clientIp?: string;
}) {
  return recordEvent({
    event_type: 'chat_completion',
    model_id: opts.modelId,
    provider: opts.provider,
    tokens_in: opts.tokensIn,
    tokens_out: opts.tokensOut,
    cost_usd: opts.costUsd,
    duration_ms: opts.durationMs,
    client_ip_hash: opts.clientIp,
    status_code: 200,
  });
}

export function recordRateLimitHit(clientIp: string, endpoint: string) {
  return recordEvent({
    event_type: 'rate_limit_hit',
    client_ip_hash: clientIp,
    status_code: 429,
    metadata: { endpoint },
  });
}

export function recordChatError(error: string, clientIp?: string) {
  return recordEvent({
    event_type: 'chat_error',
    error_message: error,
    client_ip_hash: clientIp,
    status_code: 500,
  });
}

// ── Query: Get Stats (for admin dashboard) ────────────────

export interface TelemetryStats {
  totalEvents: number;
  totalChats: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalCostUsd: number;
  rateLimitHits: number;
  errors: number;
  byModel: Record<string, number>;
  byProvider: Record<string, number>;
  recentEvents: Array<Record<string, unknown>>;
}

export async function getStats(days: number = 7): Promise<TelemetryStats | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data: events, error } = await sb
      .from('telemetry_852')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error || !events) return null;

    const stats: TelemetryStats = {
      totalEvents: events.length,
      totalChats: 0,
      totalTokensIn: 0,
      totalTokensOut: 0,
      totalCostUsd: 0,
      rateLimitHits: 0,
      errors: 0,
      byModel: {},
      byProvider: {},
      recentEvents: events.slice(0, 20),
    };

    for (const e of events) {
      if (e.event_type === 'chat_completion') {
        stats.totalChats++;
        stats.totalTokensIn += e.tokens_in || 0;
        stats.totalTokensOut += e.tokens_out || 0;
        stats.totalCostUsd += e.cost_usd || 0;
        if (e.model_id) stats.byModel[e.model_id] = (stats.byModel[e.model_id] || 0) + 1;
        if (e.provider) stats.byProvider[e.provider] = (stats.byProvider[e.provider] || 0) + 1;
      }
      if (e.event_type === 'rate_limit_hit') stats.rateLimitHits++;
      if (e.event_type === 'chat_error' || e.event_type === 'report_error') stats.errors++;
    }

    return stats;
  } catch {
    return null;
  }
}
