'use client';

import { Link2, FileText, ChevronUp, MessageCircle, Clock, Sparkles } from 'lucide-react';

interface RelatedIssue {
  id: string;
  title: string;
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

export interface CorrelationData {
  suggestedTags: string[];
  relatedIssues: RelatedIssue[];
  relatedReports: RelatedReport[];
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

export default function InlineCorrelation({ data }: { data: CorrelationData }) {
  if (!data.relatedIssues?.length && !data.relatedReports?.length && !data.suggestedTags?.length) return null;

  return (
    <div className="mt-3 bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-4 text-left shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
        <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wide">Descoberta Automática</span>
      </div>

      {data.suggestedTags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {data.suggestedTags.map(tag => (
            <span key={tag} className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-md border border-neutral-700/50">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {data.relatedIssues?.length > 0 && (
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-medium">
            <Link2 className="h-3 w-3 text-blue-400" /> Tópicos na Comunidade
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.relatedIssues.slice(0, 2).map(issue => (
              <a 
                key={issue.id} 
                href={`/issues?expanded=${issue.id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-2.5 rounded-lg border border-neutral-800 bg-neutral-950/40 hover:border-neutral-700 hover:bg-neutral-800/40 transition group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${STATUS_COLORS[issue.status] || 'bg-neutral-800 text-neutral-400'}`}>
                    {STATUS_LABELS[issue.status] || issue.status}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-neutral-200 line-clamp-2 group-hover:text-amber-400 transition">{issue.title}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[9px] text-neutral-500">
                  <span className="flex items-center gap-1"><ChevronUp className="h-2.5 w-2.5" />{issue.votes}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-2.5 w-2.5" />{issue.comment_count}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {data.relatedReports?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-medium">
            <FileText className="h-3 w-3 text-emerald-400" /> Relatos de Inteligência
          </div>
          <div className="grid grid-cols-1 gap-2">
            {data.relatedReports.slice(0, 2).map(report => (
              <a 
                key={report.id} 
                href={`/reports`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-2.5 rounded-lg border border-neutral-800 bg-neutral-950/40 hover:border-neutral-700 hover:bg-neutral-800/40 transition group"
              >
                <p className="text-[11px] text-neutral-300 line-clamp-2 group-hover:text-emerald-400 transition">{report.snippet}</p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {report.themes.slice(0, 3).map((theme) => (
                    <span key={theme} className="text-[9px] text-emerald-400/80 bg-emerald-900/20 px-1.5 py-0.5 rounded-md border border-emerald-800/30">{theme}</span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
