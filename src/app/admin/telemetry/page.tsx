'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart3, Activity, MessageSquare, AlertTriangle,
  RefreshCw, Loader2, DollarSign, Zap, ShieldAlert,
  ArrowLeft, Clock, LogOut,
} from 'lucide-react';

interface TelemetryStats {
  totalEvents: number;
  totalChats: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalCostUsd: number;
  rateLimitHits: number;
  errors: number;
  byModel: Record<string, number>;
  byProvider: Record<string, number>;
  recentEvents: Array<Record<string, unknown>>;
}

interface ApiResponse {
  configured: boolean;
  message?: string;
  hint?: string;
  stats?: TelemetryStats;
}

export default function TelemetryDashboard() {
  const router = useRouter();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/telemetry?days=${days}`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [days, router]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-[family-name:var(--font-geist-sans)]">
      <header className="border-b border-neutral-800/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="p-2 rounded-lg hover:bg-neutral-800 transition">
            <ArrowLeft className="w-4 h-4 text-neutral-400" />
          </Link>
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h1 className="text-lg font-semibold text-white">Telemetria — 852</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-300 [&>option]:bg-slate-800 [&>option]:text-white"
          >
            <option value={1}>24h</option>
            <option value={7}>7 dias</option>
            <option value={30}>30 dias</option>
            <option value={90}>90 dias</option>
          </select>
          <button
            onClick={load}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-neutral-800 transition text-neutral-400 hover:text-white disabled:opacity-50"
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

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading && !data && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
          </div>
        )}

        {data && !data.configured && (
          <div className="rounded-2xl border border-amber-800/40 bg-amber-900/10 p-6 space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">Supabase não configurado</span>
            </div>
            <p className="text-sm text-neutral-400">{data.message}</p>
            <p className="text-xs text-neutral-500 font-mono bg-neutral-900 rounded-lg px-3 py-2">{data.hint}</p>
            <div className="mt-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800">
              <p className="text-sm text-neutral-300 mb-2 font-medium">Telemetria ativa via console:</p>
              <code className="text-xs text-green-400 block">docker logs 852-app | grep &apos;852-telemetry&apos;</code>
              <p className="text-xs text-neutral-500 mt-2">
                Todos os eventos de chat, erros e rate limits são registrados em formato JSON nos logs do container.
              </p>
            </div>
          </div>
        )}

        {data?.configured && data.stats && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <KPICard icon={MessageSquare} label="Conversas" value={data.stats.totalChats} color="blue" />
              <KPICard icon={Zap} label="Tokens" value={`${((data.stats.totalTokensIn + data.stats.totalTokensOut) / 1000).toFixed(1)}k`} color="purple" />
              <KPICard icon={DollarSign} label="Custo Total" value={`$${data.stats.totalCostUsd.toFixed(4)}`} color="green" />
              <KPICard icon={ShieldAlert} label="Rate Limits" value={data.stats.rateLimitHits} color="amber" />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard title="Por Modelo" items={data.stats.byModel} />
              <StatCard title="Por Provedor" items={data.stats.byProvider} />
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Resumo</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-neutral-500">Total eventos</span><span className="text-white">{data.stats.totalEvents}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Tokens entrada</span><span className="text-white">{data.stats.totalTokensIn.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Tokens saída</span><span className="text-white">{data.stats.totalTokensOut.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Erros</span><span className="text-red-400">{data.stats.errors}</span></div>
                </div>
              </div>
            </div>

            {/* Recent Events */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-neutral-500" />
                <h3 className="text-sm font-semibold text-white">Eventos Recentes</h3>
              </div>
              <div className="divide-y divide-neutral-800/50 max-h-96 overflow-y-auto">
                {data.stats.recentEvents.map((ev, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-center gap-3 text-xs hover:bg-neutral-800/30 transition">
                    <EventBadge type={String(ev.event_type || '')} />
                    <span className="text-neutral-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(String(ev.created_at)).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {typeof ev.model_id === 'string' && <span className="text-neutral-500">{ev.model_id}</span>}
                    {typeof ev.tokens_in === 'number' && <span className="text-neutral-600">{ev.tokens_in}→{String(ev.tokens_out ?? 0)} tok</span>}
                    {typeof ev.cost_usd === 'number' && <span className="text-green-500/70">${ev.cost_usd.toFixed(5)}</span>}
                    {typeof ev.error_message === 'string' && <span className="text-red-400 truncate max-w-xs">{ev.error_message}</span>}
                  </div>
                ))}
                {data.stats.recentEvents.length === 0 && (
                  <div className="px-4 py-8 text-center text-neutral-500 text-sm">Nenhum evento registrado no período.</div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-900/20 border-blue-800/30',
    green: 'text-green-400 bg-green-900/20 border-green-800/30',
    amber: 'text-amber-400 bg-amber-900/20 border-amber-800/30',
    purple: 'text-purple-400 bg-purple-900/20 border-purple-800/30',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.blue}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function StatCard({ title, items }: { title: string; items: Record<string, number> }) {
  const entries = Object.entries(items).sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-neutral-600">—</p>
      ) : (
        <div className="space-y-2">
          {entries.map(([key, count]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-neutral-400 truncate">{key}</span>
              <span className="text-white font-medium">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    chat_completion: { label: 'CHAT', cls: 'bg-blue-900/40 text-blue-400 border-blue-800/40' },
    chat_error: { label: 'ERROR', cls: 'bg-red-900/40 text-red-400 border-red-800/40' },
    rate_limit_hit: { label: 'LIMIT', cls: 'bg-amber-900/40 text-amber-400 border-amber-800/40' },
    report_generation: { label: 'REPORT', cls: 'bg-purple-900/40 text-purple-400 border-purple-800/40' },
    provider_unavailable: { label: 'DOWN', cls: 'bg-red-900/40 text-red-400 border-red-800/40' },
  };
  const c = config[type] || { label: type.toUpperCase(), cls: 'bg-neutral-800 text-neutral-400 border-neutral-700' };
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${c.cls}`}>{c.label}</span>;
}
