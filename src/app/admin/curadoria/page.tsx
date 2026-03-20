'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  FileText,
} from 'lucide-react';
import MarkdownMessage from '@/components/chat/MarkdownMessage';

interface PendingReport {
  id: string;
  created_at: string;
  updated_at: string;
  status: 'pending_human' | 'published' | 'deleted';
  messages: Array<{ role: string; content: string }>;
  metadata?: Record<string, unknown> | null;
}

interface CurationSummary {
  pending: number;
  approved: number;
  rejected: number;
}

interface ApiResponse {
  configured: boolean;
  message?: string;
  pendingReports?: PendingReport[];
  summary?: CurationSummary;
}

export default function AdminCuradoriaPage() {
  const router = useRouter();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/curadoria');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError('Falha ao carregar relatórios pendentes.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const updateStatus = async (reportId: string, action: 'approve' | 'reject') => {
    setActingId(reportId);
    setError(null);
    try {
      const res = await fetch('/api/admin/curadoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Falha ao curar relatório.');
        return;
      }
      setData((prev) => {
        if (!prev?.pendingReports || !prev.summary) return prev;
        return {
          ...prev,
          pendingReports: prev.pendingReports.filter((item) => item.id !== reportId),
          summary: {
            pending: Math.max(0, prev.summary.pending - 1),
            approved: action === 'approve' ? prev.summary.approved + 1 : prev.summary.approved,
            rejected: action === 'reject' ? prev.summary.rejected + 1 : prev.summary.rejected,
          },
        };
      });
    } catch {
      setError('Erro de conexão ao processar curadoria.');
    } finally {
      setActingId(null);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  const reports = data?.pendingReports || [];
  const summary = data?.summary || { pending: 0, approved: 0, rejected: 0 };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-[family-name:var(--font-geist-sans)]">
      <header className="border-b border-neutral-800/50 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="p-2 rounded-lg hover:bg-neutral-800 transition">
            <ArrowLeft className="w-4 h-4 text-neutral-400" />
          </Link>
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <div>
            <h1 className="text-lg font-semibold text-white">Curadoria — 852</h1>
            <p className="text-xs text-neutral-500">Triagem Reservada Institucional</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/validations"
            className="h-10 px-4 inline-flex items-center rounded-xl border border-neutral-800 text-sm text-neutral-300 hover:bg-neutral-900 transition"
          >
            Validar MASP
          </Link>
          <Link
            href="/admin/telemetry"
            className="h-10 px-4 inline-flex items-center rounded-xl border border-neutral-800 text-sm text-neutral-300 hover:bg-neutral-900 transition"
          >
            Telemetria
          </Link>
          <button
            onClick={load}
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

        {loading && !data && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
          </div>
        )}

        {data && !data.configured && (
          <div className="rounded-2xl border border-amber-800/40 bg-amber-900/10 p-6 space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Clock3 className="w-5 h-5" />
              <span className="font-semibold">Supabase não configurado</span>
            </div>
            <p className="text-sm text-neutral-400">{data.message}</p>
          </div>
        )}

        {data?.configured && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryCard icon={Clock3} label="Pendentes" value={summary.pending} tone="amber" />
              <SummaryCard icon={CheckCircle2} label="Publicados" value={summary.approved} tone="green" />
              <SummaryCard icon={ShieldX} label="Deletados" value={summary.rejected} tone="red" />
            </div>

            <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-neutral-500" />
                  <h2 className="text-sm font-semibold text-white">Relatórios Pendentes de Triagem</h2>
                </div>
                <span className="text-xs text-neutral-500">{reports.length} item(ns)</span>
              </div>

              {reports.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <div className="mx-auto mb-3 w-12 h-12 rounded-2xl border border-green-800/40 bg-green-900/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  </div>
                  <p className="text-sm text-white font-medium">Fila Limpa</p>
                  <p className="text-xs text-neutral-500 mt-1">Não há relatórios aguardando moderação institucional.</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-800/70">
                  {reports.map((report) => {
                    const acting = actingId === report.id;
                    const meta = report.metadata || {};
                    const isAnon = !meta.userEmail;
                    return (
                      <div key={report.id} className="p-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1 space-y-4">
                           <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded-md text-[11px] font-semibold border ${
                                isAnon ? 'bg-neutral-800 text-neutral-300 border-neutral-700' : 'bg-blue-900/20 text-blue-400 border-blue-800/30'
                              }`}>
                                {isAnon ? 'Anônimo' : `Validado (${meta.userDisplayName})`}
                              </span>
                              <span className="text-xs text-neutral-500">
                                Emitido: {new Date(report.created_at).toLocaleString('pt-BR')}
                              </span>
                           </div>

                           <div className="prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-a:text-blue-400 hover:prose-a:text-blue-300 bg-neutral-950/50 border border-neutral-800/50 rounded-xl p-4">
                              <MarkdownMessage content={String(meta.formattedMarkdown || 'Sem conteúdo')} />
                           </div>
                        </div>

                        <div className="flex lg:flex-col items-center justify-end gap-2 shrink-0 lg:w-40 border-t lg:border-t-0 border-neutral-800/50 pt-4 lg:pt-0">
                          <button
                            onClick={() => updateStatus(report.id, 'approve')}
                            disabled={acting}
                            className="w-full h-10 px-4 rounded-xl bg-green-600 hover:bg-green-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-sm text-white transition inline-flex items-center justify-center gap-2"
                          >
                            {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Publicar
                          </button>
                          <button
                            onClick={() => updateStatus(report.id, 'reject')}
                            disabled={acting}
                            className="w-full h-10 px-4 rounded-xl border border-red-800/40 bg-red-900/10 hover:bg-red-900/20 disabled:border-neutral-800 disabled:text-neutral-500 text-sm text-red-300 transition inline-flex items-center justify-center gap-2"
                          >
                            {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldX className="w-4 h-4" />}
                            Rejeitar/Apagar
                          </button>
                          <div className="w-full text-center mt-2">
                             <span className="text-[10px] text-neutral-500">
                               Ao publicar, um novo tópico na Comunidade será aberto automaticamente.
                             </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
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
