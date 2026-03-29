'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldX,
  ChevronDown,
  ChevronUp,
  Brain,
  Tag,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface ReportMessage {
  role: string;
  content: string;
}

interface ReviewData {
  resumo?: string;
  temas?: string[];
  sugestoes?: Array<{ texto?: string }>;
  pontosCegos?: string[];
  [key: string]: unknown;
}

interface ReportMetadata {
  tags?: string[];
  summary?: string;
  userDisplayName?: string;
  userEmail?: string;
  formattedMarkdown?: string;
  [key: string]: unknown;
}

interface Report {
  id: string;
  created_at: string;
  updated_at: string;
  status: 'pending_human' | 'published' | 'deleted';
  messages: ReportMessage[];
  metadata: ReportMetadata | null;
  review_data: ReviewData | null;
  message_count?: number;
  conversation_id?: string;
}

interface Pagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface Summary {
  pending: number;
  published: number;
  deleted: number;
}

interface ApiResponse {
  configured: boolean;
  message?: string;
  reports?: Report[];
  pagination?: Pagination;
  summary?: Summary;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos (exceto deletados)' },
  { value: 'pending_human', label: 'Pendentes' },
  { value: 'published', label: 'Publicados' },
  { value: 'deleted', label: 'Deletados' },
];

const DAY_OPTIONS = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '14', label: 'Últimos 14 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
];

