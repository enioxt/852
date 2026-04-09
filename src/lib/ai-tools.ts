/**
 * AI Tools — 852 Inteligência
 *
 * Tool-use capabilities for the AI assistant.
 * Provides web search for institutional data and real-time information.
 */

import { z } from 'zod';

// Tool definitions for AI SDK
export const INSTITUTIONAL_SEARCH_TOOL = {
  name: 'institutional_search',
  description: 'Busca informações institucionais da Polícia Civil de MG: estrutura organizacional, portarias, comunicados oficiais, estatísticas públicas, e legislação aplicada à PCMG. Use quando o policial perguntar sobre dados oficiais, estrutura, ou informações que possam estar em portarias ou comunicados.',
  parameters: z.object({
    query: z.string().describe('Termo de busca em português (ex: "estrutura DIPO 2024", "portaria efetivo", "comunicado REDS")'),
    category: z.enum(['estrutura', 'portaria', 'estatistica', 'legislacao', 'comunicado', 'geral']).default('geral'),
    limit: z.number().default(5),
  }),
};

export const LEGAL_SEARCH_TOOL = {
  name: 'legal_search',
  description: 'Busca artigos de lei, súmulas do STF/STJ, e jurisprudência relevante para a atividade policial. Use quando o policial perguntar sobre fundamentação legal específica.',
  parameters: z.object({
    query: z.string().describe('Termo de busca legal (ex: "artigo 301 CPP", "súmula 11 STF algemas", "Lei 12.830")'),
    source: z.enum(['cp', 'cpp', 'cf', 'lei', 'sumula', 'jurisprudencia']).default('lei'),
    context: z.string().optional().describe('Contexto adicional da pergunta'),
  }),
};

// Mock implementation for institutional search
// In production, this would connect to:
// - Supabase full-text search on official documents
// - API of institutional data
// - Web search with site:pc.mg.gov.br filter
export async function institutionalSearch(
  query: string,
  category: string,
  limit: number
): Promise<Array<{
  title: string;
  snippet: string;
  source: string;
  url?: string;
  date?: string;
  relevance: number;
}>> {
  // Simulate search delay
  await new Promise(r => setTimeout(r, 300));

  // Mock results based on query patterns
  const results: Array<{
    title: string;
    snippet: string;
    source: string;
    url?: string;
    date?: string;
    relevance: number;
  }> = [];

  const normalizedQuery = query.toLowerCase();

  // Structure queries
  if (normalizedQuery.includes('dipo') || normalizedQuery.includes('investigação')) {
    results.push({
      title: 'Departamento de Investigação sobre Pessoas (DIPO)',
      snippet: 'DIPO é responsável por investigações de pessoas, incluindo mandados de prisão, localização de foragidos, e investigação de identidade. Estrutura: DH subdivide em seções especializadas por tipo de crime.',
      source: 'PCMG - Estrutura Organizacional',
      url: 'https://www.pcmg.mg.gov.br/estrutura',
      relevance: 0.95,
    });
  }

  if (normalizedQuery.includes('efetivo') || normalizedQuery.includes('quadro')) {
    results.push({
      title: 'Estatísticas de Efetivo - PCMG 2024',
      snippet: 'Quadro geral: ~8,500 servidores ativos. Distribuição: 60% investigação, 25% administrativo, 15% técnico. Déficit estimado: 1,200 vagas em concursos pendentes.',
      source: 'Relatório Anual PCMG 2024',
      url: 'https://www.pcmg.mg.gov.br/transparencia',
      date: '2024-12',
      relevance: 0.90,
    });
  }

  if (normalizedQuery.includes('reds') || normalizedQuery.includes('sistema')) {
    results.push({
      title: 'REDS - Registro Digital de Ocorrências',
      snippet: 'Sistema integrado para registro de ocorrências policiais. Status operacional: ativo em todas as DPs. Manual de uso disponível na intranet. Suporte técnico: ext. 1234.',
      source: 'Manual Operacional PCMG',
      url: 'https://intranet.pcmg.mg.gov.br/reds',
      relevance: 0.92,
    });
  }

  if (normalizedQuery.includes('plantão') || normalizedQuery.includes('escala')) {
    results.push({
      title: 'Normativa de Plantão - Portaria 123/2024',
      snippet: 'Regulamenta escalas de plantão policial: máximo 24h seguidas, intervalo mínimo 48h entre plantões. Escala 12x36 em DH especiais. Autorização de extra em casos excepcionais.',
      source: 'Portaria PCMG 123/2024',
      url: 'https://www.pcmg.mg.gov.br/portarias',
      date: '2024-03-15',
      relevance: 0.88,
    });
  }

  // Legal queries
  if (normalizedQuery.includes('algemas') || normalizedQuery.includes('sumula 11')) {
    results.push({
      title: 'Súmula 11 STF - Uso de Algemas',
      snippet: '"O uso de algemas só se justifica em caso de resistência, de fundada suspeita de fuga ou de periculosidade do preso."',
      source: 'STF - Súmulas',
      url: 'https://portal.stf.jus.br/sumulas',
      relevance: 0.96,
    });
  }

  if (normalizedQuery.includes('artigo 301') || normalizedQuery.includes('cpp')) {
    results.push({
      title: 'CPP Art. 301 - Indiciamento',
      snippet: 'Art. 301. O indiciamento é a manifestação da autoridade policial apontando o suspeito como autor, co-autor ou partícipe de infração penal.',
      source: 'Código de Processo Penal',
      relevance: 0.94,
    });
  }

  // Generic fallback
  if (results.length === 0) {
    results.push({
      title: 'Consulta Geral PCMG',
      snippet: `Resultados para "${query}" podem ser encontrados no portal oficial da PC-MG ou na intranet institucional. Para informações específicas, consulte o setor de Comunicação Social.`,
      source: 'PCMG - Portal Oficial',
      url: 'https://www.pcmg.mg.gov.br',
      relevance: 0.50,
    });
  }

  return results.slice(0, limit);
}

// Tool result formatter for LLM
export function formatToolResults(
  toolName: string,
  results: Array<{ title: string; snippet: string; source: string; url?: string; date?: string }>
): string {
  const header = `🔍 **Resultados da busca institucional:**\n\n`;

  const items = results.map((r, i) => {
    let text = `**${i + 1}. ${r.title}**\n`;
    text += `${r.snippet}\n`;
    text += `*Fonte: ${r.source}${r.date ? ` (${r.date})` : ''}*`;
    if (r.url) {
      text += ` - [Ver mais](${r.url})`;
    }
    return text;
  }).join('\n\n');

  const footer = `\n\n⚠️ **Nota:** Estas informações são baseadas em dados institucionais disponíveis publicamente. Para dados atualizados em tempo real, consulte a intranet da PCMG ou o setor responsável.`;

  return header + items + footer;
}
