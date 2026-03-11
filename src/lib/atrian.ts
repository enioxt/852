/**
 * ATRiAN — Ethical Validation Layer for 852 Inteligência
 * Inspired by EGOS ATRiAN (Automated Trust, Reality, and Integrity Assessment Network)
 *
 * Provides lightweight output validation for chatbot responses:
 * - Blocklist filtering (blocked entities, invented acronyms)
 * - Epistemic violation detection (absolute claims, fabricated data)
 * - Telemetry integration for monitoring violations
 *
 * @see CONSTITUTION_ATRIAN.md — "Confiança verificável, não crença cega"
 */

import { recordEvent } from './telemetry';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ViolationLevel = 'info' | 'warning' | 'error' | 'critical';

export interface AtrianViolation {
  level: ViolationLevel;
  category: string;
  message: string;
  matched: string;
}

export interface AtrianResult {
  passed: boolean;
  violations: AtrianViolation[];
  score: number; // 0-100, 100 = fully compliant
}

// ─── Blocklists ──────────────────────────────────────────────────────────────

const BLOCKED_ENTITIES = [
  'sindpol',
  'sindpol-mg',
  'sindpol mg',
  'sindicato dos policiais',
  'sindicato da polícia',
  'sindicato da policia',
];

const KNOWN_ACRONYMS = new Set([
  // Documentos e processos
  'DP', 'BO', 'TCO', 'IP', 'APF', 'APFD', 'TC', 'RAI', 'ROC',
  // PCMG — estrutura e unidades
  'PCMG', 'REDS', 'DH', 'DIPO', 'DEAM', 'DRCI', 'DEPOL', 'DCPC',
  'DREX', 'DCCM', 'DICRIM', 'DPC', 'DPCA', 'DPMA', 'DPRC',
  'COPE', 'GOC', 'DSAP', 'IC', 'IML',
  // Segurança pública (MG e federal)
  'PM', 'PC', 'PF', 'PRF', 'SEDS', 'SESP', 'SEJUSP', 'PMMG',
  'CBMMG', 'GRECO', 'GAECO', 'GEPAR', 'ROTAM', 'CERESP',
  'RISP', 'AISP', 'CICOM', 'CINDS',
  // Sistemas e bases de dados
  'SINESP', 'INFOPEN', 'SISP', 'SISBIN', 'ABIN', 'DEPEN',
  // Justiça e órgãos de controle
  'MPMG', 'TJMG', 'STF', 'STJ', 'CNJ', 'OAB', 'TSE', 'TRF',
  'TRT', 'TCE', 'TCU', 'CGU', 'AGU', 'DPE', 'JECRIM', 'ANPP',
  // Documentos pessoais
  'CPF', 'RG', 'MASP', 'CNPJ',
  // Geografia
  'MG', 'BH', 'RMBH', 'BR', 'SP', 'RJ', 'DF',
  // Governo e administração
  'SEPLAG', 'DETRAN', 'CIRETRAN',
  // Tecnologia
  'AI', 'IA', 'LLM', 'API', 'PDF', 'URL', 'GPS', 'CFTV',
  'DNA', 'RPA', 'OCR', 'QR', 'NFC',
  // Geral institucional
  'OG', 'FAQ', 'CEO', 'CTO', 'RH',
  'PIB', 'IDH', 'SUS', 'UBS', 'IBGE',
  'LGPD', 'GDPR', 'RLS',
  'ECA', 'CLT', 'CPP', 'CP', 'CF',
]);

// ─── Pattern Detectors ───────────────────────────────────────────────────────

const ABSOLUTE_CLAIM_PATTERNS = [
  /\b(com certeza|sem dúvida|indubitavelmente|incontestável|inequivocamente)\b/gi,
  /\b(sempre|nunca|todos os|nenhum|100%)\b(?!.*\b(nome|processo|CPF|RG|MASP|dado)\b)/gi,
  /\b(comprovadamente|cientificamente provado|fato consumado)\b/gi,
];

const FABRICATED_DATA_PATTERNS = [
  /\b(segundo (dados|pesquisas|estudos|estatísticas) (da|do|de))\b/gi,
  /\b(de acordo com (relatórios|levantamentos|números) (da|do|de))\b/gi,
  /\b(\d{1,3}[.,]\d+%\s+d[aoe]s?\s+(policiais|delegacias|unidades|servidores))\b/gi,
];

