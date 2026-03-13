'use client';

import Script from 'next/script';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: Record<string, unknown>) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

type GoogleIdentityButtonProps = {
  mode: 'login' | 'register';
  nextPath: string;
  fullWidth?: boolean;
  onSuccess?: (payload: { nextPath: string; onboarding?: boolean }) => void;
  onError?: (message: string) => void;
};

export default function GoogleIdentityButton({
  mode,
  nextPath,
  fullWidth = true,
  onSuccess,
  onError,
}: GoogleIdentityButtonProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const buttonText = useMemo(() => {
    return mode === 'register' ? 'signup_with' : 'continue_with';
  }, [mode]);

  useEffect(() => {
    if (!scriptReady || !clientId || !buttonRef.current || !window.google?.accounts?.id) return;

    buttonRef.current.innerHTML = '';

    window.google.accounts.id.initialize({
      client_id: clientId,
      ux_mode: 'popup',
      use_fedcm_for_prompt: true,
      callback: async (response: { credential?: string }) => {
        if (!response.credential) {
          onError?.('Google não retornou uma credencial válida.');
          return;
        }

        setLoading(true);
        try {
          const request = await fetch('/api/auth/google/identity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential, nextPath, mode }),
          });
          const payload = await request.json();

          if (!request.ok || payload.error) {
            onError?.(payload.error || 'Não foi possível entrar com Google.');
            return;
          }

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('852-auth-changed'));
          }

          onSuccess?.({
            nextPath: payload.nextPath || nextPath,
            onboarding: Boolean(payload.needsOnboarding),
          });
        } catch {
          onError?.('Erro de conexão ao entrar com Google.');
        } finally {
          setLoading(false);
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text: buttonText,
      logo_alignment: 'left',
      width: fullWidth ? 360 : 240,
    });
  }, [buttonText, clientId, fullWidth, mode, nextPath, onError, onSuccess, scriptReady]);

  if (!clientId) {
    return (
      <div className="flex h-12 w-full items-center justify-center rounded-2xl border border-dashed border-neutral-700 bg-neutral-950/60 px-4 text-center text-sm text-neutral-500">
        Google indisponível neste ambiente
      </div>
    );
  }

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setScriptReady(true)} />
      <div className="space-y-2">
        <div className="flex w-full justify-center overflow-hidden rounded-2xl border border-neutral-800 bg-white px-3 py-2 shadow-[0_10px_30px_rgba(255,255,255,0.06)]">
          <div ref={buttonRef} className="flex w-full justify-center" />
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Validando conta Google...
          </div>
        ) : null}
      </div>
    </>
  );
}
