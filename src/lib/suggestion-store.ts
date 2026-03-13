import type { ReviewData } from '@/lib/report-format';

export type SuggestionStatus = 'draft' | 'validated' | 'published';

export interface SuggestionHistoryItem {
  id: string;
  title: string;
  rawBody: string;
  sanitizedBody: string;
  category: string;
  tags: string[];
  attachmentNames: string[];
  piiRemoved: number;
  atrianScore: number;
  atrianPassed: boolean;
  atrianViolationCount: number;
  reviewData?: ReviewData | null;
  issueId?: string;
  status: SuggestionStatus;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = '852-suggestions-history';

function getAll(): SuggestionHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as SuggestionHistoryItem[] : [];
  } catch {
    return [];
  }
}

function saveAll(items: SuggestionHistoryItem[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function listSuggestions(): SuggestionHistoryItem[] {
  return getAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function saveSuggestionHistoryEntry(
  item: Omit<SuggestionHistoryItem, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    createdAt?: number;
    updatedAt?: number;
  }
): SuggestionHistoryItem {
  const all = getAll();
  const now = Date.now();
  const nextItem: SuggestionHistoryItem = {
    ...item,
    id: item.id || crypto.randomUUID(),
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now,
  };

  const existingIndex = all.findIndex((entry) => entry.id === nextItem.id || (entry.issueId && nextItem.issueId && entry.issueId === nextItem.issueId));
  if (existingIndex >= 0) {
    const merged: SuggestionHistoryItem = {
      ...all[existingIndex],
      ...nextItem,
      createdAt: all[existingIndex].createdAt,
      updatedAt: now,
    };
    all[existingIndex] = merged;
    saveAll(all);
    return merged;
  }

  all.push(nextItem);
  saveAll(all);
  return nextItem;
}

export function deleteSuggestionHistoryEntry(id: string): boolean {
  const all = getAll();
  const filtered = all.filter((entry) => entry.id !== id);
  if (filtered.length === all.length) return false;
  saveAll(filtered);
  return true;
}
