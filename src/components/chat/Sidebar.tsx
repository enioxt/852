'use client';

import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import { MessageSquarePlus, PanelLeftClose, PanelLeft, Trash2, HelpCircle, Clock, Home, FileText, AlertCircle, User, LogOut, Loader2 } from 'lucide-react';
import { listConversations, deleteConversation, type Conversation } from '@/lib/chat-store';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onShowFAQ: () => void;
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

export default function Sidebar({ isOpen, onToggle, activeConversationId, onSelectConversation, onNewConversation, onShowFAQ }: SidebarProps) {
  const [, forceRefresh] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; displayName?: string } | null>(null);

  // Check auth on mount
  useState(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setCurrentUser(d.user); }).catch(() => {});
  });

  const handleAuth = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = authMode === 'login'
        ? { email: authEmail, password: authPassword }
        : { email: authEmail, password: authPassword, displayName: authName };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) { setAuthError(data.error); return; }
      setCurrentUser(data.user);
      setShowAuth(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
    } catch { setAuthError('Erro de conexão'); }
    finally { setAuthLoading(false); }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
  };

  const conversations: Conversation[] = listConversations();

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteConversation(id);
    forceRefresh(current => current + 1);
    if (id === activeConversationId) {
      onNewConversation();
    }
  };

  return (
    <aside
      className={`flex flex-col h-full bg-neutral-900 border-r border-neutral-800 transition-all duration-300 ease-in-out ${
        isOpen ? 'w-[280px] min-w-[280px]' : 'w-[60px] min-w-[60px]'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'} p-3 h-14`}>
        {isOpen && (
          <div className="flex items-center gap-2 min-w-0">
            <Image src="/brand/logo-852.png" alt="852" width={28} height={28} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
            <span className="text-sm font-semibold text-white truncate">852</span>
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
            ${isOpen ? 'px-3 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white' : 'justify-center p-2.5 hover:bg-neutral-800 text-neutral-400 hover:text-white'}`}
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
              Login opcional para sincronizar conversas entre dispositivos.
            </p>
            {authMode === 'register' && (
              <input
                value={authName}
                onChange={e => setAuthName(e.target.value)}
                placeholder="Nome (opcional)"
                className="w-full h-9 px-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-700"
              />
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
            <button
              onClick={handleAuth}
              disabled={authLoading || !authEmail || !authPassword}
              className="w-full h-9 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white text-xs font-medium rounded-lg transition flex items-center justify-center gap-2"
            >
              {authLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {authMode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
            <button
              onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
              className="w-full text-[10px] text-neutral-500 hover:text-white transition"
            >
              {authMode === 'login' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
            </button>
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
                <span className="text-[10px] text-neutral-300 truncate">{currentUser.displayName || currentUser.email}</span>
                <button onClick={handleLogout} className="p-1 rounded text-neutral-500 hover:text-red-400 transition" title="Sair">
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => { setShowAuth(true); setAuthMode('login'); }}
            className={`flex items-center gap-2 w-full rounded-lg text-neutral-500 hover:text-blue-400 hover:bg-neutral-800 transition
              ${isOpen ? 'px-3 py-2 text-xs' : 'justify-center p-2'}`}
            title="Entrar / Criar conta"
          >
            <User className="w-4 h-4 flex-shrink-0" />
            {isOpen && <span>Entrar (opcional)</span>}
          </button>
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
