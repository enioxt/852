#!/usr/bin/env node
/**
 * ORCH-001: Autonomous Log Analyzer with AI
 * 
 * Sistema automatizado que:
 * 1. Analisa logs de erro a cada 1h
 * 2. Usa IA (Alibaba/Gemini) para classificar padrões
 * 3. Notifica via Telegram (critical/high only)
 * 4. Aplica noise reduction
 * 5. Gera dashboard de health status
 * 
 * Usage:
 *   npx tsx scripts/orchestrator/log-analyzer.ts
 *   npx tsx scripts/orchestrator/log-analyzer.ts --cron  # Run as cron
 *   npx tsx scripts/orchestrator/log-analyzer.ts --test  # Test mode (no telegram)
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

const LOG_FILE = join(process.cwd(), 'error.log');
const ORCHESTRATOR_DIR = join(process.cwd(), 'scripts', 'orchestrator');
const STATE_FILE = join(ORCHESTRATOR_DIR, 'log-analyzer-state.json');
const REPORT_DIR = join(process.cwd(), 'docs', '_generated', 'orchestrator');

// Configuração de severidade
const SEVERITY_PATTERNS = {
  P0: [
    /database connection failed/i,
    /supabase.*error/i,
    /asaas.*payment.*failed/i,
    /auth.*failed/i,
    /credential.*flow.*error/i,
    /kyc.*extraction.*failed/i,
    /crash|fatal|uncaught/i,
  ],
  P1: [
    /api.*timeout/i,
    /rate.*limit/i,
    /validation.*error/i,
    /telegram.*failed/i,
    /whatsapp.*error/i,
    /retry.*exhausted/i,
  ],
  P2: [
    /deprecation/i,
    /warning/i,
    /slow.*query/i,
    /cache.*miss/i,
  ],
};

// Categorias de erro
const ERROR_CATEGORIES = {
  database: /database|supabase|postgres|query/i,
  payment: /asaas|payment|wallet|transaction/i,
  auth: /auth|session|token|login/i,
  api: /api|route|endpoint|fetch/i,
  ai: /ai|llm|openrouter|gemini|alibaba/i,
  notification: /telegram|whatsapp|push|email/i,
  kyc: /kyc|credential|document|extraction/i,
  general: /.*/,
};

interface LogEntry {
  timestamp: string;
  severity: 'P0' | 'P1' | 'P2';
  category: string;
  message: string;
  fingerprint: string;
  count: number;
  lastSeen: string;
}

interface AnalyzerState {
  lastRun: string;
  processedFingerprints: Record<string, number>;
  dailyStats: {
    date: string;
    P0: number;
    P1: number;
    P2: number;
  };
}

interface AnalysisReport {
  generatedAt: string;
  entries: LogEntry[];
  summary: {
    total: number;
    P0: number;
    P1: number;
    P2: number;
    byCategory: Record<string, number>;
  };
  newFindings: LogEntry[];
  recommendations: string[];
}

// Initialize directories
function init(): void {
  if (!existsSync(ORCHESTRATOR_DIR)) {
    mkdirSync(ORCHESTRATOR_DIR, { recursive: true });
  }
  if (!existsSync(REPORT_DIR)) {
    mkdirSync(REPORT_DIR, { recursive: true });
  }
}

// Load state
function loadState(): AnalyzerState {
  if (existsSync(STATE_FILE)) {
    return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
  }
  return {
    lastRun: new Date(0).toISOString(),
    processedFingerprints: {},
    dailyStats: {
      date: new Date().toISOString().split('T')[0],
      P0: 0,
      P1: 0,
      P2: 0,
    },
  };
}

// Save state
function saveState(state: AnalyzerState): void {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Generate fingerprint for deduplication
function generateFingerprint(message: string): string {
  // Normalize message (remove timestamps, variable parts)
  const normalized = message
    .replace(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/g, '')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/g, '<UUID>')
    .replace(/\d+/g, '<NUM>')
    .substring(0, 200);

  return createHash('md5').update(normalized).digest('hex').substring(0, 16);
}

