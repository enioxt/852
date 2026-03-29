-- Migration: Integration Hub — Encrypted App Config
-- Date: 2026-03-29
-- Purpose: Store all non-bootstrap API keys/config in Supabase so any environment
--          that has SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + CONFIG_ENCRYPTION_KEY
--          can pull all other config from here. Eliminates .env drift across IDEs/VPS.

CREATE TABLE app_config_852 (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key   TEXT        NOT NULL UNIQUE,   -- e.g. DASHSCOPE_API_KEY
  config_value TEXT,                           -- AES-256-GCM encrypted (iv:tag:ciphertext)
  display_name TEXT        NOT NULL,
  description  TEXT,
  group_name   TEXT        NOT NULL,           -- ai | email | notifications | auth | analytics | meta
  is_secret    BOOLEAN     DEFAULT true,       -- mask value in UI
  is_required  BOOLEAN     DEFAULT false,
  is_configured BOOLEAN    DEFAULT false,      -- true once a non-empty value has been saved
  last_tested_at TIMESTAMPTZ,
  test_result  TEXT,                           -- 'ok' | 'error' | null
  test_message TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_app_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER app_config_updated_at
BEFORE UPDATE ON app_config_852
FOR EACH ROW EXECUTE FUNCTION update_app_config_updated_at();

-- RLS: only service_role reads/writes (admin API uses service_role client)
ALTER TABLE app_config_852 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all_direct" ON app_config_852 USING (false);
GRANT ALL ON app_config_852 TO service_role;

-- Seed the catalog (keys only, no values — admin fills them via UI)
INSERT INTO app_config_852 (config_key, display_name, description, group_name, is_secret, is_required) VALUES
  -- AI Providers
  ('DASHSCOPE_API_KEY',       'Alibaba DashScope (Qwen)',         'Modelo primário: qwen-plus, qwen-max. Obter em console.aliyun.com',           'ai',            true,  true),
  ('OPENROUTER_API_KEY',      'OpenRouter (fallback Gemini)',      'Fallback: Gemini 2.0 Flash. Obter em openrouter.ai/keys',                    'ai',            true,  true),
  ('OPENAI_API_KEY',          'OpenAI (fallback opcional)',        'Usado apenas como terceiro fallback. Obter em platform.openai.com',           'ai',            true,  false),
  -- Email
  ('SMTP_HOST',               'SMTP Host',                        'Ex: smtp.gmail.com | smtp.sendgrid.net | mail.brevo.com',                    'email',         false, false),
  ('SMTP_PORT',               'SMTP Port',                        'Ex: 587 (TLS) ou 465 (SSL)',                                                 'email',         false, false),
  ('SMTP_USER',               'SMTP User',                        'Email de autenticação no servidor SMTP',                                     'email',         false, false),
  ('SMTP_PASS',               'SMTP Password',                    'Senha ou app-password do servidor SMTP',                                     'email',         true,  false),
  ('SMTP_FROM',               'SMTP From',                        'Ex: "Tira-Voz" <no-reply@egos.ia.br>',                                       'email',         false, false),
  ('RESEND_API_KEY',          'Resend API Key',                   'Para emails de verificação de conta. Obter em resend.com',                   'email',         true,  false),
  -- Notifications
  ('TELEGRAM_BOT_TOKEN',      'Telegram Bot Token',               'Token do bot de alertas. Criar via @BotFather',                              'notifications', true,  false),
  ('TELEGRAM_CHAT_ID',        'Telegram Chat ID',                 'ID do grupo/canal onde os alertas chegam',                                   'notifications', false, false),
  ('ISSUE_ALERT_WEBHOOK_URL', 'Webhook URL (alertas)',            'Endpoint que recebe eventos de nova pauta/voto',                             'notifications', false, false),
  ('ISSUE_ALERT_WEBHOOK_SECRET', 'Webhook Secret',               'Segredo para validar os webhooks recebidos',                                 'notifications', true,  false),
  -- Auth
  ('GOOGLE_CLIENT_ID',        'Google OAuth Client ID',           'Para login com Google. Criar em console.cloud.google.com',                   'auth',          false, false),
  -- Analytics
  ('NEXT_PUBLIC_CLARITY_ID',  'Microsoft Clarity Project ID',    'ID do projeto Clarity para heatmaps. Requer rebuild para ativar.',           'analytics',     false, false),
  -- Meta
  ('PUBLIC_BASE_URL',         'URL pública base',                 'Ex: https://852.egos.ia.br. Usado em emails e links canônicos.',             'meta',          false, true)
ON CONFLICT (config_key) DO NOTHING;
