import { generateText } from 'ai';
import { getModelConfig } from '@/lib/ai-provider';
import { buildReviewPrompt } from '@/lib/prompt';
import { recordEvent } from '@/lib/telemetry';

export async function generateAutoReport(messages: Array<{ role?: string; content?: string }>) {
  try {
    const { provider, modelId } = getModelConfig('review');
    
    // Build transcript clamping to safe context window (~30k chars)
    const transcript = messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
      .map((m) => `${m.role === 'user' ? 'POLICIAL' : 'AGENTE'}: ${m.content}`)
      .join('\n')
      .slice(-30000);

    const result = await generateText({
      model: provider.chat(modelId),
      system: buildReviewPrompt(),
      messages: [{ role: 'user', content: `Leia a conversa abaixo e extraia estritamente os dados estruturados no formato JSON exigido (SEM markdown adicional):\n\n${transcript}` }],
      temperature: 0.1,
    });

    let jsonText = result.text.trim();
    jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('LLM did not return JSON');
    }

    let cleaned = jsonMatch[0]
      .replace(/[\r\n]+/g, ' ')
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']');
      
    const parsed = JSON.parse(cleaned);

    recordEvent({
      event_type: 'report_review',
      model_id: modelId,
      status_code: 200,
    });

    return parsed;
  } catch (error) {
    console.error('[852-auto-report] failed to parse auto report JSON', error);
    return null;
  }
}
