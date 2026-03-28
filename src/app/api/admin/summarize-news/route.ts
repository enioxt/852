import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { getModelConfig } from '@/lib/ai-provider';
import { getSupabase } from '@/lib/supabase';
import { recordEvent } from '@/lib/telemetry';

export const maxDuration = 60;

interface IssueSummary {
  id: string;
  title: string;
  summary: string;
  category: string | null;
  tokenUsed: number;
}

// POST /api/admin/summarize-news
// Body: { ids?: string[]; limit?: number }
// Summarizes recent issues using qwen-turbo (Phase 1 AI — $0 extra cost)
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const limit = Math.min(body.limit ?? 10, 20);
  const specificIds: string[] | undefined = body.ids;

  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json({ error: 'Supabase unavailable' }, { status: 503 });
  }

  // Fetch issues to summarize
  let query = sb
    .from('issues_852')
    .select('id, title, body, category')
    .in('status', ['open', 'in_discussion'])
    .not('body', 'is', null)
    .order('created_at', { ascending: false });

  if (specificIds && specificIds.length > 0) {
    query = query.in('id', specificIds);
  } else {
    query = query.limit(limit);
  }

  const { data: issues, error } = await query;
  if (error || !issues) {
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
  }

  const { provider, modelId, pricing } = getModelConfig('news_summarization');
  const summaries: IssueSummary[] = [];
  let totalTokens = 0;

  for (const issue of issues) {
    if (!issue.body) continue;
    try {
      const result = await generateText({
        model: provider.chat(modelId),
        system:
          'Você é um assistente de resumo de notícias. Gere um resumo objetivo e neutro em português (máximo 2 frases, ~100 palavras) do texto fornecido. Não inclua introduções ou metadados.',
        messages: [
          {
            role: 'user',
            content: `Título: ${issue.title}\n\n${issue.body.slice(0, 2000)}`,
          },
        ],
        temperature: 0.2,
      });

      const tokens = result.usage?.totalTokens ?? 0;
      totalTokens += tokens;

      summaries.push({
        id: issue.id,
        title: issue.title,
        summary: result.text.trim(),
        category: issue.category,
        tokenUsed: tokens,
      });
    } catch (err) {
      console.error(`[summarize-news] failed for issue ${issue.id}:`, err);
    }
  }

  const totalCostUsd = (totalTokens / 1000) * pricing.input;

  recordEvent({
    event_type: 'news_summarization',
    model_id: modelId,
    status_code: 200,
  });

  return NextResponse.json({
    summaries,
    meta: {
      count: summaries.length,
      totalTokens,
      totalCostUsd: totalCostUsd.toFixed(6),
      modelId,
    },
  });
}
