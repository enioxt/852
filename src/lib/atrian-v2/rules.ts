/**
 * ATRiAN v2 — Validation Rules
 *
 * Pre-configured rules for streaming validation.
 */

import { ValidationRule } from './streaming-validator';

/**
 * ATRiAN Core Rules (v2)
 */
export const ATRIAN_V2_RULES: ValidationRule[] = [
  // ── PII Detection ───────────────────────────────────────────────────────
  {
    id: 'pii_cpf',
    name: 'CPF Detection',
    description: 'Detects Brazilian CPF numbers',
    pattern: /\b\d{3}[.\s-]?\d{3}[.\s-]?\d{3}[.\s/-]?\d{2}\b/,
    severity: 'block',
    action: 'mask',
    maskWith: '[CPF REMOVIDO]',
    category: 'pii',
  },
  {
    id: 'pii_masp',
    name: 'MASP Detection',
    description: 'Detects MASP numbers',
    pattern: /\b(?:MASP|masp|Masp)[:\s]*\d{4,8}[.\s-]?\d{0,2}\b/,
    severity: 'block',
    action: 'mask',
    maskWith: '[MASP REMOVIDO]',
    category: 'pii',
  },
  {
    id: 'pii_reds',
    name: 'REDS Detection',
    description: 'Detects REDS numbers',
    pattern: /\b(?:REDS|reds|Reds)[:\s]*\d{4,}[-./]?\d{0,}\b/,
    severity: 'block',
    action: 'mask',
    maskWith: '[REDS REMOVIDO]',
    category: 'pii',
  },
  {
    id: 'pii_email',
    name: 'Email Detection',
    description: 'Detects email addresses',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
    severity: 'block',
    action: 'mask',
    maskWith: '[EMAIL REMOVIDO]',
    category: 'pii',
  },

  // ── ATRiAN Truth Layer ─────────────────────────────────────────────────
  {
    id: 'atrian_absolute_claim',
    name: 'Absolute Claim Detection',
    description: 'Detects unverified absolute claims',
    pattern: /\b(segundo dados|de acordo com|estat[íi]sticas mostram|pesquisa comprova|dados revelam)\b/i,
    severity: 'warn',
    action: 'flag',
    category: 'atrian',
  },
  {
    id: 'atrian_false_promise',
    name: 'False Promise Detection',
    description: 'Detects institutional promises',
    pattern: /\b(vai resolver|vamos resolver|prometo que|garanto que)\b/i,
    severity: 'warn',
    action: 'flag',
    category: 'atrian',
  },

  // ── Security / Blocklist ───────────────────────────────────────────────
  {
    id: 'security_sindpol',
    name: 'SINDPOL Block',
    description: 'Blocks SINDPOL entity',
    pattern: /\b(SINDPOL|sindpol|Sindicato dos Policiais)\b/,
    severity: 'block',
    action: 'mask',
    maskWith: '[ENTIDADE BLOQUEADA]',
    category: 'security',
  },
  {
    id: 'security_apex',
    name: 'APEX Block',
    description: 'Blocks APEX entity',
    pattern: /\b(APEX|apex-mg|Apex)\b/,
    severity: 'block',
    action: 'mask',
    maskWith: '[ENTIDADE BLOQUEADA]',
    category: 'security',
  },

  // ── Jailbreak Detection ────────────────────────────────────────────────
  {
    id: 'jailbreak_ignore',
    name: 'Ignore Instructions',
    description: 'Detects jailbreak attempt',
    pattern: /\b(ignore (todas as )?(instru[çc][õo]es|regras)|desconsidere|esque[çc]a tudo)\b/i,
    severity: 'block',
    action: 'abort',
    category: 'security',
  },
  {
    id: 'jailbreak_roleplay',
    name: 'Roleplay Attack',
    description: 'Detects roleplay-based jailbreak',
    pattern: /\b(voc[êe] agora [ée]|a partir de agora voc[êe]|imagine que voc[êe])\b/i,
    severity: 'warn',
    action: 'flag',
    category: 'security',
  },

  // ── Topic Safety ──────────────────────────────────────────────────────
  {
    id: 'topic_external_complaint',
    name: 'External Complaint Redirect',
    description: 'Suggests formal channel for complaints',
    pattern: /\b(quero denunciar|vou processar|vou [àa] m[íi]dia|corregedoria)\b/i,
    severity: 'warn',
    action: 'flag',
    category: 'topic',
  },
];

/**
 * Get rules by category
 */
export function getRulesByCategory(category: ValidationRule['category']): ValidationRule[] {
  return ATRIAN_V2_RULES.filter(r => r.category === category);
}

/**
 * Get blocking rules only
 */
export function getBlockingRules(): ValidationRule[] {
  return ATRIAN_V2_RULES.filter(r => r.severity === 'block');
}

/**
 * Custom rule factory
 */
export function createCustomRule(
  id: string,
  pattern: RegExp,
  options: Partial<Omit<ValidationRule, 'id' | 'pattern'>> = {}
): ValidationRule {
  return {
    id,
    pattern,
    name: options.name || id,
    description: options.description || `Custom rule: ${id}`,
    severity: options.severity || 'warn',
    action: options.action || 'flag',
    category: options.category || 'custom',
    maskWith: options.maskWith,
  };
}
