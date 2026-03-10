import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Lock, MessageSquare, FileDown } from 'lucide-react';

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
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Logo */}
          <Image src="/brand/logo-852.png" alt="852 Inteligência" width={96} height={96} className="w-24 h-24 rounded-2xl object-cover mx-auto shadow-lg shadow-blue-900/20" />

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
              852 Inteligência
            </h1>
            <p className="text-lg text-neutral-400 max-w-lg mx-auto leading-relaxed">
              Canal seguro e anônimo para mapear problemas estruturais nas delegacias de Minas Gerais.
            </p>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-900/30 text-green-400 border border-green-800/40 text-xs font-medium">
            <Lock className="w-3 h-3" /> 100% Anônimo — Sem nomes, CPFs ou identificação
          </div>

          {/* CTA */}
          <Link
            href="/chat"
            className="group inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-semibold text-base hover:bg-neutral-200 transition-all shadow-lg"
          >
            Iniciar conversa segura
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Features — minimal */}
          <div className="grid grid-cols-3 gap-6 pt-12 max-w-md mx-auto">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto">
                <Lock className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-[11px] text-neutral-500">Privacidade total</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto">
                <MessageSquare className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-[11px] text-neutral-500">IA inteligente</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto">
                <FileDown className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-[11px] text-neutral-500">Exportar relato</p>
            </div>
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
