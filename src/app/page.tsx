import Link from 'next/link';
import { ShieldAlert, Bot, ArrowRight, MessageSquare, BookOpen, ShieldCheck, Trophy, BarChart3, FileText } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-full">
            <Bot className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="font-bold text-2xl leading-tight text-white tracking-tight">852 Inteligência</h1>
            <p className="text-sm text-slate-400">Canal Seguro do Policial Civil</p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 mb-8 text-sm font-medium">
          <ShieldAlert className="w-4 h-4" /> 100% Anônimo e Seguro
        </div>
        
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
          A sua realidade precisa ser <span className="text-blue-500">ouvida.</span>
        </h2>
        
        <p className="text-lg text-slate-400 mb-10 leading-relaxed">
          Este é o canal de Inteligência 852 para mapear problemas estruturais, 
          gargalos no fluxo de trabalho e sugestões de melhoria nas delegacias. 
          Sem exposição, sem nomes, focado em soluções institucionais.
        </p>

        <Link 
          href="/chat" 
          className="group flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)]"
        >
          Iniciar Relato Seguro
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>

        <div className="flex gap-3 mt-4">
          <Link href="/ethik" className="flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300 border border-yellow-500/20 px-4 py-2 rounded-xl hover:bg-yellow-500/5 transition">
            <Trophy className="w-4 h-4" /> ETHIK Leaderboard
          </Link>
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 border border-purple-500/20 px-4 py-2 rounded-xl hover:bg-purple-500/5 transition">
            <BarChart3 className="w-4 h-4" /> Dashboard
          </Link>
          <Link href="/reports" className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 px-4 py-2 rounded-xl hover:bg-cyan-500/5 transition">
            <FileText className="w-4 h-4" /> Relatórios
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full text-left">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <ShieldCheck className="w-8 h-8 text-green-500 mb-4" />
            <h3 className="font-bold text-white mb-2">Privacidade Total</h3>
            <p className="text-sm text-slate-400">Sistema treinado para ocultar nomes, CPFs e números de processos automaticamente.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <MessageSquare className="w-8 h-8 text-blue-500 mb-4" />
            <h3 className="font-bold text-white mb-2">Diálogo Inteligente</h3>
            <p className="text-sm text-slate-400">Um agente que te ajuda a estruturar o problema e focar no que realmente importa.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <BookOpen className="w-8 h-8 text-purple-500 mb-4" />
            <h3 className="font-bold text-white mb-2">Documentação Fácil</h3>
            <p className="text-sm text-slate-400">Exporte toda a conversa em PDF ou Docx e compartilhe no WhatsApp da delegacia.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center border-t border-slate-800 text-sm text-slate-500">
        Desenvolvido com o ecossistema EGOS Inteligência Institucional.
      </footer>
    </div>
  );
}
