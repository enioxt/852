/**
 * Report Store — Persistence layer for shared reports
 *
 * Uses localStorage now, designed for easy migration to Supabase.
 * Reports are anonymized conversation snapshots that users chose to share.
 */

import { getMetadataValue } from '@/lib/session';
import type { ReviewData } from '@/lib/report-format';

export interface ReportMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type ReportStatus = 'draft' | 'reviewed' | 'shared' | 'pending_human' | 'published' | 'deleted';

export interface Report {
  id: string;
  serverId?: string;
  conversationId: string;
  messages: ReportMessage[];
  sanitizedMessages: ReportMessage[];
  status: ReportStatus;
  piiRemoved: number;
  aiSuggestions?: string[];
  reviewData?: ReviewData | null;
  title?: string;
  summary?: string;
  tags?: string[];
  formattedMarkdown?: string;
  shareText?: string;
  reporterTypeLabel?: string;
  createdAt: number;
  updatedAt: number;
  sharedAt?: number;
  deletedAt?: number;
  isOwn?: boolean;
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
    .filter(r => r.status === 'shared' || r.status === 'pending_human' || r.status === 'published')
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
  options?: {
    reviewData?: ReviewData | null;
    title?: string;
    summary?: string;
    tags?: string[];
    formattedMarkdown?: string;
    shareText?: string;
    reporterTypeLabel?: string;
  },
): Report {
  const report: Report = {
    id: crypto.randomUUID(),
    conversationId,
    messages,
    sanitizedMessages,
    status: 'reviewed',
    piiRemoved,
    aiSuggestions,
    reviewData: options?.reviewData || null,
    title: options?.title,
    summary: options?.summary,
    tags: options?.tags || [],
    formattedMarkdown: options?.formattedMarkdown,
    shareText: options?.shareText,
    reporterTypeLabel: options?.reporterTypeLabel,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const all = getAll();
  all.push(report);
  saveAll(all);
  return report;
}

export function shareReport(id: string, serverId?: string): Report | undefined {
  const all = getAll();
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) return undefined;
  all[idx].status = 'pending_human';
  if (serverId) all[idx].serverId = serverId;
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

type ServerReportPayload = {
  id: string;
  conversation_id: string;
  created_at: string;
  status: string;
  messages: ReportMessage[];
  review_data?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

function normalizeServerReport(report: ServerReportPayload): Report {
  const sanitizedMessages = getMetadataValue<ReportMessage[]>(report.metadata, 'sanitizedMessages') || report.messages;
  const piiRemoved = getMetadataValue<number>(report.metadata, 'piiRemoved') || 0;
  const localReportId = getMetadataValue<string>(report.metadata, 'localReportId') || report.id;
  const clientConversationId = getMetadataValue<string>(report.metadata, 'clientConversationId') || report.conversation_id;
  const aiSuggestions = getMetadataValue<string[]>(report.metadata, 'aiSuggestions') || [];
  const title = getMetadataValue<string>(report.metadata, 'title') || undefined;
  const summary = getMetadataValue<string>(report.metadata, 'summary') || undefined;
  const tags = getMetadataValue<string[]>(report.metadata, 'tags') || [];
  const formattedMarkdown = getMetadataValue<string>(report.metadata, 'formattedMarkdown') || undefined;
  const shareText = getMetadataValue<string>(report.metadata, 'shareText') || undefined;
  const reporterTypeLabel = getMetadataValue<string>(report.metadata, 'reporterTypeLabel') || undefined;
  const sharedAt = new Date(report.created_at).getTime();

  return {
    id: localReportId,
    serverId: report.id,
    conversationId: clientConversationId,
    messages: report.messages,
    sanitizedMessages,
    status: (report.status as ReportStatus) || 'shared',
    piiRemoved,
    aiSuggestions,
    reviewData: (report.review_data as ReviewData | null) || null,
    title,
    summary,
    tags,
    formattedMarkdown,
    shareText,
    reporterTypeLabel,
    createdAt: sharedAt,
    updatedAt: sharedAt,
    sharedAt,
  };
}

export async function loadSharedReportsFromServer(sessionHash: string): Promise<Report[]> {
  const res = await fetch(`/api/reports/server?ownOnly=true&sessionHash=${encodeURIComponent(sessionHash)}`);
  if (!res.ok) return [];
  const data = await res.json();
  const reports = Array.isArray(data.reports) ? data.reports.map(normalizeServerReport) : [];
  if (reports.length > 0) {
    saveAll(reports);
  }
  return reports;
}

export async function syncReportToServer(payload: {
  localReportId: string;
  conversationId: string;
  serverConversationId?: string | null;
  messages: ReportMessage[];
  sanitizedMessages: ReportMessage[];
  piiRemoved: number;
  aiSuggestions?: string[];
  reviewData?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  sessionHash: string;
}): Promise<string | null> {
  const res = await fetch('/api/reports/server', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: payload.serverConversationId || payload.conversationId,
      messages: payload.sanitizedMessages,
      reviewData: payload.reviewData || null,
      sessionHash: payload.sessionHash,
      metadata: {
        localReportId: payload.localReportId,
        clientConversationId: payload.conversationId,
        sanitizedMessages: payload.sanitizedMessages,
        piiRemoved: payload.piiRemoved,
        aiSuggestions: payload.aiSuggestions || [],
        ...(payload.metadata || {}),
      },
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return typeof data.id === 'string' ? data.id : null;
}

export async function deleteReportFromServer(serverId: string): Promise<boolean> {
  const res = await fetch('/api/reports/server', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: serverId }),
  });

  return res.ok;
}

export async function loadAllPublicReports(sessionHash: string): Promise<Report[]> {
  const [allRes, ownRes] = await Promise.all([
    fetch('/api/reports/server'),
    sessionHash
      ? fetch(`/api/reports/server?ownOnly=true&sessionHash=${encodeURIComponent(sessionHash)}`)
      : Promise.resolve(new Response(JSON.stringify({ reports: [] }))),
  ]);

  const allData = allRes.ok ? (await allRes.json() as { reports: ServerReportPayload[] }) : { reports: [] as ServerReportPayload[] };
  const ownData = ownRes.ok ? (await ownRes.json() as { reports: ServerReportPayload[] }) : { reports: [] as ServerReportPayload[] };

  const ownIds = new Set((ownData.reports || []).map((r: ServerReportPayload) => r.id));

  return (allData.reports || []).map((r: ServerReportPayload) => ({
    ...normalizeServerReport(r),
    isOwn: ownIds.has(r.id),
  }));
}
