'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Flame, Radio } from 'lucide-react';

type HotTopicItem = {
  id: string;
  title: string;
  category: string | null;
  votes: number;
  score: number;
};

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

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch('/api/hot-topics?limit=10');
        const data = await response.json();
        if (!cancelled) {
          setTopics(Array.isArray(data.topics) ? data.topics : []);
        }
      } catch {
        if (!cancelled) {
          setTopics([]);
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

  const marqueeTopics = useMemo(() => {
    if (topics.length === 0) return [];
    return [...topics, ...topics];
  }, [topics]);

  if (marqueeTopics.length === 0) return null;

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
            {marqueeTopics.map((topic, index) => (
              <Link
                key={`${topic.id}-${index}`}
                href="/papo-de-corredor"
                className="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/80 px-4 py-2 text-sm text-neutral-300 transition hover:border-neutral-700 hover:bg-neutral-800 hover:text-white"
              >
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                <span className="max-w-[60vw] truncate sm:max-w-none">{topic.title}</span>
                <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-[10px] text-neutral-500">
                  {CATEGORY_LABELS[topic.category || 'outro'] || CATEGORY_LABELS.outro}
                </span>
                <span className="text-[11px] text-amber-400">{topic.votes} votos</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
