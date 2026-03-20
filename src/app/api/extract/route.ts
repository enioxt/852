import { generateText } from 'ai';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { getModelConfig, hasAvailableProvider } from '@/lib/ai-provider';
import { recordEvent } from '@/lib/telemetry';

export const maxDuration = 30;
const EXTRACT_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 };

export async function POST(req: Request) {
  try {
    if (!hasAvailableProvider()) {
      return new Response(JSON.stringify({ error: 'Nenhum provedor de IA configurado.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ip = getClientIp(req.headers);
    const rate = checkRateLimit(`extract:${ip}`, EXTRACT_LIMIT.limit, EXTRACT_LIMIT.windowMs);

    if (!rate.allowed) {
      return new Response(JSON.stringify({ error: 'Muitas análises em pouco tempo. Aguarde.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const content = body?.content;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return new Response(JSON.stringify({ error: 'Conteúdo vazio para análise.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Dynamic model routing (similar to Chat orchestration)
    let { provider, modelId } = getModelConfig('review');
    if (content.length > 8000) {
      const configObj = getModelConfig('intelligence_report');
      provider = configObj.provider;
      modelId = configObj.modelId;
    }

    const systemPrompt = `Você é um analista de dados e classificação da Polícia Civil. 
Sua tarefa é ler um relato bruto e extrair o título, a categoria, as tags e um resumo técnico estruturado.

CATEGORIAS PERMITIDAS EXATAS: "tecnologia", "infraestrutura", "efetivo", "plantao", "procedimento", "integracao", "legislacao", "outro".

Regras:
1. title: Um título claro e profissional (máx 50 caracteres).
2. category: Escolha EXATAMENTE UMA das categorias permitidas acima. Se não tiver certeza, use "outro".
3. tags: Escolha entre 2 a 5 palavras-chave relevantes (somente minúsculas, separadas por vírgula).
4. completude: Nota de 0 a 10 de quão completo é o relato.
5. resumo: Resumo conciso de até 3 linhas (sempre na terceira pessoa ou impessoal).
6. sugestoes: Um array de 1 ou 2 sugestões para melhorar o relato ou dúvidas a serem sanadas.

Sua resposta DEVE SER UM JSON VÁLIDO. NÃO INCLUA NADA FORA DO JSON. Formato esperado:
{
  "title": "",
  "category": "",
  "tags": [],
  "completude": 0,
  "resumo": "",
  "sugestoes": [""]
}`;

    const clampedContent = content.slice(0, 32000);

    const result = await generateText({
      model: provider.chat(modelId),
      system: systemPrompt,
      messages: [{ role: 'user', content: `Analise o relato abaixo:\n\n${clampedContent}` }],
      temperature: 0.1,
    });

    recordEvent({
      event_type: 'report_review',
      model_id: modelId,
      status_code: 200,
    });

    // Extract JSON safely
    let jsonText = result.text.trim();
    jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('LLM did not return JSON');
    }

    let cleaned = jsonMatch[0]
      .replace(/[\r\n]+/g, ' ')
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/'/g, '"')
      .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');

    const parsed = JSON.parse(cleaned);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    recordEvent({ event_type: 'report_error', error_message: detail, status_code: 500 });
    return new Response(JSON.stringify({ error: 'Falha na extração por IA.', detail }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
