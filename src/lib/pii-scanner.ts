/**
 * PII Scanner — Detects sensitive/personal data in conversation text
 *
 * Migrated to @egosbr/guard-brasil v0.2.3 (EGOS-158).
 * This module re-exports from the canonical EGOS Guard Brasil package
 * for LGPD-compliant PII detection and masking.
 *
 * @see https://www.npmjs.com/package/@egosbr/guard-brasil
 */

import {
  scanForPII as guardScanForPII,
  sanitizeText as guardSanitizeText,
  getPIISummary as guardGetPIISummary,
  maskPII as guardMaskPII,
  type PIICategory,
  type PIIFinding,
} from '@egosbr/guard-brasil';

// Re-export types
export type { PIICategory, PIIFinding };

// Re-export functions with 852-compatible signatures
export function scanForPII(text: string): PIIFinding[] {
  return guardScanForPII(text);
}

export function sanitizeText(text: string, findings?: PIIFinding[]): string {
  if (!findings) {
    findings = scanForPII(text);
  }
  return guardSanitizeText(text, findings);
}

export function getPIISummary(findings: PIIFinding[]): string {
  return guardGetPIISummary(findings);
}

export function maskPII(text: string, categories?: string[]): string {
  return guardMaskPII(text, categories as any);
}

// Legacy compatibility: auto-scan + sanitize
export function autoSanitize(text: string): { sanitized: string; findings: PIIFinding[] } {
  const findings = scanForPII(text);
  const sanitized = sanitizeText(text, findings);
  return { sanitized, findings };
}
