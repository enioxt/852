type Bucket = {
  count: number;
  resetAt: number;
};

// ─── Per-identity budget tiers ────────────────────────────────────────────────

/** Budget limits per identity tier (CHAT-008) */
export const IDENTITY_BUDGET = {
  /** Authenticated users get a more generous window */
  authenticated: { limit: 50, windowMs: 10 * 60 * 1000 },
  /** Anonymous session hash — moderate */
  anonymous:     { limit: 20, windowMs: 10 * 60 * 1000 },
  /** Fallback when no identity is available — same as per-IP */
  unknown:       { limit: 12, windowMs:  5 * 60 * 1000 },
} as const;

export type IdentityTier = keyof typeof IDENTITY_BUDGET;

/** Derive tier from identityKey prefix (user: vs anon:) */
export function getIdentityTier(identityKey: string | null): IdentityTier {
  if (!identityKey) return 'unknown';
  if (identityKey.startsWith('user:')) return 'authenticated';
  if (identityKey.startsWith('anon:')) return 'anonymous';
  return 'unknown';
}

/**
 * Check the per-identity budget on top of the per-IP rate limit.
 * Call this AFTER checkRateLimit(ip) passes.
 * Returns false if identity budget is exhausted.
 */
export function checkIdentityBudget(identityKey: string | null): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  tier: IdentityTier;
} {
  const tier = getIdentityTier(identityKey);
  const { limit, windowMs } = IDENTITY_BUDGET[tier];
  const key = `budget:${identityKey ?? 'unknown'}`;
  const result = checkRateLimit(key, limit, windowMs);
  return { ...result, tier };
}

const buckets = new Map<string, Bucket>();

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'anonymous';
  }
  return headers.get('x-real-ip') || headers.get('cf-connecting-ip') || 'anonymous';
}

export function checkRateLimit(key: string, limit: number, windowMs: number): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    const nextBucket: Bucket = {
      count: 1,
      resetAt: now + windowMs,
    };
    buckets.set(key, nextBucket);
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: nextBucket.resetAt,
    };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: bucket.resetAt,
    };
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  return {
    allowed: true,
    remaining: limit - bucket.count,
    resetAt: bucket.resetAt,
  };
}
