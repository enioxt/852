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
export declare const BLOCKED_ENTITIES: string[];
export declare const KNOWN_ACRONYMS: Set<string>;
export declare const ABSOLUTE_CLAIM_PATTERNS: RegExp[];
export declare const FABRICATED_DATA_PATTERNS: RegExp[];
export declare const FALSE_PROMISE_PATTERNS: RegExp[];
export declare function validateResponse(text: string): AtrianResult;
//# sourceMappingURL=index.d.ts.map