const SESSION_STORAGE_KEY = '852_session_hash';

export function getOrCreateSessionHash(): string {
  if (typeof window === 'undefined') {
    return crypto.randomUUID();
  }

  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;

  const created = crypto.randomUUID();
  window.localStorage.setItem(SESSION_STORAGE_KEY, created);
  return created;
}

export function createInteractionHash(): string {
  return `${Date.now().toString(36)}-${crypto.randomUUID()}`;
}

export function getIdentityKey(sessionHash?: string | null, userId?: string | null): string | null {
  if (userId) return `user:${userId}`;
  if (sessionHash) return `anon:${sessionHash}`;
  return null;
}

export function getClientConversationId(metadata: unknown, fallbackId?: string | null): string | null {
  if (metadata && typeof metadata === 'object' && 'clientConversationId' in metadata) {
    const value = (metadata as { clientConversationId?: unknown }).clientConversationId;
    if (typeof value === 'string' && value.trim()) return value;
  }

  return fallbackId || null;
}

export function getMetadataValue<T>(metadata: unknown, key: string): T | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const value = (metadata as Record<string, unknown>)[key];
  return (value as T) ?? null;
}
