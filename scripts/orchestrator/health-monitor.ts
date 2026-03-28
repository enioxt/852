#!/usr/bin/env node
/**
 * ORCH-002: Autonomous API Health Monitor
 * 
 * Sistema automatizado que:
 * 1. Monitora endpoints críticos a cada 5 minutos
 * 2. Verifica resposta 200 e tempo < 2s
 * 3. Alerta Telegram se falhar 3x consecutivas
 * 4. Gera relatório diário de uptime
 * 5. Roda como cron job no Vercel
 * 
 * Endpoints monitorados:
 * - /api/instructor/verificacao (MG credential flow)
 * - /api/partner/instructor-drafts (Partner flow)
 * - /api/webhooks/whatsapp (WhatsApp integration)
 * - /api/health (System health)
 * 
 * Usage:
 *   npx tsx scripts/orchestrator/health-monitor.ts
 *   npx tsx scripts/orchestrator/health-monitor.ts --cron
 *   npx tsx scripts/orchestrator/health-monitor.ts --test
 */

import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { TelegramAdminReport } from '@/services/telegram/core';

const ORCHESTRATOR_DIR = join(process.cwd(), 'scripts', 'orchestrator');
const STATE_FILE = join(ORCHESTRATOR_DIR, 'health-monitor-state.json');
const REPORT_DIR = join(process.cwd(), 'docs', '_generated', 'orchestrator');

// Endpoints críticos para monitorar
const ENDPOINTS = [
  {
    name: 'Instructor Verification',
    url: '/api/instructor/verificacao',
    method: 'GET',
    timeout: 2000,
    critical: true, // MG credential flow
  },
  {
    name: 'Partner Instructor Drafts',
    url: '/api/partner/instructor-drafts',
    method: 'GET',
    timeout: 2000,
    critical: true,
  },
  {
    name: 'WhatsApp Webhook',
    url: '/api/webhooks/whatsapp',
    method: 'GET',
    timeout: 2000,
    critical: true,
  },
  {
    name: 'System Health',
    url: '/api/health',
    method: 'GET',
    timeout: 1000,
    critical: false,
  },
  {
    name: 'Lessons API',
    url: '/api/lessons',
    method: 'GET',
    timeout: 2000,
    critical: false,
  },
  {
    name: 'Bookings API',
    url: '/api/bookings',
    method: 'GET',
    timeout: 2000,
    critical: false,
  },
];

interface EndpointResult {
  name: string;
  url: string;
  status: number;
  responseTime: number;
  success: boolean;
  error?: string;
  timestamp: string;
}

interface HealthState {
  failures: Record<string, number>; // endpoint -> consecutive failures
  lastCheck: string;
  dailyStats: {
    date: string;
    checks: number;
    failures: number;
    uptime: number; // percentage
  };
  history: Array<{
    timestamp: string;
    results: EndpointResult[];
  }>;
}

interface HealthReport {
  generatedAt: string;
  results: EndpointResult[];
  summary: {
    total: number;
    passing: number;
    failing: number;
    avgResponseTime: number;
    uptime24h: number;
  };
  alerts: string[];
  recommendations: string[];
}

// Initialize
function init(): void {
  if (!existsSync(ORCHESTRATOR_DIR)) {
    mkdirSync(ORCHESTRATOR_DIR, { recursive: true });
  }
  if (!existsSync(REPORT_DIR)) {
    mkdirSync(REPORT_DIR, { recursive: true });
  }
}

// Load state
function loadState(): HealthState {
  if (existsSync(STATE_FILE)) {
    const state = JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
    // Ensure daily stats are reset if new day
    const today = new Date().toISOString().split('T')[0];
    if (state.dailyStats?.date !== today) {
      state.dailyStats = { date: today, checks: 0, failures: 0, uptime: 100 };
    }
    return state;
  }
  return {
    failures: {},
    lastCheck: new Date(0).toISOString(),
    dailyStats: {
      date: new Date().toISOString().split('T')[0],
      checks: 0,
      failures: 0,
      uptime: 100,
    },
    history: [],
  };
}

// Save state
function saveState(state: HealthState): void {
  // Keep only last 100 history entries
  if (state.history.length > 100) {
    state.history = state.history.slice(-100);
  }
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Check single endpoint
async function checkEndpoint(endpoint: typeof ENDPOINTS[0]): Promise<EndpointResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004';
  const url = `${baseUrl}${endpoint.url}`;
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout);

    const response = await fetch(url, {
      method: endpoint.method,
      signal: controller.signal,
      headers: {
        'User-Agent': 'EGOS-Health-Monitor/1.0',
      },
    });

    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;
    const success = response.status === 200 && responseTime < endpoint.timeout;

    return {
      name: endpoint.name,
      url: endpoint.url,
      status: response.status,
      responseTime,
      success,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: endpoint.name,
      url: endpoint.url,
      status: 0,
      responseTime: Date.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

// Check all endpoints
async function checkAllEndpoints(): Promise<HealthReport> {
  const state = loadState();

  console.log('🔍 Checking endpoints...');
  const results = await Promise.all(ENDPOINTS.map(e => checkEndpoint(e)));

  // Update failure counts
  const alerts: string[] = [];

  results.forEach(result => {
    if (!result.success) {
      state.failures[result.url] = (state.failures[result.url] || 0) + 1;

      // Alert if 3 consecutive failures on critical endpoint
      const endpoint = ENDPOINTS.find(e => e.url === result.url);
      if (endpoint?.critical && state.failures[result.url] >= 3) {
        alerts.push(`🚨 ${result.name} failed ${state.failures[result.url]}x consecutively`);
      }
    } else {
      // Reset failure count on success
      if (state.failures[result.url]) {
        delete state.failures[result.url];
      }
    }
  });

  // Update daily stats
  state.dailyStats.checks++;
  const failedCount = results.filter(r => !r.success).length;
  state.dailyStats.failures += failedCount;

  // Calculate uptime
  const totalChecks = state.dailyStats.checks;
  const successfulChecks = totalChecks - state.dailyStats.failures;
  state.dailyStats.uptime = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100;

  // Add to history
  state.history.push({
    timestamp: new Date().toISOString(),
    results,
  });

  state.lastCheck = new Date().toISOString();
  saveState(state);

  // Calculate summary
  const passing = results.filter(r => r.success).length;
  const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

  // Generate recommendations
  const recommendations: string[] = [];

  const slowEndpoints = results.filter(r => r.responseTime > 1000 && r.success);
  if (slowEndpoints.length > 0) {
    recommendations.push(`⚠️ ${slowEndpoints.length} endpoints slower than 1s`);
  }

  const criticalFailing = results.filter(r => !r.success && ENDPOINTS.find(e => e.url === r.url)?.critical);
  if (criticalFailing.length > 0) {
    recommendations.push(`🔴 ${criticalFailing.length} critical endpoints failing`);
  }

  if (state.dailyStats.uptime < 99) {
    recommendations.push(`📉 Daily uptime below 99%: ${state.dailyStats.uptime.toFixed(2)}%`);
  }

  return {
    generatedAt: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      passing,
      failing: results.length - passing,
      avgResponseTime: Math.round(avgResponseTime),
      uptime24h: state.dailyStats.uptime,
    },
    alerts,
    recommendations,
  };
}

