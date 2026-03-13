'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, MailWarning, ShieldAlert } from 'lucide-react';

type VerifyStatus = 'idle' | 'loading' | 'success' | 'already_verified' | 'expired' | 'invalid' | 'missing' | 'error';

interface VerifyResponse {
  status: VerifyStatus;
  email?: string;
  validationStatus?: string | null;
  error?: string;
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailPageFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [result, setResult] = useState<VerifyResponse>({ status: token ? 'loading' : 'missing' });
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendDebugUrl, setResendDebugUrl] = useState('');

  useEffect(() => {
    if (!token) {
      setResult({ status: 'missing' });
      return;
    }

    let cancelled = false;
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!cancelled) {
          setResult({
            status: data.status || (response.ok ? 'success' : 'error'),
            email: data.email,
            validationStatus: data.validationStatus,
            error: data.error,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setResult({ status: 'error' });
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const tone = useMemo(() => {
    switch (result.status) {
      case 'success':
      case 'already_verified':
        return 'green';
      case 'expired':
        return 'amber';
      case 'invalid':
      case 'missing':
      case 'error':
      default:
        return 'red';
    }
  }, [result.status]);

  const title = useMemo(() => {
    switch (result.status) {
      case 'loading':
        return 'Verificando seu email';
      case 'success':
        return 'Email confirmado com sucesso';
      case 'already_verified':
        return 'Este email já estava confirmado';
      case 'expired':
        return 'O link expirou';
      case 'invalid':
        return 'Link inválido';
      case 'missing':
        return 'Link de verificação ausente';
      default:
        return 'Não foi possível verificar o email';
    }
  }, [result.status]);

  const description = useMemo(() => {
    switch (result.status) {
      case 'loading':
        return 'Aguarde alguns segundos enquanto validamos o token enviado para sua conta.';
      case 'success':
        return result.validationStatus === 'pending'
          ? 'Seu email foi validado. Se você informou MASP, esses dados continuam privados e vinculados apenas ao contexto institucional da sua conta.'
          : 'Seu acesso foi ativado. Você já pode entrar no Tira-Voz.';
      case 'already_verified':
        return 'Você pode entrar normalmente com o email e a senha cadastrados.';
      case 'expired':
        return 'Solicite um novo link de verificação para continuar com o acesso.';
      case 'invalid':
        return 'O token não corresponde a uma solicitação válida ou já foi consumido.';
      case 'missing':
        return 'Abra esta página a partir do link enviado para o seu email.';
      default:
        return result.error || 'Tente novamente em alguns instantes.';
    }
  }, [result]);

  const handleResend = async () => {
    if (!result.email) return;
    setResendLoading(true);
    setResendMessage('');
    setResendDebugUrl('');
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: result.email }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        setResendMessage(data.error || 'Falha ao reenviar verificação.');
        return;
      }
      setResendMessage(data.warning || data.message || 'Novo link emitido com sucesso.');
      setResendDebugUrl(data.debugVerificationUrl || '');
    } catch {
      setResendMessage('Erro de conexão ao reenviar a verificação.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6 py-16">
      <section className="w-full max-w-xl rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 shadow-2xl shadow-black/30">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
          tone === 'green'
            ? 'bg-green-900/20 border border-green-800/30 text-green-400'
            : tone === 'amber'
              ? 'bg-amber-900/20 border border-amber-800/30 text-amber-400'
              : 'bg-red-900/20 border border-red-800/30 text-red-400'
        }`}>
          {result.status === 'loading' ? <Loader2 className="w-6 h-6 animate-spin" /> : null}
          {result.status === 'success' || result.status === 'already_verified' ? <CheckCircle2 className="w-6 h-6" /> : null}
          {result.status === 'expired' ? <MailWarning className="w-6 h-6" /> : null}
          {['invalid', 'missing', 'error'].includes(result.status) ? <ShieldAlert className="w-6 h-6" /> : null}
        </div>

        <p className="text-xs uppercase tracking-[0.24em] text-blue-400 mb-3">Tira-Voz</p>
        <h1 className="text-3xl font-semibold text-white mb-3">{title}</h1>
        <p className="text-sm leading-relaxed text-neutral-400 mb-6">{description}</p>

        {result.email && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 px-4 py-3 mb-6">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">Email</p>
            <p className="text-sm text-white break-all">{result.email}</p>
          </div>
        )}

        {result.status === 'expired' && result.email && (
          <div className="space-y-3 mb-6">
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="w-full h-11 rounded-xl border border-neutral-700 bg-neutral-950 hover:border-blue-700 hover:text-white transition text-sm text-neutral-300 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {resendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Reenviar email de verificação
            </button>
            {resendMessage && (
              <p className="text-xs text-blue-300 bg-blue-950/40 border border-blue-900/40 rounded-xl px-4 py-3">{resendMessage}</p>
            )}
            {resendDebugUrl && (
              <a href={resendDebugUrl} className="block text-xs text-blue-400 hover:text-blue-300 break-all">
                Abrir link de verificação gerado neste ambiente
              </a>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/chat" className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 transition text-sm font-medium text-white inline-flex items-center justify-center">
            Ir para o chat
          </Link>
          <Link href="/" className="h-11 px-5 rounded-xl border border-neutral-800 hover:bg-neutral-800 transition text-sm text-neutral-300 inline-flex items-center justify-center">
            Voltar ao início
          </Link>
        </div>
      </section>
    </main>
  );
}

function VerifyEmailPageFallback() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6 py-16">
      <section className="w-full max-w-xl rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 shadow-2xl shadow-black/30">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-neutral-900/20 border border-neutral-800/30 text-neutral-300">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-xs uppercase tracking-[0.24em] text-blue-400 mb-3">Tira-Voz</p>
        <h1 className="text-3xl font-semibold text-white mb-3">Carregando verificação</h1>
        <p className="text-sm leading-relaxed text-neutral-400">Aguarde enquanto preparamos a confirmação do seu email.</p>
      </section>
    </main>
  );
}
