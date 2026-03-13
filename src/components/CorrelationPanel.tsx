'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Hash,
  Link2,
  Loader2,
  Plus,
  Search,
  Sparkles,
  X,
  ChevronUp,
  MessageCircle,
  FileText,
  Clock,
} from 'lucide-react';

interface RelatedIssue {
  id: string;
  title: string;
  body: string | null;
  status: string;
  category: string | null;
  votes: number;
  comment_count: number;
  created_at: string;
}

interface RelatedReport {
  id: string;
  created_at: string;
  snippet: string;
  themes: string[];
}

interface CorrelationData {
  suggestedTags: string[];
  relatedIssues: RelatedIssue[];
  relatedReports: RelatedReport[];
}

interface CorrelationPanelProps {
  text: string;
  currentTags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  minChars?: number;
  debounceMs?: number;
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Aberto',
  in_discussion: 'Em Discussão',
  resolved: 'Resolvido',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-900/30 text-green-400',
  in_discussion: 'bg-blue-900/30 text-blue-400',
  resolved: 'bg-purple-900/30 text-purple-400',
};

export default function CorrelationPanel({
  text,
  currentTags,
  onAddTag,
  onRemoveTag,
  minChars = 50,
  debounceMs = 2500,
}: CorrelationPanelProps) {
  const [data, setData] = useState<CorrelationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewIssue, setPreviewIssue] = useState<RelatedIssue | null>(null);
  const [previewReport, setPreviewReport] = useState<RelatedReport | null>(null);
  const [customTag, setCustomTag] = useState('');
  const lastSearchRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCorrelation = useCallback(async (searchText: string) => {
    if (searchText === lastSearchRef.current) return;
    lastSearchRef.current = searchText;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/correlate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: searchText, context: 'suggestion' }),
      });
      if (!res.ok) throw new Error('Falha na correlação');
      const result = (await res.json()) as CorrelationData;
      setData(result);
    } catch {
      setError('Não foi possível buscar correlações.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (text.trim().length < minChars) {
      setData(null);
      lastSearchRef.current = '';
      return;
    }

    timerRef.current = setTimeout(() => {
      fetchCorrelation(text.trim());
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, minChars, debounceMs, fetchCorrelation]);

  const handleAddCustomTag = () => {
    const tag = customTag.trim().toLowerCase().slice(0, 40);
    if (tag && !currentTags.includes(tag)) {
      onAddTag(tag);
      setCustomTag('');
    }
  };

  const hasResults = data && (data.suggestedTags.length > 0 || data.relatedIssues.length > 0 || data.relatedReports.length > 0);

  if (!hasResults && !loading && !error) return null;

  return (
    <>
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-medium text-white">Correlação inteligente</span>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-500" />}
        </div>

        {error && <p className="text-xs text-rose-400">{error}</p>}

        {/* AI Suggested Tags */}
        {data && data.suggestedTags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Sparkles className="h-3 w-3 text-amber-400" />
              Tags sugeridas pela IA
            </div>
            <div className="flex flex-wrap gap-2">
              {data.suggestedTags.map((tag) => {
                const isActive = currentTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => isActive ? onRemoveTag(tag) : onAddTag(tag)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-700/40'
                        : 'bg-neutral-800 text-neutral-300 border border-neutral-700/40 hover:bg-neutral-700'
                    }`}
                  >
                    <Hash className="h-3 w-3" />
                    {tag}
                    {isActive && <X className="h-3 w-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom Tag Input */}
        <div className="flex items-center gap-2">
          <input
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
            placeholder="Adicionar tag personalizada..."
            className="flex-1 h-9 rounded-xl border border-neutral-800 bg-neutral-950 px-3 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-amber-700 transition"
          />
          <button
            onClick={handleAddCustomTag}
            disabled={!customTag.trim()}
            className="h-9 px-3 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-medium hover:bg-neutral-700 disabled:opacity-40 transition"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Active Tags */}
        {currentTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {currentTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 border border-blue-800/30 px-3 py-1.5 text-xs font-medium text-blue-300"
              >
                <Hash className="h-3 w-3" />
                {tag}
                <button onClick={() => onRemoveTag(tag)} className="hover:text-white transition">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Related Issues */}
        {data && data.relatedIssues.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Link2 className="h-3 w-3 text-blue-400" />
              Tópicos relacionados no fórum ({data.relatedIssues.length})
            </div>
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {data.relatedIssues.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => setPreviewIssue(issue)}
                  className="w-full text-left rounded-2xl border border-neutral-800 bg-neutral-950/60 p-3 hover:border-neutral-700 transition"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_COLORS[issue.status] || 'bg-neutral-800 text-neutral-400'}`}>
                      {STATUS_LABELS[issue.status] || issue.status}
                    </span>
                    {issue.category && (
                      <span className="text-[10px] text-neutral-500">{issue.category}</span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-white line-clamp-2">{issue.title}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-neutral-500">
                    <span className="flex items-center gap-1"><ChevronUp className="h-3 w-3" />{issue.votes}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{issue.comment_count}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(issue.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Related Reports */}
        {data && data.relatedReports.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <FileText className="h-3 w-3 text-emerald-400" />
              Relatos semelhantes ({data.relatedReports.length})
            </div>
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {data.relatedReports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setPreviewReport(report)}
                  className="w-full text-left rounded-2xl border border-neutral-800 bg-neutral-950/60 p-3 hover:border-neutral-700 transition"
                >
                  <p className="text-xs text-neutral-300 line-clamp-2">{report.snippet}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {report.themes.map((theme) => (
                      <span key={theme} className="text-[10px] text-emerald-400 bg-emerald-900/20 px-2 py-0.5 rounded-full">{theme}</span>
                    ))}
                    <span className="text-[10px] text-neutral-500">{new Date(report.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Issue Preview Modal */}
      {previewIssue && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPreviewIssue(null)}>
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_COLORS[previewIssue.status] || ''}`}>
                  {STATUS_LABELS[previewIssue.status] || previewIssue.status}
                </span>
                {previewIssue.category && <span className="text-xs text-neutral-500">{previewIssue.category}</span>}
              </div>
              <button onClick={() => setPreviewIssue(null)} className="text-neutral-500 hover:text-white transition"><X className="w-4 h-4" /></button>
            </div>
            <h2 className="text-base font-semibold text-white">{previewIssue.title}</h2>
            {previewIssue.body && (
              <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{previewIssue.body}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <span className="flex items-center gap-1"><ChevronUp className="h-3.5 w-3.5" />{previewIssue.votes} votos</span>
              <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{previewIssue.comment_count} comentários</span>
              <span>{new Date(previewIssue.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
            <a
              href={`/issues?expanded=${previewIssue.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition"
            >
              Abrir no fórum →
            </a>
          </div>
        </div>
      )}

      {/* Report Preview Modal */}
      {previewReport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPreviewReport(null)}>
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Relato compartilhado</span>
              <button onClick={() => setPreviewReport(null)} className="text-neutral-500 hover:text-white transition"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed">{previewReport.snippet}</p>
            {previewReport.themes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {previewReport.themes.map((theme) => (
                  <span key={theme} className="text-xs text-emerald-400 bg-emerald-900/20 px-2.5 py-1 rounded-full">{theme}</span>
                ))}
              </div>
            )}
            <p className="text-xs text-neutral-500">{new Date(previewReport.created_at).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      )}
    </>
  );
}
