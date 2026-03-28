'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Bot, Flame, Radio, Sparkles } from 'lucide-react';

type HotTopicItem = {
  id: string;
  title: string;
  category: string | null;
  votes: number;
  score: number;
};

type AIReportItem = {
  id: string;
  content_summary: string | null;
  conversation_count: number;
  report_count: number;
  created_at: string;
};

type MarqueeItem =
  | ({ kind: 'topic' } & HotTopicItem)
  | ({ kind: 'report' } & AIReportItem);

const CATEGORY_LABELS: Record<string, string> = {
  infraestrutura: 'Infraestrutura',
  efetivo: 'Efetivo',
  assedio: 'Assédio',
  plantao: 'Plantão',
  carreira: 'Carreira',
  tecnologia: 'Tecnologia',
  integracao: 'Integração',
  procedimento: 'Procedimento',
  legislacao: 'Legislação',
  outro: 'Outro',
};

export default function HotTopicsMarquee() {
  const [topics, setTopics] = useState<HotTopicItem[]>([]);
  const [reports, setReports] = useState<AIReportItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [topicsResponse, reportsResponse] = await Promise.all([
          fetch('/api/hot-topics?limit=8'),
          fetch('/api/ai-reports?limit=4'),
        ]);
        const [topicsData, reportsData] = await Promise.all([
          topicsResponse.json(),
          reportsResponse.json(),
        ]);
        if (!cancelled) {
          setTopics(Array.isArray(topicsData.topics) ? topicsData.topics : []);
          setReports(Array.isArray(reportsData.reports) ? reportsData.reports : []);
        }
      } catch {
        if (!cancelled) {
          setTopics([]);
          setReports([]);
        }
      }
    };

    void load();
    const interval = setInterval(load, 120_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const marqueeItems = useMemo<MarqueeItem[]>(() => {
    const combined: MarqueeItem[] = [
      ...topics.map(topic => ({ kind: 'topic' as const, ...topic })),
      ...reports.map(report => ({
        kind: 'report' as const,
        id: report.id,
        title: report.content_summary?.slice(0, 120) || 'Relatório de IA disponível',
        category: null,
        votes: report.conversation_count,
        score: report.report_count,
        content_summary: report.content_summary,
        conversation_count: report.conversation_count,
        report_count: report.report_count,
        created_at: report.created_at,
      })),
    ];

    if (combined.length === 0) return [];
    // Só duplica se houver itens suficientes para preencher a tela (evita duplicação visual)
    const shouldDuplicate = combined.length >= 5;
    return shouldDuplicate ? [...combined, ...combined] : combined;
  }, [topics, reports]);

  if (marqueeItems.length === 0) return null;

  return (
    <div className="border-b border-neutral-800/70 bg-neutral-950/95 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/80">
      <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-hidden px-3 py-2 sm:px-6">
        <Link
          href="/papo-de-corredor"
          className="flex shrink-0 items-center gap-2 rounded-full border border-red-900/50 bg-red-950/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-300 transition hover:border-red-700 hover:text-white"
        >
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          Corredor
        </Link>
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div className="hot-topics-marquee flex min-w-max items-center gap-3 pr-3 will-change-transform">
            {marqueeItems.map((item, index) => (
              <Link
                key={`${item.kind}-${item.id}-${index}`}
                href={item.kind === 'report' ? `/reports?tab=intelligence&reportId=${item.id}` : '/papo-de-corredor'}
                className={`inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition hover:text-white ${item.kind === 'report'
                    ? 'border border-violet-700/40 bg-violet-950/45 text-violet-200 hover:border-violet-500 hover:bg-violet-900/50'
                    : 'border border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800'
                  }`}
              >
                {item.kind === 'report' ? (
                  <>
                    <Bot className="h-3.5 w-3.5 text-violet-300" />
                    <Sparkles className="h-3 w-3 text-fuchsia-300" />
                    <span className="max-w-[60vw] truncate sm:max-w-none">{item.content_summary?.slice(0, 120) || 'Relatório de IA disponível'}</span>
                    <span className="rounded-full bg-violet-900/40 px-2 py-0.5 text-[10px] text-violet-200">
                      IA
                    </span>
                    <span className="text-[11px] text-violet-300">{item.report_count} relatórios</span>
                  </>
                ) : (
                  <>
                    <Flame className="h-3.5 w-3.5 text-orange-400" />
                    <span className="max-w-[60vw] truncate sm:max-w-none">{item.title}</span>
                    <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-[10px] text-neutral-500">
                      {CATEGORY_LABELS[item.category || 'outro'] || CATEGORY_LABELS.outro}
                    </span>
                    <span className="text-[11px] text-amber-400">{item.votes} votos</span>
                  </>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
