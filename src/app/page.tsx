'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Lock, MessageSquare, FileDown, Users,
  BarChart3, AlertCircle, Bot, ChevronUp, Loader2,
  Mic, Brain, ClipboardList, ChevronDown, Shield,
} from 'lucide-react';

interface Stats {
  totalConversations: number;
  totalReportsShared: number;
  totalReportsReviewedByAI: number;
  totalIssuesOpen: number;
  totalAIReports: number;
  sharedReportsSinceLastAIReport: number;
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

/* ─── Animated counter (kept from original) ─── */
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
      <div className="text-4xl sm:text-5xl font-bold text-white tabular-nums">{display}</div>
      <div className="text-sm text-neutral-400 mt-2 leading-snug">{label}</div>
    </div>
  );
}

/* ─── Expandable explainer section ─── */
function ExpandableCard({
  icon: Icon,
  title,
  description,
  defaultOpen = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 sm:p-6 transition-all hover:border-neutral-700 hover:bg-neutral-800/60 active:scale-[0.98] touch-target"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-amber-400" />
        </div>
        <span className="text-lg sm:text-xl font-semibold text-white flex-1">{title}</span>
        <ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="mt-4 text-base text-neutral-300 leading-relaxed pl-16">
              {description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

/* ─── Main page ─── */
export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => { })
      .finally(() => setLoadingStats(false));
  }, []);

  const sharedReportsProgress = stats ? Math.min(stats.sharedReportsSinceLastAIReport, 5) : 0;

  return (
    <div
      className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col font-[family-name:var(--font-geist-sans)]"
      style={{
        backgroundImage: "linear-gradient(to bottom, rgba(10,10,10,0.92), rgba(10,10,10,0.98)), url('/brand/bg-pattern.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <main className="flex-1 flex flex-col items-center p-4 sm:p-6">
        <div className="flex flex-col items-center max-w-2xl mx-auto w-full">

          {/* ═══════════ HERO ═══════════ */}
          <div className="flex flex-col items-center pt-6 sm:pt-12 w-full">
            <Image
              src="/brand/logo-852.png"
              alt="Tira-Voz"
              width={96}
              height={96}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-lg shadow-amber-900/20"
            />
            <h1 className="mt-5 text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight text-center">
              Tira-Voz
            </h1>
            <p className="mt-1 text-lg sm:text-xl text-amber-400 font-medium text-center">
              o radar da base
            </p>
            <p className="mt-4 text-lg sm:text-xl text-neutral-300 max-w-lg text-center leading-relaxed">
              Canal seguro e anônimo para policiais civis de Minas Gerais. Sua voz já existe, e aqui ela chega onde precisa chegar.
            </p>
          </div>

          {/* ═══════════ ANONIMATO BADGE ═══════════ */}
          <button
            onClick={() => {
              const el = document.getElementById('como-funciona');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="mt-5 flex items-center gap-3 px-5 py-3 rounded-full bg-green-900/30 text-green-400 border border-green-800/40 text-base font-medium hover:bg-green-900/50 transition touch-target cursor-pointer active:scale-95"
          >
            <Lock className="w-5 h-5" />
            🔒 100% Anônimo: toque para entender
          </button>

          {/* ═══════════ CTA PRINCIPAL ═══════════ */}
          <Link
            href="/chat"
            className="mt-8 w-full sm:w-auto group flex items-center justify-center gap-3 bg-amber-500 text-black px-8 py-5 rounded-2xl font-bold text-xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 active:scale-95 touch-target"
          >
            <Mic className="w-6 h-6" />
            Começar a falar
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>

          <p className="mt-3 text-base text-neutral-500 text-center">
            Não precisa instalar nada. É só tocar e conversar.
          </p>

          {/* ═══════════ O QUE É + COMO FUNCIONA ═══════════ */}
          <div id="como-funciona" className="mt-10 w-full space-y-3">
            <ExpandableCard
              icon={Shield}
              title="O que é o Tira-Voz?"
              description="É um canal seguro onde você, policial civil (investigador, escrivão, delegado), pode relatar problemas estruturais, sugerir melhorias e ajudar a construir pautas reais para a categoria. Sem nome, sem CPF, sem MASP. O que importa é o que você tem a dizer."
              defaultOpen
            />
            <ExpandableCard
              icon={Mic}
              title="Você fala"
              description="Conte o que acontece no seu dia a dia: falta de viatura, sistema fora do ar, sobrecarga de trabalho, ideias que nunca chegam à chefia. Escreva como falaria com um colega de plantão."
            />
            <ExpandableCard
              icon={Brain}
              title="A IA escuta e organiza"
              description="Uma inteligência artificial lê seu relato, identifica padrões e cruza com o que outros colegas de todo o estado já relataram. Nenhum dado pessoal é armazenado."
            />
            <ExpandableCard
              icon={ClipboardList}
              title="Vira pauta coletiva"
              description="A cada 5 relatos, um relatório de inteligência é gerado automaticamente. Os problemas mais citados viram tópicos públicos que a categoria pode votar e discutir."
            />
          </div>

          {/* ═══════════ LIVE STATS ═══════════ */}
          <div className="mt-10 w-full">
            {loadingStats ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-600" />
              </div>
            ) : stats && (stats.totalConversations > 0 || stats.totalReportsShared > 0) ? (
              <div className="rounded-2xl border border-neutral-800/50 bg-neutral-900/40 p-6 sm:p-8">
                <h2 className="text-xl font-bold text-white mb-6 text-center">
                  O que já foi construído
                </h2>
                <div className="grid grid-cols-2 gap-6 sm:gap-8">
                  <AnimatedCounter value={stats.totalConversations} label="Conversas realizadas" />
                  <AnimatedCounter value={stats.totalReportsShared} label="Relatórios compartilhados" />
                  <AnimatedCounter value={stats.totalIssuesOpen} label="Tópicos em discussão" />
                  <AnimatedCounter value={stats.totalReportsReviewedByAI} label="Relatórios revisados pela IA" />
                </div>

                <p className="mt-4 text-sm text-neutral-500 text-center">
                  Relatórios de inteligência completos já gerados: <span className="text-neutral-300 font-medium">{stats.totalAIReports}</span>
                </p>

                {/* Progress to next AI report */}
                <div className="mt-6 pt-5 border-t border-neutral-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-400">Próximo relatório de inteligência</span>
                    <span className="text-sm text-neutral-300 font-medium">{sharedReportsProgress}/5 relatos</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-neutral-800">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000"
                      style={{ width: `${(sharedReportsProgress / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-neutral-500 mt-2">
                    A cada 5 relatos compartilhados, um relatório completo de inteligência é gerado automaticamente por IA
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {/* ═══════════ LATEST AI REPORT ═══════════ */}
          {stats?.latestAIReport && (
            <Link href="/reports" className="mt-6 w-full block group">
              <div className="rounded-2xl border border-purple-800/30 bg-purple-950/20 p-6 hover:border-purple-700/50 hover:bg-purple-950/30 transition-all active:scale-[0.98]">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white">Último Relatório de Inteligência</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-neutral-400 flex-wrap">
                      <span>🤖 Gerado por IA</span>
                      <span>•</span>
                      <span>{stats.latestAIReport.conversation_count} conversas analisadas</span>
                      <span>•</span>
                      <span>{new Date(stats.latestAIReport.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                {stats.latestAIReport.content_summary && (
                  <p className="text-base text-neutral-300 leading-relaxed line-clamp-3">
                    {stats.latestAIReport.content_summary}
                  </p>
                )}
                {stats.latestAIReport.pending_topics && stats.latestAIReport.pending_topics.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-sm text-amber-400/80">
                      {stats.latestAIReport.pending_topics.length} tópicos pendentes identificados
                    </span>
                  </div>
                )}
                <div className="mt-4 flex items-center gap-2 text-base text-purple-400 group-hover:text-purple-300 transition font-medium">
                  Ver relatório completo <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          )}

          {/* ═══════════ TÓPICOS EM DISCUSSÃO ═══════════ */}
          {stats && stats.recentIssues.length > 0 && (
            <div className="mt-6 w-full rounded-2xl border border-neutral-800/50 bg-neutral-900/40 p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg font-semibold text-white">Tópicos em Discussão</h2>
                </div>
                <Link href="/issues" className="text-sm text-neutral-400 hover:text-white transition flex items-center gap-1">
                  Ver todos <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-2">
                {stats.recentIssues.map(issue => (
                  <Link
                    key={issue.id}
                    href="/issues"
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-neutral-800/50 transition group active:scale-[0.98] touch-target"
                  >
                    <div className="flex flex-col items-center min-w-[40px]">
                      <ChevronUp className="w-4 h-4 text-neutral-500" />
                      <span className="text-base font-semibold text-neutral-300">{issue.votes}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base text-neutral-300 group-hover:text-white transition line-clamp-2">{issue.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {issue.category && (
                          <span className="text-sm text-neutral-500">{issue.category}</span>
                        )}
                        {issue.source === 'ai_suggestion' && (
                          <span className="text-sm text-purple-400">via IA</span>
                        )}
                        <span className="text-sm text-neutral-600">{issue.comment_count} comentários</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href="/issues"
                className="mt-4 flex items-center justify-center gap-2 w-full py-4 rounded-xl border border-neutral-800 text-base text-neutral-400 hover:text-white hover:border-neutral-700 transition touch-target active:scale-[0.98]"
              >
                <AlertCircle className="w-4 h-4" />
                Criar novo tópico ou votar
              </Link>
            </div>
          )}

          {/* ═══════════ FEATURES GRID ═══════════ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 w-full">
            {[
              { icon: Lock, label: 'Privacidade total', color: 'text-green-400' },
              { icon: MessageSquare, label: 'IA inteligente', color: 'text-blue-400' },
              { icon: FileDown, label: 'Exportar relato', color: 'text-purple-400' },
              { icon: Users, label: 'Colaboração', color: 'text-amber-400' },
            ].map((feat, i) => (
              <div key={i} className="flex flex-col items-center gap-3 p-4 rounded-xl border border-neutral-800/50 bg-neutral-900/30 hover:bg-neutral-800/40 transition">
                <div className="w-14 h-14 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                  <feat.icon className={`w-6 h-6 ${feat.color}`} />
                </div>
                <p className="text-sm text-neutral-400 text-center font-medium">{feat.label}</p>
              </div>
            ))}
          </div>

          {/* ═══════════ SECONDARY CTAs ═══════════ */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href="/reports"
              className="flex items-center justify-center gap-2 w-full sm:w-auto text-base text-neutral-400 hover:text-white transition px-4 py-3 rounded-xl hover:bg-neutral-800/40 touch-target"
            >
              <BarChart3 className="w-5 h-5" />
              Relatórios compartilhados
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/issues"
              className="flex items-center justify-center gap-2 w-full sm:w-auto text-base text-neutral-400 hover:text-white transition px-4 py-3 rounded-xl hover:bg-neutral-800/40 touch-target"
            >
              <AlertCircle className="w-5 h-5" />
              Tópicos em discussão
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* ═══════════ CTA FINAL ═══════════ */}
          <Link
            href="/chat"
            className="mt-10 mb-4 w-full sm:w-auto group flex items-center justify-center gap-3 bg-white text-black px-8 py-5 rounded-2xl font-bold text-xl hover:bg-neutral-200 transition-all shadow-lg active:scale-95 touch-target"
          >
            Falar agora
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-neutral-600">
        EGOS · Tira-Voz: o radar da base
      </footer>
    </div>
  );
}
