'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquarePlus, PanelLeftClose, PanelLeft, Trash2, HelpCircle, Clock, Home, FileText, AlertCircle, User, LogOut, Trophy, PenLine, Radio } from 'lucide-react';
import { listConversations, deleteConversation, type Conversation } from '@/lib/chat-store';
import { getIdentityKey, getOrCreateSessionHash } from '@/lib/session';

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
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; display_name?: string; displayName?: string; masp?: string; lotacao?: string; validation_status?: string; email_verified_at?: string | null; reputation_points?: number } | null>(null);

  useEffect(() => {
    const syncAuth = () => {
      fetch('/api/auth/me', { cache: 'no-store' }).then(r => r.json()).then(d => setCurrentUser(d.user || null)).catch(() => setCurrentUser(null));
    };
    syncAuth();
    window.addEventListener('852-auth-changed', syncAuth);
    return () => window.removeEventListener('852-auth-changed', syncAuth);
  }, []);

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
          title="Tira-Voz Corredor"
        >
          <Radio className="w-4 h-4 flex-shrink-0" />
          {isOpen && <span>Corredor / Hub</span>}
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
