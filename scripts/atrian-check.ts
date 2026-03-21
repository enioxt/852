#!/usr/bin/env npx tsx
/**
 * ATRiAN CLI — Ethical Validation Scanner
 * 
 * Scans staged files for ethical violations before commit.
 * Used by .husky/pre-commit and can be run standalone.
 *
 * Usage:
 *   npx tsx scripts/atrian-check.ts              # scan staged .ts/.tsx files
 *   npx tsx scripts/atrian-check.ts --all         # scan all src/ files
 *   npx tsx scripts/atrian-check.ts --file foo.ts # scan specific file
 *
 * Exit codes:
 *   0 = passed (no critical/error violations)
 *   1 = blocked (critical or error violations found)
 *
 * @see src/lib/atrian.ts — Core validation engine
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

// ─── Inline ATRiAN patterns (no import needed, works standalone) ─────────────

type ViolationLevel = 'info' | 'warning' | 'error' | 'critical';
interface Violation { level: ViolationLevel; category: string; message: string; matched: string; file: string; line: number; }

const ABSOLUTE_CLAIM_PATTERNS = [
  /\b(com certeza|sem dúvida|indubitavelmente|incontestável|inequivocamente)\b/gi,
  /\b(comprovadamente|cientificamente provado|fato consumado)\b/gi,
];

const FABRICATED_DATA_PATTERNS = [
  /\b(segundo (dados|pesquisas|estudos|estatísticas) (da|do|de))\b/gi,
  /\b(de acordo com (relatórios|levantamentos|números) (da|do|de))\b/gi,
];

const FALSE_PROMISE_PATTERNS = [
  /\b(vamos (resolver|encaminhar|garantir|providenciar))\b/gi,
  /\b(isso será (encaminhado|resolvido|tratado) (pelo|pela|por))\b/gi,
  /\b(providências (serão|já foram) tomadas)\b/gi,
];

// Only scan inside string literals, template literals, and comments
const STRING_CONTENT_REGEX = /(?:['"`])([^'"`]*?)(?:['"`])|(?:\/\/\s*)(.*?)$|(?:\/\*)([\s\S]*?)(?:\*\/)/gm;

function extractStringContent(code: string): Array<{ text: string; lineOffset: number }> {
  const results: Array<{ text: string; lineOffset: number }> = [];
  let match;
  while ((match = STRING_CONTENT_REGEX.exec(code)) !== null) {
    const text = match[1] || match[2] || match[3] || '';
    if (text.length > 10) { // Skip short strings (likely not prompts)
      const lineOffset = code.slice(0, match.index).split('\n').length;
      results.push({ text, lineOffset });
    }
  }
  return results;
}

function scanText(text: string, file: string, lineOffset: number): Violation[] {
  const violations: Violation[] = [];
  const patterns: Array<{ patterns: RegExp[]; category: string; level: ViolationLevel }> = [
    { patterns: ABSOLUTE_CLAIM_PATTERNS, category: 'absolute_claim', level: 'warning' },
    { patterns: FABRICATED_DATA_PATTERNS, category: 'fabricated_data', level: 'error' },
    { patterns: FALSE_PROMISE_PATTERNS, category: 'false_promise', level: 'error' },
  ];

  for (const { patterns: pats, category, level } of patterns) {
    for (const pattern of pats) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let m;
      while ((m = regex.exec(text)) !== null) {
        violations.push({ level, category, message: `${category}: "${m[0]}"`, matched: m[0], file, line: lineOffset });
      }
    }
  }
  return violations;
}

function scanFile(filePath: string): Violation[] {
  if (!existsSync(filePath)) return [];
  const code = readFileSync(filePath, 'utf-8');
  const ext = path.extname(filePath);

  // For prompt files (.md), scan the entire content
  if (['.md', '.txt'].includes(ext)) {
    return code.split('\n').flatMap((line, i) => scanText(line, filePath, i + 1));
  }

  // For code files, only scan string content
  if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
    const strings = extractStringContent(code);
    return strings.flatMap(({ text, lineOffset }) => scanText(text, filePath, lineOffset));
  }

  return [];
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const mode = args.includes('--all') ? 'all' : args.includes('--file') ? 'file' : 'staged';

let files: string[] = [];

if (mode === 'file') {
  const idx = args.indexOf('--file');
  files = [args[idx + 1]].filter(Boolean);
} else if (mode === 'all') {
  const out = execSync('find src -type f \\( -name "*.ts" -o -name "*.tsx" \\) ! -path "*/node_modules/*"', { encoding: 'utf-8' });
  files = out.trim().split('\n').filter(Boolean);
} else {
  try {
    const out = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf-8' });
    files = out.trim().split('\n').filter(f => /\.(ts|tsx|js|jsx|md)$/.test(f));
  } catch {
    files = [];
  }
}

if (files.length === 0) {
  console.log('🔰 ATRiAN: No files to scan.');
  process.exit(0);
}

console.log(`\n🛡️  ATRiAN Ethical Scanner — scanning ${files.length} file(s)...\n`);

const allViolations: Violation[] = [];

for (const file of files) {
  const violations = scanFile(file);
  allViolations.push(...violations);
}

// ─── Report ──────────────────────────────────────────────────────────────────

const criticals = allViolations.filter(v => v.level === 'critical');
const errors = allViolations.filter(v => v.level === 'error');
const warnings = allViolations.filter(v => v.level === 'warning');

if (allViolations.length === 0) {
  console.log('✅ ATRiAN: All clear. No ethical violations detected.\n');
  process.exit(0);
}

console.log('─'.repeat(60));
for (const v of allViolations) {
  const icon = v.level === 'critical' ? '🚨' : v.level === 'error' ? '❌' : '⚠️';
  console.log(`${icon} [${v.level.toUpperCase()}] ${v.file}:${v.line}`);
  console.log(`   ${v.category}: "${v.matched}"`);
}
console.log('─'.repeat(60));
console.log(`\n📊 Summary: ${criticals.length} critical | ${errors.length} error | ${warnings.length} warning`);

const score = Math.max(0, 100 - criticals.length * 30 - errors.length * 15 - warnings.length * 5);
console.log(`🏆 ATRiAN Score: ${score}/100\n`);

if (criticals.length > 0 || errors.length > 0) {
  console.log('❌ BLOCKED: Fix critical/error violations before committing.\n');
  process.exit(1);
} else {
  console.log('⚠️  PASSED with warnings. Consider reviewing flagged items.\n');
  process.exit(0);
}
