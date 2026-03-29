import { generateText } from 'ai';
import { getModelConfig, hasAvailableProvider } from '@/lib/ai-provider';
import { searchIssuesAndReports } from '@/lib/correlate';
import { checkRateLimit } from '@/lib/rate-limit';
import { ensureConfigLoaded } from '@/lib/config-store';

export async function POST(req: Request) {
  await ensureConfigLoaded();
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const limited = checkRateLimit(`correlate:${ip}`, 20, 60_000);
  if (limited) {
    return Response.json({ error: 'Muitas requisições. Aguarde um momento.' }, { status: 429 });
  }

  try {
    const { text, context } = (await req.json()) as {
      text?: string;
      context?: 'chat' | 'suggestion' | 'report';
    };

    if (!text || text.trim().length < 30) {
      return Response.json({ suggestedTags: [], relatedIssues: [], relatedReports: [] });
    }

    const trimmed = text.slice(0, 2000);

    // Step 1: Extract tags via AI (if provider available)
    let aiTags: string[] = [];
    if (hasAvailableProvider()) {
      try {
        const config = getModelConfig('correlation');
        const { text: tagResponse } = await generateText({
          model: config.provider.chat(config.modelId),
          system: `Você é um classificador de temas para a Polícia Civil de Minas Gerais.
Dado um texto de um policial, extraia de 3 a 8 tags curtas (1-3 palavras cada) que descrevam os temas principais.
As tags devem ser em português, minúsculas, sem acentos, separadas por vírgula.
Priorize termos operacionais policiais quando aplicável.
Responda APENAS com as tags separadas por vírgula, sem explicação.
Exemplo: efetivo, plantao, tecnologia, integracao sistemas, sobrecarga`,
          prompt: trimmed,
        });
        aiTags = tagResponse
          .split(',')
          .map((t) => t.trim().toLowerCase().slice(0, 40))
          .filter((t) => t.length >= 2 && t.length <= 40)
          .slice(0, 8);
      } catch (e) {
        console.error('[852-correlate] AI tag extraction failed:', e);
      }
    }

    // Step 2: Search existing issues and reports using keywords from text + AI tags
    const keywords = extractKeywords(trimmed);
    const searchTerms = [...new Set([...aiTags, ...keywords])].slice(0, 12);

    const { issues, reports } = await searchIssuesAndReports(searchTerms, 10);

    return Response.json({
      suggestedTags: aiTags,
      relatedIssues: issues,
      relatedReports: reports,
      context: context || 'suggestion',
    });
  } catch (error) {
    console.error('[852-correlate] error:', error);
    return Response.json({ error: 'Falha na correlação.' }, { status: 500 });
  }
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'que', 'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas',
    'com', 'por', 'para', 'uma', 'um', 'uns', 'umas', 'como', 'mas', 'mais',
    'ou', 'se', 'ao', 'aos', 'pela', 'pelo', 'pelas', 'pelos', 'entre',
    'isso', 'este', 'esta', 'esse', 'essa', 'aquele', 'aquela', 'muito',
    'tem', 'ter', 'ser', 'foi', 'são', 'está', 'estão', 'ele', 'ela',
    'nao', 'não', 'sim', 'quando', 'onde', 'porque', 'sobre', 'tambem',
    'também', 'pode', 'podem', 'deve', 'devem', 'seria', 'poderia',
    'precisa', 'precisam', 'fazer', 'feito', 'toda', 'todo', 'todos',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-záàâãéèêíïóôõöúüç\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stopWords.has(w))
    .reduce((acc, word) => {
      if (!acc.includes(word)) acc.push(word);
      return acc;
    }, [] as string[])
    .slice(0, 8);
}