export default function AdminReportsPage() {
  const router = useRouter();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [daysFilter, setDaysFilter] = useState('30');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        days: daysFilter,
        page: String(p),
      });
      const res = await fetch(`/api/admin/reports?${params}`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError('Falha ao carregar relatórios.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, daysFilter, page, router]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const applyFilters = () => {
    setPage(1);
    load(1);
  };

  useEffect(() => {
    load(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const reports = data?.reports || [];
  const pagination = data?.pagination;
  const summary = data?.summary || { pending: 0, published: 0, deleted: 0 };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-[family-name:var(--font-geist-sans)]">
      <header className="border-b border-neutral-800/50 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/curadoria" className="p-2 rounded-lg hover:bg-neutral-800 transition">
            <ArrowLeft className="w-4 h-4 text-neutral-400" />
          </Link>
          <FileText className="w-5 h-5 text-blue-400" />
          <div>
            <h1 className="text-lg font-semibold text-white">Relatórios Compartilhados</h1>
            <p className="text-xs text-neutral-500">Visão geral de todos os relatos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/curadoria"
            className="h-10 px-4 inline-flex items-center rounded-xl border border-neutral-800 text-sm text-neutral-300 hover:bg-neutral-900 transition"
          >
            Curadoria
          </Link>
          <Link
            href="/admin/telemetry"
            className="h-10 px-4 inline-flex items-center rounded-xl border border-neutral-800 text-sm text-neutral-300 hover:bg-neutral-900 transition"
          >
            Telemetria
          </Link>
          <button
            onClick={() => load(page)}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-neutral-800 transition text-neutral-400 hover:text-white disabled:opacity-50"
            title="Atualizar"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-neutral-800 transition text-neutral-400 hover:text-red-400"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <div className="rounded-xl border border-red-800/40 bg-red-900/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 flex flex-wrap items-end gap-3">
          <Filter className="w-4 h-4 text-neutral-500 mt-1 shrink-0" />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-500">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-500">Período</label>
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
            >
              {DAY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={applyFilters}
            className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm text-white transition"
          >
            Filtrar
          </button>
        </div>

        {/* Summary */}
        {data?.configured && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard icon={Clock3} label="Pendentes" value={summary.pending} tone="amber" />
            <SummaryCard icon={CheckCircle2} label="Publicados" value={summary.published} tone="green" />
            <SummaryCard icon={ShieldX} label="Deletados" value={summary.deleted} tone="red" />
          </div>
        )}

        {loading && !data && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
          </div>
        )}

        {data && !data.configured && (
          <div className="rounded-2xl border border-amber-800/40 bg-amber-900/10 p-6">
            <p className="text-sm text-neutral-400">{data.message}</p>
          </div>
        )}

        {data?.configured && (
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-neutral-500" />
                <h2 className="text-sm font-semibold text-white">
                  Relatórios
                  {pagination && <span className="ml-2 text-xs text-neutral-500 font-normal">({pagination.total} total)</span>}
                </h2>
              </div>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />}
            </div>

            {reports.length === 0 && !loading ? (
              <div className="px-6 py-14 text-center">
                <p className="text-sm text-neutral-500">Nenhum relatório encontrado para os filtros aplicados.</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-800/70">
                {reports.map((report) => (
                  <ReportRow
                    key={report.id}
                    report={report}
                    expanded={expandedId === report.id}
                    onToggle={() => setExpandedId(expandedId === report.id ? null : report.id)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-neutral-800 flex items-center justify-between gap-3">
                <span className="text-xs text-neutral-500">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page <= 1 || loading}
                    className="p-1.5 rounded-lg hover:bg-neutral-800 disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.page >= pagination.totalPages || loading}
                    className="p-1.5 rounded-lg hover:bg-neutral-800 disabled:opacity-40 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function ReportRow({
  report,
  expanded,
  onToggle,
}: {
  report: Report;
  expanded: boolean;
  onToggle: () => void;
}) {
  const meta = report.metadata || {};
  const rd = report.review_data;
  const tags = Array.isArray(meta.tags) ? meta.tags : [];
  const msgCount = report.message_count || report.messages?.length || 0;
  const isAnon = !meta.userEmail;

  const statusStyle: Record<string, string> = {
    pending_human: 'bg-amber-900/20 text-amber-400 border-amber-800/30',
    published: 'bg-green-900/20 text-green-400 border-green-800/30',
    deleted: 'bg-red-900/20 text-red-400 border-red-800/30',
  };

  const statusLabel: Record<string, string> = {
    pending_human: 'Pendente',
    published: 'Publicado',
    deleted: 'Deletado',
  };

  return (
    <div className="p-4 space-y-3">
      {/* Row header */}
      <div
        className="flex flex-wrap items-center gap-2 cursor-pointer group"
        onClick={onToggle}
      >
        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${statusStyle[report.status]}`}>
          {statusLabel[report.status]}
        </span>
        <span className={`px-2 py-0.5 rounded-md text-[11px] border ${
          isAnon ? 'bg-neutral-800 text-neutral-400 border-neutral-700' : 'bg-blue-900/20 text-blue-400 border-blue-800/30'
        }`}>
          {isAnon ? 'Anônimo' : String(meta.userDisplayName || 'Validado')}
        </span>

        {tags.slice(0, 4).map((tag) => (
          <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 text-[11px]">
            <Tag className="w-2.5 h-2.5" />
            {tag}
          </span>
        ))}

        <span className="flex items-center gap-1 text-xs text-neutral-500 ml-auto">
          <MessageSquare className="w-3 h-3" />
          {msgCount} msgs
        </span>

        <span className="text-xs text-neutral-600">
          {new Date(report.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </span>

        <span className="text-neutral-600 group-hover:text-neutral-400 transition">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </div>

      {/* Summary preview */}
      {!expanded && meta.summary && (
        <p className="text-sm text-neutral-400 line-clamp-2 pl-1">{String(meta.summary)}</p>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="mt-2 space-y-4 pl-1">
          {/* AI Review data */}
          {rd && (
            <div className="rounded-xl border border-blue-900/30 bg-blue-950/20 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-300">
                <Brain className="w-4 h-4" />
                Revisão IA
              </div>
              {rd.resumo && (
                <p className="text-sm text-neutral-300">{rd.resumo}</p>
              )}
              {Array.isArray(rd.temas) && rd.temas.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {rd.temas.map((t, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-300 text-xs border border-blue-800/30">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {Array.isArray(rd.sugestoes) && rd.sugestoes.length > 0 && (
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Sugestões:</p>
                  <ul className="text-xs text-neutral-400 space-y-0.5 list-disc list-inside">
                    {rd.sugestoes.map((s, i) => (
                      <li key={i}>{s.texto || String(s)}</li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(rd.pontosCegos) && rd.pontosCegos.length > 0 && (
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Pontos Cegos:</p>
                  <ul className="text-xs text-amber-400/80 space-y-0.5 list-disc list-inside">
                    {rd.pontosCegos.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Conversation messages */}
          {report.messages && report.messages.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-neutral-500 font-medium">Conversa ({report.messages.length} mensagens)</p>
              <div className="max-h-80 overflow-y-auto space-y-2 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3">
                {report.messages.map((m, i) => (
                  <div
                    key={i}
                    className={`text-xs rounded-lg px-3 py-2 max-w-[85%] ${
                      m.role === 'user'
                        ? 'bg-neutral-800 text-neutral-300 ml-auto text-right'
                        : 'bg-neutral-900 text-neutral-400'
                    }`}
                  >
                    <span className="block font-semibold text-[10px] mb-1 opacity-60">
                      {m.role === 'user' ? 'Policial' : '852-IA'}
                    </span>
                    {m.content.slice(0, 600)}{m.content.length > 600 ? '…' : ''}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-neutral-600 font-mono">ID: {report.id}</p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: 'amber' | 'green' | 'red';
}) {
  const tones: Record<string, string> = {
    amber: 'text-amber-400 bg-amber-900/20 border-amber-800/30',
    green: 'text-green-400 bg-green-900/20 border-green-800/30',
    red: 'text-red-400 bg-red-900/20 border-red-800/30',
  };

  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
