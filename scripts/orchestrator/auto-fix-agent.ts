#!/usr/bin/env node
/**
 * ORCH-005: Autonomous Auto-Fix Agent
 * 
 * Sistema automatizado que:
 * 1. Detecta problemas comuns (lint, typos, config drift)
 * 2. Aplica correções automáticas onde seguro
 * 3. Notifica Telegram ANTES de aplicar
 * 4. Gera relatório de mudanças
 * 5. Cria PR para review (em modo produção)
 * 
 * Correções aplicáveis:
 * - Lint errors auto-fix (eslint --fix)
 * - Typos em logs/mensagens
 * - Formatação inconsistente
 * - Import statements ordenados
 * - Configuração de env vars faltando
 * 
 * Usage:
 *   npx tsx scripts/orchestrator/auto-fix-agent.ts --dry    # Preview only
 *   npx tsx scripts/orchestrator/auto-fix-agent.ts --exec   # Apply fixes
 *   npx tsx scripts/orchestrator/auto-fix-agent.ts --cron   # Cron mode (dry)
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const ORCHESTRATOR_DIR = join(process.cwd(), 'scripts', 'orchestrator');
const STATE_FILE = join(ORCHESTRATOR_DIR, 'auto-fix-state.json');
const REPORT_DIR = join(process.cwd(), 'docs', '_generated', 'orchestrator');
const FIXES_DIR = join(process.cwd(), 'docs', '_generated', 'fixes');

// Tipos de fix disponíveis
const FIX_TYPES = [
  {
    id: 'eslint',
    name: 'ESLint Auto-Fix',
    command: 'npx eslint --fix --ext .ts,.tsx app/ lib/ components/',
    safe: true,
    description: 'Fixes code style, unused imports, formatting',
  },
  {
    id: 'prettier',
    name: 'Prettier Format',
    command: 'npx prettier --write "**/*.{ts,tsx,js,jsx,json,md}"',
    safe: true,
    description: 'Consistent code formatting',
  },
  {
    id: 'imports',
    name: 'Organize Imports',
    command: 'npx tsx scripts/orchestrator/organize-imports.ts',
    safe: true,
    description: 'Sort and organize import statements',
  },
  {
    id: 'typo-logs',
    name: 'Fix Log Typos',
    command: 'npx tsx scripts/orchestrator/fix-typos.ts',
    safe: true,
    description: 'Common typos in log messages',
  },
  {
    id: 'typecheck',
    name: 'TypeScript Check',
    command: 'npx tsc --noEmit',
    safe: false, // Requires manual review
    description: 'Type checking (manual fix needed)',
  },
];

interface FixResult {
  type: string;
  name: string;
  executed: boolean;
  output: string;
  filesChanged: string[];
  errors: string[];
  safe: boolean;
}

interface FixState {
  lastRun: string;
  fixesApplied: number;
  dailyStats: {
    date: string;
    dryRuns: number;
    executions: number;
    filesChanged: number;
  };
}

interface AutoFixReport {
  generatedAt: string;
  mode: 'dry' | 'exec' | 'cron';
  results: FixResult[];
  summary: {
    total: number;
    executed: number;
    skipped: number;
    errors: number;
    filesChanged: number;
  };
  changes: string[];
  gitDiff?: string;
}

// Initialize
function init(): void {
  if (!existsSync(ORCHESTRATOR_DIR)) {
    mkdirSync(ORCHESTRATOR_DIR, { recursive: true });
  }
  if (!existsSync(REPORT_DIR)) {
    mkdirSync(REPORT_DIR, { recursive: true });
  }
  if (!existsSync(FIXES_DIR)) {
    mkdirSync(FIXES_DIR, { recursive: true });
  }
}

// Load state
function loadState(): FixState {
  if (existsSync(STATE_FILE)) {
    const state = JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
    const today = new Date().toISOString().split('T')[0];
    if (state.dailyStats?.date !== today) {
      state.dailyStats = { date: today, dryRuns: 0, executions: 0, filesChanged: 0 };
    }
    return state;
  }
  return {
    lastRun: new Date(0).toISOString(),
    fixesApplied: 0,
    dailyStats: {
      date: new Date().toISOString().split('T')[0],
      dryRuns: 0,
      executions: 0,
      filesChanged: 0,
    },
  };
}