// Send Telegram alerts
async function sendTelegramAlerts(report: HealthReport, isTest: boolean): Promise<void> {
  if (isTest) {
    console.log('📱 [TEST MODE] Alerts that would be sent:');
    report.alerts.forEach(a => console.log(`   ${a}`));
    return;
  }

  if (report.alerts.length === 0) {
    console.log('📱 No critical alerts to send');
    return;
  }

  try {
    const { sendTelegramAdminReport } = await import('@/services/telegram/core');

    const alert: TelegramAdminReport = {
      title: `🚨 API Health Alert: ${report.summary.failing} endpoints failing`,
      priority: 'critical',
      category: 'orchestrator',
      intro: `Health monitor detected ${report.summary.failing} failing endpoints`,
      summary: [
        { label: 'Passing', value: report.summary.passing },
        { label: 'Failing', value: report.summary.failing },
        { label: 'Avg Response', value: `${report.summary.avgResponseTime}ms` },
        { label: 'Daily Uptime', value: `${report.summary.uptime24h.toFixed(1)}%` },
      ],
      diagnosis: report.alerts,
      nextSteps: [
        'Check Vercel deployment status',
        'Verify Supabase connection',
        'Review error logs: npm run orchestrator:logs',
        'Run manual health check',
      ],
    };

    await sendTelegramAdminReport(alert);
    console.log('📱 Telegram alerts sent');
  } catch (e) {
    console.error('❌ Failed to send Telegram:', e);
  }
}

// Save report
function saveReport(report: HealthReport): void {
  const filename = `health-${new Date().toISOString().split('T')[0]}.json`;
  const filepath = join(REPORT_DIR, filename);
  writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(`📄 Report saved: ${filepath}`);
}

// Generate daily uptime report
function generateDailyReport(): void {
  const state = loadState();
  const today = new Date().toISOString().split('T')[0];

  const report = {
    date: today,
    uptime: state.dailyStats.uptime,
    checks: state.dailyStats.checks,
    failures: state.dailyStats.failures,
    status: state.dailyStats.uptime >= 99 ? 'healthy' : state.dailyStats.uptime >= 95 ? 'degraded' : 'critical',
  };

  const filepath = join(REPORT_DIR, `uptime-${today}.json`);
  writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(`📊 Daily uptime report: ${report.uptime.toFixed(2)}%`);
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isTest = args.includes('--test');
  const isCron = args.includes('--cron');

  init();

  console.log('🏥 ORCH-002: Autonomous API Health Monitor');
  console.log(`   Mode: ${isTest ? 'TEST' : isCron ? 'CRON' : 'MANUAL'}`);
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log(`   Base URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004'}`);
  console.log();

  const report = await checkAllEndpoints();

  // Output results
  console.log('📊 Health Check Results:');
  report.results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    const time = `${r.responseTime}ms`;
    const status = r.status > 0 ? `[${r.status}]` : '[ERR]';
    console.log(`   ${icon} ${r.name.padEnd(25)} ${status} ${time.padStart(6)}`);
  });
  console.log();

  console.log('📈 Summary:');
  console.log(`   Passing: ${report.summary.passing}/${report.summary.total}`);
  console.log(`   Avg Response: ${report.summary.avgResponseTime}ms`);
  console.log(`   Daily Uptime: ${report.summary.uptime24h.toFixed(2)}%`);
  console.log();

  if (report.alerts.length > 0) {
    console.log('🚨 Alerts:');
    report.alerts.forEach(a => console.log(`   ${a}`));
    console.log();
  }

  if (report.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    report.recommendations.forEach(r => console.log(`   ${r}`));
    console.log();
  }

  // Send notifications
  await sendTelegramAlerts(report, isTest);

  // Save outputs
  saveReport(report);
  generateDailyReport();

  console.log('✅ Health check complete');

  // Exit with error code if critical failures in CI mode
  if (isCron && report.summary.failing > 0) {
    const criticalFailing = report.results.filter(r =>
      !r.success && ENDPOINTS.find(e => e.url === r.url)?.critical
    ).length;
    if (criticalFailing > 0) {
      process.exit(1);
    }
  }
}

// Run
main().catch(console.error);
