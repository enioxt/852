'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { Suspense, useRef, useEffect, useState, useCallback } from 'react';
import { Send, Menu, Home } from 'lucide-react';
import Sidebar from '@/components/chat/Sidebar';
import FAQModal from '@/components/chat/FAQModal';
import ReportReview from '@/components/chat/ReportReview';
import WelcomeScreen from '@/components/chat/WelcomeScreen';
import MessageList, { getMessageText } from '@/components/chat/MessageList';
import ChatInputArea from '@/components/chat/ChatInputArea';
import ExportMenu, { ShareWhatsAppButton } from '@/components/chat/ExportMenu';
import {
  getConversation, createConversation, listConversations,
  updateConversation, generateTitle, type Conversation, type StoredMessage,
  getConversationServerId, setConversationServerId, upsertConversation
} from '@/lib/chat-store';
import { getClientConversationId, getIdentityKey, getOrCreateSessionHash } from '@/lib/session';

function toChatMessages(storedMessages: StoredMessage[]) {
  return storedMessages.map((message) => ({
    id: message.id,
    role: message.role as 'user' | 'assistant',
    content: message.content,
    parts: [{ type: 'text' as const, text: message.content }],
    createdAt: new Date(message.createdAt || Date.now()),
  }));
}

interface ServerConversationResponse {
  id: string;
  title: string | null;
  messages: StoredMessage[];
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown> | null;
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 min-h-0 items-center justify-center bg-neutral-950 text-neutral-400">Carregando chat...</div>}>
      <ChatPageClient />
    </Suspense>
  );
}

function ChatPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authIntent = searchParams.get('auth') === 'register' ? 'register' : searchParams.get('auth') === 'login' ? 'login' : null;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showFAQ, setShowFAQ] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showReportReview, setShowReportReview] = useState(false);
  const [sessionHash] = useState<string>(() => (typeof window === 'undefined' ? '' : getOrCreateSessionHash()));
  const [serverConversationId, setServerConversationId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabaseIdRef = useRef<string | null>(null);
  const previousScopeRef = useRef<string | null>(null);
  const conversationScope = getIdentityKey(sessionHash || null, currentUserId) || undefined;

  const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading, error, setInput } = useChat({
    api: '/api/chat',
    streamProtocol: 'text',
    headers: sessionHash ? { 'x-session-hash': sessionHash } : undefined,
    onError: (err) => {
      console.error('[852-chat] useChat error:', err.message, err);
    },
    onFinish: () => {
      // persist after AI responds
    },
  });

  // Auto-resize textarea
  const adjustTextarea = useCallback(() => {
    const el = inputRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }
  }, []);

  useEffect(() => { adjustTextarea(); }, [input, adjustTextarea]);

  useEffect(() => {
    if (!authIntent) return;
    router.replace(`/conta?auth=${authIntent}&next=/chat`);
  }, [authIntent, router]);

  useEffect(() => {
    const syncAuth = () => {
      fetch('/api/auth/me')
        .then(r => r.json())
        .then(d => setCurrentUserId(d.user?.id || null))
        .catch(() => setCurrentUserId(null));
    };

    syncAuth();
    window.addEventListener('852-auth-changed', syncAuth);
    return () => window.removeEventListener('852-auth-changed', syncAuth);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadConversationIntoChat = useCallback((conversation: {
    id: string;
    serverId?: string;
    messages: StoredMessage[];
  }) => {
    supabaseIdRef.current = conversation.serverId || null;
    setServerConversationId(conversation.serverId || null);
    setActiveConvId(conversation.id);
    setMessages(toChatMessages(conversation.messages));
  }, [setMessages]);

  const clearActiveConversation = useCallback(() => {
    supabaseIdRef.current = null;
    setServerConversationId(null);
    setActiveConvId(null);
    setMessages([]);
  }, [setMessages]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    const previousScope = previousScopeRef.current;
    if (previousScope === conversationScope) return;

    const storedMessages: StoredMessage[] = messages.map(m => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: getMessageText(m),
      createdAt: m.createdAt instanceof Date ? m.createdAt.getTime() : Date.now(),
    }));

    if (previousScope && activeConvId && storedMessages.length > 0) {
      const previousConversation = getConversation(activeConvId, previousScope);
      const preservedConversation = {
        id: activeConvId,
        serverId: supabaseIdRef.current || previousConversation?.serverId,
        title: previousConversation?.title || generateTitle(storedMessages[0].content),
        messages: storedMessages,
        createdAt: previousConversation?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      upsertConversation(preservedConversation, previousScope);
      if (conversationScope) upsertConversation(preservedConversation, conversationScope);
    }

    previousScopeRef.current = conversationScope || null;

    const scopedActiveConversation = activeConvId && conversationScope
      ? getConversation(activeConvId, conversationScope)
      : null;

    if (scopedActiveConversation) {
      queueMicrotask(() => loadConversationIntoChat(scopedActiveConversation));
      return;
    }

    queueMicrotask(clearActiveConversation);
  }, [activeConvId, clearActiveConversation, conversationScope, loadConversationIntoChat, messages]);

  useEffect(() => {
    if (!sessionHash) return;

    const loadServerConversations = async () => {
      try {
        const res = await fetch(`/api/conversations?sessionHash=${encodeURIComponent(sessionHash)}`);
        if (!res.ok) return;
        const data = await res.json();
        const serverConversations = Array.isArray(data.conversations) ? data.conversations : [];
        const mapped: Conversation[] = serverConversations.map((conversation: ServerConversationResponse) => ({
          id: getClientConversationId(conversation.metadata, conversation.id) || conversation.id,
          serverId: conversation.id,
          title: conversation.title || 'Nova conversa',
          messages: Array.isArray(conversation.messages)
            ? conversation.messages.map((message) => ({
                id: message.id || crypto.randomUUID(),
                role: message.role,
                content: message.content,
                createdAt: message.createdAt,
              }))
            : [],
          createdAt: new Date(conversation.created_at).getTime(),
          updatedAt: new Date(conversation.updated_at).getTime(),
        }));

        mapped.forEach((conversation: Conversation) => upsertConversation(conversation, conversationScope));

        const scopedActiveConversation = activeConvId && conversationScope
          ? getConversation(activeConvId, conversationScope)
          : null;

        if (!scopedActiveConversation && mapped.length > 0) return;
      } catch (loadError) {
        console.error('[852-chat] failed to hydrate conversations:', loadError instanceof Error ? loadError.message : 'Unknown');
      }
    };

    void loadServerConversations();
  }, [activeConvId, conversationScope, loadConversationIntoChat, sessionHash]);

  // Persist messages to localStorage + background Supabase sync
  useEffect(() => {
    if (messages.length === 0 || !activeConvId || !sessionHash) return;
    const stored: StoredMessage[] = messages.map(m => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: getMessageText(m),
    }));
    const title = stored.length > 0 ? generateTitle(stored[0].content) : 'Nova conversa';
    updateConversation(activeConvId, stored, title, conversationScope);

    // Background Supabase sync (fire-and-forget)
    const syncToSupabase = async () => {
      try {
        await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: stored.map(m => ({ role: m.role, content: m.content })),
            title,
            sessionHash,
            clientConversationId: activeConvId,
            existingId: getConversationServerId(activeConvId, conversationScope) || supabaseIdRef.current,
          }),
        }).then(r => r.json()).then(d => {
          if (d.id) {
            supabaseIdRef.current = d.id;
            setConversationServerId(activeConvId, d.id, conversationScope);
          }
        });
      } catch (syncError) {
        console.error('[852-chat] failed to sync conversation:', syncError instanceof Error ? syncError.message : 'Unknown');
      }
    };
    syncToSupabase();
  }, [messages, activeConvId, conversationScope, sessionHash]);

  const handleNewConversation = useCallback(() => {
    supabaseIdRef.current = null;
    setServerConversationId(null);
    setActiveConvId(null);
    setMessages([]);
    setInput('');
    inputRef.current?.focus();
  }, [setMessages, setInput]);

  const handleSelectConversation = useCallback((id: string) => {
    const conv = getConversation(id, conversationScope);
    if (!conv) return;
    loadConversationIntoChat(conv);
  }, [conversationScope, loadConversationIntoChat]);

  const handleQuickAction = (prompt: string) => {
    if (!activeConvId) {
      const conv = createConversation(undefined, conversationScope);
      setActiveConvId(conv.id);
    }
    setInput(prompt);
    inputRef.current?.focus();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (!activeConvId) {
      const conv = createConversation(undefined, conversationScope);
      setActiveConvId(conv.id);
    }
    handleSubmit(e);
  };

  const copyMessage = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (authIntent) {
    return <div className="flex flex-1 min-h-0 items-center justify-center bg-neutral-950 text-neutral-400">Redirecionando para a conta...</div>;
  }

  return (
    <div
      className="flex min-h-0 flex-1 bg-neutral-950 text-neutral-200 font-[family-name:var(--font-geist-sans)]"
      style={{
        backgroundImage: "linear-gradient(to bottom, rgba(10,10,10,0.95), rgba(10,10,10,0.98)), url('/brand/bg-pattern.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'fixed inset-y-0 left-0 z-40 md:relative md:z-auto' : 'hidden md:block'}`}>
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeConversationId={activeConvId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onShowFAQ={() => setShowFAQ(true)}
      />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-4 h-14 border-b border-neutral-800/50 bg-neutral-950 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition md:hidden"
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/" className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition" title="Página inicial">
              <Home className="w-4 h-4" />
            </Link>
            <h1 className="text-sm font-semibold text-white">{activeConvId ? 'Conversa em andamento' : 'Novo chat'}</h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/40 text-green-400 font-medium">Identidade protegida</span>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <ExportMenu
                messages={messages}
                showExport={showExport}
                onToggleExport={() => setShowExport(!showExport)}
              />
            )}
            {messages.length >= 2 && (
              <button
                onClick={() => setShowReportReview(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-green-400 hover:text-green-300 hover:bg-green-900/20 transition border border-green-800/30"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Enviar Relatório</span>
              </button>
            )}
            <ShareWhatsAppButton />
          </div>
        </header>

        {messages.length > 0 && (
          <div className="px-4 py-2 border-b border-neutral-800/50 bg-neutral-950/70 text-[11px] text-neutral-500">
            Nada é compartilhado automaticamente. Use <span className="text-white">Enviar Relatório</span> para revisar, aplicar filtros e só então publicar o conteúdo final.
          </div>
        )}

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <WelcomeScreen onQuickAction={handleQuickAction} />
          ) : (
            <MessageList
              messages={messages}
              isLoading={isLoading}
              error={error}
              copiedId={copiedId}
              onCopy={copyMessage}
              messagesEndRef={messagesEndRef}
            />
          )}
        </main>

        {/* Input Area */}
        <ChatInputArea
          input={input}
          onInputChange={handleInputChange}
          onSubmit={handleFormSubmit}
          isLoading={isLoading}
          inputRef={inputRef}
        />
      </div>

      {/* FAQ Modal */}
      {showFAQ && <FAQModal onClose={() => setShowFAQ(false)} />}

      {/* Report Review Modal */}
      {showReportReview && activeConvId && (
        <ReportReview
          messages={messages.map(m => ({ role: m.role, content: getMessageText(m) }))}
          conversationId={activeConvId}
          serverConversationId={serverConversationId}
          sessionHash={sessionHash}
          onClose={() => setShowReportReview(false)}
          onSuggestionClick={(suggestion, reviewSummary) => {
            setShowReportReview(false);
            // Inject AI analysis as an assistant message so nothing is lost
            if (reviewSummary) {
              const analysisMsg = {
                id: `review-${Date.now()}`,
                role: 'assistant' as const,
                content: reviewSummary,
                parts: [{ type: 'text' as const, text: reviewSummary }],
                createdAt: new Date(),
              };
              setMessages(prev => [...prev, analysisMsg]);
            }
            setInput(suggestion);
            inputRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}
