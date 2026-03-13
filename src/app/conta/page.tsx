'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Loader2, LogOut, Mail, RefreshCw, Shield, Trophy, User, Waypoints, Lock, BadgeCheck } from 'lucide-react';

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
  const requestedAuthMode = searchParams.get('auth') === 'register' ? 'register' : 'login';
  const nextPath = normalizeNextPath(searchParams.get('next'));
  const onboardingRequested = searchParams.get('onboarding') === '1';
  const initialError = getFriendlyAuthError(searchParams.get('error'));

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>(requestedAuthMode);
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
  const [resendingVerification, setResendingVerification] = useState(false);
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

  const handleAuth = async () => {
    setAuthLoading(true);
    setAuthError('');
    setAuthNotice('');
    setAuthDebugVerificationUrl('');
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
      window.dispatchEvent(new Event('852-auth-changed'));
      if (nextPath !== '/conta') router.push(nextPath);
      else router.replace('/conta');
      router.refresh();
    } catch {
      setAuthError('Erro de conexão');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = `/api/auth/google?mode=${authMode}&next=${encodeURIComponent(nextPath)}`;
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
      <div className="flex flex-1 items-center justify-center bg-neutral-950 px-4 py-10">
        <div className="w-full max-w-xl rounded-3xl border border-neutral-800 bg-neutral-900/70 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-neutral-800 p-3">
              <User className="h-5 w-5 text-neutral-200" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Conta protegida</h1>
              <p className="text-sm text-neutral-400">Entrada única para login, Google, onboarding, nickname e validação institucional.</p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => setAuthMode('login')}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${authMode === 'login' ? 'bg-neutral-100 text-neutral-950' : 'border border-neutral-700 text-neutral-200 hover:border-neutral-500 hover:bg-neutral-800'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => setAuthMode('register')}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${authMode === 'register' ? 'bg-amber-500 text-black' : 'border border-neutral-700 text-neutral-200 hover:border-neutral-500 hover:bg-neutral-800'}`}
            >
              Criar conta
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {authError && <div className="rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">{authError}</div>}
            {authNotice && <div className="rounded-2xl border border-blue-900/50 bg-blue-950/30 px-4 py-3 text-sm text-blue-200">{authNotice}</div>}
            {pendingVerificationEmail && (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 px-4 py-4 text-sm text-neutral-300 space-y-3">
                <p>Email pendente: <span className="text-white">{pendingVerificationEmail}</span></p>
                <button
                  onClick={handleResendVerification}
                  disabled={resendingVerification}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-neutral-700 px-4 text-sm text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800 disabled:opacity-60"
                >
                  {resendingVerification ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Reenviar verificação
                </button>
                {authDebugVerificationUrl ? (
                  <a href={authDebugVerificationUrl} className="block break-all text-xs text-blue-400 hover:text-blue-300">
                    Abrir link de verificação gerado neste ambiente
                  </a>
                ) : null}
              </div>
            )}

            <button
              onClick={handleGoogle}
              disabled={authLoading}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100 disabled:opacity-60"
            >
              {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Continuar com Google
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-800" /></div>
              <div className="relative flex justify-center"><span className="bg-neutral-900 px-3 text-xs text-neutral-500">ou use email e senha</span></div>
            </div>

            {authMode === 'register' && (
              <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs font-medium text-neutral-400">Codinome obrigatório</label>
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
                <p className="text-xs leading-relaxed text-neutral-500">Seu nickname é público. Email, MASP e lotação nunca aparecem nos relatos.</p>
              </div>
            )}

            <input
              type="email"
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
              placeholder="Seu email"
              className="h-12 w-full rounded-2xl border border-neutral-800 bg-neutral-900 px-4 text-sm text-white outline-none transition focus:border-blue-700"
            />
            <input
              type="password"
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
              placeholder="Sua senha"
              className="h-12 w-full rounded-2xl border border-neutral-800 bg-neutral-900 px-4 text-sm text-white outline-none transition focus:border-blue-700"
            />

            <button
              onClick={handleAuth}
              disabled={authLoading || !authEmail || !authPassword || (authMode === 'register' && !registerNickname.trim())}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500"
            >
              {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {authMode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>

            <p className="text-center text-xs text-neutral-500">
              O chat continua anônimo. A conta existe para persistência, nickname, continuidade e validação institucional quando você quiser desbloquear recursos restritos.
            </p>
          </div>
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
                  <p className="text-sm text-neutral-400">SSOT do perfil público-anônimo e dos dados privados.</p>
                </div>
              </div>
              <button onClick={() => void generateNickname('profile')} className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 px-3 py-2 text-xs text-neutral-200 hover:border-neutral-500 hover:bg-neutral-800">
                <RefreshCw className="h-3.5 w-3.5" /> Gerar nickname
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
              <p className="mt-2 text-xs leading-relaxed text-neutral-500">Voto e follow-up nas pautas públicas dependem de MASP validado. Enquanto isso, o chat e os relatos seguem anônimos.</p>
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
