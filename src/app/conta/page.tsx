'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, Flame, Loader2, Lock, LogOut, Mail, RefreshCw, Shield, Trophy, User, Waypoints } from 'lucide-react';
import GoogleIdentityButton from '@/components/auth/GoogleIdentityButton';

type CurrentUser = {
  id: string;
  email: string;
  display_name?: string | null;
  displayName?: string | null;
  masp?: string | null;
  lotacao?: string | null;
  email_verified_at?: string | null;
  reputation_points?: number;
  validation_status?: string | null;
  auth_provider?: string | null;
  avatar_url?: string | null;
  has_password?: boolean;
  is_profile_complete?: boolean;
} | null;

function normalizeNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith('/')) return '/conta';
  if (nextPath.startsWith('//')) return '/conta';
  return nextPath;
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center bg-neutral-950 px-4 py-16 text-neutral-300"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <AccountPageContent />
    </Suspense>
  );
}

function getFriendlyAuthError(error: string | null) {
  switch (error) {
    case 'google_not_configured':
      return 'O login com Google ainda não está configurado neste ambiente.';
    case 'access_denied':
      return 'O login com Google foi cancelado.';
    case 'google_identity_failed':
      return 'Não foi possível concluir a identificação com Google.';
    case 'google_callback_invalid':
      return 'O retorno do Google veio incompleto. Tente novamente.';
    default:
      return error ? decodeURIComponent(error).replace(/\+/g, ' ') : '';
  }
}

function getValidationLabel(status?: string | null) {
  if (status === 'approved') return 'MASP validado';
  if (status === 'pending') return 'Validação pendente';
  if (status === 'rejected') return 'Validação rejeitada';
  return 'Perfil sem validação MASP';
}

function AccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedAuthMode = searchParams.get('auth') === 'register'
    ? 'register'
    : searchParams.get('auth') === 'forgot'
      ? 'forgot'
      : searchParams.get('auth') === 'reset'
        ? 'reset'
        : 'login';
  const nextPath = normalizeNextPath(searchParams.get('next'));
  const onboardingRequested = searchParams.get('onboarding') === '1';
  const resetToken = searchParams.get('token') || '';
  const initialError = getFriendlyAuthError(searchParams.get('error'));

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(requestedAuthMode);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [registerNickname, setRegisterNickname] = useState('');
  const [registerMasp, setRegisterMasp] = useState('');
  const [registerLotacao, setRegisterLotacao] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(initialError);
  const [authNotice, setAuthNotice] = useState('');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [authDebugVerificationUrl, setAuthDebugVerificationUrl] = useState('');
  const [authDebugResetUrl, setAuthDebugResetUrl] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [profileMasp, setProfileMasp] = useState('');
  const [profileLotacao, setProfileLotacao] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const syncAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      const user = data.user || null;
      setCurrentUser(user);
      if (user) {
        setProfileDisplayName(user.display_name || user.displayName || '');
        setProfileMasp(user.masp || '');
        setProfileLotacao(user.lotacao || '');
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void syncAuth();
    window.addEventListener('852-auth-changed', syncAuth);
    return () => window.removeEventListener('852-auth-changed', syncAuth);
  }, []);

  useEffect(() => {
    setAuthMode(requestedAuthMode);
  }, [requestedAuthMode]);

  useEffect(() => {
    setAuthError(initialError);
  }, [initialError]);

  const isOnboarding = Boolean(currentUser && (!currentUser.is_profile_complete || onboardingRequested));
  const displayName = useMemo(() => {
    return currentUser?.display_name || currentUser?.displayName || 'Conta protegida';
  }, [currentUser]);

  const generateNickname = async (target: 'register' | 'profile') => {
    try {
      const response = await fetch('/api/auth/generate-nickname');
      const data = await response.json();
      if (!data.nicknames?.[0]) return;
      if (target === 'register') setRegisterNickname(data.nicknames[0]);
      else setProfileDisplayName(data.nicknames[0]);
    } catch {}
  };

  useEffect(() => {
    if (!currentUser && authMode === 'register' && !registerNickname) {
      void generateNickname('register');
    }
  }, [authMode, currentUser, registerNickname]);

  const finishAuthenticatedRedirect = (targetPath: string) => {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('852-auth-changed'));
    if (targetPath !== '/conta') router.push(targetPath);
    else router.replace(targetPath);
    router.refresh();
  };

  const handleAuth = async () => {
    if (authMode !== 'login' && authMode !== 'register') return;
    setAuthLoading(true);
    setAuthError('');
    setAuthNotice('');
    setAuthDebugVerificationUrl('');
    setAuthDebugResetUrl('');
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = authMode === 'login'
        ? { email: authEmail, password: authPassword }
        : {
            email: authEmail,
            password: authPassword,
            displayName: registerNickname,
            masp: registerMasp || undefined,
            lotacao: registerLotacao || undefined,
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        if (data.needsEmailVerification) {
          setPendingVerificationEmail(data.email || authEmail);
          setAuthNotice(data.error || 'Verifique seu email antes de entrar.');
          setAuthDebugVerificationUrl(data.debugVerificationUrl || '');
          return;
        }
        setAuthError(data.error || 'Falha de autenticação');
        return;
      }

      if (authMode === 'register' && data.requiresEmailVerification) {
        setPendingVerificationEmail(authEmail);
        setAuthNotice(data.warning || 'Conta criada. Verifique seu email para ativar o acesso.');
        setAuthDebugVerificationUrl(data.debugVerificationUrl || '');
        setAuthMode('login');
        setAuthPassword('');
        return;
      }

      setCurrentUser(data.user);
      finishAuthenticatedRedirect(nextPath);
    } catch {
      setAuthError('Erro de conexão');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSuccess = (payload: { nextPath: string }) => {
    void syncAuth();
    finishAuthenticatedRedirect(payload.nextPath);
  };

  const handleResendVerification = async () => {
    if (!pendingVerificationEmail) return;
    setResendingVerification(true);
    setAuthError('');
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingVerificationEmail }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        setAuthError(data.error || 'Falha ao reenviar verificação');
        return;
      }
      setAuthNotice(data.warning || data.message || 'Novo link emitido com sucesso.');
      setAuthDebugVerificationUrl(data.debugVerificationUrl || '');
    } catch {
      setAuthError('Erro de conexão');
    } finally {
      setResendingVerification(false);
    }
  };

  const handleForgotPassword = async () => {
    setAuthLoading(true);
    setAuthError('');
    setAuthNotice('');
    setAuthDebugResetUrl('');
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        setAuthError(data.error || 'Falha ao iniciar recuperação.');
        return;
      }
      setAuthNotice(data.warning || data.message || 'Se o email existir, enviaremos um link de redefinição.');
      setAuthDebugResetUrl(data.debugResetUrl || '');
    } catch {
      setAuthError('Erro de conexão');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken) {
      setAuthError('Link de redefinição inválido.');
      return;
    }
    if (resetPassword.length < 8) {
      setAuthError('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (resetPassword !== resetPasswordConfirm) {
      setAuthError('As senhas não coincidem.');
      return;
    }

    setResetLoading(true);
    setAuthError('');
    setAuthNotice('');
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword: resetPassword }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        setAuthError(data.error || 'Falha ao redefinir senha.');
        return;
      }
      if (data.user) {
        setCurrentUser(data.user);
      }
      setAuthNotice('Senha redefinida com sucesso.');
      finishAuthenticatedRedirect('/conta');
    } catch {
      setAuthError('Erro de conexão');
    } finally {
      setResetLoading(false);
    }
  };

  const handleProfileSave = async () => {
    setSavingProfile(true);
    setProfileError('');
    setProfileNotice('');
    try {
      const response = await fetch('/api/auth/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: profileDisplayName,
          masp: profileMasp || undefined,
          lotacao: profileLotacao || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        setProfileError(data.error || 'Falha ao atualizar perfil');
        return;
      }
      setCurrentUser(data.user);
      setProfileNotice(isOnboarding ? 'Perfil concluído com sucesso.' : 'Dados atualizados com sucesso.');
      window.dispatchEvent(new Event('852-auth-changed'));
      if (isOnboarding && nextPath !== '/conta') {
        router.push(nextPath);
        router.refresh();
      }
    } catch {
      setProfileError('Erro de conexão');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async () => {
    setSavingPassword(true);
    setPasswordError('');
    setPasswordNotice('');
    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        setPasswordError(data.error || 'Falha ao salvar senha');
        return;
      }
      setPasswordNotice('Senha atualizada com sucesso.');
      setCurrentPassword('');
      setNewPassword('');
      void syncAuth();
    } catch {
      setPasswordError('Erro de conexão');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.dispatchEvent(new Event('852-auth-changed'));
      router.push('/');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-neutral-950 px-4 py-16 text-neutral-300">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-neutral-950 px-4 py-8 sm:px-6 sm:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.14),_transparent_24%)]" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] border border-neutral-800 bg-neutral-900/55 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-900/40 bg-blue-950/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">
              <Shield className="h-3.5 w-3.5" />
              Conta protegida
            </div>
            <h1 className="mt-5 text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Entre rápido, continue anônimo, sincronize quando quiser.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-400 sm:text-base">
              O acesso com Google reduz atrito, o email e senha continuam disponíveis, e o codinome segue sendo sua identidade pública. Dados privados ficam reservados para autenticação, reputação e validação funcional.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Mais fluido</p>
                <p className="mt-2 text-sm font-medium text-white">Google entra em segundos no desktop e no mobile.</p>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Mais seguro</p>
                <p className="mt-2 text-sm font-medium text-white">Senha local opcional, redefinição por link assinado e sessão protegida.</p>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Mais institucional</p>
                <p className="mt-2 text-sm font-medium text-white">MASP e lotação ficam privados, nickname e reputação seguem públicos.</p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-amber-900/40 bg-amber-950/20 p-5">
              <div className="flex items-center gap-2 text-amber-300">
                <Flame className="h-4 w-4" />
                <span className="text-sm font-medium">Por que criar conta no Tira-Voz</span>
              </div>
              <div className="mt-3 space-y-3 text-sm text-neutral-300">
                <p>Persistência de histórico, relatórios e reputação entre dispositivos.</p>
                <p>Entrada híbrida: Google para rapidez, senha local para contingência.</p>
                <p>Onboarding guiado para definir codinome e liberar validação institucional.</p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-neutral-800 bg-neutral-900/75 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">Acesso</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {authMode === 'register'
                    ? 'Criar conta'
                    : authMode === 'forgot'
                      ? 'Recuperar senha'
                      : authMode === 'reset'
                        ? 'Nova senha'
                        : 'Entrar'}
                </h2>
                <p className="mt-2 text-sm text-neutral-400">
                  {authMode === 'register'
                    ? 'Cadastre email, senha e codinome para ativar persistência e reputação.'
                    : authMode === 'forgot'
                      ? 'Informe seu email e enviaremos um link seguro para redefinir sua senha.'
                      : authMode === 'reset'
                        ? 'Crie uma nova senha para voltar a entrar com email quando quiser.'
                        : 'Use Google ou email e senha para retomar sua conta.'}
                </p>
              </div>
              <div className="rounded-2xl bg-neutral-950/80 p-3">
                <User className="h-5 w-5 text-neutral-200" />
              </div>
            </div>

            {authMode !== 'reset' ? (
              <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-1.5 text-xs font-medium text-neutral-400">
                <button onClick={() => setAuthMode('login')} className={`rounded-xl px-3 py-2 transition ${authMode === 'login' ? 'bg-white text-neutral-950' : 'hover:bg-neutral-900 hover:text-white'}`}>Entrar</button>
                <button onClick={() => setAuthMode('register')} className={`rounded-xl px-3 py-2 transition ${authMode === 'register' ? 'bg-amber-500 text-black' : 'hover:bg-neutral-900 hover:text-white'}`}>Criar conta</button>
                <button onClick={() => setAuthMode('forgot')} className={`rounded-xl px-3 py-2 transition ${authMode === 'forgot' ? 'bg-blue-600 text-white' : 'hover:bg-neutral-900 hover:text-white'}`}>Recuperar</button>
              </div>
            ) : null}

            <div className="mt-6 space-y-4">
              {authError ? <div className="rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">{authError}</div> : null}
              {authNotice ? <div className="rounded-2xl border border-blue-900/50 bg-blue-950/30 px-4 py-3 text-sm text-blue-200">{authNotice}</div> : null}

              {pendingVerificationEmail ? (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 px-4 py-4 text-sm text-neutral-300">
                  <p>Email pendente: <span className="font-medium text-white">{pendingVerificationEmail}</span></p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      onClick={handleResendVerification}
                      disabled={resendingVerification}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-neutral-700 px-4 text-sm text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800 disabled:opacity-60"
                    >
                      {resendingVerification ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Reenviar verificação
                    </button>
                    {authDebugVerificationUrl ? <a href={authDebugVerificationUrl} className="inline-flex items-center text-xs text-blue-400 hover:text-blue-300">Abrir link local</a> : null}
                  </div>
                </div>
              ) : null}

              {authDebugResetUrl ? (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 px-4 py-3 text-sm text-neutral-300">
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Ambiente local</p>
                  <a href={authDebugResetUrl} className="mt-2 block break-all text-blue-400 hover:text-blue-300">{authDebugResetUrl}</a>
                </div>
              ) : null}

              {authMode === 'reset' ? (
                <div className="space-y-3">
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={resetPassword}
                    onChange={(event) => setResetPassword(event.target.value)}
                    placeholder="Nova senha"
                    className="h-12 w-full rounded-2xl border border-neutral-800 bg-neutral-950/80 px-4 text-sm text-white outline-none transition focus:border-blue-700"
                  />
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={resetPasswordConfirm}
                    onChange={(event) => setResetPasswordConfirm(event.target.value)}
                    placeholder="Confirme a nova senha"
                    className="h-12 w-full rounded-2xl border border-neutral-800 bg-neutral-950/80 px-4 text-sm text-white outline-none transition focus:border-blue-700"
                  />
                  <button
                    onClick={handleResetPassword}
                    disabled={resetLoading || resetPassword.length < 8 || resetPasswordConfirm.length < 8}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500"
                  >
                    {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    Salvar nova senha
                  </button>
                  <button onClick={() => setAuthMode('login')} className="w-full text-center text-sm text-neutral-500 transition hover:text-white">
                    Voltar para entrada
                  </button>
                </div>
              ) : (
                <>
                  <GoogleIdentityButton
                    mode={authMode === 'register' ? 'register' : 'login'}
                    nextPath={nextPath}
                    onSuccess={handleGoogleSuccess}
                    onError={setAuthError}
                  />

                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-800" /></div>
                    <div className="relative flex justify-center"><span className="bg-neutral-900 px-3 text-xs text-neutral-500">ou continue com email</span></div>
                  </div>

                  {authMode === 'register' ? (
                    <div className="space-y-3 rounded-3xl border border-neutral-800 bg-neutral-950/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">Codinome</label>
                        <button onClick={() => void generateNickname('register')} className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                          <RefreshCw className="h-3 w-3" /> Gerar outro
                        </button>
                      </div>
                      <input
                        value={registerNickname}
                        onChange={(event) => setRegisterNickname(event.target.value)}
                        placeholder="Ex: Falcão Tático"
                        className="h-11 w-full rounded-2xl border border-neutral-800 bg-neutral-900 px-4 text-sm text-white outline-none transition focus:border-blue-700"
                      />
                      <input
                        value={registerMasp}
                        onChange={(event) => setRegisterMasp(event.target.value)}
                        placeholder="MASP opcional (8 dígitos)"
                        className="h-11 w-full rounded-2xl border border-neutral-800 bg-neutral-900 px-4 text-sm text-white outline-none transition focus:border-blue-700"
                      />
                      <input
                        value={registerLotacao}
                        onChange={(event) => setRegisterLotacao(event.target.value)}
                        placeholder="Lotação opcional"
                        className="h-11 w-full rounded-2xl border border-neutral-800 bg-neutral-900 px-4 text-sm text-white outline-none transition focus:border-blue-700"
                      />
                      <p className="text-xs leading-relaxed text-neutral-500">Seu codinome é público. Email, MASP e lotação nunca aparecem nos relatos.</p>
                    </div>
                  ) : null}

                  <input
                    type="email"
                    autoComplete="email"
                    name="email"
                    value={authEmail}
                    onChange={(event) => setAuthEmail(event.target.value)}
                    placeholder="Seu email institucional ou pessoal"
                    className="h-12 w-full rounded-2xl border border-neutral-800 bg-neutral-950/80 px-4 text-sm text-white outline-none transition focus:border-blue-700"
                  />

                  {authMode !== 'forgot' ? (
                    <input
                      type="password"
                      autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                      name="password"
                      value={authPassword}
                      onChange={(event) => setAuthPassword(event.target.value)}
                      placeholder="Sua senha"
                      className="h-12 w-full rounded-2xl border border-neutral-800 bg-neutral-950/80 px-4 text-sm text-white outline-none transition focus:border-blue-700"
                    />
                  ) : null}

                  <button
                    onClick={authMode === 'forgot' ? handleForgotPassword : handleAuth}
                    disabled={authLoading || !authEmail || (authMode !== 'forgot' && !authPassword) || (authMode === 'register' && !registerNickname.trim())}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500"
                  >
                    {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    {authMode === 'register' ? 'Criar conta' : authMode === 'forgot' ? 'Enviar link de recuperação' : 'Entrar com email'}
                  </button>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-500">
                    <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="transition hover:text-white">
                      {authMode === 'login' ? 'Ainda não tem conta? Criar agora' : 'Já tem conta? Entrar'}
                    </button>
                    {authMode === 'login' ? <button onClick={() => setAuthMode('forgot')} className="transition hover:text-white">Esqueci minha senha</button> : null}
                  </div>
                </>
              )}

              <p className="text-center text-xs leading-relaxed text-neutral-500">
                O chat continua anônimo. A conta existe para persistência, nickname, continuidade e validação institucional quando você quiser liberar recursos adicionais.
              </p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-neutral-950 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <section className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">Conta</p>
              <h1 className="text-3xl font-semibold text-white">{displayName}</h1>
              <p className="max-w-2xl text-sm leading-relaxed text-neutral-400">
                Seu nickname é a identidade pública. Email, MASP e lotação ficam privados e só servem para autenticação, sincronização e validação funcional.
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-neutral-700 px-5 text-sm font-medium text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800 disabled:opacity-60"
            >
              {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              Sair
            </button>
          </div>
        </section>

        {isOnboarding ? (
          <section className="rounded-3xl border border-amber-800/50 bg-amber-950/20 p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-amber-900/30 p-3"><Shield className="h-5 w-5 text-amber-300" /></div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-white">Complete sua identidade protegida</h2>
                <p className="text-sm text-neutral-300">Quem entra com Google precisa concluir o nickname e pode informar MASP/lotação para iniciar a validação do perfil.</p>
                <p className="text-sm text-neutral-500">Sem nickname, o perfil não fica utilizável. Sem MASP validado, recursos restritos continuam bloqueados.</p>
              </div>
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-950/40 p-3"><Shield className="h-5 w-5 text-emerald-300" /></div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Identidade protegida</h2>
                  <p className="text-sm text-neutral-400">Gestão do perfil público-anônimo e dos dados privados.</p>
                </div>
              </div>
              <button onClick={() => void generateNickname('profile')} className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 px-3 py-2 text-xs text-neutral-200 hover:border-neutral-500 hover:bg-neutral-800">
                <RefreshCw className="h-3.5 w-3.5" /> Gerar codinome
              </button>
            </div>

            {profileError && <div className="rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">{profileError}</div>}
            {profileNotice && <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">{profileNotice}</div>}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-neutral-500">Codinome público</label>
                <input
                  value={profileDisplayName}
                  onChange={(event) => setProfileDisplayName(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-neutral-800 bg-neutral-950/60 px-4 text-sm text-white outline-none transition focus:border-blue-700"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-neutral-500">Email</label>
                <div className="flex h-12 items-center rounded-2xl border border-neutral-800 bg-neutral-950/60 px-4 text-sm text-white">{currentUser.email}</div>
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-neutral-500">Provedor</label>
                <div className="flex h-12 items-center rounded-2xl border border-neutral-800 bg-neutral-950/60 px-4 text-sm text-white">{currentUser.auth_provider || 'password'}</div>
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-neutral-500">MASP</label>
                <input
                  value={profileMasp}
                  onChange={(event) => setProfileMasp(event.target.value)}
                  placeholder="Ex: 12571402"
                  className="h-12 w-full rounded-2xl border border-neutral-800 bg-neutral-950/60 px-4 text-sm text-white outline-none transition focus:border-blue-700"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-neutral-500">Lotação</label>
                <input
                  value={profileLotacao}
                  onChange={(event) => setProfileLotacao(event.target.value)}
                  placeholder="Ex: 1ª DPCAMI BH"
                  className="h-12 w-full rounded-2xl border border-neutral-800 bg-neutral-950/60 px-4 text-sm text-white outline-none transition focus:border-blue-700"
                />
              </div>
            </div>

            <button
              onClick={handleProfileSave}
              disabled={savingProfile || !profileDisplayName.trim()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500"
            >
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Salvar perfil
            </button>
          </section>

          <section className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8 space-y-5">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
              <div className="flex items-center gap-2 text-neutral-300">
                <BadgeCheck className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium">Status institucional</span>
              </div>
              <p className="mt-2 text-sm text-white">{getValidationLabel(currentUser.validation_status)}</p>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">Voto e acompanhamento nas pautas públicas dependem de MASP validado. Enquanto isso, o chat e os relatos seguem anônimos.</p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
              <div className="flex items-center gap-2 text-neutral-300">
                <Mail className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium">Verificação de email</span>
              </div>
              <p className="mt-2 text-sm text-white">{currentUser.email_verified_at ? 'Confirmado' : 'Pendente'}</p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
              <div className="flex items-center gap-2 text-neutral-300">
                <Trophy className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium">Reputação</span>
              </div>
              <p className="mt-2 text-sm text-white">{currentUser.reputation_points || 0} pontos</p>
            </div>

            <div id="configuracoes" className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
              <div className="flex items-center gap-2 text-neutral-300">
                <Waypoints className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium">Senha e acesso</span>
              </div>
              {passwordError && <p className="text-sm text-red-300">{passwordError}</p>}
              {passwordNotice && <p className="text-sm text-emerald-300">{passwordNotice}</p>}
              {currentUser.has_password ? (
                <input
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Senha atual"
                  className="h-11 w-full rounded-2xl border border-neutral-800 bg-neutral-900 px-4 text-sm text-white outline-none transition focus:border-blue-700"
                />
              ) : (
                <p className="text-xs leading-relaxed text-neutral-500">Sua conta entrou via Google e ainda não tem senha local. Defina uma senha para poder entrar também por email.</p>
              )}
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder={currentUser.has_password ? 'Nova senha' : 'Definir senha'}
                className="h-11 w-full rounded-2xl border border-neutral-800 bg-neutral-900 px-4 text-sm text-white outline-none transition focus:border-blue-700"
              />
              <button
                onClick={handlePasswordSave}
                disabled={savingPassword || newPassword.length < 8}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-neutral-700 px-4 text-sm font-medium text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800 disabled:opacity-60"
              >
                {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {currentUser.has_password ? 'Atualizar senha' : 'Definir senha'}
              </button>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 text-sm text-neutral-400">
              <p>Você pode continuar usando o chat anonimamente em <Link href="/chat" className="text-blue-400 hover:text-blue-300">/chat</Link>.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