// Parse log file
function parseLogs(): string[] {
  if (!existsSync(LOG_FILE)) {
    console.log('⚠️ No error.log file found');
    return [];
  }

  const content = readFileSync(LOG_FILE, 'utf-8');

  // Split by common log delimiters
  const lines = content.split(/\n(?=\d{4}-\d{2}-\d{2}|\[|Error|ERROR)/);

  return lines.filter(line => line.trim().length > 0);
}

// Classify severity
function classifySeverity(message: string): 'P0' | 'P1' | 'P2' {
  for (const pattern of SEVERITY_PATTERNS.P0) {
    if (pattern.test(message)) return 'P0';
  }
  for (const pattern of SEVERITY_PATTERNS.P1) {
    if (pattern.test(message)) return 'P1';
  }
  for (const pattern of SEVERITY_PATTERNS.P2) {
    if (pattern.test(message)) return 'P2';
  }
  return 'P2'; // Default
}

// Classify category
function classifyCategory(message: string): string {
  for (const [category, pattern] of Object.entries(ERROR_CATEGORIES)) {
    if (pattern.test(message)) return category;
  }
  return 'general';
}

// Extract timestamp from log line
function extractTimestamp(line: string): string {
  const match = line.match(/(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2})/);
  return match ? match[1] : new Date().toISOString();
}

// AI Analysis (simulated - can integrate with Alibaba/Gemini)
async function aiAnalyzePattern(entries: LogEntry[]): Promise<string[]> {
  const recommendations: string[] = [];

  // Pattern analysis without AI call (for now)
  const categoryCounts: Record<string, number> = {};
  entries.forEach(e => {
    categoryCounts[e.category] = (categoryCounts[e.category] || 0) + e.count;
  });

  // Generate recommendations based on patterns
  if (categoryCounts['database'] > 5) {
    recommendations.push('🔴 Database errors frequent - check connection pool');
  }
  if (categoryCounts['payment'] > 3) {
    recommendations.push('🟡 Payment failures detected - verify Asaas integration');
  }
  if (categoryCounts['auth'] > 5) {
    recommendations.push('🟡 Auth issues - check Supabase sessions');
  }
  if (categoryCounts['ai'] > 10) {
    recommendations.push('🟠 AI costs spiking - review circuit breakers');
  }

  // If we have Alibaba/Gemini integration:
  // const analysis = await callAlibabaForPatternAnalysis(entries);

  return recommendations;
}

// Main analysis function
async function analyzeLogs(): Promise<AnalysisReport> {
  const state = loadState();
  const rawLogs = parseLogs();

  if (rawLogs.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      entries: [],
      summary: { total: 0, P0: 0, P1: 0, P2: 0, byCategory: {} },
      newFindings: [],
      recommendations: ['✅ No errors found in log file'],
    };
  }

  // Process logs
  const entries: LogEntry[] = rawLogs.map(line => {
    const severity = classifySeverity(line);
    const category = classifyCategory(line);
    const fingerprint = generateFingerprint(line);

    return {
      timestamp: extractTimestamp(line),
      severity,
      category,
      message: line.substring(0, 500), // Truncate long messages
      fingerprint,
      count: state.processedFingerprints[fingerprint] || 0,
      lastSeen: new Date().toISOString(),
    };
  });

  // Deduplicate and count
  const fingerprintMap = new Map<string, LogEntry>();
  entries.forEach(entry => {
    if (fingerprintMap.has(entry.fingerprint)) {
      const existing = fingerprintMap.get(entry.fingerprint)!;
      existing.count++;
    } else {
      entry.count = 1;
      fingerprintMap.set(entry.fingerprint, entry);
    }
  });

  const uniqueEntries = Array.from(fingerprintMap.values());

  // Identify new findings (not seen before)
  const newFindings = uniqueEntries.filter(e =>
    !state.processedFingerprints[e.fingerprint]
  );

  // Update state
  uniqueEntries.forEach(e => {
    state.processedFingerprints[e.fingerprint] = e.count;
  });

  // Update daily stats
  const today = new Date().toISOString().split('T')[0];
  if (state.dailyStats.date !== today) {
    state.dailyStats = { date: today, P0: 0, P1: 0, P2: 0 };
  }
  uniqueEntries.forEach(e => {
    state.dailyStats[e.severity] += e.count;
  });

  state.lastRun = new Date().toISOString();
  saveState(state);

  // Calculate summary
  const byCategory: Record<string, number> = {};
  uniqueEntries.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.count;
  });

  const summary = {
    total: uniqueEntries.reduce((sum, e) => sum + e.count, 0),
    P0: uniqueEntries.filter(e => e.severity === 'P0').reduce((sum, e) => sum + e.count, 0),
    P1: uniqueEntries.filter(e => e.severity === 'P1').reduce((sum, e) => sum + e.count, 0),
    P2: uniqueEntries.filter(e => e.severity === 'P2').reduce((sum, e) => sum + e.count, 0),
    byCategory,
  };

  // Get AI recommendations
  const recommendations = await aiAnalyzePattern(uniqueEntries);

  return {
    generatedAt: new Date().toISOString(),
    entries: uniqueEntries,
    summary,
    newFindings,
    recommendations,
  };
}

