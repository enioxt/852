/**
 * Integration Hub API — /api/admin/integrations
 *
 * GET  /api/admin/integrations          — list all integrations (values masked)
 * PUT  /api/admin/integrations          — save a config value (encrypted)
 * POST /api/admin/integrations (test)   — test a specific integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin-auth';
import { getSupabase } from '@/lib/supabase';
import { encryptConfig, decryptConfig } from '@/lib/crypto-config';
import { invalidateConfigCache } from '@/lib/config-store';

export const runtime = 'nodejs';

// ── Integration catalog ──────────────────────────────────────────────────────

interface IntegrationDef {
  key: string;
  name: string;
  description: string;
  group: string;
  isSecret: boolean;
  isRequired: boolean;
  placeholder?: string;
  docsUrl?: string;
}

const INTEGRATION_CATALOG: IntegrationDef[] = [
  // AI
  { key: 'DASHSCOPE_API_KEY', name: 'Alibaba DashScope (Qwen)', description: 'Modelo primário qwen-plus / qwen-max', group: 'ai', isSecret: true, isRequired: true, placeholder: 'sk-...', docsUrl: 'https://dashscope.console.aliyun.com/apiKey' },
  { key: 'OPENROUTER_API_KEY', name: 'OpenRouter (Gemini fallback)', description: 'Fallback pago: Gemini 2.0 Flash', group: 'ai', isSecret: true, isRequired: true, placeholder: 'sk-or-...', docsUrl: 'https://openrouter.ai/keys' },
  { key: 'OPENAI_API_KEY', name: 'OpenAI (fallback opcional)', description: 'Terceiro fallback. Opcional.', group: 'ai', isSecret: true, isRequired: false, placeholder: 'sk-...', docsUrl: 'https://platform.openai.com/api-keys' },
  // Email
  { key: 'SMTP_HOST', name: 'SMTP Host', description: 'Ex: smtp.gmail.com | smtp.sendgrid.net', group: 'email', isSecret: false, isRequired: false, placeholder: 'smtp.gmail.com' },
  { key: 'SMTP_PORT', name: 'SMTP Port', description: '587 (TLS) ou 465 (SSL)', group: 'email', isSecret: false, isRequired: false, placeholder: '587' },
  { key: 'SMTP_USER', name: 'SMTP User / Email', description: 'Email de autenticação', group: 'email', isSecret: false, isRequired: false, placeholder: 'voce@gmail.com' },
  { key: 'SMTP_PASS', name: 'SMTP Password', description: 'Senha ou app-password', group: 'email', isSecret: true, isRequired: false, placeholder: '••••••••' },
  { key: 'SMTP_FROM', name: 'SMTP From', description: 'Nome e email exibido nos envios', group: 'email', isSecret: false, isRequired: false, placeholder: '"Tira-Voz" <no-reply@egos.ia.br>' },
  { key: 'RESEND_API_KEY', name: 'Resend API Key', description: 'Para verificação de email de conta', group: 'email', isSecret: true, isRequired: false, placeholder: 're_...', docsUrl: 'https://resend.com/api-keys' },
  // Notifications
  { key: 'TELEGRAM_BOT_TOKEN', name: 'Telegram Bot Token', description: 'Token do bot de alertas operacionais', group: 'notifications', isSecret: true, isRequired: false, placeholder: '123456:ABC-DEF...', docsUrl: 'https://core.telegram.org/bots#botfather' },
  { key: 'TELEGRAM_CHAT_ID', name: 'Telegram Chat ID', description: 'ID do grupo/canal destino dos alertas', group: 'notifications', isSecret: false, isRequired: false, placeholder: '-100123456789' },
  { key: 'ISSUE_ALERT_WEBHOOK_URL', name: 'Webhook URL (alertas)', description: 'Endpoint que recebe nova pauta/voto', group: 'notifications', isSecret: false, isRequired: false, placeholder: 'https://...' },
  { key: 'ISSUE_ALERT_WEBHOOK_SECRET', name: 'Webhook Secret', description: 'Segredo para validar webhooks recebidos', group: 'notifications', isSecret: true, isRequired: false },
  // Auth
  { key: 'GOOGLE_CLIENT_ID', name: 'Google OAuth Client ID', description: 'Para login com Google', group: 'auth', isSecret: false, isRequired: false, placeholder: '12345.apps.googleusercontent.com', docsUrl: 'https://console.cloud.google.com/apis/credentials' },
  // Analytics
  { key: 'NEXT_PUBLIC_CLARITY_ID', name: 'Microsoft Clarity Project ID', description: 'Heatmaps e sessões. Requer rebuild para ativar.', group: 'analytics', isSecret: false, isRequired: false, docsUrl: 'https://clarity.microsoft.com' },
  // Meta
  { key: 'PUBLIC_BASE_URL', name: 'URL pública base', description: 'Ex: https://852.egos.ia.br', group: 'meta', isSecret: false, isRequired: true, placeholder: 'https://852.egos.ia.br' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function maskValue(value: string, isSecret: boolean): string {
  if (!isSecret) return value;
  if (value.length <= 8) return '••••••••';
  return value.slice(0, 4) + '••••••••' + value.slice(-4);
}

async function getCurrentDbConfig(): Promise<Map<string, { value: string; isConfigured: boolean; lastTestedAt: string | null; testResult: string | null; testMessage: string | null }>> {
  const sb = getSupabase();
  const map = new Map();
  if (!sb) return map;

  const { data } = await sb
    .from('app_config_852')
    .select('config_key, config_value, is_configured, last_tested_at, test_result, test_message');

  for (const row of data || []) {
    const decrypted = row.config_value ? decryptConfig(row.config_value) : null;
    map.set(row.config_key, {
      value: decrypted || '',
      isConfigured: row.is_configured || false,
      lastTestedAt: row.last_tested_at || null,
      testResult: row.test_result || null,
      testMessage: row.test_message || null,
    });
  }
  return map;
}

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbConfig = await getCurrentDbConfig();

  const integrations = INTEGRATION_CATALOG.map((def) => {
    const db = dbConfig.get(def.key);
    // Source: DB if configured there, otherwise check process.env
    const rawValue = db?.isConfigured ? db.value : (process.env[def.key] || '');
    const source = db?.isConfigured ? 'db' : (process.env[def.key] ? 'env' : 'missing');

    return {
      key: def.key,
      name: def.name,
      description: def.description,
      group: def.group,
      isSecret: def.isSecret,
      isRequired: def.isRequired,
      placeholder: def.placeholder || '',
      docsUrl: def.docsUrl || null,
      // Never return the full value for secrets — only masked
      maskedValue: rawValue ? maskValue(rawValue, def.isSecret) : '',
      isConfigured: Boolean(rawValue),
      source, // 'db' | 'env' | 'missing'
      lastTestedAt: db?.lastTestedAt || null,
      testResult: db?.testResult || null,
      testMessage: db?.testMessage || null,
    };
  });

  const groups = ['ai', 'email', 'notifications', 'auth', 'analytics', 'meta'];
  return NextResponse.json({ integrations, groups });
}

// ── PUT (save value) ─────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { key, value } = await req.json();
  if (!key || typeof value !== 'string') {
    return NextResponse.json({ error: 'key e value obrigatórios' }, { status: 400 });
  }

  const def = INTEGRATION_CATALOG.find(d => d.key === key);
  if (!def) return NextResponse.json({ error: 'Chave não reconhecida' }, { status: 400 });

  const sb = getSupabase();
  if (!sb) return NextResponse.json({ error: 'DB indisponível' }, { status: 503 });

  const trimmed = value.trim();
  const encrypted = trimmed ? encryptConfig(trimmed) : null;

  const { error } = await sb
    .from('app_config_852')
    .upsert({
      config_key: key,
      config_value: encrypted,
      display_name: def.name,
      description: def.description,
      group_name: def.group,
      is_secret: def.isSecret,
      is_required: def.isRequired,
      is_configured: Boolean(trimmed),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'config_key' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Push to process.env immediately so current worker picks it up
  if (trimmed) {
    process.env[key] = trimmed;
  } else {
    delete process.env[key];
  }
  invalidateConfigCache();

  return NextResponse.json({ success: true });
}

// ── POST (test integration) ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, key } = await req.json();
  if (action !== 'test' || !key) {
    return NextResponse.json({ error: 'action=test e key obrigatórios' }, { status: 400 });
  }

  const value = process.env[key] || '';
  let result: { ok: boolean; message: string } = { ok: false, message: 'Não configurado' };

  try {
    if (key === 'DASHSCOPE_API_KEY') {
      result = await testDashScope(value);
    } else if (key === 'OPENROUTER_API_KEY') {
      result = await testOpenRouter(value);
    } else if (key === 'OPENAI_API_KEY') {
      result = await testOpenAI(value);
    } else if (key === 'TELEGRAM_BOT_TOKEN') {
      result = await testTelegram(value, process.env.TELEGRAM_CHAT_ID || '');
    } else if (key === 'SMTP_HOST') {
      result = await testSmtp();
    } else if (key === 'ISSUE_ALERT_WEBHOOK_URL') {
      result = await testWebhook(value);
    } else {
      result = { ok: Boolean(value), message: value ? 'Valor configurado (sem teste automático disponível)' : 'Não configurado' };
    }
  } catch (err) {
    result = { ok: false, message: err instanceof Error ? err.message : 'Erro inesperado' };
  }

  // Persist test result to DB
  const sb = getSupabase();
  if (sb) {
    await sb.from('app_config_852').update({
      last_tested_at: new Date().toISOString(),
      test_result: result.ok ? 'ok' : 'error',
      test_message: result.message.slice(0, 500),
    }).eq('config_key', key);
  }

  return NextResponse.json(result);
}

// ── Test functions ───────────────────────────────────────────────────────────

async function testDashScope(key: string): Promise<{ ok: boolean; message: string }> {
  if (!key) return { ok: false, message: 'Chave não configurada' };
  const res = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'qwen-turbo', messages: [{ role: 'user', content: 'ping' }], max_tokens: 5 }),
  });
  if (res.ok) return { ok: true, message: `DashScope OK (HTTP ${res.status})` };
  const body = await res.text().catch(() => '');
  return { ok: false, message: `DashScope erro ${res.status}: ${body.slice(0, 120)}` };
}

async function testOpenRouter(key: string): Promise<{ ok: boolean; message: string }> {
  if (!key) return { ok: false, message: 'Chave não configurada' };
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { 'Authorization': `Bearer ${key}` },
  });
  if (res.ok) return { ok: true, message: `OpenRouter OK — modelos acessíveis` };
  return { ok: false, message: `OpenRouter erro ${res.status}` };
}

async function testOpenAI(key: string): Promise<{ ok: boolean; message: string }> {
  if (!key) return { ok: false, message: 'Chave não configurada' };
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { 'Authorization': `Bearer ${key}` },
  });
  if (res.ok) return { ok: true, message: 'OpenAI OK' };
  return { ok: false, message: `OpenAI erro ${res.status}` };
}

async function testTelegram(token: string, chatId: string): Promise<{ ok: boolean; message: string }> {
  if (!token) return { ok: false, message: 'Token não configurado' };
  const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const data = await res.json().catch(() => null);
  if (res.ok && data?.ok) {
    if (chatId) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: '✅ 852 Integration Hub: Telegram OK' }),
      });
    }
    return { ok: true, message: `Bot @${data.result?.username} autenticado` };
  }
  return { ok: false, message: `Telegram erro: ${JSON.stringify(data?.description || '')}` };
}

async function testSmtp(): Promise<{ ok: boolean; message: string }> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    return { ok: false, message: 'SMTP_HOST, SMTP_USER e SMTP_PASS precisam estar configurados' };
  }
  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });
    await transporter.verify();
    return { ok: true, message: `SMTP OK: conexão verificada com ${host}` };
  } catch (err) {
    return { ok: false, message: `SMTP erro: ${err instanceof Error ? err.message : String(err)}` };
  }
}

async function testWebhook(url: string): Promise<{ ok: boolean; message: string }> {
  if (!url) return { ok: false, message: 'URL não configurada' };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-852-Test': 'integration-check' },
      body: JSON.stringify({ event: 'integration_test', source: '852-admin', timestamp: new Date().toISOString() }),
    });
    return { ok: res.ok, message: `Webhook HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, message: `Webhook erro: ${err instanceof Error ? err.message : String(err)}` };
  }
}
