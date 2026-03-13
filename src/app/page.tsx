'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Lock, MessageSquare, FileDown, Users,
  BarChart3, AlertCircle, Bot, ChevronUp, Loader2,
  Mic, Brain, ClipboardList, ChevronDown, Shield,
  Github, Code2, Eye, Send,
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

/* ─── Animated counter ─── */
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

/* ─── Expandable section ─── */
function ExpandableCard({
  icon: Icon,
  title,
  children,
  defaultOpen = false,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
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
            <div className="mt-4 text-base text-neutral-300 leading-relaxed pl-16">
              {children}
            </div>
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
        <div className="flex flex-col items-center max-w-3xl mx-auto w-full">

          {/* ═══════════ HERO ═══════════ */}
          <div className="flex flex-col items-center pt-6 sm:pt-12 w-full">
            <Image
              src="/brand/logo-852.png"
              alt="Tira-Voz"
              width={96}
              height={96}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-contain shadow-lg shadow-amber-900/20"
            />
            <h1 className="mt-5 text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight text-center">
              Tira-Voz
            </h1>
            <p className="mt-1 text-lg sm:text-xl text-amber-400 font-medium text-center">
              o radar da base
            </p>
            <p className="mt-4 text-lg sm:text-xl text-neutral-300 max-w-lg text-center leading-relaxed">
              Canal seguro e anonimo para policiais civis de Minas Gerais. Sua voz ja existe, e aqui ela chega onde precisa chegar.
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
            100% Anonimo: toque para entender
          </button>

          {/* ═══════════ DUAS FORMAS DE PARTICIPAR (lado a lado) ═══════════ */}
          <div className="mt-10 w-full">
            <h2 className="text-xl font-bold text-white text-center mb-6">
              Como voce pode participar
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Opcao 1: Chatbot */}
              <Link
                href="/chat"
                className="group flex flex-col rounded-2xl border border-amber-800/30 bg-amber-950/20 p-6 hover:border-amber-700/50 hover:bg-amber-950/30 transition-all active:scale-[0.98]"
              >
                <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                  <Mic className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Conversar com a IA</h3>
                <p className="text-sm text-neutral-400 leading-relaxed flex-1">
                  Fale com o agente 852 como se fosse um colega. Descreva o problema, tire duvidas, peça orientação. A IA organiza e cruza seu relato com outros.
                </p>
                <div className="mt-4 flex items-center gap-2 text-amber-400 group-hover:text-amber-300 font-medium text-sm">
                  Iniciar conversa <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Opcao 2: Forum/Issues */}
              <Link
                href="/issues"
                className="group flex flex-col rounded-2xl border border-green-800/30 bg-green-950/20 p-6 hover:border-green-700/50 hover:bg-green-950/30 transition-all active:scale-[0.98]"
              >
                <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                  <Send className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Enviar direto no forum</h3>
                <p className="text-sm text-neutral-400 leading-relaxed flex-1">
                  Crie um topico, vote nos problemas que te afetam ou comente nos relatos de outros colegas. Tudo anonimo, tudo visivel para a categoria.
                </p>
                <div className="mt-4 flex items-center gap-2 text-green-400 group-hover:text-green-300 font-medium text-sm">
                  Abrir forum <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
            <p className="mt-3 text-sm text-neutral-500 text-center">
              Nao precisa instalar nada. Funciona no celular e no computador.
            </p>
          </div>

          {/* ═══════════ COMO A INFORMACAO FLUI ═══════════ */}
          <div id="como-funciona" className="mt-10 w-full space-y-3">
            <h2 className="text-xl font-bold text-white text-center mb-4">
              Como a informacao flui dentro da ferramenta
            </h2>
            <ExpandableCard icon={Shield} title="O que e o Tira-Voz?" defaultOpen>
              <p>
                E um canal onde voce, policial civil (investigador, escrivao, delegado, perito), pode relatar problemas do dia a dia, sugerir melhorias e ajudar a construir pautas reais para a categoria.
              </p>
              <p className="mt-2">
                Sem nome, sem CPF, sem MASP obrigatorio. O que importa e o que voce tem a dizer.
              </p>
            </ExpandableCard>
            <ExpandableCard icon={Mic} title="Passo 1: Voce fala">
              <p>
                Pode ser pelo chatbot (conversa com a IA) ou direto no forum (cria um topico). Conte o que acontece: falta de viatura, sistema fora do ar, sobrecarga, ideias que nunca chegam a chefia.
              </p>
            </ExpandableCard>
            <ExpandableCard icon={Brain} title="Passo 2: A IA le, organiza e cruza">
              <p>
                Uma inteligencia artificial analisa seu relato e compara com o que outros colegas de todo o estado ja relataram. Ela identifica padroes: se muita gente reclama da mesma coisa, isso vira destaque.
              </p>
              <p className="mt-2 text-neutral-400">
                Nenhum dado pessoal e armazenado. A IA nao sabe quem voce e.
              </p>
            </ExpandableCard>
            <ExpandableCard icon={ClipboardList} title="Passo 3: Vira pauta coletiva">
              <p>
                A cada 5 relatos compartilhados, um relatorio de inteligencia e gerado automaticamente. Os problemas mais citados viram topicos publicos. A categoria pode votar e comentar.
              </p>
            </ExpandableCard>
            <ExpandableCard icon={Eye} title="Passo 4: Tudo transparente">
              <p>
                Voce pode ver os relatorios de inteligencia, acompanhar os topicos mais votados e exportar conversas em PDF. Nada fica escondido.
              </p>
            </ExpandableCard>
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
                  O que ja foi construido
                </h2>
                <div className="grid grid-cols-2 gap-6 sm:gap-8">
                  <AnimatedCounter value={stats.totalConversations} label="Conversas realizadas" />
                  <AnimatedCounter value={stats.totalReportsShared} label="Relatos compartilhados" />
                  <AnimatedCounter value={stats.totalIssuesOpen} label="Topicos em discussao" />
                  <AnimatedCounter value={stats.totalReportsReviewedByAI} label="Relatos revisados pela IA" />
                </div>

                <p className="mt-4 text-sm text-neutral-500 text-center">
                  Relatorios de inteligencia completos ja gerados: <span className="text-neutral-300 font-medium">{stats.totalAIReports}</span>
                </p>

                {/* Progress to next AI report */}
                <div className="mt-6 pt-5 border-t border-neutral-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-400">Proximo relatorio de inteligencia</span>
                    <span className="text-sm text-neutral-300 font-medium">{sharedReportsProgress}/5 relatos</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-neutral-800">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000"
                      style={{ width: `${(sharedReportsProgress / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-neutral-500 mt-2">
                    A cada 5 relatos compartilhados, um relatorio completo e gerado por IA
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {/* ═══════════ ULTIMO RELATORIO DE INTELIGENCIA ═══════════ */}
          {stats?.latestAIReport && (
            <Link href="/reports" className="mt-6 w-full block group">
              <div className="rounded-2xl border border-purple-800/30 bg-purple-950/20 p-6 hover:border-purple-700/50 hover:bg-purple-950/30 transition-all active:scale-[0.98]">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white">Ultimo relatorio de inteligencia</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-neutral-400 flex-wrap">
                      <span>Gerado por IA</span>
                      <span>·</span>
                      <span>{stats.latestAIReport.conversation_count} conversas analisadas</span>
                      <span>·</span>
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
                      {stats.latestAIReport.pending_topics.length} topicos pendentes identificados
                    </span>
                  </div>
                )}
                <div className="mt-4 flex items-center gap-2 text-base text-purple-400 group-hover:text-purple-300 transition font-medium">
                  Ver relatorio completo <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          )}

          {/* ═══════════ FEATURES GRID ═══════════ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 w-full">
            {[
              { icon: Lock, label: 'Privacidade total', color: 'text-green-400' },
              { icon: Brain, label: 'IA que organiza', color: 'text-blue-400' },
              { icon: FileDown, label: 'Exportar em PDF', color: 'text-purple-400' },
              { icon: Users, label: 'Voto coletivo', color: 'text-amber-400' },
            ].map((feat, i) => (
              <div key={i} className="flex flex-col items-center gap-3 p-4 rounded-xl border border-neutral-800/50 bg-neutral-900/30 hover:bg-neutral-800/40 transition">
                <div className="w-14 h-14 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                  <feat.icon className={`w-6 h-6 ${feat.color}`} />
                </div>
                <p className="text-sm text-neutral-400 text-center font-medium">{feat.label}</p>
              </div>
            ))}
          </div>

          {/* ═══════════ CODIGO ABERTO ═══════════ */}
          <div className="mt-10 w-full rounded-2xl border border-neutral-800/50 bg-neutral-900/40 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center flex-shrink-0">
                <Code2 className="w-6 h-6 text-neutral-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Codigo 100% aberto</h2>
                <p className="text-sm text-neutral-400">Nada escondido. Voce pode ver, auditar e contribuir.</p>
              </div>
            </div>
            <p className="text-base text-neutral-300 leading-relaxed mb-4">
              O Tira-Voz e um projeto de codigo livre. Todo o codigo fonte, incluindo a logica da IA, as regras de privacidade e o tratamento dos dados, esta publicado no GitHub. Qualquer pessoa pode verificar que nenhum dado pessoal e coletado ou armazenado.
            </p>
            <a
              href="https://github.com/enioxt/852"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-200 hover:bg-neutral-700 hover:text-white transition font-medium text-sm active:scale-95"
            >
              <Github className="w-5 h-5" />
              Ver codigo no GitHub
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* ═══════════ LINKS SECUNDARIOS ═══════════ */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href="/reports"
              className="flex items-center justify-center gap-2 w-full sm:w-auto text-base text-neutral-400 hover:text-white transition px-4 py-3 rounded-xl hover:bg-neutral-800/40 touch-target"
            >
              <BarChart3 className="w-5 h-5" />
              Ver relatorios
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 w-full sm:w-auto text-base text-neutral-400 hover:text-white transition px-4 py-3 rounded-xl hover:bg-neutral-800/40 touch-target"
            >
              <BarChart3 className="w-5 h-5" />
              Painel de dados
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* ═══════════ CTA FINAL ═══════════ */}
          <Link
            href="/chat"
            className="mt-10 mb-4 w-full sm:w-auto group flex items-center justify-center gap-3 bg-white text-black px-8 py-5 rounded-2xl font-bold text-xl hover:bg-neutral-200 transition-all shadow-lg active:scale-95 touch-target"
          >
            Comecar agora
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-neutral-600 space-y-1">
        <p>EGOS · Tira-Voz: o radar da base</p>
        <a
          href="https://github.com/enioxt/852"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-300 transition"
        >
          <Github className="w-3.5 h-3.5" />
          Codigo aberto no GitHub
        </a>
      </footer>
    </div>
  );
}
