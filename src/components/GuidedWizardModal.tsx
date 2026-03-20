'use client';

import { useState } from 'react';
import { Bot, ChevronRight, X } from 'lucide-react';

interface GuidedWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: { category: string; title: string; body: string }) => void;
}

const steps = [
  {
    question: 'O que está acontecendo?',
    description: 'Descreva de forma simples qual é a situação ou o problema que você quer relatar.',
    placeholder: 'Ex: A estrutura das celas na delegacia de plantão não está aguentando a lotação e gera vulnerabilidade de fuga...',
  },
  {
    question: 'Onde e/ou com quem ocorre?',
    description: 'Diga a cidade, delegacia, viatura, setor ou sistema que está sendo afetado.',
    placeholder: 'Ex: No plantão de Contagem, turno B, ou viatura placa XYZ...',
  },
  {
    question: 'Qual a sua sugestão ou o pedido?',
    description: 'Como você acha que isso poderia ser resolvido, atenuado ou reportado formalmente?',
    placeholder: 'Ex: Adoção imediata de reformas ou liberação do recurso do fundo...',
  }
];

export default function GuidedWizardModal({ isOpen, onClose, onComplete }: GuidedWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      const compiledBody = `**Situação/Problema:**\n${answers[0]}\n\n**Local/Ambiente:**\n${answers[1]}\n\n**Proposta de Melhoria:**\n${answers[2]}`;
      onComplete({
        category: 'outro',
        title: 'Relatório Guiado - ' + new Date().toLocaleDateString('pt-BR'),
        body: compiledBody.trim()
      });
      // reset and close
      setCurrentStep(0);
      setAnswers(['', '', '']);
      onClose();
    }
  };

  const handleTextChange = (val: string) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = val;
    setAnswers(newAnswers);
  };

  const handleClose = () => {
    setCurrentStep(0);
    setAnswers(['', '', '']);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-2">
             <Bot className="w-5 h-5 text-blue-400" />
             <h3 className="font-semibold text-white">Bússola (Modo Guiado)</h3>
           </div>
           <button onClick={handleClose} className="rounded-full bg-neutral-800 p-1.5 text-neutral-400 hover:text-white transition hover:bg-neutral-700">
             <X className="w-4 h-4" />
           </button>
        </div>
        
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">Passo {currentStep + 1} de {steps.length}</p>
          <h4 className="text-xl font-bold text-white mb-2">{steps[currentStep].question}</h4>
          <p className="text-sm text-neutral-400 leading-relaxed">{steps[currentStep].description}</p>
        </div>

        <textarea 
          value={answers[currentStep]}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={steps[currentStep].placeholder}
          className="w-full min-h-[160px] rounded-2xl border border-neutral-700 bg-neutral-950 p-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition mb-6"
        />

        <div className="flex justify-between items-center">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentStep ? 'w-6 bg-blue-500' : i < currentStep ? 'w-2 bg-emerald-500' : 'w-2 bg-neutral-700'}`} />
            ))}
          </div>
          <button 
             onClick={handleNext}
             disabled={!answers[currentStep].trim()}
             className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg transition hover:bg-blue-500 active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {currentStep === steps.length - 1 ? 'Preencher Formulário' : 'Próximo'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
