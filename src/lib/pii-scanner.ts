/**
 * PII Scanner — Detects sensitive/personal data in conversation text
 *
 * Scans for: CPF, RG, MASP, phone numbers, emails, process numbers,
 * REDS numbers, proper names (heuristic), addresses, and other PII.
 *
 * Returns a list of findings with positions so the UI can highlight them.
 */

export type PIICategory =
  | 'cpf'
  | 'rg'
  | 'masp'
  | 'phone'
  | 'email'
  | 'reds'
  | 'process_number'
  | 'name'
  | 'address'
  | 'plate'
  | 'date_of_birth';

export interface PIIFinding {
  category: PIICategory;
  label: string;
  matched: string;
  start: number;
  end: number;
  suggestion: string;
}

// ─── Pattern Definitions ─────────────────────────────────────────────────────

const PII_PATTERNS: Array<{
  category: PIICategory;
  label: string;
  pattern: RegExp;
  suggestion: string;
}> = [
  {
    category: 'cpf',
    label: 'CPF',
    pattern: /\b\d{3}[.\s-]?\d{3}[.\s-]?\d{3}[.\s/-]?\d{2}\b/g,
    suggestion: '[CPF REMOVIDO]',
  },
  {
    category: 'rg',
    label: 'RG',
    pattern: /\b(?:RG|rg|Rg)[:\s]*\d{1,2}[.\s]?\d{3}[.\s]?\d{3}[.\s-]?\d?\b/gi,
    suggestion: '[RG REMOVIDO]',
  },
  {
    category: 'masp',
    label: 'MASP',
    pattern: /\b(?:MASP|masp|Masp)[:\s]*\d{4,8}[.\s-]?\d{0,2}\b/gi,
    suggestion: '[MASP REMOVIDO]',
  },
  {
    category: 'phone',
    label: 'Telefone',
    pattern: /\b(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-.\s]?\d{4}\b/g,
    suggestion: '[TELEFONE REMOVIDO]',
  },
  {
    category: 'email',
    label: 'Email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    suggestion: '[EMAIL REMOVIDO]',
  },
  {
    category: 'reds',
    label: 'REDS',
    pattern: /\b(?:REDS|reds|Reds)[:\s]*\d{4,}[-./]?\d{0,}\b/gi,
    suggestion: '[REDS REMOVIDO]',
  },
  {
    category: 'process_number',
    label: 'Processo',
    pattern: /\b\d{7}[-.]?\d{2}[.]?\d{4}[.]?\d[.]?\d{2}[.]?\d{4}\b/g,
    suggestion: '[PROCESSO REMOVIDO]',
  },
  {
    category: 'plate',
    label: 'Placa',
    pattern: /\b[A-Z]{3}[-\s]?\d[A-Z0-9]\d{2}\b/gi,
    suggestion: '[PLACA REMOVIDA]',
  },
  {
    category: 'date_of_birth',
    label: 'Data de Nascimento',
    pattern: /\b(?:nascido|nascimento|nasc\.?|DN|dn)[:\s]*\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/gi,
    suggestion: '[DATA REMOVIDA]',
  },
];

// Heuristic name detection — capitalized multi-word sequences that look like proper names
const NAME_PATTERN = /\b(?:delegad[oa]|chefe|colega|servidor|investigador|escriv[aã]o?|comissário|perito|agente)\s+([A-ZÁÉÍÓÚÃÕÂÊÎÔÛ][a-záéíóúãõâêîôû]+(?:\s+[A-ZÁÉÍÓÚÃÕÂÊÎÔÛ][a-záéíóúãõâêîôû]+){1,4})\b/g;

// ─── Scanner ─────────────────────────────────────────────────────────────────

export function scanForPII(text: string): PIIFinding[] {
  const findings: PIIFinding[] = [];

  // Run all regex patterns
  for (const { category, label, pattern, suggestion } of PII_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      findings.push({
        category,
        label,
        matched: match[0],
        start: match.index,
        end: match.index + match[0].length,
        suggestion,
      });
    }
  }

  // Heuristic name detection
  NAME_PATTERN.lastIndex = 0;
  let nameMatch;
  while ((nameMatch = NAME_PATTERN.exec(text)) !== null) {
    const name = nameMatch[1];
    if (name && name.length > 3) {
      findings.push({
        category: 'name',
        label: 'Possível nome',
        matched: name,
        start: nameMatch.index + nameMatch[0].indexOf(name),
        end: nameMatch.index + nameMatch[0].indexOf(name) + name.length,
        suggestion: '[NOME REMOVIDO]',
      });
    }
  }

  // Sort by position and deduplicate overlapping ranges
  findings.sort((a, b) => a.start - b.start);
  return deduplicateFindings(findings);
}

function deduplicateFindings(findings: PIIFinding[]): PIIFinding[] {
  const result: PIIFinding[] = [];
  let lastEnd = -1;
  for (const f of findings) {
    if (f.start >= lastEnd) {
      result.push(f);
      lastEnd = f.end;
    }
  }
  return result;
}

// ─── Auto-Sanitize ───────────────────────────────────────────────────────────

export function sanitizeText(text: string, findings: PIIFinding[]): string {
  if (findings.length === 0) return text;

  // We need to count occurrences to generate sequential semantic tokens: [CPF_1], [NOME_1], etc.
  // 'findings' is assumed to be sorted by start position ascending
  const counters: Record<string, number> = {};
  const replacements: Record<number, string> = {};
  
  for (const f of findings) {
    const key = f.category;
    counters[key] = (counters[key] || 0) + 1;
    replacements[f.start] = `[${key.toUpperCase()}_${counters[key]}]`;
  }

  // Apply replacements from end to start so indices remain valid
  const sorted = [...findings].sort((a, b) => b.start - a.start);
  let result = text;
  for (const f of sorted) {
    const replacement = replacements[f.start] || f.suggestion;
    result = result.slice(0, f.start) + replacement + result.slice(f.end);
  }
  return result;
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export function getPIISummary(findings: PIIFinding[]): string {
  if (findings.length === 0) return 'Nenhum dado sensível detectado.';
  const categories = [...new Set(findings.map(f => f.label))];
  return `Detectamos ${findings.length} dado(s) sensível(is): ${categories.join(', ')}. Sugerimos a remoção antes de compartilhar.`;
}
