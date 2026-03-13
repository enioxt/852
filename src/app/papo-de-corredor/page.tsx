'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronUp,
  Clock,
  Flame,
  Loader2,
  MessageCircle,
  Radio,
  Tag,
  TrendingUp,
} from 'lucide-react';

interface HotTopic {
  id: string;
  title: string;
  body: string | null;
  status: string;
  category: string | null;
  source: string;
  votes: number;
  comment_count: number;
  created_at: string;
  score: number;
  age_hours: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  infraestrutura: 'bg-amber-900/30 text-amber-400',
  efetivo: 'bg-red-900/30 text-red-400',
  assedio: 'bg-rose-900/30 text-rose-400',
  plantao: 'bg-orange-900/30 text-orange-400',
  carreira: 'bg-blue-900/30 text-blue-400',
  tecnologia: 'bg-cyan-900/30 text-cyan-400',
  integracao: 'bg-indigo-900/30 text-indigo-400',
  procedimento: 'bg-violet-900/30 text-violet-400',
  legislacao: 'bg-teal-900/30 text-teal-400',
  outro: 'bg-neutral-800/50 text-neutral-400',
};

function formatAge(hours: number): string {
  if (hours < 1) return 'agora';
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.round(days / 30)}m`;
}

export default function PapoDeCorredorPage() {
  const [topics, setTopics] = useState<HotTopic[]>([]);
  const [categories, setCategories] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadTopics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hot-topics?limit=30');
      const data = await res.json();
      setTopics(data.topics || []);
      setCategories(data.categories || {});
      setTotal(data.total || 0);
    } catch {
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTopics();
    const interval = setInterval(loadTopics, 120_000);
    return () => clearInterval(interval);
  }, [loadTopics]);

  const topThree = topics.slice(0, 3);
  const rest = topics.slice(3);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-800/40 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-300">
            <Radio className="h-4 w-4 animate-pulse" />
            Papo de Corredor
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
            O que os policiais estao falando
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-neutral-400">
            Os temas mais quentes entre os policiais civis. Ranking por engajamento: votos, comentarios e relevancia temporal. Atualizado a cada 2 minutos.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-neutral-500">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              {total} tópicos ativos
            </span>
            <span className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-orange-400" />
              {topics.length} em destaque
            </span>
          </div>
        </div>

        {/* Category Summary */}
        {Object.keys(categories).length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {Object.entries(categories)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => (
                <span
                  key={cat}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${CATEGORY_COLORS[cat] || CATEGORY_COLORS.outro}`}
                >
                  <Tag className="h-3 w-3" />
                  {cat} ({count})
                </span>
              ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Radio className="h-10 w-10 text-neutral-700 mx-auto" />
            <p className="text-sm text-neutral-500">Nenhum tópico quente no momento.</p>
            <Link href="/sugestao" className="text-sm text-amber-400 hover:text-amber-300 transition">
              Abra o primeiro tópico →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top 3 - Featured */}
            {topThree.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-3">
                {topThree.map((topic, index) => (
                  <Link
                    key={topic.id}
                    href={`/issues?id=${topic.id}`}
                    className="group relative rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900/80 to-neutral-950/80 p-5 hover:border-neutral-700 transition"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        index === 0
                          ? 'bg-amber-500/20 text-amber-400'
                          : index === 1
                            ? 'bg-neutral-700 text-neutral-300'
                            : 'bg-amber-900/20 text-amber-600'
                      }`}>
                        {index + 1}
                      </span>
                      <Flame className={`h-4 w-4 ${index === 0 ? 'text-orange-400' : 'text-neutral-600'}`} />
                    </div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition line-clamp-3 min-h-[3.5rem]">
                      {topic.title}
                    </h3>
                    {topic.category && (
                      <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[topic.category] || CATEGORY_COLORS.outro}`}>
                        {topic.category}
                      </span>
                    )}
                    <div className="mt-3 flex items-center gap-3 text-[10px] text-neutral-500">
                      <span className="flex items-center gap-1"><ChevronUp className="h-3 w-3" />{topic.votes}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{topic.comment_count}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatAge(topic.age_hours)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Rest of topics */}
            {rest.length > 0 && (
              <div className="space-y-2">
                {rest.map((topic, index) => (
                  <Link
                    key={topic.id}
                    href={`/issues?id=${topic.id}`}
                    className="group flex items-start gap-3 rounded-xl border border-neutral-800/60 bg-neutral-900/40 p-4 hover:border-neutral-700 transition"
                  >
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-neutral-800 text-[10px] font-bold text-neutral-400">
                      {index + 4}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-medium text-white group-hover:text-blue-400 transition line-clamp-1">
                          {topic.title}
                        </h3>
                        {topic.category && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[topic.category] || CATEGORY_COLORS.outro}`}>
                            {topic.category}
                          </span>
                        )}
                      </div>
                      {topic.body && (
                        <p className="mt-1 text-xs text-neutral-500 line-clamp-1">{topic.body}</p>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-3 text-[10px] text-neutral-500">
                      <span className="flex items-center gap-1"><ChevronUp className="h-3 w-3" />{topic.votes}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{topic.comment_count}</span>
                      <span>{formatAge(topic.age_hours)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 text-center">
          <p className="text-sm text-neutral-400">Tem algo para contribuir?</p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <Link href="/sugestao" className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition">
              Enviar sugestão
            </Link>
            <Link href="/chat" className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-300 hover:bg-neutral-800 transition">
              Conversar com o 852
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
