/**
 * Standalone ATRiAN Core Engine
 * 
 * Verifiable trust, not blind belief.
 */

export interface AtrianViolation {
  level: 'info' | 'warning' | 'error' | 'critical';
  category: string;
  message: string;
  matched: string;
}

export interface AtrianResult {
  passed: boolean;
  score: number;
  violations: AtrianViolation[];
}

export const BLOCKED_ENTITIES = [
  'OpenAI', 'Anthropic', 'Google', 'Meta', 'Mistral', 'Cohere',
  'gpt-4', 'gpt-3.5', 'claude-3', 'gemini', 'llama', 'mixtral',
];

export const KNOWN_ACRONYMS = new Set([
  'EGOS', 'ATRIAN', 'RHO', 'LLM', 'API', 'UI', 'UX', 'HTTP', 'JSON',
  'PII', 'CPF', 'RG', 'MASP', 'REDS', 'BPM', 'RMBH', 'MG', 'PCMG',
  'PMMG', 'CBMMG', 'SEJUSP', 'SIDS', 'ISP', 'PC', 'PM', 'BM', 'GCP',
  'AWS', 'SQL', 'JWT', 'OAUTH', 'UUID', 'URL', 'URN', 'URI', 'RPC',
  'REST', 'GraphQL', 'CLI', 'GUI', 'OS', 'CPU', 'RAM', 'GPU', 'TPU',
  'NPU', 'VRAM', 'SSD', 'HDD', 'USB', 'TCP', 'UDP', 'IP', 'DNS',
  'DHCP', 'TLS', 'SSL', 'SSH', 'FTP', 'SMTP', 'IMAP', 'POP3', 'BGP',
  'QoS', 'VPN', 'VPC', 'CDN', 'DDoS', 'WAF', 'IAM', 'RBAC', 'ABAC',
  'SOC', 'SIEM', 'EDR', 'MDR', 'XDR', 'SOAR', 'CTI', 'OSINT', 'CVE',
  'CVSS', 'NVD', 'OWASP', 'SAST', 'DAST', 'SCA', 'CI', 'CD', 'VCS'
]);

export const ABSOLUTE_CLAIM_PATTERNS = [
  /\b(100%|cem por cento)\s+(seguro|garantido|perfeito|imutável)\b/i,
  /\b(nunca|jamais)\s+(vai\s+falhar|erra|vaza)\b/i,
  /\b(sempre)\s+(acerta|funciona|perfeito)\b/i,
  /\b(a\s+única\s+solução|o\s+único\s+jeito)\b/i,
  /\b(totalmente|absolutamente)\s+(infalível|invulnerável)\b/i,
];

export const FABRICATED_DATA_PATTERNS = [
  /\b(pesquisas\s+recentes\s+provam)\b/i,
  /\b(estudos\s+comprovam\s+que\s+[0-9]+%)\b/i,
  /\b(fontes\s+oficiais\s+confirmam)\b/i, 
];

export const FALSE_PROMISE_PATTERNS = [
  /\b(eu\s+vou\s+(fazer|resolver|enviar|criar|deletar))\b/i,
  /\b(deixa\s+comigo\s+que\s+eu\s+(resolvo|faço))\b/i,
  /\b(fique\s+tranquilo(a)?,\s+eu\s+(garanto|cuido))\b/i,
  /\b(posso\s+(executar|rodar)\s+esse\s+comando)\b/i,
];

function checkBlockedEntities(text: string): AtrianViolation[] {
  const violations: AtrianViolation[] = [];
  const lowerText = text.toLowerCase();
  
  for (const entity of BLOCKED_ENTITIES) {
    if (lowerText.includes(entity.toLowerCase())) {
      violations.push({
        level: 'critical',
        category: 'Identity Break',
        message: `Referência a entidade bloqueada: ${entity}`,
        matched: entity,
      });
    }
  }
  return violations;
}

function detectInventedAcronyms(text: string): AtrianViolation[] {
  const violations: AtrianViolation[] = [];
  const acronymMatches = text.matchAll(/\b([A-Z]{3,})\b/g);
  for (const match of acronymMatches) {
    const acronym = match[1];
    if (acronym && !KNOWN_ACRONYMS.has(acronym)) {
      if (!isCommonWordOrName(acronym)) {
        violations.push({
          level: 'warning',
          category: 'Potential Fabricated Acronym',
          message: `Sigla desconhecida: ${acronym}`,
          matched: acronym,
        });
      }
    }
  }
  return violations;
}

function isCommonWordOrName(word: string): boolean {
  const common = ['QUE', 'NÃO', 'SIM', 'PARA', 'COM', 'POR', 'DOS', 'DAS', 'NOS', 'NAS', 'AOS', 'AS'];
  return common.includes(word);
}

export function validateResponse(text: string): AtrianResult {
  const violations: AtrianViolation[] = [];
  let score = 100;

  const entityViolations = checkBlockedEntities(text);
  violations.push(...entityViolations);
  score -= entityViolations.length * 50;

  const acronymViolations = detectInventedAcronyms(text);
  violations.push(...acronymViolations);
  score -= acronymViolations.length * 5;

  for (const pattern of ABSOLUTE_CLAIM_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      violations.push({
        level: 'warning',
        category: 'Absolute Claim',
        message: 'Afirmação absoluta sem nuances',
        matched: match[0],
      });
      score -= 20;
    }
  }

  for (const pattern of FABRICATED_DATA_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      violations.push({
        level: 'error',
        category: 'Potential Fabricated Data',
        message: 'Uso de "estudos comprovam" ou similar genérico',
        matched: match[0],
      });
      score -= 40;
    }
  }

  for (const pattern of FALSE_PROMISE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      violations.push({
        level: 'error',
        category: 'False Promise of Action',
        message: 'Promessa de ação fora de capacidade (ex: "eu vou enviar")',
        matched: match[0],
      });
      score -= 30;
    }
  }

  score = Math.max(0, score);
  const hasCritical = violations.some(v => v.level === 'critical');
  const hasError = violations.some(v => v.level === 'error');

  return {
    passed: !hasCritical && !hasError && score >= 70,
    score,
    violations,
  };
}
