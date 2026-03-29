/**
 * AI SDK tool: buscar_legislacao
 * Searches the embedded law/normative database and optionally Brave Search API.
 * Server-side only — executed via streamText maxSteps, never reaches the browser.
 */

import { tool } from 'ai';
import { z } from 'zod';

interface LawEntry {
  id: string;
  name: string;
  description: string;
  tags: string[];
  url: string;
  category: string;
}

// Compact reference db — same data as /legislacao page
const LAW_DB: LawEntry[] = [
  {
    id: 'cp', name: 'Código Penal (Decreto-Lei 2.848/1940)',
    description: 'Define crimes e penas. Base para tipificação de qualquer infração penal no trabalho policial.',
    tags: ['crime', 'pena', 'tipificação', 'homicídio', 'furto', 'roubo', 'lesão', 'estupro'],
    url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm', category: 'federal',
  },
  {
    id: 'cpp', name: 'Código de Processo Penal (Decreto-Lei 3.689/1941)',
    description: 'Regula inquéritos, prisões, flagrante, busca e apreensão, audiências e todo o rito processual penal.',
    tags: ['inquérito', 'flagrante', 'prisão', 'busca', 'apreensão', 'delegacia', 'processo', 'auto de prisão'],
    url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm', category: 'federal',
  },
  {
    id: 'lep', name: 'Lei de Execução Penal (Lei 7.210/1984)',
    description: 'Normas para execução da pena privativa de liberdade. Regula carceragem, regime, progressão.',
    tags: ['pena', 'regime', 'progressão', 'carceragem', 'preso', 'execução', 'penitenciária'],
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l7210.htm', category: 'federal',
  },
  {
    id: 'eca', name: 'ECA — Estatuto da Criança e do Adolescente (Lei 8.069/1990)',
    description: 'Proteção de crianças e adolescentes. Ato infracional, medida socioeducativa, acolhimento.',
    tags: ['menor', 'criança', 'adolescente', 'eca', 'ato infracional', 'conselho tutelar', 'abuso'],
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l8069.htm', category: 'federal',
  },
  {
    id: 'interceptacao', name: 'Lei de Interceptação Telefônica (Lei 9.296/1996)',
    description: 'Autoriza escutas telefônicas mediante ordem judicial. Requisitos, vedações e procedimento.',
    tags: ['interceptação', 'escuta', 'telefone', 'judicial', 'grampo', 'telemática'],
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l9296.htm', category: 'federal',
  },
  {
    id: 'tortura', name: 'Lei de Tortura (Lei 9.455/1997)',
    description: 'Define crime de tortura. Imprescritível e inafiançável. Policial pode responder penalmente.',
    tags: ['tortura', 'maus tratos', 'abuso', 'violência policial', 'imprescritível', 'inafiançável'],
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l9455.htm', category: 'federal',
  },
  {
    id: 'estatuto_armas', name: 'Estatuto do Desarmamento (Lei 10.826/2003)',
    description: 'Regula porte, registro e apreensão de armas. Define crimes relacionados a armas de fogo.',
    tags: ['arma', 'porte', 'registro', 'apreensão', 'munição', 'cano', 'ilegal', 'CAC'],
    url: 'https://www.planalto.gov.br/ccivil_03/leis/2003/l10.826.htm', category: 'federal',
  },
  {
    id: 'maria_da_penha', name: 'Lei Maria da Penha (Lei 11.340/2006)',
    description: 'Violência doméstica e familiar contra a mulher. Medidas protetivas, flagrante obrigatório.',
    tags: ['violência doméstica', 'mulher', 'maria da penha', 'medida protetiva', 'feminicídio', 'afastamento'],
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11340.htm', category: 'federal',
  },
  {
    id: 'drogas', name: 'Lei de Drogas (Lei 11.343/2006)',
    description: 'Combate ao tráfico de entorpecentes. Distingue usuário de traficante. Polícias Judiciárias.',
    tags: ['droga', 'tráfico', 'entorpecente', 'usuário', 'crack', 'cocaína', 'cannabis', 'apreensão', 'delegacia'],
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11343.htm', category: 'federal',
  },
  {
    id: 'organizacao_criminosa', name: 'Lei de Organizações Criminosas (Lei 12.850/2013)',
    description: 'Define organização criminosa, infiltração policial, colaboração premiada e medidas especiais.',
    tags: ['organização criminosa', 'infiltração', 'colaboração premiada', 'delação', 'ORCRIM'],
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12850.htm', category: 'federal',
  },
  {
    id: 'investigacao_criminal', name: 'Lei do Delegado (Lei 12.830/2013)',
    description: 'Atribuições exclusivas do Delegado de Polícia. Investigação criminal, sigilo, inquérito.',
    tags: ['delegado', 'investigação', 'inquérito', 'privativo', 'atribuição', 'indiciamento'],
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12830.htm', category: 'federal',
  },
  {
    id: 'feminicidio', name: 'Lei do Feminicídio (Lei 13.104/2015)',
    description: 'Qualificadora de homicídio quando vítima é mulher em razão de condição do sexo feminino.',
    tags: ['feminicídio', 'homicídio', 'qualificadora', 'mulher', 'violência de gênero'],
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13104.htm', category: 'federal',
  },
  {
    id: 'lgpd', name: 'LGPD — Lei Geral de Proteção de Dados (Lei 13.709/2018)',
    description: 'Proteção de dados pessoais. Relevante para tratamento de dados em inquéritos e sistemas policiais.',
    tags: ['lgpd', 'dados pessoais', 'privacidade', 'sistema', 'sigilo', 'proteção'],
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm', category: 'federal',
  },
  {
    id: 'abuso_autoridade', name: 'Lei de Abuso de Autoridade (Lei 13.869/2019)',
    description: 'Crimes de abuso de autoridade praticados por agentes públicos, inclusive policiais. Impacto direto na rotina.',
    tags: ['abuso de autoridade', 'ilegalidade', 'constrangimento', 'policial', 'agente público', 'crime funcional'],
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/L13869.htm', category: 'federal',
  },
  {
    id: 'pacote_anticrime', name: 'Pacote Anticrime (Lei 13.964/2019)',
    description: 'Reformas no CP, CPP e LEP. Juiz das garantias, cadeia de custódia, acordo de não persecução penal.',
    tags: ['anticrime', 'juiz de garantias', 'cadeia de custódia', 'ANPP', 'legítima defesa', 'excludente'],
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13964.htm', category: 'federal',
  },
  {
    id: 'lei_organica_pcmg', name: 'Lei Orgânica da PCMG (Lei Estadual 5.406/1969)',
    description: 'Estrutura, atribuições e carreira da Polícia Civil de Minas Gerais.',
    tags: ['pcmg', 'lei orgânica', 'carreira', 'estrutura', 'delegado', 'escrivão', 'investigador', 'perito'],
    url: 'https://www.almg.gov.br/legislacao-mineira/texto/LEI/5406/1969/', category: 'estadual',
  },
  {
    id: 'estatuto_servidores_mg', name: 'Estatuto dos Servidores Civis de MG (Lei 869/1952)',
    description: 'Direitos e deveres dos servidores estaduais, incluindo policiais civis. Licenças, férias, disciplina.',
    tags: ['estatuto', 'servidor', 'férias', 'licença', 'disciplina', 'demissão', 'processo administrativo'],
    url: 'https://www.almg.gov.br/legislacao-mineira/texto/LEI/869/1952/', category: 'estadual',
  },
  {
    id: 'sumula_vinculante_11', name: 'Súmula Vinculante 11 — STF (Algemas)',
    description: 'Uso de algemas só permitido em casos de resistência e fundado receio de fuga ou perigo. Obriga fundamentação.',
    tags: ['algemas', 'uso de força', 'resistência', 'fuga', 'constrangimento', 'fundamentação', 'stf'],
    url: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1220', category: 'sumula',
  },
  {
    id: 'sumula_vinculante_14', name: 'Súmula Vinculante 14 — STF (Acesso ao Inquérito)',
    description: 'Defensor tem direito de acesso a diligências já documentadas no inquérito, não às em andamento.',
    tags: ['inquérito', 'advogado', 'defensor', 'sigilo', 'acesso', 'diligência', 'stf'],
    url: 'https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=26&sumula=1220', category: 'sumula',
  },
  {
    id: 'resolucao_ssp_efetivo', name: 'Resolução SSP-MG — Gestão de Efetivo',
    description: 'Normas sobre lotação, transferência e gestão de efetivo da PCMG.',
    tags: ['efetivo', 'lotação', 'transferência', 'ssp', 'delegacia', 'gestão', 'remanejamento'],
    url: 'https://www.seguranca.mg.gov.br/legislacao', category: 'normativa',
  },
  {
    id: 'reds', name: 'REDS — Registro de Eventos de Defesa Social',
    description: 'Sistema integrado de registro de ocorrências usado pela PCMG, PMMG, CBMMG e SEDS.',
    tags: ['reds', 'registro', 'ocorrência', 'bo', 'boletim', 'sistema', 'integrado'],
    url: 'https://www.seguranca.mg.gov.br', category: 'normativa',
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function scoreLaw(law: LawEntry, terms: string[]): number {
  let score = 0;
  const lawText = normalize(`${law.name} ${law.description} ${law.tags.join(' ')}`);
  for (const term of terms) {
    if (normalize(law.name).includes(term)) score += 3;
    if (normalize(law.description).includes(term)) score += 2;
    if (law.tags.some((t) => normalize(t).includes(term))) score += 2;
    if (lawText.includes(term)) score += 1;
  }
  return score;
}

function searchLaws(query: string, topK = 4): LawEntry[] {
  const terms = normalize(query).split(/\s+/).filter((t) => t.length >= 3);
  if (terms.length === 0) return LAW_DB.slice(0, topK);

  return LAW_DB.map((law) => ({ law, score: scoreLaw(law, terms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ law }) => law);
}

async function braveWebSearch(query: string, apiKey: string): Promise<Array<{ title: string; url: string; snippet: string }>> {
  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query + ' site:planalto.gov.br OR site:almg.gov.br OR site:seguranca.mg.gov.br OR site:stf.jus.br')}&count=3&country=br&search_lang=pt`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results = data?.web?.results || [];
    return results.map((r: { title?: string; url?: string; description?: string }) => ({
      title: r.title || '',
      url: r.url || '',
      snippet: r.description || '',
    }));
  } catch {
    return [];
  }
}

export const searchLegislationTool = tool({
  description:
    'Busca leis, normativas, súmulas e protocolos relevantes para policiais civis de Minas Gerais. ' +
    'Use quando o policial perguntar sobre base legal de procedimentos, direitos, obrigações, ou referenciar uma lei específica. ' +
    'Retorna os artigos/leis mais relevantes com links oficiais.',
  parameters: z.object({
    query: z
      .string()
      .describe(
        'Termos de busca. Ex: "prisão em flagrante", "uso de algemas", "Lei Maria da Penha", "MASP lotação", "REDS ocorrência"'
      ),
  }),
  execute: async ({ query }) => {
    const laws = searchLaws(query);

    // Try Brave search if API key available
    const braveKey = process.env.BRAVE_SEARCH_API_KEY;
    let webResults: Array<{ title: string; url: string; snippet: string }> = [];
    if (braveKey && query.trim().length >= 4) {
      webResults = await braveWebSearch(query, braveKey);
    }

    if (laws.length === 0 && webResults.length === 0) {
      return {
        found: false,
        message: `Nenhuma referência encontrada para "${query}" na base local. Consulte diretamente o Planalto ou a ALMG.`,
      };
    }

    return {
      found: true,
      localResults: laws.map((l) => ({
        name: l.name,
        description: l.description,
        url: l.url,
        category: l.category,
        tags: l.tags.slice(0, 5),
      })),
      webResults: webResults.slice(0, 3),
    };
  },
});
