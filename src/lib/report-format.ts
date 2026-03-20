export interface ReviewData {
  titulo?: string;
  completude: number;
  resumo: string;
  temas: string[];
  pontosCegos: string[];
  sugestoes: string[];
  impacto: string;
  insights_estruturais?: string[];
}

export interface ReportFormatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface FormattedReport {
  title: string;
  summary: string;
  tags: string[];
  markdown: string;
  plainText: string;
  shareText: string;
}

const TAG_ALIASES: Record<string, string> = {
  infraestrutura: 'infraestrutura',
  estrutura: 'infraestrutura',
  efetivo: 'efetivo',
  pessoal: 'efetivo',
  assedio: 'assedio',
  assédio: 'assedio',
  plantao: 'plantao',
  plantão: 'plantao',
  carreira: 'carreira',
  tecnologia: 'tecnologia',
  sistema: 'tecnologia',
  sistemas: 'tecnologia',
  helios: 'tecnologia',
  integração: 'tecnologia',
  integracao: 'tecnologia',
  escala: 'plantao',
  sobrecarga: 'efetivo',
  viatura: 'infraestrutura',
  equipamento: 'infraestrutura',
};

const KEYWORD_TAGS: Array<{ tag: string; pattern: RegExp }> = [
  { tag: 'infraestrutura', pattern: /viatura|predio|pr[eé]dio|equipamento|estrutura|sala|cadeira|computador|impressora/i },
  { tag: 'efetivo', pattern: /efetivo|sobrecarga|equipe reduzida|falta de pessoal|ac[uú]mulo/i },
  { tag: 'plantao', pattern: /plant[aã]o|escala|turno|hora extra|carga hor[aá]ria/i },
  { tag: 'carreira', pattern: /carreira|promo[cç][aã]o|progress[aã]o|sal[aá]rio|remunera[cç][aã]o/i },
  { tag: 'tecnologia', pattern: /sistema|helio[s]?|tecnologia|integra[cç][aã]o|login|rede|travando/i },
  { tag: 'assedio', pattern: /ass[eé]dio|humilha[cç][aã]o|amea[cç]a|press[aã]o indevida/i },
];

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function normalizeTag(value: string) {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  return TAG_ALIASES[normalized] || normalized || 'outro';
}

function inferTags(messages: ReportFormatMessage[]) {
  const text = messages
    .filter((message) => message.role === 'user')
    .map((message) => message.content)
    .join('\n');

  const tags = new Set<string>();
  for (const { tag, pattern } of KEYWORD_TAGS) {
    if (pattern.test(text)) tags.add(tag);
  }

  return tags.size > 0 ? Array.from(tags) : ['outro'];
}

function compactText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function buildTitle(tags: string[], summary: string, reviewTitle?: string) {
  if (reviewTitle && reviewTitle.trim()) {
    return reviewTitle.trim();
  }

  if (summary) {
    const firstSentence = compactText(summary).split('.').find(Boolean)?.trim();
    if (firstSentence) {
      return firstSentence.length > 90 ? `${firstSentence.slice(0, 87)}...` : firstSentence;
    }
  }

  const primaryTag = tags[0] || 'outro';
  return `Relato institucional: ${toTitleCase(primaryTag)}`;
}

export function buildFormattedReport(params: {
  messages: ReportFormatMessage[];
  reviewData?: ReviewData | null;
  piiRemoved?: number;
  reporterTypeLabel?: string;
}) : FormattedReport {
  const userMessages = params.messages
    .filter((message) => message.role === 'user')
    .map((message) => compactText(message.content))
    .filter(Boolean);

  const assistantMessages = params.messages
    .filter((message) => message.role === 'assistant')
    .map((message) => compactText(message.content))
    .filter(Boolean);

  const reviewTags = Array.isArray(params.reviewData?.temas)
    ? params.reviewData?.temas.map(normalizeTag).filter(Boolean)
    : [];

  const tags = Array.from(new Set((reviewTags.length > 0 ? reviewTags : inferTags(params.messages)).slice(0, 6)));
  const summary = compactText(params.reviewData?.resumo || userMessages.join(' ').slice(0, 320));
  const title = buildTitle(tags, summary, params.reviewData?.titulo);
  const reporterTypeLabel = params.reporterTypeLabel || 'Relator protegido';
  const piiRemoved = params.piiRemoved || 0;

  const lines: string[] = [
    `# ${title}`,
    '',
    `**Relator:** ${reporterTypeLabel}`,
    `**Tags:** ${tags.map(toTitleCase).join(', ')}`,
    `**Privacidade:** ${piiRemoved > 0 ? `${piiRemoved} dado(s) sensível(is) removido(s) antes do compartilhamento` : 'nenhum dado sensível removido'}`,
  ];

  if (typeof params.reviewData?.completude === 'number') {
    lines.push(`**Completude:** ${params.reviewData.completude}/10`);
  }

  lines.push('', '## Resumo executivo', '', summary || 'Sem resumo disponível.');

  if (params.reviewData?.impacto) {
    lines.push('', '## Impacto institucional', '', compactText(params.reviewData.impacto));
  }

  lines.push('', '## Relato consolidado', '');
  if (userMessages.length === 0) {
    lines.push('- Nenhum conteúdo do relator disponível.');
  } else {
    userMessages.forEach((message, index) => {
      lines.push(`${index + 1}. ${message}`);
    });
  }

  if (assistantMessages.length > 0) {
    lines.push('', '## Apoio do Agente 852', '');
    assistantMessages.slice(-3).forEach((message) => {
      lines.push(`- ${message}`);
    });
  }

  if (params.reviewData?.pontosCegos?.length) {
    lines.push('', '## Pontos para aprofundar', '');
    params.reviewData.pontosCegos.forEach((item) => lines.push(`- ${compactText(item)}`));
  }

  if (params.reviewData?.sugestoes?.length) {
    lines.push('', '## Perguntas sugeridas para follow-up', '');
    params.reviewData.sugestoes.forEach((item) => lines.push(`- ${compactText(item)}`));
  }

  if (params.reviewData?.insights_estruturais?.length) {
    lines.push('', '## Insights Estruturais e Fundamentação', '');
    params.reviewData.insights_estruturais.forEach((item) => lines.push(`- ${compactText(item)}`));
  }

  const markdown = lines.join('\n');
  const plainText = markdown.replace(/^#\s+/gm, '').replace(/^##\s+/gm, '').replace(/\*\*/g, '');
  const shareText = compactText([
    title,
    tags.length ? `Tags: ${tags.map(toTitleCase).join(', ')}` : '',
    summary ? `Resumo: ${summary}` : '',
  ].filter(Boolean).join('\n'));

  return {
    title,
    summary,
    tags,
    markdown,
    plainText,
    shareText,
  };
}
