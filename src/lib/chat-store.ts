export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: number;
}

export interface Conversation {
  id: string;
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

export function createConversation(): Conversation {
  const conv: Conversation = {
    id: crypto.randomUUID(),
    title: 'Nova conversa',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const all = getAll();
  all.push(conv);
  saveAll(all);
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
