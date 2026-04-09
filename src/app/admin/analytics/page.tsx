'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Activity,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowLeft,
  LogOut,
  RefreshCw,
  Loader2,
  Calendar,
  Target,
  Funnel,
  ChevronDown,
} from 'lucide-react';

interface RetentionData {
  d1: number;
  d7: number;
  d30: number;
  newUsers: number;
  returningUsers: number;
}

interface SessionData {
  avgDurationMinutes: number;
  medianDurationMinutes: number;
  p95DurationMinutes: number;
  totalSessions: number;
  bounceRate: number;
}

interface FunnelData {
  landing: number;
  chat: number;
  reportReview: number;
  shared: number;
  conversionRate: number;
}

interface DailyStat {
  date: string;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  reportsShared: number;
  issuesCreated: number;
  commentsAdded: number;
  avgSessionDuration: number;
}

interface AnalyticsData {
  retention: RetentionData;
  sessions: SessionData;
  funnel: FunnelData;
  dailyStats: DailyStat[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?days=${days}`, {
        cache: 'no-store',
      });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) throw new Error('Falha ao carregar analytics');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Erro desconhecido');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro de rede');
    } finally {
      setLoading(false);
    }
  }, [days, router]);

  useEffect(() => {
    load();
  }, [load]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  // Calculate trend from daily stats
  const calculateTrend = (stats: DailyStat[], key: keyof DailyStat) => {
    if (stats.length < 7) return { value: 0, positive: true };
    const recent = stats.slice(-7).reduce((sum, s) => sum + (s[key] as number), 0) / 7;
    const previous = stats.slice(-14, -7).reduce((sum, s) => sum + (s[key] as number), 0) / 7;
    if (previous === 0) return { value: 0, positive: true };
    const change = ((recent - previous) / previous) * 100;
    return { value: Math.round(change), positive: change >= 0 };
  };

  const userTrend = data?.dailyStats ? calculateTrend(data.dailyStats, 'activeUsers') : null;
  const reportTrend = data?.dailyStats ? calculateTrend(data.dailyStats, 'reportsShared') : null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="border-b border-neutral-800/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="p-2 rounded-lg hover:bg-neutral-800 transition">
            <ArrowLeft className="w-4 h-4 text-neutral-400" />
          </Link>
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h1 className="text-lg font-semibold text-white">Analytics — 852</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/telemetry"
            className="h-10 px-4 inline-flex items-center rounded-xl border border-neutral-800 text-sm text-neutral-300 hover:bg-neutral-900 transition"
          >
            Telemetria
          </Link>
          <Link
            href="/admin/clarity"
            className="h-10 px-4 inline-flex items-center rounded-xl border border-neutral-800 text-sm text-neutral-300 hover:bg-neutral-900 transition"
          >
            Clarity
          </Link>
          <Link
            href="/admin/reports"
            className="h-10 px-4 inline-flex items-center rounded-xl border border-neutral-800 text-sm text-neutral-300 hover:bg-neutral-900 transition"
          >
            Relatórios
          </Link>
          <Link
            href="/admin/validations"
            className="h-10 px-4 inline-flex items-center rounded-xl border border-neutral-800 text-sm text-neutral-300 hover:bg-neutral-900 transition"
          >
            Validações
          </Link>
          <button
            onClick={handleLogout}
            className="h-10 px-3 inline-flex items-center gap-2 rounded-xl border border-red-900/50 text-sm text-red-400 hover:bg-red-900/20 transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="px-6 py-4 border-b border-neutral-800/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value={7}>Últimos 7 dias</option>
              <option value={14}>Últimos 14 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={90}>Últimos 90 dias</option>
            </select>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="h-10 px-3 inline-flex items-center gap-2 rounded-xl border border-neutral-800 text-sm text-neutral-300 hover:bg-neutral-900 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Atualizar
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-6 py-4">
          <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="p-6">
        {loading && !data ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Active Users */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-500">Usuários Ativos</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">
                    {data.retention.newUsers}
                  </span>
                  {userTrend && (
                    <span className={`text-xs ${userTrend.positive ? 'text-green-400' : 'text-red-400'}`}>
                      {userTrend.positive ? '+' : ''}{userTrend.value}%
                    </span>
                  )}
                </div>
              </div>

              {/* Avg Session Duration */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-500">Tempo Médio</span>
                  <Clock className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {data.sessions.avgDurationMinutes}m
                </div>
                <span className="text-xs text-neutral-500">
                  Mediana: {data.sessions.medianDurationMinutes}m
                </span>
              </div>

              {/* Conversion Rate */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-500">Conversão</span>
                  <Target className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {data.funnel.conversionRate}%
                </div>
                <span className="text-xs text-neutral-500">
                  {data.funnel.shared} / {data.funnel.landing}
                </span>
              </div>

              {/* Bounce Rate */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-500">Bounce Rate</span>
                  <TrendingDown className="w-4 h-4 text-yellow-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {data.sessions.bounceRate}%
                </div>
                <span className="text-xs text-neutral-500">
                  {data.sessions.totalSessions} sessões
                </span>
              </div>
            </div>

            {/* Retention Metrics */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Retenção de Usuários
              </h2>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">{data.retention.d1}%</div>
                  <div className="text-sm text-neutral-500">D1 Retenção</div>
                  <div className="text-xs text-neutral-600 mt-1">
                    Retornaram no dia seguinte
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">{data.retention.d7}%</div>
                  <div className="text-sm text-neutral-500">D7 Retenção</div>
                  <div className="text-xs text-neutral-600 mt-1">
                    Retornaram em 7 dias
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">{data.retention.d30}%</div>
                  <div className="text-sm text-neutral-500">D30 Retenção</div>
                  <div className="text-xs text-neutral-600 mt-1">
                    Retornaram em 30 dias
                  </div>
                </div>
              </div>
            </div>

            {/* Funnel */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Funnel className="w-5 h-5 text-purple-400" />
                Funnel de Conversão
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-neutral-500">Landing</div>
                  <div className="flex-1 bg-neutral-800 rounded-full h-8 relative">
                    <div
                      className="bg-neutral-600 h-full rounded-full flex items-center justify-end px-2"
                      style={{ width: '100%' }}
                    >
                      <span className="text-xs text-white">{data.funnel.landing}</span>
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm text-neutral-400">100%</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-neutral-500">Chat</div>
                  <div className="flex-1 bg-neutral-800 rounded-full h-8 relative">
                    <div
                      className="bg-blue-600 h-full rounded-full flex items-center justify-end px-2"
                      style={{ width: `${(data.funnel.chat / data.funnel.landing) * 100}%` }}
                    >
                      <span className="text-xs text-white">{data.funnel.chat}</span>
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm text-neutral-400">
                    {Math.round((data.funnel.chat / data.funnel.landing) * 100)}%
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-neutral-500">Review</div>
                  <div className="flex-1 bg-neutral-800 rounded-full h-8 relative">
                    <div
                      className="bg-purple-600 h-full rounded-full flex items-center justify-end px-2"
                      style={{ width: `${(data.funnel.reportReview / data.funnel.landing) * 100}%` }}
                    >
                      <span className="text-xs text-white">{data.funnel.reportReview}</span>
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm text-neutral-400">
                    {Math.round((data.funnel.reportReview / data.funnel.landing) * 100)}%
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-neutral-500">Shared</div>
                  <div className="flex-1 bg-neutral-800 rounded-full h-8 relative">
                    <div
                      className="bg-green-600 h-full rounded-full flex items-center justify-end px-2"
                      style={{ width: `${(data.funnel.shared / data.funnel.landing) * 100}%` }}
                    >
                      <span className="text-xs text-white">{data.funnel.shared}</span>
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm text-neutral-400">
                    {data.funnel.conversionRate}%
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Stats Table */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-800">
                <h2 className="text-lg font-semibold text-white">Estatísticas Diárias</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-800/50">
                    <tr>
                      <th className="text-left text-xs font-medium text-neutral-500 px-4 py-3">Data</th>
                      <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3">Ativos</th>
                      <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3">Novos</th>
                      <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3">Relatórios</th>
                      <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3">Tópicos</th>
                      <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3">Comentários</th>
                      <th className="text-right text-xs font-medium text-neutral-500 px-4 py-3">Tempo Médio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50">
                    {data.dailyStats.slice(-14).reverse().map((day) => (
                      <tr key={day.date} className="hover:bg-neutral-800/30">
                        <td className="px-4 py-3 text-sm text-neutral-300">{day.date}</td>
                        <td className="px-4 py-3 text-sm text-right text-neutral-300">{day.activeUsers}</td>
                        <td className="px-4 py-3 text-sm text-right text-green-400">+{day.newUsers}</td>
                        <td className="px-4 py-3 text-sm text-right text-blue-400">{day.reportsShared}</td>
                        <td className="px-4 py-3 text-sm text-right text-purple-400">{day.issuesCreated}</td>
                        <td className="px-4 py-3 text-sm text-right text-yellow-400">{day.commentsAdded}</td>
                        <td className="px-4 py-3 text-sm text-right text-neutral-400">{day.avgSessionDuration}m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
