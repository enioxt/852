import { generateText } from 'ai';
import { getModelConfig } from '@/lib/ai-provider';
import { getSupabase } from '@/lib/supabase';
import { buildConversationSummaryPrompt } from '@/lib/prompt';

const MAX_MEMORY_ITEMS = 3;

export async function summarizeConversation(messages: Array<{ role: string; content: string }>): Promise<string | null> {
  if (messages.length < 4) return null;

  try {
    const { provider, modelId } = getModelConfig('conversation_summary');
    const transcript = messages
      .slice(-12)
      .map((message) => `${message.role === 'user' ? 'POLICIAL' : 'AGENTE'}: ${message.content.slice(0, 400)}`)
      .join('\n');

    const result = await generateText({
      model: provider.chat(modelId),
      system: buildConversationSummaryPrompt(),
      prompt: transcript,
      temperature: 0.2,
    });

    return result.text.trim().slice(0, 1200) || null;
  } catch (error) {
    console.error('[852-memory] summarizeConversation failed:', error instanceof Error ? error.message : 'Unknown');
    return null;
  }
}

export async function saveConversationSummary(conversationId: string, summary: string): Promise<void> {
  const sb = getSupabase();
  if (!sb || !summary.trim()) return;

  const { data: current } = await sb
    .from('conversations_852')
    .select('metadata')
    .eq('id', conversationId)
    .maybeSingle();

  const metadata = {
    ...(current?.metadata && typeof current.metadata === 'object' ? current.metadata : {}),
    summary,
    summaryUpdatedAt: new Date().toISOString(),
  };

  await sb
    .from('conversations_852')
    .update({ metadata, updated_at: new Date().toISOString() })
    .eq('id', conversationId);
}

export async function getConversationMemory(identityKey: string | null): Promise<string | null> {
  const sb = getSupabase();
  if (!sb || !identityKey) return null;

  const { data, error } = await sb
    .from('conversations_852')
    .select('title, metadata, updated_at')
    .eq('session_hash', identityKey)
    .order('updated_at', { ascending: false })
    .limit(MAX_MEMORY_ITEMS);

  if (error || !data?.length) return null;

  const summaries = data
    .map((row) => {
      const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata as Record<string, unknown> : {};
      const summary = typeof metadata.summary === 'string' ? metadata.summary.trim() : '';
      if (!summary) return null;
      const title = typeof row.title === 'string' && row.title.trim() ? row.title.trim() : 'Conversa anterior';
      return `- ${title}: ${summary}`;
    })
    .filter(Boolean)
    .join('\n');

  if (!summaries) return null;

  return [
    '## MEMÓRIA DE SESSÕES ANTERIORES (use apenas como contexto, sem afirmar como fato novo)',
    summaries,
    'Se algo parecer desatualizado, confirme com o policial antes de assumir continuidade.',
  ].join('\n');
}
