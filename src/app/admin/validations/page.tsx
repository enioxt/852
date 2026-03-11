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
  Users,
} from 'lucide-react';

interface ValidationUser {
  id: string;
  email: string;
  display_name: string | null;
  nome_partial: string | null;
  masp: string | null;
  lotacao: string | null;
  validation_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  last_login: string | null;
}

interface ValidationSummary {
  pending: number;
  approved: number;
  rejected: number;
}

interface ApiResponse {
  configured: boolean;
  message?: string;
  hint?: string;
  validations?: ValidationUser[];
  summary?: ValidationSummary;
}

export default function AdminValidationsPage() {
  const router = useRouter();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/validations');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setError('Falha ao carregar validações.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const updateStatus = async (userId: string, status: 'approved' | 'rejected') => {
    setActingId(userId);
    setError(null);
    try {
      const res = await fetch('/api/admin/validations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Falha ao atualizar validação.');
        return;
      }
      setData((prev) => {
        if (!prev?.validations || !prev.summary) return prev;
        return {
          ...prev,
          validations: prev.validations.filter((item) => item.id !== userId),
          summary: {
            pending: Math.max(0, prev.summary.pending - 1),
            approved: status === 'approved' ? prev.summary.approved + 1 : prev.summary.approved,
            rejected: status === 'rejected' ? prev.summary.rejected + 1 : prev.summary.rejected,
          },
        };
      });
    } catch {
      setError('Erro de conexão ao atualizar validação.');
    } finally {
      setActingId(null);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  const validations = data?.validations || [];
  const summary = data?.summary || { pending: 0, approved: 0, rejected: 0 };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-[family-name:var(--font-geist-sans)]">
      <header className="border-b border-neutral-800/50 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="p-2 rounded-lg hover:bg-neutral-800 transition">
            <ArrowLeft className="w-4 h-4 text-neutral-400" />
          </Link>
          <ShieldCheck className="w-5 h-5 text-green-400" />
          <div>
            <h1 className="text-lg font-semibold text-white">Validação MASP — 852</h1>
            <p className="text-xs text-neutral-500">Revisão manual de contas pendentes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
            <p className="text-xs text-neutral-500 font-mono bg-neutral-900 rounded-lg px-3 py-2">{data.hint}</p>
          </div>
        )}

        {data?.configured && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryCard icon={Clock3} label="Pendentes" value={summary.pending} tone="amber" />
              <SummaryCard icon={CheckCircle2} label="Aprovados" value={summary.approved} tone="green" />
              <SummaryCard icon={ShieldX} label="Rejeitados" value={summary.rejected} tone="red" />
            </div>

            <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-neutral-500" />
                  <h2 className="text-sm font-semibold text-white">Solicitações pendentes</h2>
                </div>
                <span className="text-xs text-neutral-500">{validations.length} item(ns)</span>
              </div>

              {validations.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <div className="mx-auto mb-3 w-12 h-12 rounded-2xl border border-green-800/40 bg-green-900/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  </div>
                  <p className="text-sm text-white font-medium">Nenhuma validação pendente</p>
                  <p className="text-xs text-neutral-500 mt-1">Novos cadastros com MASP aparecerão aqui automaticamente.</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-800/70">
                  {validations.map((user) => {
                    const acting = actingId === user.id;
                    return (
                      <div key={user.id} className="px-4 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 flex-1">
                          <InfoBlock label="Conta" value={user.display_name || user.nome_partial || 'Sem nome'} subvalue={user.email} />
                          <InfoBlock label="MASP" value={user.masp || '—'} subvalue={`Status: ${user.validation_status}`} />
                          <InfoBlock label="Lotação" value={user.lotacao || 'Não informada'} subvalue={`Cadastro: ${formatDate(user.created_at)}`} />
                          <InfoBlock label="Atividade" value={user.last_login ? formatDate(user.last_login) : 'Sem login'} subvalue="Último acesso" />
                        </div>
                        <div className="flex items-center gap-2 lg:pl-4">
                          <button
                            onClick={() => updateStatus(user.id, 'approved')}
                            disabled={acting}
                            className="h-10 px-4 rounded-xl bg-green-600 hover:bg-green-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-sm text-white transition inline-flex items-center gap-2"
                          >
                            {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Aprovar
                          </button>
                          <button
                            onClick={() => updateStatus(user.id, 'rejected')}
                            disabled={acting}
                            className="h-10 px-4 rounded-xl border border-red-800/40 bg-red-900/10 hover:bg-red-900/20 disabled:border-neutral-800 disabled:text-neutral-500 text-sm text-red-300 transition inline-flex items-center gap-2"
                          >
                            {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldX className="w-4 h-4" />}
                            Rejeitar
                          </button>
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

function InfoBlock({ label, value, subvalue }: { label: string; value: string; subvalue: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3 min-h-20">
      <p className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">{label}</p>
      <p className="text-sm text-white break-words">{value}</p>
      <p className="text-xs text-neutral-500 mt-1 break-words">{subvalue}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
