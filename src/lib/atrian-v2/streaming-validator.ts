/**
 * Streaming Validator — ATRiAN v2
 *
 * Async validation of streaming chunks against rules.
 */

export type ValidationSeverity = 'block' | 'warn' | 'log' | 'pass';

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  pattern: RegExp;
  severity: ValidationSeverity;
  action: 'mask' | 'abort' | 'continue' | 'flag';
  maskWith?: string;
  category: 'pii' | 'security' | 'atrian' | 'topic' | 'custom';
}

export interface ValidationResult {
  ruleId: string;
  matched: boolean;
  matchText?: string;
  severity: ValidationSeverity;
  action: ValidationRule['action'];
  maskedText?: string;
  metadata?: Record<string, unknown>;
}

export class StreamingValidator {
  private rules: ValidationRule[];
  private onViolation?: (result: ValidationResult) => void;

  constructor(options: {
    rules: ValidationRule[];
    onViolation?: (result: ValidationResult) => void;
  }) {
    this.rules = options.rules;
    this.onViolation = options.onViolation;
  }

  /**
   * Validate chunk against all rules
   */
  async validateChunk(chunk: string): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const rule of this.rules) {
      // Skip disabled rules
      if (!rule.pattern) continue;

      const result = this.checkRule(chunk, rule);

      if (result.matched) {
        results.push(result);

        // Trigger callback if configured
        if (this.onViolation && result.severity !== 'pass') {
          this.onViolation(result);
        }
      }
    }

    return results;
  }

  /**
   * Quick check for blocking violations
   */
  async hasBlockingViolation(chunk: string): Promise<boolean> {
    const results = await this.validateChunk(chunk);
    return results.some(r => r.severity === 'block');
  }

  /**
   * Apply masking to chunk based on rules
   */
  async applyMasking(chunk: string): Promise<string> {
    let masked = chunk;
    const results = await this.validateChunk(chunk);

    // Sort by position (descending) to avoid index shifting
    const maskResults = results
      .filter(r => r.action === 'mask' && r.matchText)
      .sort((a, b) => {
        const aIndex = masked.indexOf(a.matchText!);
        const bIndex = masked.indexOf(b.matchText!);
        return bIndex - aIndex;
      });

    for (const result of maskResults) {
      if (result.matchText) {
        const mask = result.maskedText || '[REDACTED]';
        masked = masked.replace(result.matchText, mask);
      }
    }

    return masked;
  }

  private checkRule(text: string, rule: ValidationRule): ValidationResult {
    const match = rule.pattern.exec(text);

    if (!match) {
      return {
        ruleId: rule.id,
        matched: false,
        severity: 'pass',
        action: 'continue',
      };
    }

    const matchText = match[0];
    const maskedText = rule.maskWith
      ? rule.maskWith
      : matchText.replace(/./g, '*');

    return {
      ruleId: rule.id,
      matched: true,
      matchText,
      severity: rule.severity,
      action: rule.action,
      maskedText: rule.action === 'mask' ? maskedText : undefined,
      metadata: {
        index: match.index,
        groups: match.groups,
        category: rule.category,
      },
    };
  }

  /**
   * Add rule dynamically
   */
  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove rule
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  /**
   * Get active rules
   */
  getRules(): ValidationRule[] {
    return [...this.rules];
  }
}
