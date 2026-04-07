/**
 * eval/runner.ts — Lightweight eval harness for chatbot golden cases
 *
 * Runs a set of golden test cases against any async response function,
 * scores each response against expected patterns, and produces a report.
 *
 * Usage:
 *   import { runEval } from '@egos/shared/eval/runner';
 *   const report = await runEval(cases, async (messages) => {
 *     const res = await fetch('/api/chat', { body: JSON.stringify({ messages }) });
 *     return await res.text();
 *   });
 *   console.log(report.summary);
 */

export interface EvalMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GoldenCase {
  /** Human-readable name for this test */
  id: string;
  /** Input conversation */
  messages: EvalMessage[];
  /** Strings that MUST appear in the response (case-insensitive substring check) */
  mustContain?: string[];
  /** Strings that must NOT appear in the response */
  mustNotContain?: string[];
  /** Minimum response length in characters */
  minLength?: number;
  /** Maximum response length in characters */
  maxLength?: number;
  /** Custom scorer — returns 0-1 */
  score?: (response: string) => number | Promise<number>;
  /** Expected response for reference (not used in scoring unless score() provided) */
  expectedResponse?: string;
  /** Category for grouping results */
  category?: string;
}

export interface EvalResult {
  caseId: string;
  passed: boolean;
  score: number;
  response: string;
  durationMs: number;
  failures: string[];
  category?: string;
}

export interface EvalReport {
  totalCases: number;
  passed: number;
  failed: number;
  passRate: number;
  avgScore: number;
  avgDurationMs: number;
  results: EvalResult[];
  summary: string;
}

export type ChatFn = (messages: EvalMessage[]) => Promise<string>;

/**
 * Run all golden cases through the provided chat function and score them.
 */
export async function runEval(
  cases: GoldenCase[],
  chatFn: ChatFn,
  options: { concurrency?: number; timeoutMs?: number } = {},
): Promise<EvalReport> {
  const { concurrency = 3, timeoutMs = 30_000 } = options;
  const results: EvalResult[] = [];

  // Process in chunks of `concurrency`
  for (let i = 0; i < cases.length; i += concurrency) {
    const batch = cases.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(c => runCase(c, chatFn, timeoutMs)));
    results.push(...batchResults);
  }

  const passed = results.filter(r => r.passed).length;
  const avgScore = results.reduce((s, r) => s + r.score, 0) / results.length;
  const avgDurationMs = Math.round(results.reduce((s, r) => s + r.durationMs, 0) / results.length);
  const passRate = Math.round((passed / results.length) * 100);

  const failedIds = results.filter(r => !r.passed).map(r => r.caseId);
  const summary = [
    `Eval: ${passed}/${results.length} passed (${passRate}%) | avg score ${avgScore.toFixed(2)} | avg ${avgDurationMs}ms`,
    failedIds.length > 0 ? `Failed: ${failedIds.join(', ')}` : 'All cases passed.',
  ].join('\n');

  return { totalCases: results.length, passed, failed: results.length - passed, passRate, avgScore, avgDurationMs, results, summary };
}

async function runCase(
  goldenCase: GoldenCase,
  chatFn: ChatFn,
  timeoutMs: number,
): Promise<EvalResult> {
  const start = Date.now();
  const failures: string[] = [];
  let response = '';

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    );
    response = await Promise.race([chatFn(goldenCase.messages), timeout]);
  } catch (err) {
    failures.push(`Error: ${err instanceof Error ? err.message : String(err)}`);
    return { caseId: goldenCase.id, passed: false, score: 0, response: '', durationMs: Date.now() - start, failures, category: goldenCase.category };
  }

  const lower = response.toLowerCase();

  // mustContain checks
  for (const term of goldenCase.mustContain ?? []) {
    if (!lower.includes(term.toLowerCase())) {
      failures.push(`mustContain "${term}" not found`);
    }
  }

  // mustNotContain checks
  for (const term of goldenCase.mustNotContain ?? []) {
    if (lower.includes(term.toLowerCase())) {
      failures.push(`mustNotContain "${term}" found in response`);
    }
  }

  // Length checks
  if (goldenCase.minLength && response.length < goldenCase.minLength) {
    failures.push(`response too short: ${response.length} < ${goldenCase.minLength}`);
  }
  if (goldenCase.maxLength && response.length > goldenCase.maxLength) {
    failures.push(`response too long: ${response.length} > ${goldenCase.maxLength}`);
  }

  // Custom scorer
  let score = failures.length === 0 ? 1 : 0;
  if (goldenCase.score) {
    score = await goldenCase.score(response);
    if (score < 0.5) failures.push(`custom score too low: ${score.toFixed(2)}`);
  }

  return {
    caseId: goldenCase.id,
    passed: failures.length === 0,
    score,
    response,
    durationMs: Date.now() - start,
    failures,
    category: goldenCase.category,
  };
}
