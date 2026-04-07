/**
 * eval/runner.ts — 852 eval entry point
 *
 * Runs the 20 golden cases against the local or deployed 852 API.
 *
 * Usage:
 *   BASE_URL=http://localhost:3001 bun src/eval/runner.ts
 *   BASE_URL=https://852.egos.ia.br bun src/eval/runner.ts
 *
 * Output: pass/fail table + summary line.
 */
import { runEval } from './eval-runner';
import { GOLDEN_CASES_852 } from './golden/852';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3001';
const SESSION_HASH = `eval-${Date.now()}`;

async function callChat(messages: Array<{ role: string; content: string }>): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-session-hash': SESSION_HASH,
    },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  // Accumulate streamed text/plain response
  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');
  const decoder = new TextDecoder();
  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  return result.trim();
}

async function main() {
  console.log(`\n🧪 852 Eval — ${GOLDEN_CASES_852.length} golden cases`);
  console.log(`   Target: ${BASE_URL}\n`);

  const report = await runEval(GOLDEN_CASES_852, callChat, {
    concurrency: 2,
    timeoutMs: 30_000,
  });

  // Print results table
  const categories = [...new Set(report.results.map(r => r.category ?? 'misc'))];
  for (const cat of categories) {
    const catResults = report.results.filter(r => (r.category ?? 'misc') === cat);
    const catPassed = catResults.filter(r => r.passed).length;
    console.log(`\n[${cat}] ${catPassed}/${catResults.length}`);
    for (const r of catResults) {
      const icon = r.passed ? '✅' : '❌';
      const detail = r.passed ? '' : ` — ${r.failures.join('; ')}`;
      console.log(`  ${icon} ${r.caseId} (${r.durationMs}ms)${detail}`);
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(report.summary);
  console.log(`${'─'.repeat(60)}\n`);

  process.exit(report.passRate >= 80 ? 0 : 1);
}

main().catch(err => {
  console.error('Eval error:', err);
  process.exit(1);
});
