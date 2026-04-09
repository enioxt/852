/**
 * Proactive Collaboration Suggestions — 852 Inteligência
 *
 * Suggests topics and themes to users during conversation
 * when they seem hesitant or don't know where to start.
 */

export interface ProactiveSuggestion {
  id: string;
  category: 'tema' | 'pergunta' | 'recurso' | 'referencia';
  text: string;
  trigger: string; // keywords that trigger this suggestion
  priority: number; // 1-10
}

// Curated suggestions for police officers
const PROACTIVE_SUGGESTIONS: ProactiveSuggestion[] = [
  // Temas comuns de relatos
  {
    id: 'tema-efetivo',
    category: 'tema',
    text: 'Falta de efetivo na unidade — escala desfalcada, plantões sobrecarregados',
    trigger: 'efetivo,gente,pessoal,quadro,escala,plantão',
    priority: 9,
  },
  {
    id: 'tema-viatura',
    category: 'tema',
    text: 'Frota de viaturas — carros quebrados, falta de manutenção, poucos veículos',
    trigger: 'viatura,carro,frota,manutenção,combustível,veículo',
    priority: 8,
  },
  {
    id: 'tema-sistema',
    category: 'tema',
    text: 'Sistemas de informática — REDS lento, senhas expirando, computadores antigos',
    trigger: 'sistema,REDS,computador,senha,login,internet,rede',
    priority: 8,
  },
  {
    id: 'tema-infraestrutura',
    category: 'tema',
    text: 'Infraestrutura da delegacia — espaço físico, climatização, segurança',
    trigger: 'prédio,sala,infraestrutura,ar condicionado,elevador,banheiro,segurança',
    priority: 7,
  },
  {
    id: 'tema-armamento',
    category: 'tema',
    text: 'Armamento e equipamentos — armas, munição, coletes, rádios',
    trigger: 'arma,munição,colete,rádio,equipamento,tático',
    priority: 7,
  },
  {
    id: 'tema-carreira',
    category: 'tema',
    text: 'Progressão e promoção — concurso, ascensão, progressão vertical',
    trigger: 'carreira,promoção,concurso,progressão,ascensão,cargo',
    priority: 6,
  },
  {
    id: 'tema-saude',
    category: 'tema',
    text: 'Saúde mental e bem-estar — estresse, burnout, apoio psicológico',
    trigger: 'saúde,estresse,ansiedade,depressão,psicólogo, burnout',
    priority: 9,
  },
  // Perguntas-gatilho
  {
    id: 'pergunta-como-comecar',
    category: 'pergunta',
    text: 'Você quer relatar um problema específico ou só desabafar sobre a rotina?',
    trigger: 'não sei,por onde,começar,desabafar,conversar',
    priority: 10,
  },
  {
    id: 'pergunta-unidade',
    category: 'pergunta',
    text: 'O problema é na sua unidade atual ou é algo mais geral da corporação?',
    trigger: 'unidade,delegacia,setor,local,geral',
    priority: 8,
  },
  // Recursos
  {
    id: 'recurso-legislacao',
    category: 'recurso',
    text: 'Você pode consultar leis e súmulas relevantes na nossa Biblioteca Jurídica em /legislacao',
    trigger: 'lei,artigo,legal,consultar,norma,estatuto,código',
    priority: 6,
  },
  {
    id: 'recurso-sugestao',
    category: 'recurso',
    text: 'Você pode enviar uma sugestão direta (sem precisar conversar com a IA) em /sugestao',
    trigger: 'sugestão,enviar,relato,ideia,proposta,feedback',
    priority: 7,
  },
  // Referências externas
  {
    id: 'referencia-claude',
    category: 'referencia',
    text: 'Para questões complexas ou análises jurídicas detalhadas, você pode usar Claude (Anthropic) ou consultar um advogado.',
    trigger: 'complexo,jurídico,detalhado,análise,interpretar,confirmar',
    priority: 5,
  },
  {
    id: 'referencia-gemini',
    category: 'referencia',
    text: 'Para pesquisas rápidas ou síntese de documentos, o Google Gemini pode ser útil.',
    trigger: 'pesquisa,sintetizar,resumir,googlear,procurar',
    priority: 5,
  },
];

