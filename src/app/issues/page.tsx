'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, MessageCircle, ChevronUp, Tag,
  Loader2, AlertCircle, Clock, Bot, User, Send, X,
} from 'lucide-react';
import { getOrCreateSessionHash } from '@/lib/session';

interface Issue {
  id: string;
  created_at: string;
  title: string;
  body: string | null;
  status: string;
  category: string | null;
  source: string;
  ai_report_id: string | null;
  votes: number;
  comment_count: number;
}

interface Comment {
  id: string;
  created_at: string;
  body: string;
  is_ai: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-900/30 text-green-400 border-green-800/40',
  in_discussion: 'bg-blue-900/30 text-blue-400 border-blue-800/40',
  resolved: 'bg-purple-900/30 text-purple-400 border-purple-800/40',
  closed: 'bg-neutral-800/50 text-neutral-500 border-neutral-700/40',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Aberto',
  in_discussion: 'Em Discussão',
  resolved: 'Resolvido',
  closed: 'Fechado',
};

const CATEGORY_COLORS: Record<string, string> = {
  infraestrutura: 'bg-amber-900/30 text-amber-400',
  efetivo: 'bg-red-900/30 text-red-400',
  assedio: 'bg-rose-900/30 text-rose-400',
  plantao: 'bg-orange-900/30 text-orange-400',
  carreira: 'bg-blue-900/30 text-blue-400',
  tecnologia: 'bg-cyan-900/30 text-cyan-400',
  outro: 'bg-neutral-800/50 text-neutral-400',
};

interface CurrentUser {
  id: string;
  email: string;
  masp?: string;
  validation_status?: string;
}

