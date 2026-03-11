'use client';

import Image from 'next/image';
import { AlertTriangle, FileText, MessageCircle, Zap } from 'lucide-react';

const quickActions = [
  { icon: AlertTriangle, label: 'Relatar problema no dia a dia', prompt: 'Quero relatar um problema operacional que afeta o trabalho da equipe na delegacia.' },
  { icon: FileText, label: 'Sugerir melhoria', prompt: 'Tenho uma sugestão para melhorar um processo interno que está causando atrasos.' },
  { icon: MessageCircle, label: 'Falar sobre condições de trabalho', prompt: 'Preciso falar sobre as condições de trabalho na minha unidade.' },
  { icon: Zap, label: 'Problema com sistema ou tecnologia', prompt: 'Estou enfrentando problemas com sistemas ou tecnologia utilizados no serviço.' },
];

interface WelcomeScreenProps {
  onQuickAction: (prompt: string) => void;
}

export default function WelcomeScreen({ onQuickAction }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <Image src="/brand/logo-852.png" alt="Tira-Voz" width={72} height={72} className="w-18 h-18 rounded-2xl object-cover mx-auto shadow-lg shadow-amber-900/30" />
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Fala, parceiro. Aqui é o Tira-Voz.
          </h2>
          <p className="text-base text-neutral-400 max-w-md mx-auto leading-relaxed">
            Canal seguro e anônimo. Relate problemas, sugira melhorias, sem identificação. Sua voz já existe, aqui ela chega onde precisa.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => onQuickAction(action.prompt)}
              className="flex items-center gap-3 px-5 py-4 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800/80 hover:border-neutral-700 text-left transition group touch-target active:scale-[0.97]"
            >
              <action.icon className="w-5 h-5 text-neutral-500 group-hover:text-amber-400 transition flex-shrink-0" />
              <span className="text-sm sm:text-base text-neutral-400 group-hover:text-neutral-200 transition">{action.label}</span>
            </button>
          ))}
        </div>

        <p className="text-sm text-neutral-600 max-w-sm mx-auto">
          Não cite nomes, CPFs, REDS ou dados pessoais. O foco é em problemas estruturais e processuais.
        </p>
      </div>
    </div>
  );
}