// Send Telegram notification
async function sendTelegramNotification(report: AnalysisReport, isTest: boolean): Promise<void> {
  if (isTest) {
    console.log('📱 [TEST MODE] Telegram notification would be sent:');
    console.log(`   P0: ${report.summary.P0}, P1: ${report.summary.P1}, P2: ${report.summary.P2}`);
    return;
  }

  // Only send for P0/P1 (noise reduction)
  if (report.summary.P0 === 0 && report.summary.P1 === 0) {
    console.log('📱 No critical/high errors - skipping Telegram (noise reduction)');
    return;
  }

  const { sendTelegramAdminReport } = await import('@/services/telegram/core');

  const alert: TelegramAdminReport = {
    title: `🚨 API Health Alert: ${report.summary.failing} endpoints failing`,
    priority: 'critical',
    category: 'orchestrator',
    intro: `Log analyzer found ${report.summary.total} errors`,
    summary: [
      { label: 'Critical (P0)', value: report.summary.P0 },
      { label: 'High (P1)', value: report.summary.P1 },
      { label: 'Low (P2)', value: report.summary.P2 },
      { label: 'New Findings', value: report.newFindings.length },
    ],
    diagnosis: report.recommendations.slice(0, 3),
    nextSteps: [
      'Check error.log for details',
      'Review dashboard at /admin/telemetry',
      'Run: npm run orchestrator:logs',
    ],
  };

  try {
    await sendTelegramAdminReport(alert);
    console.log('📱 Telegram notification sent');
  } catch (e) {
    console.error('❌ Failed to send Telegram:', e);
  }
}

// Save report
function saveReport(report: AnalysisReport): void {
  const filename = `log-analysis-${new Date().toISOString().split('T')[0]}.json`;
  const filepath = join(REPORT_DIR, filename);
  writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(`📄 Report saved: ${filepath}`);
}

// Generate dashboard data
function updateDashboard(report: AnalysisReport): void {
  const dashboardFile = join(REPORT_DIR, 'health-dashboard.json');

  const dashboard = {
    lastUpdated: new Date().toISOString(),
    status: report.summary.P0 > 0 ? 'critical' : report.summary.P1 > 0 ? 'warning' : 'healthy',
    metrics: {
      errors: report.summary,
      recommendations: report.recommendations,
    },
  };

  writeFileSync(dashboardFile, JSON.stringify(dashboard, null, 2));
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isTest = args.includes('--test');
  const isCron = args.includes('--cron');

  init();

  console.log('🔍 ORCH-001: Autonomous Log Analyzer');
  console.log(`   Mode: ${isTest ? 'TEST' : isCron ? 'CRON' : 'MANUAL'}`);
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log();

  const report = await analyzeLogs();

  // Output summary
  console.log('📊 Analysis Summary:');
  console.log(`   Total errors: ${report.summary.total}`);
  console.log(`   Critical (P0): ${report.summary.P0}`);
  console.log(`   High (P1): ${report.summary.P1}`);
  console.log(`   Low (P2): ${report.summary.P2}`);
  console.log(`   New findings: ${report.newFindings.length}`);
  console.log();

  if (report.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    report.recommendations.forEach(r => console.log(`   ${r}`));
    console.log();
  }

  // Send notifications
  await sendTelegramNotification(report, isTest);

  // Save outputs
  saveReport(report);
  updateDashboard(report);

  console.log('✅ Analysis complete');
}

// Run
main().catch(console.error);
