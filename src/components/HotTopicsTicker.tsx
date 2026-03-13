'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronUp, Flame, Radio } from 'lucide-react';

interface TickerTopic {
  id: string;
  title: string;
  category: string | null;
  votes: number;
  score: number;
}

const CATEGORY_DOT: Record<string, string> = {
  infraestrutura: 'bg-amber-400',
  efetivo: 'bg-red-400',
  assedio: 'bg-rose-400',
  plantao: 'bg-orange-400',
  carreira: 'bg-blue-400',
  tecnologia: 'bg-cyan-400',
  integracao: 'bg-indigo-400',
  procedimento: 'bg-violet-400',
  legislacao: 'bg-teal-400',
  outro: 'bg-neutral-500',
};

export default function HotTopicsTicker() {
  const [topics, setTopics] = useState<TickerTopic[]>([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch('/api/hot-topics?limit=8');
        const data = await res.json();
        if (!cancelled) {
          setTopics(
            (data.topics || []).map((t: TickerTopic & Record<string, unknown>) => ({
              id: t.id,
              title: t.title,
              category: t.category,
              votes: t.votes,
              score: t.score,
            }))
          );
        }
      } catch { /* silent */ }
    };
    run();
    const interval = setInterval(run, 180_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (topics.length === 0) return null;

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
      <Link
        href="/papo-de-corredor"
        className="flex items-center gap-2 text-sm font-medium text-white hover:text-amber-400 transition mb-3"
      >
        <Radio className="h-4 w-4 text-red-400 animate-pulse" />
        Papo de Corredor
        <Flame className="h-3.5 w-3.5 text-orange-400" />
      </Link>
      <div className="space-y-2">
        {topics.slice(0, 6).map((topic, i) => (
          <Link
            key={topic.id}
            href={`/issues?id=${topic.id}`}
            className="group flex items-start gap-2.5 rounded-xl px-2.5 py-2 -mx-1 hover:bg-neutral-800/60 transition"
          >
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-neutral-800 text-[9px] font-bold text-neutral-400 mt-0.5">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-neutral-300 group-hover:text-white transition line-clamp-2 leading-relaxed">
                {topic.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {topic.category && (
                  <span className="flex items-center gap-1 text-[10px] text-neutral-500">
                    <span className={`h-1.5 w-1.5 rounded-full ${CATEGORY_DOT[topic.category] || CATEGORY_DOT.outro}`} />
                    {topic.category}
                  </span>
                )}
                <span className="flex items-center gap-0.5 text-[10px] text-neutral-600">
                  <ChevronUp className="h-2.5 w-2.5" />{topic.votes}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Link
        href="/papo-de-corredor"
        className="mt-3 block text-center text-[11px] text-neutral-500 hover:text-amber-400 transition"
      >
        Ver todos os tópicos quentes →
      </Link>
    </div>
  );
}
