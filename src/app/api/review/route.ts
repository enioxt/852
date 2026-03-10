import { streamText } from 'ai';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { getProvider, getModelId, hasAvailableProvider } from '@/lib/ai-provider';
import { recordEvent } from '@/lib/telemetry';

export const maxDuration = 30;

const REVIEW_LIMIT = { limit: 6, windowMs: 10 * 60 * 1000 };

const REVIEW_PROMPT = `Você é um analista de qualidade do Agente 852 — sistema de inteligência institucional da Polícia Civil de Minas Gerais.

Sua tarefa: analisar uma conversa entre um policial e o Agente 852 e fornecer uma avaliação estruturada.

## REGRAS
1. NUNCA cite nomes, CPFs, REDS, ou dados pessoais — mesmo que apareçam na conversa.
2. Foque em padrões sistêmicos, não em casos individuais.
3. Seja objetivo e construtivo.

## FORMATO DE RESPOSTA (JSON)
Responda APENAS com um JSON válido, sem texto adicional:
{
  "completude": <número 1-10>,
  "resumo": "<resumo executivo em 2-3 frases do que foi relatado>",
  "temas": ["<tema 1>", "<tema 2>"],
  "pontosCegos": ["<área não explorada 1>", "<área não explorada 2>"],
  "sugestoes": ["<pergunta sugerida ao policial 1>", "<pergunta sugerida 2>"],
  "impacto": "<análise breve do impacto potencial deste relato para a inteligência institucional>"
}

## CAMPOS
- completude: nota de 1 a 10 para quão completo/detalhado está o relato
- resumo: síntese do que o policial relatou
- temas: categorias/temas identificados (ex: infraestrutura, efetivo, assédio, tecnologia, processo)
- pontosCegos: áreas que o policial NÃO explorou mas poderiam enriquecer o relato
- sugestoes: perguntas concretas que o policial poderia responder para completar o relato
- impacto: relevância do relato para mapeamento de problemas estruturais`;

export async function POST(req: Request) {
  try {
    if (!hasAvailableProvider()) {
      return new Response(JSON.stringify({ error: 'Nenhum provedor de IA configurado.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ip = getClientIp(req.headers);
    const rate = checkRateLimit(`review:${ip}`, REVIEW_LIMIT.limit, REVIEW_LIMIT.windowMs);

    if (!rate.allowed) {
      return new Response(JSON.stringify({ error: 'Muitas revisões em pouco tempo. Aguarde.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const messages = body?.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Nenhuma mensagem para analisar.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Format conversation for analysis
    const conversationText = messages
      .slice(-20)
      .map((m: { role: string; content: string }) =>
        `[${m.role === 'user' ? 'Policial' : '852-IA'}]: ${m.content.slice(0, 2000)}`
      )
      .join('\n\n');

    const provider = getProvider();
    const modelId = getModelId();

    const result = streamText({
      model: provider.chat(modelId),
      system: REVIEW_PROMPT,
      messages: [{ role: 'user', content: `Analise esta conversa:\n\n${conversationText}` }],
      temperature: 0.3,
      onFinish: async () => {
        recordEvent({
          event_type: 'report_generation',
          model_id: modelId,
          status_code: 200,
          metadata: { type: 'conversation_review', messageCount: messages.length },
        });
      },
    });

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    recordEvent({ event_type: 'report_error', error_message: detail, status_code: 500 });
    return new Response(JSON.stringify({ error: 'Falha na revisão.', detail }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
