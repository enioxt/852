'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight, Lock, MessageSquare, FileDown, Users,
  BarChart3, AlertCircle, Bot, ChevronUp, Loader2,
} from 'lucide-react';

interface Stats {
  totalConversations: number;
  totalReportsShared: number;
  totalIssuesOpen: number;
  totalAIReports: number;
  latestAIReport: {
    id: string;
    created_at: string;
    model_id: string;
    provider: string;
    cost_usd: number;
    tokens_in: number;
    tokens_out: number;
    duration_ms: number;
    conversation_count: number;
    report_count: number;
    content_summary: string;
    pending_topics: Array<{ titulo: string; categoria?: string }>;
  } | null;
  recentIssues: Array<{
    id: string;
    title: string;
    votes: number;
    comment_count: number;
    category: string | null;
    source: string;
    status: string;
  }>;
}

function AnimatedCounter({ value, label }: { value: number; label: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) return;
    const duration = 1200;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="text-center">
      <div className="text-3xl sm:text-4xl font-bold text-white tabular-nums">{display}</div>
      <div className="text-xs text-neutral-500 mt-1">{label}</div>
    </div>
  );
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  const nextReportIn = stats ? Math.max(0, 5 - (stats.totalConversations % 5)) : 5;

  return (
    <div
      className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col font-[family-name:var(--font-geist-sans)]"
      style={{
        backgroundImage: "linear-gradient(to bottom, rgba(10,10,10,0.92), rgba(10,10,10,0.98)), url('/brand/bg-pattern.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center p-6">
        <div className="flex flex-col items-center max-w-3xl mx-auto w-full">
          {/* Logo + Title */}
          <div className="flex flex-col items-center pt-8 sm:pt-12">
            <Image src="/brand/logo-852.png" alt="852 Inteligência" width={96} height={96} className="w-24 h-24 rounded-2xl object-cover shadow-lg shadow-blue-900/20" />
            <h1 className="mt-6 text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight text-center">
              852 Inteligência
            </h1>
            <p className="mt-3 text-base sm:text-lg text-neutral-400 max-w-lg text-center leading-relaxed">
              Canal seguro e anônimo para mapear problemas estruturais nas delegacias de Minas Gerais.
            </p>
            <div className="mt-5 flex items-center gap-2 px-4 py-2 rounded-full bg-green-900/30 text-green-400 border border-green-800/40 text-xs font-medium">
              <Lock className="w-3.5 h-3.5" /> 100% Anônimo — Sem nomes, CPFs ou identificação
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/chat"
            className="mt-6 group flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-semibold text-base hover:bg-neutral-200 transition-all shadow-lg"
          >
            Iniciar conversa segura
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Live Stats */}
          <div className="mt-10 w-full">
            {loadingStats ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
              </div>
            ) : stats && (stats.totalConversations > 0 || stats.totalReportsShared > 0) ? (
              <div className="rounded-2xl border border-neutral-800/50 bg-neutral-900/40 p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <AnimatedCounter value={stats.totalConversations} label="Conversas realizadas" />
                  <AnimatedCounter value={stats.totalReportsShared} label="Relatórios compartilhados" />
                  <AnimatedCounter value={stats.totalIssuesOpen} label="Tópicos em discussão" />
                  <AnimatedCounter value={stats.totalAIReports} label="Relatórios de IA" />
                </div>

                {/* Progress to next AI report */}
                <div className="mt-5 pt-4 border-t border-neutral-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-neutral-500">Próximo relatório de IA</span>
                    <span className="text-xs text-neutral-400 font-medium">{5 - nextReportIn}/5 relatos</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-800">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-500 transition-all duration-1000"
                      style={{ width: `${((5 - nextReportIn) / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-neutral-600 mt-1.5">
                    A cada 5 relatos, um relatório completo é gerado automaticamente por IA
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Latest AI Report */}
          {stats?.latestAIReport && (
            <div className="mt-6 w-full rounded-2xl border border-purple-800/30 bg-purple-950/20 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-white">Último Relatório de Inteligência</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-900/40 text-purple-400 border border-purple-800/30">
                      🤖 Gerado por IA
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-neutral-500 flex-wrap">
                    <span>Modelo: {stats.latestAIReport.model_id}</span>
                    <span>•</span>
                    <span>Custo: ${stats.latestAIReport.cost_usd?.toFixed(4)}</span>
                    <span>•</span>
                    <span>{stats.latestAIReport.conversation_count} conversas analisadas</span>
                    <span>•</span>
                    <span>{new Date(stats.latestAIReport.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
              {stats.latestAIReport.content_summary && (
                <p className="text-sm text-neutral-300 leading-relaxed line-clamp-4">
                  {stats.latestAIReport.content_summary}
                </p>
              )}
              {stats.latestAIReport.pending_topics && stats.latestAIReport.pending_topics.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="text-xs text-amber-400/80">
                    {stats.latestAIReport.pending_topics.length} tópicos pendentes identificados
                  </span>
                </div>
              )}
              <Link
                href="/reports"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition"
              >
                Ver relatório completo <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Pending Issues / Topics */}
          {stats && stats.recentIssues.length > 0 && (
            <div className="mt-6 w-full rounded-2xl border border-neutral-800/50 bg-neutral-900/40 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-green-400" />
                  <h3 className="text-sm font-semibold text-white">Tópicos em Discussão</h3>
                </div>
                <Link href="/issues" className="text-xs text-neutral-500 hover:text-white transition flex items-center gap-1">
                  Ver todos <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {stats.recentIssues.map(issue => (
                  <Link
                    key={issue.id}
                    href="/issues"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-800/50 transition group"
                  >
                    <div className="flex flex-col items-center min-w-[32px]">
                      <ChevronUp className="w-3.5 h-3.5 text-neutral-600" />
                      <span className="text-xs font-semibold text-neutral-400">{issue.votes}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-300 group-hover:text-white transition truncate">{issue.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {issue.category && (
                          <span className="text-[10px] text-neutral-600">{issue.category}</span>
                        )}
                        {issue.source === 'ai_suggestion' && (
                          <span className="text-[10px] text-purple-500">via IA</span>
                        )}
                        <span className="text-[10px] text-neutral-700">{issue.comment_count} comentários</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href="/issues"
                className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-neutral-800 text-xs text-neutral-500 hover:text-white hover:border-neutral-700 transition"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Criar novo tópico ou votar
              </Link>
            </div>
          )}

          {/* Features grid */}
          <div className="grid grid-cols-4 gap-6 mt-10 w-full max-w-md">
            <div className="flex flex-col items-center gap-2.5">
              <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <Lock className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-xs text-neutral-500">Privacidade total</p>
            </div>
            <div className="flex flex-col items-center gap-2.5">
              <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-xs text-neutral-500">IA inteligente</p>
            </div>
            <div className="flex flex-col items-center gap-2.5">
              <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <FileDown className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-xs text-neutral-500">Exportar relato</p>
            </div>
            <div className="flex flex-col items-center gap-2.5">
              <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-xs text-neutral-500">Colaboração</p>
            </div>
          </div>

          {/* Secondary CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
            <Link
              href="/reports"
              className="flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition"
            >
              <BarChart3 className="w-4 h-4" />
              Relatórios compartilhados
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/issues"
              className="flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition"
            >
              <AlertCircle className="w-4 h-4" />
              Tópicos em discussão
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[10px] text-neutral-600">
        EGOS Inteligência Institucional
      </footer>
    </div>
  );
}
