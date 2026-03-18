'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, X } from 'lucide-react';

const LGPD_CONSENT_KEY = '852_lgpd_consent';

export default function LgpdBanner() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem(LGPD_CONSENT_KEY);
  });

  const handleAccept = () => {
    localStorage.setItem(LGPD_CONSENT_KEY, new Date().toISOString());
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4">
      <div className="mx-auto max-w-3xl rounded-2xl border border-neutral-800 bg-neutral-900/95 p-4 shadow-[0_-8px_40px_rgba(0,0,0,0.5)] backdrop-blur sm:p-5">
        <div className="flex items-start gap-3">
          <div className="hidden sm:block rounded-xl bg-blue-950/40 p-2.5">
            <Shield className="h-4 w-4 text-blue-300" />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-white">Privacidade e proteção de dados</p>
            <p className="text-xs leading-relaxed text-neutral-400">
              O Tira-Voz usa cookies de sessão e armazena dados localmente no seu navegador. Se você criar uma conta, conversas e relatórios podem ser sincronizados com nosso servidor. Seus dados nunca são vendidos ou compartilhados para marketing. Leia a{' '}
              <Link href="/privacidade" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
                Política de Privacidade
              </Link>{' '}
              completa.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleAccept}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-blue-600 px-4 text-xs font-medium text-white transition hover:bg-blue-500"
              >
                Aceitar e continuar
              </button>
              <Link
                href="/privacidade"
                className="inline-flex h-9 items-center justify-center rounded-xl border border-neutral-700 px-4 text-xs font-medium text-neutral-300 transition hover:border-neutral-500 hover:bg-neutral-800"
              >
                Ver política completa
              </Link>
            </div>
          </div>
          <button onClick={handleDismiss} className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-800 hover:text-white" title="Fechar">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