const FALSE_PROMISE_PATTERNS = [
  /\b(vamos (resolver|encaminhar|garantir|providenciar))\b/gi,
  /\b(isso será (encaminhado|resolvido|tratado) (pelo|pela|por))\b/gi,
  /\b(providências (serão|já foram) tomadas)\b/gi,
];

// ─── Invented Acronym Detector ───────────────────────────────────────────────

function detectInventedAcronyms(text: string): AtrianViolation[] {
  const violations: AtrianViolation[] = [];
  // Match 2-5 letter all-caps words that aren't known acronyms
  const acronymRegex = /\b([A-Z]{2,5})\b/g;
  let match;

  while ((match = acronymRegex.exec(text)) !== null) {
    const acronym = match[1];
    if (!KNOWN_ACRONYMS.has(acronym)) {
      // Check context: is it preceded by a definition pattern?
      const before = text.slice(Math.max(0, match.index - 80), match.index);
      const isDefinedInContext = /\(/.test(before.slice(-5)) || /— /.test(before.slice(-5));
      if (!isDefinedInContext) {
        violations.push({
          level: 'warning',
          category: 'invented_acronym',
          message: `Possible invented acronym: "${acronym}" — not in known acronym list`,
          matched: acronym,
        });
      }
    }
  }

  return violations;
}

// ─── Core Validator ──────────────────────────────────────────────────────────

export function validateResponse(text: string): AtrianResult {
  const violations: AtrianViolation[] = [];

  // 1. Blocked entities check (CRITICAL)
  for (const entity of BLOCKED_ENTITIES) {
    const regex = new RegExp(entity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const match = regex.exec(text);
    if (match) {
      violations.push({
        level: 'critical',
        category: 'blocked_entity',
        message: `Blocked entity mentioned: "${entity}"`,
        matched: match[0],
      });
    }
  }

  // 2. Invented acronyms check (WARNING)
  violations.push(...detectInventedAcronyms(text));

  // 3. Absolute claims check (WARNING)
  for (const pattern of ABSOLUTE_CLAIM_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      // Skip if it's inside the privacy rules context (those ARE absolute)
      const context = text.slice(Math.max(0, match.index - 40), match.index + match[0].length + 40);
      if (/nome|processo|CPF|RG|MASP|dado|privacidade|anonimat/.test(context)) continue;

      violations.push({
        level: 'warning',
        category: 'absolute_claim',
        message: `Absolute claim without hedging: "${match[0]}"`,
        matched: match[0],
      });
    }
  }

  // 4. Fabricated data references (ERROR)
  for (const pattern of FABRICATED_DATA_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      violations.push({
        level: 'error',
        category: 'fabricated_data',
        message: `Possible fabricated data reference: "${match[0]}"`,
        matched: match[0],
      });
    }
  }

  // 5. False promises check (ERROR)
  for (const pattern of FALSE_PROMISE_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      violations.push({
        level: 'error',
        category: 'false_promise',
        message: `False promise of action: "${match[0]}"`,
        matched: match[0],
      });
    }
  }

  // Score calculation: start at 100, deduct per violation severity
  const deductions: Record<ViolationLevel, number> = {
    info: 2,
    warning: 5,
    error: 15,
    critical: 30,
  };

  let score = 100;
  for (const v of violations) {
    score -= deductions[v.level];
  }
  score = Math.max(0, score);

  const hasCritical = violations.some(v => v.level === 'critical');
  const hasError = violations.some(v => v.level === 'error');

  return {
    passed: !hasCritical && !hasError,
    violations,
    score,
  };
}

// ─── Telemetry Integration ───────────────────────────────────────────────────

export function validateAndLog(text: string, clientIp?: string): AtrianResult {
  const result = validateResponse(text);

  if (result.violations.length > 0) {
    recordEvent({
      event_type: 'atrian_violation',
      status_code: result.passed ? 200 : 422,
      metadata: {
        score: result.score,
        violationCount: result.violations.length,
        categories: [...new Set(result.violations.map(v => v.category))],
        levels: [...new Set(result.violations.map(v => v.level))],
        clientIp,
      },
    });
  }

  return result;
}

// ─── Stream Chunk Filter (lightweight, for critical terms only) ──────────────

const CRITICAL_BLOCKLIST_REGEX = new RegExp(
  BLOCKED_ENTITIES.map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'gi'
);

export function filterChunk(chunk: string): string {
  return chunk.replace(CRITICAL_BLOCKLIST_REGEX, '***');
}