/**
 * Check if user input indicates hesitation or lack of direction
 */
export function detectHesitation(text: string): boolean {
  const hesitationPatterns = [
    /não sei/i,
    /não tenho certeza/i,
    /por onde (começo|começar|start)/i,
    /não sei o que falar/i,
    /não sei por onde/i,
    /só queria desabafar/i,
    /só conversar/i,
    /testando/i,
    /oi|olá|hey|hello$/i, // Just greeting with nothing else
  ];

  return hesitationPatterns.some(pattern => pattern.test(text));
}

/**
 * Get relevant suggestions based on user input
 */
export function getProactiveSuggestions(userText: string): ProactiveSuggestion[] {
  const normalized = userText.toLowerCase();
  const matches: ProactiveSuggestion[] = [];

  for (const suggestion of PROACTIVE_SUGGESTIONS) {
    const triggers = suggestion.trigger.split(',');
    const hasMatch = triggers.some(trigger => normalized.includes(trigger.toLowerCase()));

    if (hasMatch) {
      matches.push(suggestion);
    }
  }

  // Sort by priority and limit to top 3
  return matches
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);
}

/**
 * Format suggestions for chat display
 */
export function formatSuggestionsForChat(suggestions: ProactiveSuggestion[]): string {
  if (suggestions.length === 0) return '';

  const lines = suggestions.map(s => {
    if (s.category === 'tema') {
      return `💡 **${s.text}** — quer falar sobre isso?`;
    }
    if (s.category === 'pergunta') {
      return `❓ ${s.text}`;
    }
    if (s.category === 'recurso') {
      return `🔗 ${s.text}`;
    }
    if (s.category === 'referencia') {
      return `🤖 ${s.text}`;
    }
    return `• ${s.text}`;
  });

  return '\n\n' + lines.join('\n');
}

/**
 * Generate a proactive message when user seems hesitant
 */
export function generateHesitationHelp(): string {
  const openers = [
    'Sem problema! Aqui estão alguns temas que outros policiais têm relatado:',
    'Entendo. Posso ajudar com algumas sugestões de onde começar:',
    'Fique à vontade. Veja se algum desses temas te interessa:',
    'Tudo bem não saber por onde começar. Que tal um desses assuntos?',
  ];

  const randomOpener = openers[Math.floor(Math.random() * openers.length)];

  // Get top 3 tema suggestions
  const temas = PROACTIVE_SUGGESTIONS
    .filter(s => s.category === 'tema')
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);

  const temaList = temas.map(t => `• ${t.text}`).join('\n');

  return `${randomOpener}\n\n${temaList}\n\nOu se preferir, pode só desabafar. Estou aqui para ouvir.`;
}

/**
 * Check if we should suggest external LLM for complex queries
 */
export function shouldSuggestExternalLLM(userText: string): boolean {
  const complexPatterns = [
    /análise jurídica/i,
    /interpretação de lei/i,
    /artigo \d+ do cp|cpp|constituição/i,
    /súmula \d+/i,
    /precedente/i,
    /jurisprudência/i,
    /doutrina/i,
    /tese/i,
    /dissertação/i,
    /artigo científico/i,
    /pesquisa extensa/i,
    /documento longo/i,
  ];

  return complexPatterns.some(pattern => pattern.test(userText));
}

/**
 * Get external LLM suggestion message
 */
export function getExternalLLMSuggestion(): string {
  return `🤖 **Sugestão:** Para essa questão mais complexa, você pode considerar usar:\n\n• **Claude (Anthropic)** — excelente para análise jurídica detalhada e documentos longos\n• **ChatGPT (OpenAI)** — bom para pesquisa e síntese de informações\n• **Gemini (Google)** — útil para integração com documentos do Workspace\n\nO Tira-Voz é focado em escuta protegida e registro estruturado de problemas operacionais. Para análises jurídicas profundas, essas ferramentas podem complementar.`;
}
