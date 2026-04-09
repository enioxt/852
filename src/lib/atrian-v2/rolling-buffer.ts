/**
 * Rolling Buffer — ATRiAN v2
 *
 * Accumulates tokens with sliding window for context-aware validation.
 */

export class RollingBuffer {
  private tokens: string[] = [];
  private maxTokens: number;
  private contextWindow: number;

  constructor(options: { maxTokens: number; contextWindow?: number }) {
    this.maxTokens = options.maxTokens;
    this.contextWindow = options.contextWindow || Math.floor(options.maxTokens / 4);
  }

  /**
   * Add token to buffer
   */
  add(token: string): void {
    this.tokens.push(token);

    // Maintain max size
    if (this.tokens.length > this.maxTokens) {
      this.slide();
    }
  }

  /**
   * Remove oldest tokens (sliding window)
   */
  slide(): void {
    const slideAmount = Math.max(1, Math.floor(this.contextWindow / 2));
    this.tokens = this.tokens.slice(slideAmount);
  }

  /**
   * Get current buffer content
   */
  getContent(): string {
    return this.tokens.join('');
  }

  /**
   * Get recent context (last N tokens)
   */
  getRecentContext(tokenCount: number = this.contextWindow): string {
    return this.tokens.slice(-tokenCount).join('');
  }

  /**
   * Get full buffer with metadata
   */
  getState(): {
    content: string;
    tokenCount: number;
    isFull: boolean;
    recentContext: string;
  } {
    return {
      content: this.getContent(),
      tokenCount: this.tokens.length,
      isFull: this.tokens.length >= this.maxTokens,
      recentContext: this.getRecentContext(),
    };
  }

  /**
   * Clear buffer
   */
  clear(): void {
    this.tokens = [];
  }

  /**
   * Check if buffer contains pattern
   */
  contains(pattern: RegExp): boolean {
    return pattern.test(this.getContent());
  }

  /**
   * Find matches in buffer
   */
  findMatches(pattern: RegExp): RegExpMatchArray[] {
    const content = this.getContent();
    const matches: RegExpMatchArray[] = [];
    let match: RegExpMatchArray | null;

    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      matches.push(match);
      if (!pattern.global) break;
    }

    return matches;
  }
}