export default function IssuesPage() {
  const [aiReportId, setAiReportId] = useState<string | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<string>('open');
  const [sort, setSort] = useState<'votes' | 'created_at'>('votes');
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newCategory, setNewCategory] = useState('outro');
  const [creating, setCreating] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [showLoginNotice, setShowLoginNotice] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setAiReportId(params.get('aiReportId'));
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setCurrentUser(d.user as CurrentUser); }).catch(() => {});
  }, []);

  const loadIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort });
      if (filter !== 'all') params.set('status', filter);
      if (aiReportId) params.set('aiReportId', aiReportId);
      const res = await fetch(`/api/issues?${params}`);
      const data = await res.json();
      setIssues(data.issues || []);
    } catch { setIssues([]); }
    finally { setLoading(false); }
  }, [aiReportId, filter, sort]);

  useEffect(() => { loadIssues(); }, [loadIssues]);

  const handleVote = async (issueId: string) => {
    if (!currentUser?.masp) {
      setShowLoginNotice(true);
      return;
    }
    const sessionHash = getOrCreateSessionHash();
    const res = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vote', issueId, sessionHash }),
    });
    const data = await res.json();
    if (data.voted) {
      setIssues(prev => prev.map(i => i.id === issueId ? { ...i, votes: i.votes + 1 } : i));
    }
  };

  const handleExpand = async (issueId: string) => {
    if (expandedIssue === issueId) { setExpandedIssue(null); return; }
    setExpandedIssue(issueId);
    const res = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'comments', issueId }),
    });
    const data = await res.json();
    setComments(data.comments || []);
  };

  const handleComment = async (issueId: string) => {
    if (!commentText.trim()) return;
    await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'comment', issueId, commentBody: commentText }),
    });
    setCommentText('');
    // Reload comments
    handleExpand(issueId);
    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, comment_count: i.comment_count + 1 } : i));
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, body: newBody, category: newCategory }),
      });
      setNewTitle('');
      setNewBody('');
      setShowCreate(false);
      loadIssues();
    } finally { setCreating(false); }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-[family-name:var(--font-geist-sans)]">
      {/* Login required modal */}
      {showLoginNotice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Login necessário para votar</h2>
              <button onClick={() => setShowLoginNotice(false)} className="text-neutral-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Para votar nas pautas, você precisa estar cadastrado como <strong className="text-white">Policial Civil de MG</strong> com MASP válido.
            </p>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Isso garante que cada pauta seja votada apenas uma vez por servidor — evitando duplicidade e dando legitimidade ao processo.
            </p>
            <div className="space-y-2">
              <p className="text-[10px] text-neutral-600 font-semibold uppercase tracking-wider">Transparência de dados</p>
              <ul className="text-[11px] text-neutral-500 space-y-1 list-none">
                <li>🔒 Seu MASP nunca é exibido publicamente</li>
                <li>🗑️ Você pode apagar sua conta e todos os dados a qualquer momento</li>
                <li>📡 Dados usados apenas para validação de identidade funcional</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Link
                href="/chat"
                onClick={() => setShowLoginNotice(false)}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium text-center transition"
              >
                Entrar / Cadastrar
              </Link>
              <button
                onClick={() => setShowLoginNotice(false)}
                className="px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-400 text-sm hover:border-neutral-600 transition"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="border-b border-neutral-800/50 px-6 py-4 flex items-center justify-between sticky top-0 bg-neutral-950/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg hover:bg-neutral-800 transition">
            <ArrowLeft className="w-4 h-4 text-neutral-400" />
          </Link>
          <AlertCircle className="w-5 h-5 text-green-400" />
          <h1 className="text-lg font-semibold text-white">Tópicos em Discussão</h1>
          <span className="text-xs text-neutral-500 hidden sm:inline">Anônimo — como issues do GitHub</span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Tópico</span>
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {aiReportId && (
          <div className="mb-4 rounded-xl border border-emerald-800/40 bg-emerald-900/10 p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-emerald-300">
                Exibindo apenas issues vinculadas a um relatório de inteligência específico.
              </p>
              <Link href={`/reports?tab=intelligence&reportId=${aiReportId}`} className="text-xs text-emerald-400 hover:text-emerald-300 transition">
                Voltar para relatórios →
              </Link>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {['all', 'open', 'in_discussion', 'resolved', 'closed'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === s ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {s === 'all' ? 'Todos' : STATUS_LABELS[s]}
            </button>
          ))}
          <div className="flex-1" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'votes' | 'created_at')}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-300 [&>option]:bg-slate-800 [&>option]:text-white"
          >
            <option value="votes">Mais votados</option>
            <option value="created_at">Mais recentes</option>
          </select>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Novo Tópico para Discussão</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-neutral-800 rounded-lg transition">
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Título do tópico..."
              className="w-full h-10 px-4 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-green-700 transition"
              autoFocus
            />
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Descreva o problema, sugestão ou questão para discussão... (opcional)"
              rows={3}
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-green-700 transition resize-none"
            />
            <div className="flex items-center gap-3">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 [&>option]:bg-slate-800 [&>option]:text-white"
              >
                <option value="infraestrutura">Infraestrutura</option>
                <option value="efetivo">Efetivo</option>
                <option value="assedio">Assédio</option>
                <option value="plantao">Plantão</option>
                <option value="carreira">Carreira</option>
                <option value="tecnologia">Tecnologia</option>
                <option value="outro">Outro</option>
              </select>
              <div className="flex-1" />
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || creating}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Criar Tópico
              </button>
            </div>
            <p className="text-[10px] text-neutral-600">Seu tópico é 100% anônimo. Sem rastreamento de identidade.</p>
          </div>
        )}

        {/* Issues List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <AlertCircle className="w-10 h-10 text-neutral-700 mx-auto" />
            <p className="text-sm text-neutral-500">Nenhum tópico encontrado.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-sm text-green-400 hover:text-green-300 transition"
            >
              Seja o primeiro a criar um tópico →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map(issue => (
              <div key={issue.id} className="rounded-xl border border-neutral-800 bg-neutral-900/50 hover:border-neutral-700/70 transition">
                <div className="flex items-start gap-3 p-4">
                  {/* Vote */}
                  <button
                    onClick={() => handleVote(issue.id)}
                    className="flex flex-col items-center gap-0.5 pt-0.5 min-w-[40px] group"
                  >
                    <ChevronUp className="w-4 h-4 text-neutral-600 group-hover:text-green-400 transition" />
                    <span className="text-sm font-semibold text-neutral-400 group-hover:text-green-400 transition">{issue.votes}</span>
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${STATUS_COLORS[issue.status] || STATUS_COLORS.open}`}>
                        {STATUS_LABELS[issue.status] || issue.status}
                      </span>
                      {issue.category && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${CATEGORY_COLORS[issue.category] || CATEGORY_COLORS.outro}`}>
                          <Tag className="w-2.5 h-2.5 inline mr-0.5" />{issue.category}
                        </span>
                      )}
                      {issue.source === 'ai_suggestion' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-900/30 text-purple-400">
                          <Bot className="w-2.5 h-2.5 inline mr-0.5" />IA
                        </span>
                      )}
                      {issue.ai_report_id && (
                        <Link
                          href={`/reports?tab=intelligence&reportId=${issue.ai_report_id}`}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-900/30 text-emerald-400 hover:text-emerald-300 transition"
                        >
                          relatório vinculado
                        </Link>
                      )}
                    </div>
                    <button
                      onClick={() => handleExpand(issue.id)}
                      className="text-sm font-medium text-white hover:text-blue-400 transition text-left"
                    >
                      {issue.title}
                    </button>
                    {issue.body && (
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{issue.body}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(issue.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <button
                        onClick={() => handleExpand(issue.id)}
                        className="flex items-center gap-1 hover:text-neutral-400 transition"
                      >
                        <MessageCircle className="w-3 h-3" />
                        {issue.comment_count} comentários
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded: Comments */}
                {expandedIssue === issue.id && (
                  <div className="border-t border-neutral-800/50 p-4 space-y-3">
                    {comments.length === 0 ? (
                      <p className="text-xs text-neutral-600 text-center py-2">Nenhum comentário ainda. Seja o primeiro!</p>
                    ) : (
                      comments.map(c => (
                        <div key={c.id} className="flex items-start gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${c.is_ai ? 'bg-purple-900/30' : 'bg-neutral-800'}`}>
                            {c.is_ai ? <Bot className="w-3 h-3 text-purple-400" /> : <User className="w-3 h-3 text-neutral-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-neutral-300">{c.body}</p>
                            <span className="text-[10px] text-neutral-600">
                              {new Date(c.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              {c.is_ai && ' · Agente IA'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Adicionar comentário anônimo..."
                        className="flex-1 h-9 px-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-green-700 transition"
                        onKeyDown={(e) => e.key === 'Enter' && handleComment(issue.id)}
                      />
                      <button
                        onClick={() => handleComment(issue.id)}
                        disabled={!commentText.trim()}
                        className="p-2 bg-green-600 hover:bg-green-500 disabled:bg-neutral-800 rounded-lg transition"
                      >
                        <Send className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
