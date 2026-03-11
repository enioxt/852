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

function getAll(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(convs: Conversation[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
}

export function listConversations(): Conversation[] {
  return getAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getConversation(id: string): Conversation | undefined {
  return getAll().find(c => c.id === id);
}

export function getConversationServerId(id: string): string | null {
  return getConversation(id)?.serverId || null;
}

export function replaceConversations(conversations: Conversation[]) {
  saveAll(conversations);
}

export function upsertConversation(conversation: Conversation) {
  const all = getAll();
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
  saveAll(all.sort((a, b) => b.updatedAt - a.updatedAt));
}

export function setConversationServerId(id: string, serverId: string) {
  const all = getAll();
  const idx = all.findIndex(c => c.id === id);
  if (idx === -1) return;
  all[idx].serverId = serverId;
  saveAll(all);
}

export function createConversation(seed?: Partial<Conversation>): Conversation {
  const conv: Conversation = {
    id: seed?.id || crypto.randomUUID(),
    serverId: seed?.serverId,
    title: seed?.title || 'Nova conversa',
    messages: seed?.messages || [],
    createdAt: seed?.createdAt || Date.now(),
    updatedAt: seed?.updatedAt || Date.now(),
  };
  const all = getAll();
  const idx = all.findIndex(existing => existing.id === conv.id);
  if (idx === -1) all.push(conv);
  else all[idx] = conv;
  saveAll(all.sort((a, b) => b.updatedAt - a.updatedAt));
  return conv;
}

export function updateConversation(id: string, messages: StoredMessage[], title?: string) {
  const all = getAll();
  const idx = all.findIndex(c => c.id === id);
  if (idx === -1) return;
  all[idx].messages = messages;
  all[idx].updatedAt = Date.now();
  if (title) all[idx].title = title;
  saveAll(all);
}

export function deleteConversation(id: string) {
  const all = getAll().filter(c => c.id !== id);
  saveAll(all);
}

export function generateTitle(firstMessage: string): string {
  const clean = firstMessage.replace(/\n/g, ' ').trim();
  if (clean.length <= 40) return clean;
  return clean.substring(0, 37) + '...';
}
