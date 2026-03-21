'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Bot, MessageSquare, Plus, Tag,
  Clock, X, ChevronUp, ChevronDown,
  Loader2, AlertCircle, MessageCircle, User, Send
} from 'lucide-react';
import { getOrCreateSessionHash } from '@/lib/session';

interface Issue {
  id: string;
  title: string;
  body: string | null;
  status: string;
  votes: number;
  downvotes?: number;
  ai_report_id: string | null;
  category: string;
  source: string;
  comment_count: number;
  created_at: string;
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
  display_name?: string;
  validation_status?: string | null;
}

interface IssuesFeedProps {
  category?: string;
}

export function IssuesFeed({ category = 'all' }: IssuesFeedProps) {
  const [aiReportId, setAiReportId] = useState<string | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<string>('open');
  const [sort, setSort] = useState<'votes' | 'created_at'>('votes');
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [versions, setVersions] = useState<Record<string, Issue[]>>({});
  const [commentText, setCommentText] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newCategory, setNewCategory] = useState('outro');
  const [versionReason, setVersionReason] = useState('');
  const [branchingIssue, setBranchingIssue] = useState<Issue | null>(null);
  const [creating, setCreating] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [showLoginNotice, setShowLoginNotice] = useState(false);
  const [loginNoticeMode, setLoginNoticeMode] = useState<'auth' | 'validation'>('auth');
  const [focusId, setFocusId] = useState<string | null>(null);
  const focusRef = useRef<HTMLDivElement | null>(null);
  const didScrollRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setAiReportId(params.get('aiReportId'));
    const idParam = params.get('id');
    if (idParam) {
      setFocusId(idParam);
      setFilter('all');
    }
    const syncAuth = () => {
      fetch('/api/auth/me', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => setCurrentUser((d.user as CurrentUser) || null))
        .catch(() => setCurrentUser(null));
    };
    syncAuth();
    window.addEventListener('852-auth-changed', syncAuth);
    return () => window.removeEventListener('852-auth-changed', syncAuth);
  }, []);

  const loadIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort });
      if (filter !== 'all') params.set('status', filter);
      if (aiReportId) params.set('aiReportId', aiReportId);
      if (category && category !== 'all') params.set('category', category);
      const res = await fetch(`/api/issues?${params}`);
      const data = await res.json();
      setIssues(data.issues || []);
    } catch { setIssues([]); }
    finally { setLoading(false); }
  }, [aiReportId, filter, sort]);

  useEffect(() => { loadIssues(); }, [loadIssues]);

  useEffect(() => {
    if (!focusId || didScrollRef.current || loading) return;
    const match = issues.find(i => i.id === focusId);
    if (!match) return;
    didScrollRef.current = true;
    setExpandedIssue(focusId);
    fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'comments', issueId: focusId }),
    })
      .then(r => r.json())
      .then(d => setComments(d.comments || []))
      .catch(() => {});
    setTimeout(() => {
      focusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  }, [focusId, issues, loading]);

  const handleVote = async (issueId: string, voteType: 'up' | 'down' = 'up') => {
    if (!currentUser?.id) {
      setLoginNoticeMode('auth');
      setShowLoginNotice(true);
      return;
    }
    const sessionHash = getOrCreateSessionHash();
    const res = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vote', issueId, sessionHash, voteType }),
    });
    const data = await res.json();
    if (!res.ok && data?.needsAuth) {
      setLoginNoticeMode('auth');
      setShowLoginNotice(true);
      return;
    }
    if (!res.ok && data?.needsValidation) {
      setLoginNoticeMode('validation');
      setShowLoginNotice(true);
      return;
    }
    if (data.voted && data.issue) {
      setIssues(prev => prev.map(i => i.id === issueId ? { ...i, votes: data.issue.votes, downvotes: data.issue.downvotes } : i));
    }
  };

  const handleExpand = async (issueId: string) => {
    if (expandedIssue === issueId) { setExpandedIssue(null); return; }
    setExpandedIssue(issueId);
    
    // Fetch comments
    fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'comments', issueId }),
    }).then(r => r.json()).then(data => setComments(data.comments || []));

    // Fetch versions
    fetch(`/api/issues?action=versions&parentId=${issueId}`)
      .then(r => r.json())
      .then(data => setVersions(prev => ({ ...prev, [issueId]: data.versions || [] })));
  };

  const handleComment = async (issueId: string) => {
    if (!commentText.trim()) return;
    if (!currentUser?.id) {
      setLoginNoticeMode('auth');
      setShowLoginNotice(true);
      return;
    }
    const res = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'comment', issueId, commentBody: commentText }),
    });
    const data = await res.json();
    if (!res.ok && data?.needsAuth) {
      setLoginNoticeMode('auth');
      setShowLoginNotice(true);
      return;
    }
    if (!res.ok && data?.needsValidation) {
      setLoginNoticeMode('validation');
      setShowLoginNotice(true);
      return;
    }
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
        body: JSON.stringify({ 
          title: newTitle, 
          body: newBody, 
          category: newCategory,
          parentId: branchingIssue?.id,
          versionReason: branchingIssue ? versionReason : undefined
        }),
      });
      setNewTitle('');
      setNewBody('');
      setVersionReason('');
      setShowCreate(false);
      
      if (branchingIssue) {
        handleExpand(branchingIssue.id); // reload expanded to fetch new version
        setBranchingIssue(null);
      } else {
        loadIssues();
      }
    } finally { setCreating(false); }
  };
  
  const handleOpenBranching = (issue: Issue) => {
    if (!currentUser?.id) {
      setLoginNoticeMode('auth');
      setShowLoginNotice(true);
      return;
    }
    if (currentUser.validation_status !== 'approved') {
      setLoginNoticeMode('validation');
      setShowLoginNotice(true);
      return;
    }
    setBranchingIssue(issue);
    setNewTitle(issue.title);
    setNewCategory(issue.category || 'outro');
    setNewBody(issue.body || '');
    setVersionReason('');
  };

  return (
    <div className="w-full text-neutral-200 font-[family-name:var(--font-geist-sans)]">
      {/* Login required modal */}
      {showLoginNotice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                {loginNoticeMode === 'auth' ? 'Sessão Expirada ou Ausente' : 'Validação de MASP'}
              </h2>
              <button onClick={() => setShowLoginNotice(false)} className="text-neutral-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed">
              {loginNoticeMode === 'auth'
                ? <>Para votar e acompanhar as pautas, você precisa ter uma <strong className="text-white">conta protegida</strong>.</>
                : <>Para votar e acompanhar as pautas, você precisa estar cadastrado como <strong className="text-white">Policial Civil de MG com MASP validado</strong>.</>}
            </p>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Anônimos podem abrir conversas e gerar relatos. A governança dos tópicos públicos exige validação para evitar duplicidade, abuso e dar legitimidade ao processo.
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
                href={loginNoticeMode === 'auth' ? '/conta?auth=register&next=/issues' : '/conta?next=/issues'}
                onClick={() => setShowLoginNotice(false)}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium text-center transition"
              >
                {loginNoticeMode === 'auth' ? 'Entrar / Cadastrar' : 'Validar MASP'}
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-green-900/20 p-3">
              <AlertCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Tópicos em Discussão</h1>
              <p className="text-sm text-neutral-400">Leitura aberta. Voto e comentários com conta protegida.</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Tópico</span>
          </button>
        </div>

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

        {/* Create / Branch Modal */}
        {(showCreate || branchingIssue) && (
          <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                {branchingIssue ? 'Evoluir / Contestar Insight' : 'Novo Tópico para Discussão'}
              </h2>
              <button onClick={() => { setShowCreate(false); setBranchingIssue(null); }} className="p-1 hover:bg-neutral-800 rounded-lg transition">
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            
            {branchingIssue && (
              <div className="bg-red-900/20 border border-red-900/40 rounded-xl p-3 mb-4">
                <p className="text-xs text-red-400">
                  <strong className="block mb-1">Princípio da Verdade Versionada</strong>
                  Você está criando uma nova "Branch" deste insight. A autoria desta evolução ficará vinculada ao seu MASP, permitindo que a corporação debata sua versão alternativa sem apagar o histórico original.
                </p>
              </div>
            )}

            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Título do tópico..."
              className="w-full h-10 px-4 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-green-700 transition"
              autoFocus
            />
            
            {branchingIssue && (
              <textarea
                value={versionReason}
                onChange={(e) => setVersionReason(e.target.value)}
                placeholder="Qual o motivo fundamentado para esta divergência ou evolução?"
                rows={2}
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-red-700 transition resize-none"
              />
            )}

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
                disabled={!!branchingIssue}
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
                disabled={!newTitle.trim() || creating || (!!branchingIssue && !versionReason.trim())}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : (branchingIssue ? <MessageSquare className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                {branchingIssue ? 'Publicar Evolução' : 'Criar Tópico'}
              </button>
            </div>
            {!branchingIssue && (
              <>
                <p className="text-[10px] text-neutral-600">Seu tópico é 100% anônimo. Sem rastreamento de identidade.</p>
                <p className="text-[10px] text-neutral-600">Tópicos também podem ser gerados automaticamente a partir de relatos compartilhados e relatórios de inteligência.</p>
              </>
            )}
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
              <div
                key={issue.id}
                ref={issue.id === focusId ? focusRef : undefined}
                className={`rounded-xl border bg-neutral-900/50 hover:border-neutral-700/70 transition ${issue.id === focusId ? 'border-blue-700/60 ring-1 ring-blue-800/30' : 'border-neutral-800'}`}
              >
                <div className="flex items-start gap-3 p-4">
                  {/* Vote */}
                  <div className="flex flex-col items-center gap-1 pt-0.5 min-w-[40px]">
                    <button
                      onClick={() => handleVote(issue.id, 'up')}
                      className="flex flex-col items-center group"
                      title="Aprovar"
                    >
                      <ChevronUp className="w-5 h-5 text-neutral-600 group-hover:text-green-400 transition" />
                      <span className="text-sm font-semibold text-neutral-400 group-hover:text-green-400 transition leading-none">{issue.votes}</span>
                    </button>
                    <button
                      onClick={() => handleVote(issue.id, 'down')}
                      className="flex flex-col items-center group mt-1"
                      title="Rejeitar"
                    >
                      <span className="text-[10px] font-semibold text-neutral-500 group-hover:text-red-400 transition leading-none mb-0.5">{issue.downvotes || 0}</span>
                      <ChevronDown className="w-4 h-4 text-neutral-600 group-hover:text-red-400 transition" />
                    </button>
                  </div>

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

                {/* Expanded: Comments & Versions */}
                {expandedIssue === issue.id && (
                  <div className="border-t border-neutral-800/50 p-4 space-y-4">
                    
                    {/* Versions/Branches Section */}
                    {versions[issue.id]?.length > 0 && (
                      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-2 mb-4">
                        <h4 className="text-xs font-semibold text-neutral-400 flex items-center gap-2">
                          <AlertCircle className="w-3 h-3" />
                          Versões / Contestações ({versions[issue.id].length})
                        </h4>
                        <div className="space-y-2">
                          {versions[issue.id].map(v => (
                            <div key={v.id} className="pl-3 border-l-2 border-green-800/50">
                              <p className="text-xs font-medium text-blue-300">{v.title}</p>
                              {/* @ts-ignore - because version_reason is dynamically added */}
                              {v.version_reason && <p className="text-[10px] text-neutral-500 mt-0.5">Motivo: {v.version_reason}</p>}
                              <div className="flex gap-2 mt-1">
                                <span className="text-[10px] text-green-500">{v.votes} votos</span>
                                <Link href={`/issues?id=${v.id}`} className="text-[10px] text-blue-400 hover:underline">Abrir versão →</Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Action Bar */}
                    <div className="flex justify-end border-b border-neutral-800/50 pb-3">
                      <button 
                        onClick={() => handleOpenBranching(issue)}
                        className="text-xs flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition px-3 py-1.5 rounded-lg bg-blue-900/20 border border-blue-800/30"
                      >
                        <AlertCircle className="w-3 h-3" />
                        Evoluir / Contestar Versão
                      </button>
                    </div>

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
                        placeholder="Adicionar comentário com sua conta protegida..."
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
