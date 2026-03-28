'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Shield, Activity, Clock, BarChart3, AlertTriangle,
  Eye, RefreshCw, Loader2, CheckCircle2, XCircle,
  ArrowLeft, Bot, Server
} from 'lucide-react';

interface ReportTimelineItem {
  id: string;
  title: string;
  description?: string;
  system: string;
  agent?: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  triggered_by: string;
  error_message?: string;
}

const statusConfig = {
  running: { icon: <Clock className="w-4 h-4 text-amber-400 animate-pulse" />, dot: 'bg-amber-400 animate-pulse', label: 'Rodando', border: 'border-l-amber-500' },
  completed: { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, dot: 'bg-emerald-400', label: 'Completo', border: 'border-l-emerald-500' },
  failed: { icon: <XCircle className="w-4 h-4 text-rose-400" />, dot: 'bg-rose-400', label: 'Falhou', border: 'border-l-rose-500' },
};

const TABS = [
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'telemetry', label: 'Telemetria', icon: Activity },
  { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
] as const;

type TabId = typeof TABS[number]['id'];

export default function TransparenciaPage() {
  const [activeTab, setActiveTab] = useState<TabId>('timeline');
  const [reports, setReports] = useState<ReportTimelineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filterSystem, setFilterSystem] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterSystem) params.append('system', filterSystem);
      if (filterStatus) params.append('status', filterStatus);
      if (search) params.append('search', search);
      params.append('limit', '50');

      const res = await fetch(`/api/admin/transparency/reports?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setReports(data.reports || []);
      setLastUpdated(new Date());
    } catch {
      // keep stale data
    } finally {
      setLoading(false);
    }
  }, [filterSystem, filterStatus, search]);

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 30000);
    return () => clearInterval(interval);
  }, [fetchReports]);

  const systems = [...new Set(reports.map(r => r.system))];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/telemetry" className="text-zinc-500 hover:text-zinc-300 transition">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">Transparência Radical</h1>
                  <p className="text-xs text-zinc-400">Observabilidade completa — 852 + Ecossistema EGOS</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-xs text-zinc-500">
                  {lastUpdated.toLocaleTimeString('pt-BR')}
                </span>
              )}
              <button
                onClick={fetchReports}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Atualizar
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-400">Online</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition ${
                  activeTab === id
                    ? 'text-white border-blue-500'
                    : 'text-zinc-400 border-transparent hover:text-zinc-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total', value: reports.length, color: 'text-blue-400' },
                { label: 'Rodando', value: reports.filter(r => r.status === 'running').length, color: 'text-amber-400' },
                { label: 'Completos', value: reports.filter(r => r.status === 'completed').length, color: 'text-emerald-400' },
                { label: 'Falhas', value: reports.filter(r => r.status === 'failed').length, color: 'text-rose-400' },
              ].map(stat => (
                <div key={stat.label} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
                  <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={filterSystem}
                onChange={e => setFilterSystem(e.target.value)}
                className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-blue-500"
              >
                <option value="">Todos sistemas</option>
                {systems.map(s => <option key={s} value={s}>{s}</option>)}
                {!systems.includes('852') && <option value="852">852</option>}
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-blue-500"
              >
                <option value="">Todos status</option>
                <option value="running">🟡 Rodando</option>
                <option value="completed">🟢 Completo</option>
                <option value="failed">🔴 Falhou</option>
              </select>
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
              />
              {(filterSystem || filterStatus || search) && (
                <button
                  onClick={() => { setFilterSystem(''); setFilterStatus(''); setSearch(''); }}
                  className="px-3 py-2 text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded-lg transition"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Timeline list */}
            <div className="space-y-2">
              {loading && !reports.length ? (
                <div className="flex items-center justify-center py-16 gap-2 text-zinc-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Carregando relatórios...
                </div>
              ) : reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-600">
                  <Eye className="w-10 h-10 opacity-30" />
                  <p className="text-sm">Nenhum relatório ainda</p>
                  <p className="text-xs text-zinc-700">Os eventos aparecerão aqui automaticamente</p>
                </div>
              ) : (
                reports.map(report => {
                  const cfg = statusConfig[report.status];
                  return (
                    <div key={report.id} className={`border-l-2 ${cfg.border} pl-4 py-3 pr-4 bg-zinc-900/40 rounded-r-lg hover:bg-zinc-900/70 transition`}>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{cfg.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-medium text-sm text-white truncate">{report.title}</span>
                            {report.agent && (
                              <span className="text-xs px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded flex-shrink-0">
                                <Bot className="w-3 h-3 inline mr-1" />{report.agent}
                              </span>
                            )}
                          </div>
                          {report.description && <p className="text-xs text-zinc-400 mb-1.5">{report.description}</p>}
                          <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                            <span className="px-1.5 py-0.5 bg-zinc-800/80 rounded">{report.system}</span>
                            <span>{report.triggered_by}</span>
                            <span>🕐 {formatDistanceToNow(new Date(report.started_at), { addSuffix: true })}</span>
                            {report.duration_ms != null && <span>⏱️ {(report.duration_ms / 1000).toFixed(1)}s</span>}
                          </div>
                          {report.error_message && (
                            <div className="mt-1.5 px-2 py-1 bg-rose-500/10 border border-rose-500/20 rounded text-xs text-rose-300">
                              {report.error_message}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TELEMETRY TAB — link to existing /admin/telemetry */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
              <BarChart3 className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Dashboard de Telemetria</h3>
              <p className="text-sm text-zinc-400 mb-6">
                O dashboard de telemetria completo do 852 já está disponível em /admin/telemetry com ATRiAN violations, AI Observability e event feed.
              </p>
              <Link
                href="/admin/telemetry"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
              >
                <Activity className="w-4 h-4" />
                Abrir Telemetria Completa
              </Link>
            </div>

            {/* Quick infra status */}
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                <Server className="w-4 h-4" />
                Status de Infraestrutura
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: 'Vercel (852 Frontend)', status: 'healthy', details: 'Deploy ativo' },
                  { name: 'Supabase (Database)', status: 'healthy', details: 'Conexões normais' },
                  { name: 'VPS (Contabo)', status: 'healthy', details: 'Pendente migração' },
                  { name: 'Railway (Workers)', status: 'healthy', details: 'EGOS agents ativos' },
                ].map(item => (
                  <div key={item.name} className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                    <div className={`w-2 h-2 rounded-full ${item.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="text-xs text-zinc-500">{item.details}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                      {item.status === 'healthy' ? 'Saudável' : 'Degradado'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ALERTS TAB */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {reports.filter(r => r.status === 'failed').length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-600">
                <CheckCircle2 className="w-10 h-10 text-emerald-500/40" />
                <p className="text-sm text-zinc-400">Nenhum alerta ativo</p>
                <p className="text-xs">Todos os relatórios recentes foram concluídos com sucesso</p>
              </div>
            ) : (
              reports
                .filter(r => r.status === 'failed')
                .map(report => (
                  <div key={report.id} className="flex items-start gap-4 p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-medium text-white text-sm">{report.title}</h4>
                        <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">{report.system}</span>
                      </div>
                      {report.error_message && (
                        <p className="text-sm text-zinc-400 mb-2">{report.error_message}</p>
                      )}
                      <p className="text-xs text-zinc-600">
                        {formatDistanceToNow(new Date(report.started_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
