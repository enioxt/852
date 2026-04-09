'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText, ArrowLeft, RefreshCw, Loader2, Filter,
  Eye, Trash2, CheckCircle, XCircle, Clock, Tag,
  ChevronDown, ChevronUp, Search, LogOut, AlertTriangle,
  BarChart3, Download, User, Calendar
} from 'lucide-react';

interface Report {
  id: string;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'reviewed' | 'shared' | 'pending_human' | 'published' | 'deleted';
  messages: Array<{ role: string; content: string }>;
  review_data?: {
    resumo?: string;
    temas?: string[];
    categoria?: string;
    completude?: number;
  } | null;
  metadata?: Record<string, unknown> | null;
  conversations_852?: {
    title: string | null;
  };
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Rascunho', color: 'text-neutral-400', icon: FileText },
  reviewed: { label: 'Revisado', color: 'text-blue-400', icon: CheckCircle },
  shared: { label: 'Compartilhado', color: 'text-amber-400', icon: Eye },
  pending_human: { label: 'Aguardando Humano', color: 'text-orange-400', icon: Clock },
  published: { label: 'Publicado', color: 'text-green-400', icon: CheckCircle },
  deleted: { label: 'Excluído', color: 'text-red-400', icon: Trash2 },
};

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const limit = 20;

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/reports?${params}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error(`Erro ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      setReports(data.reports || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  }, [offset, statusFilter, router]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const filteredReports = reports.filter(r => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const content = r.messages?.map(m => m.content).join(' ').toLowerCase() || '';
    const review = JSON.stringify(r.review_data).toLowerCase();
    return content.includes(query) || review.includes(query);
  });

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/telemetry"
              className="p-2 hover:bg-neutral-800 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-400" />
            </Link>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h1 className="font-semibold text-lg">Painel Admin — Relatórios</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadReports}
              disabled={loading}
              className="p-2 hover:bg-neutral-800 rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 hover:bg-red-900/20 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
            <div className="text-sm text-neutral-400 mb-1">Total de Relatórios</div>
            <div className="text-2xl font-bold">{total}</div>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
            <div className="text-sm text-neutral-400 mb-1">Exibindo</div>
            <div className="text-2xl font-bold">{reports.length}</div>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
            <div className="text-sm text-neutral-400 mb-1">Publicados</div>
            <div className="text-2xl font-bold text-green-400">
              {reports.filter(r => r.status === 'published').length}
            </div>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
            <div className="text-sm text-neutral-400 mb-1">Pendentes</div>
            <div className="text-2xl font-bold text-amber-400">
              {reports.filter(r => r.status === 'pending_human').length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar em relatórios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setOffset(0);
            }}
            className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Todos os status</option>
            <option value="draft">Rascunho</option>
            <option value="reviewed">Revisado</option>
            <option value="shared">Compartilhado</option>
            <option value="pending_human">Aguardando Humano</option>
            <option value="published">Publicado</option>
          </select>

          <span className="text-sm text-neutral-400">
            Página {currentPage} de {totalPages || 1}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        )}

        {/* Reports List */}
        {!loading && filteredReports.length === 0 && (
          <div className="text-center py-12 text-neutral-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum relatório encontrado.</p>
          </div>
        )}

        {!loading && filteredReports.map((report) => {
          const statusConfig = STATUS_LABELS[report.status] || STATUS_LABELS.draft;
          const StatusIcon = statusConfig.icon;
          const isExpanded = expandedReport === report.id;

          return (
            <div
              key={report.id}
              className="mb-3 bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden"
            >
              {/* Header */}
              <div
                className="p-4 flex items-start gap-3 cursor-pointer hover:bg-neutral-900 transition"
                onClick={() => setExpandedReport(isExpanded ? null : report.id)}
              >
                <StatusIcon className={`w-5 h-5 mt-0.5 ${statusConfig.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-neutral-800 ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {new Date(report.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-300 truncate">
                    {report.review_data?.resumo || report.conversations_852?.title || 'Sem título'}
                  </p>
                  {report.review_data?.temas && (
                    <div className="flex items-center gap-1 mt-2">
                      <Tag className="w-3 h-3 text-neutral-500" />
                      {report.review_data.temas.slice(0, 3).map((tema, i) => (
                        <span key={i} className="text-xs bg-neutral-800 px-2 py-0.5 rounded text-neutral-400">
                          {tema}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-neutral-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-neutral-500" />
                )}
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-neutral-800">
                  <div className="pt-4 space-y-4">
                    {/* Review Data */}
                    {report.review_data && (
                      <div className="bg-neutral-950 rounded-lg p-3">
                        <h4 className="text-xs font-medium text-neutral-400 mb-2">Dados da Revisão IA</h4>
                        <pre className="text-xs text-neutral-300 overflow-auto max-h-40">
                          {JSON.stringify(report.review_data, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Messages Preview */}
                    <div className="bg-neutral-950 rounded-lg p-3">
                      <h4 className="text-xs font-medium text-neutral-400 mb-2">Mensagens ({report.messages?.length || 0})</h4>
                      <div className="space-y-2 max-h-60 overflow-auto">
                        {report.messages?.slice(0, 5).map((msg, i) => (
                          <div key={i} className="text-xs">
                            <span className={`font-medium ${msg.role === 'user' ? 'text-blue-400' : 'text-green-400'}`}>
                              {msg.role === 'user' ? 'Policial' : 'Agente 852'}:
                            </span>
                            <p className="text-neutral-300 mt-0.5 line-clamp-2">{msg.content}</p>
                          </div>
                        ))}
                        {report.messages && report.messages.length > 5 && (
                          <p className="text-xs text-neutral-500 italic">
                            +{report.messages.length - 5} mensagens...
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Metadata */}
                    {report.metadata && (
                      <div className="bg-neutral-950 rounded-lg p-3">
                        <h4 className="text-xs font-medium text-neutral-400 mb-2">Metadata</h4>
                        <pre className="text-xs text-neutral-500">
                          {JSON.stringify(report.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="px-3 py-1.5 text-sm bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm text-neutral-400 px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="px-3 py-1.5 text-sm bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
