'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquarePlus, PanelLeftClose, PanelLeft, Trash2, HelpCircle, Clock, Home, FileText, AlertCircle, User, LogOut, Loader2, RefreshCw, Shield, Trophy, PenLine, Radio } from 'lucide-react';
import { listConversations, deleteConversation, type Conversation } from '@/lib/chat-store';
import { getIdentityKey, getOrCreateSessionHash } from '@/lib/session';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onShowFAQ: () => void;
  requestedAuthMode?: 'login' | 'register' | null;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function normalizeMaspInput(value: string) {
  return value.replace(/\D/g, '').slice(0, 8);
}

export default function Sidebar({ isOpen, onToggle, activeConversationId, onSelectConversation, onNewConversation, onShowFAQ, requestedAuthMode = null }: SidebarProps) {
  const [, forceRefresh] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(requestedAuthMode !== null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>(requestedAuthMode ?? 'login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authNickname, setAuthNickname] = useState('');
  const [authNicknameMode, setAuthNicknameMode] = useState<'generated' | 'custom'>('generated');
  const [nicknameValidating, setNicknameValidating] = useState(false);
  const [nicknameError, setNicknameError] = useState('');
  const [authMasp, setAuthMasp] = useState('');
  const [authLotacao, setAuthLotacao] = useState('');
  const [showMaspFields, setShowMaspFields] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authResendLoading, setAuthResendLoading] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const [authDebugVerificationUrl, setAuthDebugVerificationUrl] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; display_name?: string; displayName?: string; masp?: string; lotacao?: string; validation_status?: string; email_verified_at?: string | null; reputation_points?: number } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setCurrentUser(d.user); }).catch(() => { });
  }, []);

  useEffect(() => {
    if (!showAuth || authMode !== 'register' || authNickname.trim()) return;

    fetch('/api/auth/generate-nickname')
      .then(r => r.json())
      .then(d => {
        if (d.nicknames?.[0]) setAuthNickname(d.nicknames[0]);
      })
      .catch(() => {});
  }, [authMode, authNickname, showAuth]);

  const handleAuth = async () => {
    setAuthError('');
    setAuthNotice('');
    setAuthDebugVerificationUrl('');
    setNicknameError('');
    setAuthLoading(true);
    try {
      // Validate custom nickname with AI before registering
      if (authMode === 'register' && authNicknameMode === 'custom' && authNickname.trim()) {
        setNicknameValidating(true);
        try {
          const valRes = await fetch('/api/auth/validate-name', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: authNickname.trim() }),
          });
          const valData = await valRes.json();
          if (!valData.valid) {
            setNicknameError(valData.reason || 'Nome inválido');
            if (valData.suggestions?.length) {
              setAuthNickname(valData.suggestions[0]);
              setAuthNicknameMode('generated');
            }
            setAuthLoading(false);
            setNicknameValidating(false);
            return;
          }
        } catch { /* AI down, allow */ }
        setNicknameValidating(false);
      }

      if (authMode === 'register' && !authNickname.trim()) {
        setNicknameError('Codinome obrigatório');
        setAuthLoading(false);
        return;
      }

      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = authMode === 'login'
        ? { email: authEmail, password: authPassword }
        : { email: authEmail, password: authPassword, displayName: authNickname.trim(), masp: authMasp || undefined, lotacao: authLotacao || undefined };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
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
        setAuthNotice(
          data.warning ||
          (data.verificationEmailSent
            ? 'Conta criada. Verifique seu email para ativar o acesso.'
            : 'Conta criada. Não foi possível enviar o email agora; você pode reenviar abaixo.')
        );
        setAuthDebugVerificationUrl(data.debugVerificationUrl || '');
        setAuthMode('login');
        setAuthPassword('');
        return;
      }
      setCurrentUser(data.user);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('852-auth-changed'));
      setShowAuth(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthNickname('');
      setAuthMasp('');
      setAuthLotacao('');
      setPendingVerificationEmail('');
      setAuthDebugVerificationUrl('');
    } catch { setAuthError('Erro de conexão'); }
    finally { setAuthLoading(false); }
  };

  const handleResendVerification = async () => {
    if (!pendingVerificationEmail) return;
    setAuthError('');
    setAuthNotice('');
    setAuthResendLoading(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingVerificationEmail }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setAuthError(data.error || 'Falha ao reenviar verificação');
        return;
      }
      setAuthNotice(data.warning || data.message || 'Novo link emitido com sucesso.');
      setAuthDebugVerificationUrl(data.debugVerificationUrl || '');
    } catch {
      setAuthError('Erro de conexão');
    } finally {
      setAuthResendLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('852-auth-changed'));
  };

  const conversationScope = getIdentityKey(typeof window === 'undefined' ? null : getOrCreateSessionHash(), currentUser?.id) || undefined;
  const conversations: Conversation[] = listConversations(conversationScope);
  const isDraftSelected = activeConversationId === null;

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteConversation(id, conversationScope);
    forceRefresh(current => current + 1);
    if (id === activeConversationId) {
      onNewConversation();
    }
  };

  return (
    <aside
      className={`flex flex-col h-full bg-neutral-900 border-r border-neutral-800 transition-all duration-300 ease-in-out ${isOpen ? 'w-[280px] min-w-[280px]' : 'w-[60px] min-w-[60px]'
        }`}
    >
      {/* Header */}
      <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'} p-3 h-14`}>
        {isOpen && (
          <div className="flex items-center gap-2 min-w-0">
            <Image src="/brand/logo-852.png" alt="Tira-Voz" width={28} height={28} className="w-7 h-7 rounded-lg object-contain bg-neutral-950/70 p-0.5 flex-shrink-0" />
            <span className="text-sm font-semibold text-white truncate">Tira-Voz</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          title={isOpen ? 'Recolher' : 'Expandir'}
        >
          {isOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 mb-2">
        <button
          onClick={onNewConversation}
          className={`flex items-center gap-2 w-full rounded-lg text-sm font-medium transition
            ${isOpen
              ? isDraftSelected
                ? 'px-3 py-2.5 bg-neutral-800 text-white'
                : 'px-3 py-2.5 text-neutral-300 hover:bg-neutral-800 hover:text-white'
              : 'justify-center p-2.5 hover:bg-neutral-800 text-neutral-400 hover:text-white'}`}
          title="Nova conversa"
        >
          <MessageSquarePlus className="w-4 h-4 flex-shrink-0" />
          {isOpen && <span>Nova conversa</span>}
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2">
        {isOpen && conversations.length > 0 && (
          <div className="px-1 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Histórico</span>
          </div>
        )}
        {conversations.map(conv => (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            onMouseEnter={() => setHoveredId(conv.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`flex items-center w-full rounded-lg mb-0.5 transition group
              ${isOpen ? 'px-3 py-2' : 'justify-center p-2'}
              ${conv.id === activeConversationId
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
              }`}
            title={conv.title}
          >
            {isOpen ? (
              <div className="flex items-center justify-between w-full min-w-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs truncate text-left">{conv.title}</p>
                  <p className="text-[10px] text-neutral-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {timeAgo(conv.updatedAt)}
                  </p>
                </div>
                {hoveredId === conv.id && (
                  <button
                    onClick={(e) => handleDelete(e, conv.id)}
                    className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-700 ml-1 flex-shrink-0"
                    title="Excluir"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : (
              <div className="w-2 h-2 rounded-full bg-current opacity-60" />
            )}
          </button>
        ))}
      </div>

      {/* Auth Modal (overlay inside sidebar) */}
      {showAuth && isOpen && (
        <div className="px-3 pb-3 border-t border-neutral-800">
          <div className="bg-neutral-950 rounded-xl p-4 space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white">
                {authMode === 'login' ? 'Entrar' : 'Criar conta'}
              </h3>
              <button onClick={() => setShowAuth(false)} className="text-neutral-500 hover:text-white text-xs">✕</button>
            </div>
            <p className="text-[10px] text-neutral-500 leading-relaxed">
              {authMode === 'login' ? 'Entre para vincular seu histórico local e continuar com sua identidade protegida.' : 'Você pode começar anônimo agora e vincular sua identidade protegida depois.'}
            </p>
            {authMode === 'register' && (
              <>
                <div className="rounded-lg border border-blue-900/40 bg-blue-950/20 px-3 py-2 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider">Identidade anônima</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-relaxed">
                    Seu email nunca é exibido publicamente. Use um codinome e evite informar nome completo. Você pode relatar primeiro e vincular sua conta depois, no mesmo aparelho.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-neutral-500 font-medium">Seu codinome</label>
                  <div className="flex gap-1.5">
                    <input
                      value={authNickname}
                      onChange={e => { setAuthNickname(e.target.value); setNicknameError(''); }}
                      placeholder={authNicknameMode === 'generated' ? 'Gerando...' : 'Digite seu codinome'}
                      readOnly={authNicknameMode === 'generated'}
                      className={`flex-1 h-9 px-3 bg-neutral-900 border rounded-lg text-xs text-white placeholder:text-neutral-600 focus:outline-none transition ${
                        nicknameError ? 'border-red-700' : 'border-neutral-800 focus:border-blue-700'
                      } ${authNicknameMode === 'generated' ? 'text-blue-300 font-medium' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/auth/generate-nickname');
                          const data = await res.json();
                          if (data.nicknames?.[0]) {
                            setAuthNickname(data.nicknames[0]);
                            setAuthNicknameMode('generated');
                            setNicknameError('');
                          }
                        } catch { /* ignore */ }
                      }}
                      className="h-9 w-9 flex items-center justify-center border border-neutral-800 hover:border-blue-700 rounded-lg text-neutral-400 hover:text-blue-400 transition"
                      title="Gerar outro codinome"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {nicknameError && <p className="text-[10px] text-red-400">{nicknameError}</p>}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setAuthNicknameMode('generated'); fetch('/api/auth/generate-nickname').then(r => r.json()).then(d => { if (d.nicknames?.[0]) setAuthNickname(d.nicknames[0]); }).catch(() => {}); }}
                      className={`text-[9px] px-2 py-0.5 rounded transition ${authNicknameMode === 'generated' ? 'bg-blue-900/30 text-blue-400' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                      Gerado
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthNicknameMode('custom'); setAuthNickname(''); }}
                      className={`text-[9px] px-2 py-0.5 rounded transition ${authNicknameMode === 'custom' ? 'bg-blue-900/30 text-blue-400' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                      Personalizar
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMaspFields(!showMaspFields)}
                  className="w-full text-[10px] text-neutral-500 hover:text-neutral-300 text-left transition"
                >
                  {showMaspFields ? '▾ Ocultar dados institucionais opcionais' : '▸ Se quiser, adicione MASP e lotação para contextualizar sua atuação'}
                </button>
                {showMaspFields && (
                  <div className="space-y-2 pl-2 border-l-2 border-neutral-800">
                    <input
                      value={authMasp}
                      onChange={e => setAuthMasp(normalizeMaspInput(e.target.value))}
                      placeholder="MASP opcional, ex: 12571402"
                      inputMode="numeric"
                      maxLength={8}
                      className="w-full h-9 px-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-700"
                    />
                    <input
                      value={authLotacao}
                      onChange={e => setAuthLotacao(e.target.value)}
                      placeholder="Lotação atual (ex: 1ª DPCAMI BH)"
                      className="w-full h-9 px-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-700"
                    />
                    <p className="text-[9px] text-neutral-600">Aceita formatos como 1.257.140-2 ou 1257140-2 e converte para 12571402. MASP e lotação nunca são exibidos publicamente.</p>
                  </div>
                )}
              </>
            )}
            <input
              value={authEmail}
              onChange={e => setAuthEmail(e.target.value)}
              placeholder="Email"
              type="email"
              className="w-full h-9 px-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-700"
            />
            <input
              value={authPassword}
              onChange={e => setAuthPassword(e.target.value)}
              placeholder="Senha"
              type="password"
              className="w-full h-9 px-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-700"
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
            />
            {authError && <p className="text-[10px] text-red-400">{authError}</p>}
            {authNotice && <p className="text-[10px] text-blue-300 bg-blue-950/40 border border-blue-900/40 rounded-lg px-3 py-2">{authNotice}</p>}
            {pendingVerificationEmail && (
              <div className="space-y-2 rounded-lg border border-neutral-800 bg-neutral-900/70 px-3 py-3">
                <p className="text-[10px] text-neutral-400 leading-relaxed">
                  Email pendente: <span className="text-neutral-200">{pendingVerificationEmail}</span>
                </p>
                <button
                  onClick={handleResendVerification}
                  disabled={authResendLoading}
                  className="w-full h-9 border border-neutral-700 hover:border-blue-700 hover:text-white disabled:opacity-50 text-neutral-300 text-[11px] rounded-lg transition flex items-center justify-center gap-2"
                >
                  {authResendLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Reenviar email de verificação
                </button>
                {authDebugVerificationUrl && (
                  <a href={authDebugVerificationUrl} className="block text-[10px] text-blue-400 hover:text-blue-300 break-all">
                    Abrir link de verificação gerado neste ambiente
                  </a>
                )}
              </div>
            )}
            <button
              onClick={handleAuth}
              disabled={authLoading || nicknameValidating || !authEmail || !authPassword || (authMode === 'register' && !authNickname.trim())}
              className="w-full h-9 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white text-xs font-medium rounded-lg transition flex items-center justify-center gap-2"
            >
              {(authLoading || nicknameValidating) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {nicknameValidating ? 'Validando codinome...' : authMode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
            <button
              onClick={() => {
                const newMode = authMode === 'login' ? 'register' : 'login';
                setAuthMode(newMode);
                setAuthError('');
                setAuthNotice('');
                setAuthDebugVerificationUrl('');
                setNicknameError('');
                if (newMode === 'register') {
                  fetch('/api/auth/generate-nickname').then(r => r.json()).then(d => { if (d.nicknames?.[0]) setAuthNickname(d.nicknames[0]); }).catch(() => {});
                }
              }}
              className="w-full text-[10px] text-neutral-500 hover:text-white transition"
            >
              {authMode === 'login' ? 'Não tem conta? Criar identidade protegida' : 'Já tem conta? Entrar'}
            </button>
            {authMode === 'register' && (
              <p className="text-[9px] text-neutral-600 leading-relaxed">
                Seus relatos continuam privados neste aparelho até você decidir revisar, filtrar e compartilhar.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-neutral-800 space-y-1">
        {/* User status */}
        {currentUser ? (
          <div className={`flex items-center gap-2 rounded-lg mb-1 ${isOpen ? 'px-3 py-2' : 'justify-center p-2'}`}>
            <div className="w-6 h-6 rounded-full bg-blue-900/40 flex items-center justify-center flex-shrink-0">
              <User className="w-3 h-3 text-blue-400" />
            </div>
            {isOpen && (
              <div className="flex-1 min-w-0 flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-[10px] text-neutral-300 truncate block">{currentUser.display_name || currentUser.displayName || 'Anônimo'}</span>
                  <div className="flex items-center gap-1">
                    {currentUser.masp && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-blue-900/30 text-blue-400">
                        MASP informado
                      </span>
                    )}
                    {typeof currentUser.reputation_points === 'number' && currentUser.reputation_points > 0 && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-purple-900/30 text-purple-400 flex items-center gap-0.5">
                        <Trophy className="w-2.5 h-2.5" />{currentUser.reputation_points}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={handleLogout} className="p-1 rounded text-neutral-500 hover:text-red-400 transition ml-1" title="Sair">
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/conta?auth=login&next=/chat"
            className={`flex items-center gap-2 w-full rounded-lg text-neutral-500 hover:text-blue-400 hover:bg-neutral-800 transition
              ${isOpen ? 'px-3 py-2 text-xs' : 'justify-center p-2'}`}
            title="Entrar / Criar conta"
          >
            <User className="w-4 h-4 flex-shrink-0" />
            {isOpen && <span>Entrar / Criar conta</span>}
          </Link>
        )}

        <Link
          href="/"
          className={`flex items-center gap-2 w-full rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition
            ${isOpen ? 'px-3 py-2 text-xs' : 'justify-center p-2'}`}
          title="Página inicial"
        >
          <Home className="w-4 h-4 flex-shrink-0" />
          {isOpen && <span>Página Inicial</span>}
        </Link>
        <Link
          href="/reports"
          className={`flex items-center gap-2 w-full rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition
            ${isOpen ? 'px-3 py-2 text-xs' : 'justify-center p-2'}`}
          title="Relatórios"
        >
          <FileText className="w-4 h-4 flex-shrink-0" />
          {isOpen && <span>Relatórios</span>}
        </Link>
        <Link
          href="/sugestao"
          className={`flex items-center gap-2 w-full rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition
            ${isOpen ? 'px-3 py-2 text-xs' : 'justify-center p-2'}`}
          title="Sugestão direta"
        >
          <PenLine className="w-4 h-4 flex-shrink-0" />
          {isOpen && <span>Sugestão</span>}
        </Link>
        <Link
          href="/papo-de-corredor"
          className={`flex items-center gap-2 w-full rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition
            ${isOpen ? 'px-3 py-2 text-xs' : 'justify-center p-2'}`}
          title="Papo de Corredor"
        >
          <Radio className="w-4 h-4 flex-shrink-0" />
          {isOpen && <span>Corredor</span>}
        </Link>
        <Link
          href="/issues"
          className={`flex items-center gap-2 w-full rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition
            ${isOpen ? 'px-3 py-2 text-xs' : 'justify-center p-2'}`}
          title="Tópicos em discussão"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {isOpen && <span>Tópicos</span>}
        </Link>
        <button
          onClick={onShowFAQ}
          className={`flex items-center gap-2 w-full rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition
            ${isOpen ? 'px-3 py-2 text-xs' : 'justify-center p-2'}`}
          title="Perguntas frequentes"
        >
          <HelpCircle className="w-4 h-4 flex-shrink-0" />
          {isOpen && <span>Ajuda & FAQ</span>}
        </button>
      </div>
    </aside>
  );
}
