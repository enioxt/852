/**
 * Report Store — Persistence layer for shared reports
 *
 * Uses localStorage now, designed for easy migration to Supabase.
 * Reports are anonymized conversation snapshots that users chose to share.
 */

export interface ReportMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type ReportStatus = 'draft' | 'reviewed' | 'shared' | 'deleted';

export interface Report {
  id: string;
  conversationId: string;
  messages: ReportMessage[];
  sanitizedMessages: ReportMessage[];
  status: ReportStatus;
  piiRemoved: number;
  aiSuggestions?: string[];
  createdAt: number;
  updatedAt: number;
  sharedAt?: number;
  deletedAt?: number;
}

const STORAGE_KEY = '852-reports';

// ─── Core CRUD ───────────────────────────────────────────────────────────────

function getAll(): Report[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(reports: Report[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export function listReports(): Report[] {
  return getAll()
    .filter(r => r.status !== 'deleted')
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function listSharedReports(): Report[] {
  return getAll()
    .filter(r => r.status === 'shared')
    .sort((a, b) => (b.sharedAt || b.updatedAt) - (a.sharedAt || a.updatedAt));
}

export function getReport(id: string): Report | undefined {
  return getAll().find(r => r.id === id);
}

export function createReport(
  conversationId: string,
  messages: ReportMessage[],
  sanitizedMessages: ReportMessage[],
  piiRemoved: number,
  aiSuggestions?: string[],
): Report {
  const report: Report = {
    id: crypto.randomUUID(),
    conversationId,
    messages,
    sanitizedMessages,
    status: 'reviewed',
    piiRemoved,
    aiSuggestions,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const all = getAll();
  all.push(report);
  saveAll(all);
  return report;
}

export function shareReport(id: string): Report | undefined {
  const all = getAll();
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) return undefined;
  all[idx].status = 'shared';
  all[idx].sharedAt = Date.now();
  all[idx].updatedAt = Date.now();
  saveAll(all);
  return all[idx];
}

export function deleteReport(id: string): boolean {
  const all = getAll();
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) return false;
  all[idx].status = 'deleted';
  all[idx].deletedAt = Date.now();
  all[idx].updatedAt = Date.now();
  saveAll(all);
  return true;
}

export function getReportCount(): number {
  return getAll().filter(r => r.status === 'shared').length;
}

// ─── Share URL ───────────────────────────────────────────────────────────────

export function getShareUrl(reportId: string): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/reports?id=${reportId}`;
}
