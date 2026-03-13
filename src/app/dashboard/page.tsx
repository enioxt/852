'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bot, BarChart3, Users, AlertTriangle, TrendingUp, Search } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import type { DashboardStats } from '@/lib/supabase';

// Mock data based on institutional intelligence analysis
const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#c084fc', '#06b6d4', '#f59e0b', '#ef4444', '#22c55e', '#94a3b8'];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await fetch('/api/dashboard/public');
        const data = await res.json();
        setConfigured(Boolean(data.configured));
        setStats(data.stats || null);
      } catch (error) {
        console.error('[852-dashboard] failed to load stats:', error instanceof Error ? error.message : 'Unknown');
        setConfigured(false);
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
    const interval = setInterval(() => { void loadDashboard(); }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const issuesData = useMemo(() => (
    stats?.topThemes.map((item) => ({ name: item.theme, count: item.count })) || []
  ), [stats]);

  const categoryData = useMemo(() => (
    stats?.issuesByCategory.map((item, index) => ({
      name: item.category,
      value: item.count,
      color: PIE_COLORS[index % PIE_COLORS.length],
    })) || []
  ), [stats]);

  const timelineData = useMemo(() => {
    const map = new Map<string, { date: string; relatos: number; relatorios: number }>();

    stats?.conversationsByDay.forEach((item) => {
      map.set(item.day, { date: item.day.slice(5), relatos: item.count, relatorios: 0 });
    });

    stats?.reportsByDay.forEach((item) => {
      const existing = map.get(item.day);
      if (existing) {
        existing.relatorios = item.count;
      } else {
        map.set(item.day, { date: item.day.slice(5), relatos: 0, relatorios: item.count });
      }
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, value]) => value);
  }, [stats]);

  const recentReports = stats?.recentReports || [];
  const showCharts = mounted && !loading;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-purple-600/20 rounded-2xl">
            <BarChart3 className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-white">Painel de Inteligência</h1>
            <p className="text-sm text-slate-400">Leitura operacional das conversas, relatos e tópicos ativos do Tira-Voz.</p>
          </div>
        </div>

        {!configured && (
          <div className="p-4 bg-amber-900/20 border border-amber-800/40 rounded-2xl text-sm text-amber-300">
            O painel depende do Supabase configurado no servidor para exibir métricas reais.
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total de Relatos</p>
              <h3 className="text-2xl font-bold text-white">{loading ? '...' : stats?.totalConversations || 0}</h3>
            </div>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Temas Reincidentes</p>
              <h3 className="text-2xl font-bold text-white">{loading ? '...' : stats?.topThemes.length || 0}</h3>
            </div>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Relatórios Compartilhados</p>
              <h3 className="text-2xl font-bold text-white">{loading ? '...' : stats?.reportsShared || 0}</h3>
            </div>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Bot className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Média por Conversa</p>
              <h3 className="text-2xl font-bold text-white">{loading ? '...' : stats?.avgMessagesPerConversation || 0}</h3>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart - Principais Problemas */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
            <h3 className="font-bold text-white mb-6">Volume por Categoria de Problema</h3>
            <div className="h-64">
              {showCharts ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={issuesData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                      cursor={{ fill: '#1e293b' }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full rounded-xl bg-slate-950 border border-slate-800 animate-pulse" />
              )}
            </div>
          </div>

          {/* Pie & Line Charts */}
          <div className="grid grid-rows-2 gap-6">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex gap-6 items-center">
              <div className="flex-1">
                <h3 className="font-bold text-white mb-2">Categorias dos Issues</h3>
                <p className="text-xs text-slate-400">Distribuição agregada dos tópicos abertos e recentes.</p>
              </div>
              <div className="w-32 h-32">
                {showCharts ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} innerRadius={35} outerRadius={50} paddingAngle={2} dataKey="value">
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full rounded-full bg-slate-950 border border-slate-800 animate-pulse" />
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
              <h3 className="font-bold text-white mb-4">Volume de Relatos e Relatórios</h3>
              <div className="h-32">
                {showCharts ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Line type="monotone" dataKey="relatos" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 3, fill: '#8b5cf6' }} />
                      <Line type="monotone" dataKey="relatorios" stroke="#22c55e" strokeWidth={2} dot={{ r: 2, fill: '#22c55e' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full rounded-xl bg-slate-950 border border-slate-800 animate-pulse" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Processed Feed */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-500" /> Relatos Processados Recentes
            </h3>
            <span className="text-xs text-slate-400">Dados anonimizados e agregados do Supabase</span>
          </div>
          
          <div className="space-y-3">
            {recentReports.map(report => (
              <div key={report.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-wrap gap-2">
                    {report.themes.length > 0 ? report.themes.map((theme) => (
                      <span key={theme} className="text-xs font-semibold px-2 py-1 bg-slate-800 text-blue-400 rounded-md">
                        {theme}
                      </span>
                    )) : (
                      <span className="text-xs font-semibold px-2 py-1 bg-slate-800 text-blue-400 rounded-md">
                        Relato
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs text-slate-500">{new Date(report.created_at).toLocaleDateString('pt-BR')}</span>
                    <span className="text-xs px-2 py-1 rounded-md font-medium bg-blue-500/10 text-blue-400">
                      Compartilhado
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-300">&quot;{report.snippet}&quot;</p>
              </div>
            ))}
          </div>
          {recentReports.length === 0 && !loading && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-400">
              Ainda não há relatórios suficientes para compor o feed analítico.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
