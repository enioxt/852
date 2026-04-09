'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart3, Activity, MessageSquare, AlertTriangle,
  RefreshCw, Loader2, DollarSign, Zap, ShieldAlert,
  ArrowLeft, Clock, LogOut, Shield, Filter, Download,
  ChevronDown, ChevronUp, Search, X, FileJson
} from 'lucide-react';

interface AtrianViolation {
  id: string;
  created_at: string;
  score: number;
  categories: string[];
  level: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

interface AtrianStats {
  totalViolations: number;
  byCategory: Record<string, number>;
  byLevel: Record<string, number>;
  avgScore: number;
  recentViolations: AtrianViolation[];
}

interface TelemetryEvent {
  id: string;
  created_at: string;
  event_type: string;
  model_id?: string;
  tokens_in?: number;
  tokens_out?: number;
  cost_usd?: number;
  error_message?: string;
  metadata?: Record<string, unknown>;
}

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
  recentEvents: TelemetryEvent[];
  atrian?: AtrianStats;
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
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiType, setAiType] = useState('general');

  // New state for filters and drill-down
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    atrian: false,
    events: false
  });
  const [atrianFilter, setAtrianFilter] = useState<{ category?: string, level?: string }>({});

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const exportData = () => {
    if (!data?.stats) return;
    const exportObj = {
      timestamp: new Date().toISOString(),
      days,
      stats: data.stats
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemetry-${days}d-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  const generateAIInsight = async (type: string) => {
    setLoadingAI(true);
    setAiType(type);
    try {
      const res = await fetch('/api/admin/telemetry/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisType: type, days }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiInsight(json.insight);
      } else {
        setAiInsight('Erro ao gerar análise.');
      }
    } catch {
      setAiInsight('Falha na comunicação com API IA.');
    } finally {
      setLoadingAI(false);
    }
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
          <Link
            href="/admin/reports"
            className="h-10 px-4 inline-flex items-center rounded-xl border border-neutral-800 text-sm text-neutral-300 hover:bg-neutral-900 transition"
          >
            Relatórios
          </Link>
          <Link
            href="/admin/analytics"
            className="h-10 px-4 inline-flex items-center rounded-xl border border-neutral-800 text-sm text-neutral-300 hover:bg-neutral-900 transition"
          >
            Analytics
          </Link>
          <Link
            href="/admin/validations"
            className="h-10 px-4 inline-flex items-center rounded-xl border border-neutral-800 text-sm text-neutral-300 hover:bg-neutral-900 transition"
          >
            Validações
          </Link>
          <button
            onClick={exportData}
            disabled={!data?.stats}
            className="h-10 px-3 inline-flex items-center gap-2 rounded-xl border border-neutral-800 text-sm text-neutral-300 hover:bg-neutral-900 transition disabled:opacity-50"
            title="Exportar dados"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
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
            {/* KPI Cards — Clickable with drill-down */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <ClickableKPICard
                icon={MessageSquare}
                label="Conversas"
                value={data.stats.totalChats}
                color="blue"
                onClick={() => setSelectedMetric(selectedMetric === 'chats' ? null : 'chats')}
                isActive={selectedMetric === 'chats'}
              />
              <ClickableKPICard
                icon={Zap}
                label="Tokens"
                value={`${((data.stats.totalTokensIn + data.stats.totalTokensOut) / 1000).toFixed(1)}k`}
                color="purple"
                onClick={() => setSelectedMetric(selectedMetric === 'tokens' ? null : 'tokens')}
                isActive={selectedMetric === 'tokens'}
              />
              <ClickableKPICard
                icon={DollarSign}
                label="Custo Total"
                value={`$${data.stats.totalCostUsd.toFixed(4)}`}
                color="green"
                onClick={() => setSelectedMetric(selectedMetric === 'cost' ? null : 'cost')}
                isActive={selectedMetric === 'cost'}
              />
              <ClickableKPICard
                icon={ShieldAlert}
                label="Rate Limits"
                value={data.stats.rateLimitHits}
                color="amber"
                onClick={() => setSelectedMetric(selectedMetric === 'rateLimits' ? null : 'rateLimits')}
                isActive={selectedMetric === 'rateLimits'}
              />
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

            {/* ATRiAN Violations */}
            {data.stats.atrian && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-orange-400" />
                  <h2 className="text-sm font-semibold text-white">ATRiAN — Validação Ética</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <KPICard icon={ShieldAlert} label="Violações" value={data.stats.atrian.totalViolations} color="amber" />
                  <KPICard icon={Shield} label="Score Médio" value={data.stats.atrian.avgScore} color={data.stats.atrian.avgScore >= 80 ? 'green' : data.stats.atrian.avgScore >= 50 ? 'amber' : 'red'} />
                  <StatCard title="Por Categoria" items={data.stats.atrian.byCategory} />
                  <StatCard title="Por Severidade" items={data.stats.atrian.byLevel} />
                </div>
                {data.stats.atrian.recentViolations.length > 0 && (
                  <div className="rounded-xl border border-orange-800/30 bg-orange-900/5 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-orange-800/20 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-xs font-semibold text-orange-300">Violações Recentes</span>
                    </div>
                    <div className="divide-y divide-neutral-800/50 max-h-48 overflow-y-auto">
                      {data.stats.atrian.recentViolations.map((ev, i) => {
                        const meta = (ev.metadata || {}) as Record<string, unknown>;
                        const cats = Array.isArray(meta.categories) ? meta.categories.join(', ') : '';
                        const score = typeof meta.score === 'number' ? meta.score : '—';
                        return (
                          <div key={i} className="px-4 py-2 flex items-center gap-3 text-xs">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${typeof meta.score === 'number' && meta.score < 50
                              ? 'bg-red-900/40 text-red-400 border-red-800/40'
                              : 'bg-orange-900/40 text-orange-400 border-orange-800/40'
                              }`}>{score}</span>
                            <span className="text-neutral-400">{cats}</span>
                            <span className="text-neutral-600 flex items-center gap-1 ml-auto">
                              <Clock className="w-3 h-3" />
                              {new Date(String(ev.created_at)).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Insights Panel */}
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  <h2 className="font-semibold text-gray-100">AI Observability Analytics</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => generateAIInsight('general')}
                    disabled={loadingAI}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${aiType === 'general' ? 'bg-purple-600' : 'bg-neutral-800'}`}
                  >Geral</button>
                  <button
                    onClick={() => generateAIInsight('errors')}
                    disabled={loadingAI}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${aiType === 'errors' ? 'bg-purple-600' : 'bg-neutral-800'}`}
                  >Erros</button>
                  <button
                    onClick={() => generateAIInsight('security')}
                    disabled={loadingAI}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${aiType === 'security' ? 'bg-purple-600' : 'bg-neutral-800'}`}
                  >Segurança</button>
                </div>
              </div>
              {loadingAI ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                  <span className="ml-2 text-neutral-400 text-sm">Analisando logs com IA...</span>
                </div>
              ) : aiInsight ? (
                <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-800">
                  <div className="whitespace-pre-wrap text-sm text-neutral-300 leading-relaxed">
                    {aiInsight}
                  </div>
                </div>
              ) : (
                <p className="text-neutral-500 text-sm text-center py-4">Escolha um modo acima para gerar insights analíticos</p>
              )}
            </div>

            {/* Metric Drill-Down Panel */}
            {selectedMetric && (
              <div className="mb-8 rounded-xl border border-blue-800/30 bg-blue-900/10 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-blue-300">
                    Detalhes: {selectedMetric === 'chats' ? 'Conversas' : selectedMetric === 'tokens' ? 'Tokens' : selectedMetric === 'cost' ? 'Custo' : 'Rate Limits'}
                  </h3>
                  <button onClick={() => setSelectedMetric(null)} className="text-neutral-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-sm text-neutral-300">
                  {selectedMetric === 'chats' && (
                    <div className="space-y-2">
                      <p>Total de conversas: <strong>{data.stats.totalChats}</strong></p>
                      <p>Média por dia: <strong>{(data.stats.totalChats / days).toFixed(1)}</strong></p>
                    </div>
                  )}
                  {selectedMetric === 'tokens' && (
                    <div className="space-y-2">
                      <p>Tokens entrada: <strong>{data.stats.totalTokensIn.toLocaleString()}</strong></p>
                      <p>Tokens saída: <strong>{data.stats.totalTokensOut.toLocaleString()}</strong></p>
                      <p>Total: <strong>{(data.stats.totalTokensIn + data.stats.totalTokensOut).toLocaleString()}</strong></p>
                    </div>
                  )}
                  {selectedMetric === 'cost' && (
                    <div className="space-y-2">
                      <p>Custo total: <strong>${data.stats.totalCostUsd.toFixed(4)}</strong></p>
                      <p>Média por conversa: <strong>${data.stats.totalChats > 0 ? (data.stats.totalCostUsd / data.stats.totalChats).toFixed(4) : '0'}</strong></p>
                    </div>
                  )}
                  {selectedMetric === 'rateLimits' && (
                    <div className="space-y-2">
                      <p>Rate limits atingidos: <strong>{data.stats.rateLimitHits}</strong></p>
                      <p className="text-amber-400">
                        {data.stats.rateLimitHits > 10 ? '⚠️ Alto número de rate limits - verificar quotas' : '✓ Rate limits sob controle'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Events with Filters */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden mb-8">
              <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-neutral-500" />
                  <h3 className="text-sm font-semibold text-white">Eventos Recentes</h3>
                  <span className="text-xs text-neutral-500">({data.stats.recentEvents.length})</span>
                </div>
                <button
                  onClick={() => toggleSection('events')}
                  className="text-neutral-400 hover:text-white transition"
                >
                  {expandedSections.events ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Filters */}
              <div className="px-4 py-3 border-b border-neutral-800/50 bg-neutral-900/30 flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Buscar eventos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-200 w-40"
                  />
                </div>
                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-200"
                >
                  <option value="all">Todos os tipos</option>
                  <option value="chat_completion">Chat</option>
                  <option value="chat_error">Erros</option>
                  <option value="rate_limit_hit">Rate Limits</option>
                  <option value="atrian_violation">ATRiAN</option>
                </select>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Limpar
                  </button>
                )}
              </div>

              <div className={`divide-y divide-neutral-800/50 overflow-y-auto transition-all ${expandedSections.events ? 'max-h-96' : 'max-h-48'}`}>
                {data.stats.recentEvents
                  .filter(ev => {
                    const matchesType = eventFilter === 'all' || ev.event_type === eventFilter;
                    const matchesSearch = searchQuery === '' ||
                      JSON.stringify(ev).toLowerCase().includes(searchQuery.toLowerCase());
                    return matchesType && matchesSearch;
                  })
                  .map((ev, i) => (
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
                {data.stats.recentEvents.length > 0 && data.stats.recentEvents.filter(ev => {
                  const matchesType = eventFilter === 'all' || ev.event_type === eventFilter;
                  const matchesSearch = searchQuery === '' || JSON.stringify(ev).toLowerCase().includes(searchQuery.toLowerCase());
                  return matchesType && matchesSearch;
                }).length === 0 && (
                    <div className="px-4 py-8 text-center text-neutral-500 text-sm">Nenhum evento corresponde aos filtros.</div>
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
    red: 'text-red-400 bg-red-900/20 border-red-800/30',
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

function ClickableKPICard({ icon: Icon, label, value, color, onClick, isActive }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  onClick: () => void;
  isActive: boolean;
}) {
  const colors: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-900/20 border-blue-800/30 hover:bg-blue-900/30',
    green: 'text-green-400 bg-green-900/20 border-green-800/30 hover:bg-green-900/30',
    amber: 'text-amber-400 bg-amber-900/20 border-amber-800/30 hover:bg-amber-900/30',
    purple: 'text-purple-400 bg-purple-900/20 border-purple-800/30 hover:bg-purple-900/30',
    red: 'text-red-400 bg-red-900/20 border-red-800/30 hover:bg-red-900/30',
  };
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-all ${colors[color] || colors.blue} ${isActive ? 'ring-2 ring-white/20' : ''}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {isActive && <span className="text-[10px] text-neutral-400 mt-1 block">Clique para fechar</span>}
    </button>
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
    issue_created: { label: 'ISSUE', cls: 'bg-blue-900/40 text-blue-300 border-blue-800/40' },
    issue_voted: { label: 'VOTE', cls: 'bg-cyan-900/40 text-cyan-400 border-cyan-800/40' },
    notification_sent: { label: 'PING', cls: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/40' },
    notification_error: { label: 'ALERT', cls: 'bg-rose-900/40 text-rose-400 border-rose-800/40' },
    provider_unavailable: { label: 'DOWN', cls: 'bg-red-900/40 text-red-400 border-red-800/40' },
    atrian_violation: { label: 'ATRiAN', cls: 'bg-orange-900/40 text-orange-400 border-orange-800/40' },
  };
  const c = config[type] || { label: type.toUpperCase(), cls: 'bg-neutral-800 text-neutral-400 border-neutral-700' };
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${c.cls}`}>{c.label}</span>;
}