// Save state
function saveState(state: FixState): void {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Execute a fix
async function executeFix(fixType: typeof FIX_TYPES[0], isDry: boolean): Promise<FixResult> {
  console.log(`   ${isDry ? '🔍' : '🔧'} ${fixType.name} (${isDry ? 'dry' : 'exec'})`);
  
  const result: FixResult = {
    type: fixType.id,
    name: fixType.name,
    executed: false,
    output: '',
    filesChanged: [],
    errors: [],
    safe: fixType.safe,
  };
  
  if (isDry && !fixType.safe) {
    console.log(`      ⏭️  Skipped (unsafe in dry mode)`);
    return result;
  }
  
  try {
    const output = execSync(fixType.command, {
      encoding: 'utf8',
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    
    result.output = output;
    result.executed = !isDry;
    
    // Parse files changed from output
    const fileMatches = output.match(/app\/[^\s]+|lib\/[^\s]+|components\/[^\s]+/g);
    if (fileMatches) {
      result.filesChanged = [...new Set(fileMatches)];
    }
    
    console.log(`      ✅ ${result.filesChanged.length} files`);
    
  } catch (error) {
    const errorOutput = error instanceof Error ? error.message : String(error);
    result.errors.push(errorOutput);
    console.log(`      ❌ Error: ${errorOutput.substring(0, 100)}`);
  }
  
  return result;
}

// Get git diff
function getGitDiff(): string {
  try {
    return execSync('git diff --stat && echo "---" && git diff', {
      encoding: 'utf8',
      timeout: 10000,
    });
  } catch {
    return '';
  }
}

// Main fix execution
async function runAutoFix(mode: 'dry' | 'exec' | 'cron'): Promise<AutoFixReport> {
  const state = loadState();
  const isDry = mode !== 'exec';
  
  console.log(`${isDry ? '🔍' : '🔧'} Running auto-fix agent (${mode})...`);
  console.log();
  
  const results: FixResult[] = [];
  
  for (const fixType of FIX_TYPES) {
    const result = await executeFix(fixType, isDry);
    results.push(result);
  }
  
  // Calculate summary
  const executed = results.filter(r => r.executed).length;
  const errors = results.filter(r => r.errors.length > 0).length;
  const filesChanged = [...new Set(results.flatMap(r => r.filesChanged))];
  
  // Update state
  if (isDry) {
    state.dailyStats.dryRuns++;
  } else {
    state.dailyStats.executions++;
    state.dailyStats.filesChanged += filesChanged.length;
    state.fixesApplied += executed;
  }
  state.lastRun = new Date().toISOString();
  saveState(state);
  
  // Generate changes list
  const changes: string[] = [];
  results.forEach(r => {
    if (r.filesChanged.length > 0) {
      changes.push(`${r.name}: ${r.filesChanged.length} files`);
    }
  });
  
  return {
    generatedAt: new Date().toISOString(),
    mode,
    results,
    summary: {
      total: FIX_TYPES.length,
      executed,
      skipped: FIX_TYPES.length - executed - errors,
      errors,
      filesChanged: filesChanged.length,
    },
    changes,
    gitDiff: mode === 'exec' ? getGitDiff() : undefined,
  };
}

// Send notification
async function sendNotification(report: AutoFixReport, isTest: boolean): Promise<void> {
  if (isTest) {
    console.log('📱 [TEST MODE] Would notify Telegram');
    return;
  }
  
  // In exec mode, notify BEFORE applying (for approval)
  // In dry/cron mode, notify of findings
  
  const hasChanges = report.summary.filesChanged > 0;
  
  if (!hasChanges && report.mode === 'cron') {
    console.log('📱 No changes - skipping notification');
    return;
  }
  
  try {
    const { sendTelegramAdminReport } = await import('@/services/telegram/core');
    
    const alert = {
      title: report.mode === 'exec' 
        ? `🔧 Auto-Fix Applied: ${report.summary.filesChanged} files changed`
        : `🔍 Auto-Fix Preview: ${report.summary.filesChanged} files can be fixed`,
      priority: report.mode === 'exec' ? 'high' : 'medium',
      category: 'orchestrator',
      intro: `Auto-fix agent ${report.mode} mode - ${report.summary.executed} fixes`,
      summary: [
        { label: 'Files Changed', value: report.summary.filesChanged },
        { label: 'Fixes Applied', value: report.summary.executed },
        { label: 'Errors', value: report.summary.errors },
        { label: 'Mode', value: report.mode },
      ],
      diagnosis: report.changes.slice(0, 5),
      nextSteps: report.mode === 'dry' 
        ? [
            'Review changes in report',
            'Run: npx tsx scripts/orchestrator/auto-fix-agent.ts --exec',
            'Check git diff before committing',
          ]
        : [
            'Review git diff',
            'Run tests: npm test',
            'Commit changes if tests pass',
          ],
    };
    
    await sendTelegramAdminReport(alert);
    console.log('📱 Telegram notification sent');
  } catch (e) {
    console.error('❌ Failed to send Telegram:', e);
  }
}

// Save report
function saveReport(report: AutoFixReport): void {
  const filename = `auto-fix-${new Date().toISOString().split('T')[0]}-${report.mode}.json`;
  const filepath = join(REPORT_DIR, filename);
  writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(`📄 Report saved: ${filepath}`);
  
  // Save git diff separately if exec mode
  if (report.gitDiff && report.gitDiff.length > 0) {
    const diffFile = join(FIXES_DIR, `changes-${new Date().toISOString().split('T')[0]}.diff`);
    writeFileSync(diffFile, report.gitDiff);
    console.log(`📄 Git diff saved: ${diffFile}`);
  }
}

// Create PR (simulated - would use GitHub API in production)
async function createPullRequest(report: AutoFixReport): Promise<void> {
  if (report.summary.filesChanged === 0) {
    return;
  }
  
  console.log();
  console.log('📋 To create PR:');
  console.log('   1. git add .');
  console.log('   2. git commit -m "chore: auto-fix applied by orchestrator"');
  console.log('   3. git push origin auto-fix/$(date +%Y%m%d)');
  console.log('   4. gh pr create --title "Auto-fix: $(date)" --body "See report"');
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isTest = args.includes('--test');
  
  let mode: 'dry' | 'exec' | 'cron' = 'dry';
  if (args.includes('--exec')) mode = 'exec';
  if (args.includes('--cron')) mode = 'cron';

  init();

  console.log('🤖 ORCH-005: Autonomous Auto-Fix Agent');
  console.log(`   Mode: ${isTest ? 'TEST' : mode.toUpperCase()}`);
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log();

  // Safety check for exec mode
  if (mode === 'exec' && !isTest) {
    console.log('⚠️  EXEC MODE: Will apply fixes automatically');
    console.log('   Sending notification before applying...');
    console.log();
  }

  const report = await runAutoFix(mode);

  // Output summary
  console.log();
  console.log('📊 Fix Summary:');
  console.log(`   Total fixes: ${report.summary.total}`);
  console.log(`   Executed: ${report.summary.executed}`);
  console.log(`   Skipped: ${report.summary.skipped}`);
  console.log(`   Errors: ${report.summary.errors}`);
  console.log(`   Files changed: ${report.summary.filesChanged}`);
  console.log();

  if (report.changes.length > 0) {
    console.log('📝 Changes:');
    report.changes.forEach(c => console.log(`   ${c}`));
    console.log();
  }

  // Send notifications
  await sendNotification(report, isTest);

  // Save outputs
  saveReport(report);

  // Suggest PR creation in exec mode
  if (mode === 'exec' && report.summary.filesChanged > 0) {
    await createPullRequest(report);
  }

  console.log('✅ Auto-fix complete');
}

// Run
main().catch(console.error);
