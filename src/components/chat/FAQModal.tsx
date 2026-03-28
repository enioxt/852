'use client';

import { X, Shield, Lock, FileText, MessageSquare, Share2, AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface FAQModalProps {
  onClose: () => void;
}

const faqs = [
  {
    icon: Shield,
    q: 'O que é o Tira-Voz?',
    a: 'É um canal digital seguro e anônimo onde policiais civis de Minas Gerais podem relatar problemas do dia a dia, sugerir melhorias e construir pautas coletivas para a categoria. Funciona como um radar: capta o que acontece na base e organiza para que chegue onde precisa.',
  },
  {
    icon: Lock,
    q: 'É realmente anônimo?',
    a: 'Sim. Não coletamos nomes, CPFs, IPs nem identificamos quem está usando. O cadastro é opcional e usa codinomes aleatórios (ex: Falcão Noturno, Águia de Ferro). Suas conversas ficam no seu navegador, não em servidores.',
  },
  {
    icon: AlertTriangle,
    q: 'Por que não devo citar nomes ou CPFs?',
    a: 'Para proteger você e terceiros. Nosso objetivo é captar problemas estruturais e processuais, não dados pessoais. Se citar algo sensível, a IA vai alertar e pedir que reformule.',
  },
  {
    icon: MessageSquare,
    q: 'Que tipo de relato posso fazer?',
    a: 'Problemas de fluxo, gargalos operacionais, falta de equipamento, demandas repetitivas, sugestões de melhoria, dificuldades com sistemas, tudo que impacta o dia a dia da Polícia Civil.',
  },
  {
    icon: FileText,
    q: 'Posso exportar minha conversa?',
    a: 'Sim. No chat você pode exportar em PDF, DOCX ou Markdown. Na sugestão direta, você também pode exportar o texto validado em PDF ou Markdown antes de publicar.',
  },
  {
    icon: Share2,
    q: 'Posso compartilhar com colegas?',
    a: 'Com certeza! Use o botão de compartilhamento para enviar o link via WhatsApp. Quanto mais relatos, mais dados para embasar melhorias reais.',
  },
];

export default function FAQModal({ onClose }: FAQModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-white">Perguntas Frequentes</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {faqs.map((faq, i) => (
            <div key={i} className="group">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-600/10 flex-shrink-0 mt-0.5">
                  <faq.icon className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white mb-1">{faq.q}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/80 space-y-3">
          <p className="text-[10px] text-neutral-500 text-center">
            Tira-Voz: o radar da base · Canal de inteligência institucional para os 852 municípios de MG
          </p>
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center justify-center gap-2 text-xs text-amber-400 hover:text-amber-300 transition"
          >
            Ver FAQ completo na página inicial
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
