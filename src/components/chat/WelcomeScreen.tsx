'use client';

import Image from 'next/image';
import { AlertTriangle, FileText, MessageCircle, Zap } from 'lucide-react';

const quickActions = [
  { icon: AlertTriangle, label: 'Relatar problema operacional', prompt: 'Quero relatar um problema operacional que afeta o trabalho da equipe na delegacia.' },
  { icon: FileText, label: 'Sugerir melhoria de processo', prompt: 'Tenho uma sugestão para melhorar um processo interno que está causando atrasos.' },
  { icon: MessageCircle, label: 'Falar sobre condições de trabalho', prompt: 'Preciso falar sobre as condições de trabalho na minha unidade.' },
  { icon: Zap, label: 'Problema com sistema/tecnologia', prompt: 'Estou enfrentando problemas com sistemas ou tecnologia utilizados no serviço.' },
];

interface WelcomeScreenProps {
  onQuickAction: (prompt: string) => void;
}

export default function WelcomeScreen({ onQuickAction }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-3">
          <Image src="/brand/logo-852.png" alt="852 Inteligência" width={64} height={64} className="w-16 h-16 rounded-2xl object-cover mx-auto shadow-lg shadow-blue-900/30" />
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Como posso ajudar?
          </h2>
          <p className="text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
            Canal seguro e anônimo de inteligência institucional. Relate problemas, sugira melhorias — sem identificação.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => onQuickAction(action.prompt)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800/80 hover:border-neutral-700 text-left transition group"
            >
              <action.icon className="w-4 h-4 text-neutral-500 group-hover:text-blue-400 transition flex-shrink-0" />
              <span className="text-xs text-neutral-400 group-hover:text-neutral-200 transition">{action.label}</span>
            </button>
          ))}
        </div>

        <p className="text-[10px] text-neutral-600 max-w-xs mx-auto">
          Não cite nomes, CPFs, REDS ou dados pessoais. O foco é em problemas estruturais e processuais.
        </p>
      </div>
    </div>
  );
}
