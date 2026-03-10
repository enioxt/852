import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Lock, MessageSquare, FileDown, Users } from 'lucide-react';

export default function Home() {
  return (
    <div
      className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col font-[family-name:var(--font-geist-sans)]"
      style={{
        backgroundImage: "linear-gradient(to bottom, rgba(10,10,10,0.92), rgba(10,10,10,0.98)), url('/brand/bg-pattern.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Hero — full screen centered */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center max-w-2xl mx-auto">
          {/* Logo */}
          <Image src="/brand/logo-852.png" alt="852 Inteligência" width={112} height={112} className="w-28 h-28 rounded-2xl object-cover shadow-lg shadow-blue-900/20" />

          {/* Headline */}
          <h1 className="mt-8 text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight text-center">
            852 Inteligência
          </h1>
          <p className="mt-4 text-lg text-neutral-400 max-w-lg text-center leading-relaxed">
            Canal seguro e anônimo para mapear problemas estruturais nas delegacias de Minas Gerais.
          </p>

          {/* Badge */}
          <div className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full bg-green-900/30 text-green-400 border border-green-800/40 text-xs font-medium">
            <Lock className="w-3.5 h-3.5" /> 100% Anônimo — Sem nomes, CPFs ou identificação
          </div>

          {/* CTA */}
          <Link
            href="/chat"
            className="mt-6 group flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-semibold text-base hover:bg-neutral-200 transition-all shadow-lg"
          >
            Iniciar conversa segura
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Features — minimal */}
          <div className="grid grid-cols-4 gap-6 mt-16 w-full max-w-md">
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

          {/* Secondary CTA — Reports */}
          <Link
            href="/reports"
            className="mt-6 flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition"
          >
            <Users className="w-4 h-4" />
            Ver relatórios compartilhados
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[10px] text-neutral-600">
        EGOS Inteligência Institucional
      </footer>
    </div>
  );
}
