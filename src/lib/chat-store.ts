export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: number;
}

export interface Conversation {
  id: string;
  serverId?: string;
  title: string;
  messages: StoredMessage[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = '852-conversations';

function getStorageKey(scope?: string) {
  return scope ? `${STORAGE_KEY}:${scope}` : STORAGE_KEY;
}

function readBucket(storageKey: string): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getAll(scope?: string): Conversation[] {
  const scopedKey = getStorageKey(scope);
  const scoped = readBucket(scopedKey);
  if (scoped.length > 0 || !scope || !scope.startsWith('anon:')) return scoped;

  const legacy = readBucket(STORAGE_KEY);
  if (legacy.length > 0 && typeof window !== 'undefined') {
    localStorage.setItem(scopedKey, JSON.stringify(legacy));
  }
  return legacy;
}

function saveAll(convs: Conversation[], scope?: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getStorageKey(scope), JSON.stringify(convs));
}

export function listConversations(scope?: string): Conversation[] {
  return getAll(scope).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getConversation(id: string, scope?: string): Conversation | undefined {
  return getAll(scope).find(c => c.id === id);
}

export function getConversationServerId(id: string, scope?: string): string | null {
  return getConversation(id, scope)?.serverId || null;
}

export function replaceConversations(conversations: Conversation[], scope?: string) {
  saveAll(conversations, scope);
}

export function upsertConversation(conversation: Conversation, scope?: string) {
  const all = getAll(scope);
  const idx = all.findIndex(c => c.id === conversation.id);
  if (idx === -1) {
    all.push(conversation);
  } else {
    all[idx] = {
      ...all[idx],
      ...conversation,
      serverId: conversation.serverId || all[idx].serverId,
    };
  }
  saveAll(all.sort((a, b) => b.updatedAt - a.updatedAt), scope);
}

export function setConversationServerId(id: string, serverId: string, scope?: string) {
  const all = getAll(scope);
  const idx = all.findIndex(c => c.id === id);
  if (idx === -1) return;
  all[idx].serverId = serverId;
  saveAll(all, scope);
}

export function createConversation(seed?: Partial<Conversation>, scope?: string): Conversation {
  const conv: Conversation = {
    id: seed?.id || crypto.randomUUID(),
    serverId: seed?.serverId,
    title: seed?.title || 'Nova conversa',
    messages: seed?.messages || [],
    createdAt: seed?.createdAt || Date.now(),
    updatedAt: seed?.updatedAt || Date.now(),
  };
  const all = getAll(scope);
  const idx = all.findIndex(existing => existing.id === conv.id);
  if (idx === -1) all.push(conv);
  else all[idx] = conv;
  saveAll(all.sort((a, b) => b.updatedAt - a.updatedAt), scope);
  return conv;
}

export function updateConversation(id: string, messages: StoredMessage[], title?: string, scope?: string) {
  const all = getAll(scope);
  const idx = all.findIndex(c => c.id === id);
  if (idx === -1) return;
  all[idx].messages = messages;
  all[idx].updatedAt = Date.now();
  if (title) all[idx].title = title;
  saveAll(all, scope);
}

export function deleteConversation(id: string, scope?: string) {
  const all = getAll(scope).filter(c => c.id !== id);
  saveAll(all, scope);
}

export function generateTitle(firstMessage: string): string {
  const clean = firstMessage.replace(/\n/g, ' ').trim();
  if (clean.length <= 40) return clean;
  return clean.substring(0, 37) + '...';
}
