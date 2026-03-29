# Relatório de Investigação: Evolution API no carteira-livre

**Data:** 2026-03-29
**Repositório:** /home/enio/carteira-livre
**Objetivo:** Documentar implementação da Evolution API para reutilização no projeto Forja

---

## 1. LOCALIZAÇÃO DOS ARQUIVOS PRINCIPAIS

### Arquivos de Implementação
- **Evolution API Client:** `/home/enio/carteira-livre/services/whatsapp/evolution-api.ts`
- **Multi-Provider Abstraction:** `/home/enio/carteira-livre/services/notifications/zapi.ts`
- **WhatsApp Dispatcher:** `/home/enio/carteira-livre/services/notifications/whatsapp-dispatcher.ts`
- **Setup Script:** `/home/enio/carteira-livre/scripts/setup-evolution-api.ts`
- **AI Service:** `/home/enio/carteira-livre/services/ai/whatsapp-ai.ts`

### Documentação
- **Setup Guide Completo:** `/home/enio/carteira-livre/docs/guides/WHATSAPP_SETUP_GUIDE.md`
- **Handoff Session 44:** `/home/enio/carteira-livre/docs/_current_handoffs/handoff_session44_whatsapp_end2end.md`
- **Configuração de Exemplo:** `/home/enio/carteira-livre/.env.example`

---

## 2. INFORMAÇÕES DE CONFIGURAÇÃO

### Variáveis de Ambiente Necessárias

```env
# ===== EVOLUTION API =====
EVOLUTION_API_URL=https://seu-evolution-api.railway.app
EVOLUTION_API_KEY=sua-chave-super-secreta-aqui
EVOLUTION_INSTANCE_NAME=carteira-livre (ou seu-nome-da-instancia)

# ===== WEBHOOK =====
WHATSAPP_VERIFY_TOKEN=seu-token-de-verificacao-aleatorio
NEXT_PUBLIC_APP_URL=https://seu-app.com
```

### Detalhes de Autenticação

- **Method:** API Key via header `apikey`
- **Header Name:** `apikey`
- **Header Value:** Chave secreta (EVOLUTION_API_KEY)
- **Content-Type:** `application/json`

---

## 3. ARQUITETURA DE PROVIDERS

O carteira-livre implementa abstração multi-provider em `zapi.ts`:

```
┌─────────────────────────────────────────────────────────────┐
│                    sendTextMessage()                         │
│              (função unificada para todos)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬──────────────┐
        │            │            │              │
    ┌───▼─┐     ┌───▼─┐     ┌───▼─┐        ┌──▼──┐
    │ Z-API│     │ZAPI │     │WAHA │        │ZAPI │
    │      │     │     │     │     │        │     │
    └──────┘     └─────┘     └─────┘        └─────┘
    (Default)  (Legacy)  (Self-hosted)  (Primary)
```

**Provider disponíveis:**
1. **zapi** (padrão) — Z-API.io
2. **wasender** — WasenderAPI
3. **evolution** — Evolution API (self-hosted)
4. **waha** — WAHA (self-hosted)

**Seleção via:** `WHATSAPP_PROVIDER` env var

---

## 4. ENDPOINTS DA EVOLUTION API

### 4.1 Enviar Mensagens

#### POST `/message/sendText/{instanceName}`
**Propósito:** Enviar mensagem de texto simples

**Headers:**
```
apikey: {EVOLUTION_API_KEY}
Content-Type: application/json
```

**Body:**
```json
{
  "number": "5534999999999",
  "text": "Sua mensagem aqui"
}
```

**Resposta (sucesso):**
```json
{
  "success": true,
  "key": {
    "id": "message-id-unique"
  }
}
```

---

#### POST `/message/sendButtons/{instanceName}`
**Propósito:** Enviar mensagem com botões interativos

**Body:**
```json
{
  "number": "5534999999999",
  "buttonMessage": {
    "text": "Escolha uma opção:",
    "buttons": [
      {
        "buttonId": "1",
        "buttonText": {
          "displayText": "Opção 1"
        }
      },
      {
        "buttonId": "2",
        "buttonText": {
          "displayText": "Opção 2"
        }
      }
    ],
    "footerText": "Carteira Livre"
  }
}
```

---

#### POST `/message/sendList/{instanceName}`
**Propósito:** Enviar mensagem com lista de opções

**Body:**
```json
{
  "number": "5534999999999",
  "listMessage": {
    "title": "Instrutores Disponíveis",
    "description": "Escolha um instrutor:",
    "buttonText": "Ver mais",
    "footerText": "Carteira Livre",
    "sections": [
      {
        "title": "Premium",
        "rows": [
          {
            "title": "João Silva",
            "description": "⭐ 4.8 - R$80/h",
            "rowId": "instructor_1"
          },
          {
            "title": "Maria Santos",
            "description": "⭐ 4.5 - R$75/h",
            "rowId": "instructor_2"
          }
        ]
      }
    ]
  }
}
```

---

### 4.2 Verificar Conexão

#### GET `/instance/connectionState/{instanceName}`
**Propósito:** Verificar status da conexão WhatsApp

**Response (conectado):**
```json
{
  "instance": "carteira-livre",
  "state": "open",
  "number": "5534999999999"
}
```

**Response (desconectado):**
```json
{
  "instance": "carteira-livre",
  "state": "closed"
}
```

---

#### GET `/instance/connect/{instanceName}`
**Propósito:** Obter QR Code para conectar WhatsApp

**Response:**
```json
{
  "base64": "data:image/png;base64,...",
  "instance": "carteira-livre"
}
```

---

### 4.3 Gerenciamento de Instâncias

#### POST `/instance/create`
**Propósito:** Criar nova instância WhatsApp

**Body:**
```json
{
  "instanceName": "carteira-livre",
  "integration": "WHATSAPP-CLOUD-API",
  "token": "seu_meta_permanent_access_token",
  "number": "5534999999999",
  "businessId": "seu_whatsapp_business_account_id",
  "webhook": {
    "url": "https://carteiralivre.com/api/whatsapp/webhook",
    "webhookByEvents": true,
    "events": [
      "MESSAGES_UPSERT",
      "MESSAGES_SET",
      "SEND_MESSAGE",
      "CONNECTION_UPDATE"
    ]
  }
}
```

---

#### GET `/instance/fetchInstances`
**Propósito:** Listar todas as instâncias

**Response:**
```json
[
  {
    "instanceName": "carteira-livre",
    "state": "open",
    "number": "5534999999999",
    "integration": "WHATSAPP-CLOUD-API"
  }
]
```

---

## 5. CÓDIGO - FUNÇÃO SEND MESSAGE (ATUAL)

### Arquivo: `/home/enio/carteira-livre/services/whatsapp/evolution-api.ts`

#### sendText() — Enviar texto

```typescript
export async function sendText({ to, text }: SendTextParams): Promise<EvolutionResponse> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    console.warn('[Evolution API] Not configured — skipping message');
    return { success: false, error: 'Evolution API not configured' };
  }

  try {
    const res = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          number: formatPhone(to),
          text,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `HTTP ${res.status}: ${err}` };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
```

#### Tipos TypeScript

```typescript
interface SendTextParams {
  to: string;     // Phone number (with country code, e.g. 5534999999999)
  text: string;
}

interface SendButtonsParams {
  to: string;
  text: string;
  buttons: { buttonId: string; buttonText: { displayText: string } }[];
  footerText?: string;
}

interface SendListParams {
  to: string;
  title: string;
  description: string;
  buttonText: string;
  sections: {
    title: string;
    rows: { title: string; description?: string; rowId: string }[];
  }[];
}

interface EvolutionResponse {
  success: boolean;
  error?: string;
  data?: any;
}
```

---

## 6. ABSTRAÇÃO MULTI-PROVIDER

### Arquivo: `/home/enio/carteira-livre/services/notifications/zapi.ts`

A função `sendTextMessage()` detecta automaticamente o provider:

```typescript
export async function sendTextMessage(
  phone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const provider = getProvider(); // Lê WHATSAPP_PROVIDER env var
  const formattedPhone = formatPhone(phone);

  try {
    switch (provider) {
      case 'wasender':
        return await sendViaWasender(formattedPhone, message);
      case 'evolution':
        return await sendViaEvolution(formattedPhone, message);
      case 'waha':
        return await sendViaWaha(formattedPhone, message);
      case 'zapi':
      default:
        return await sendViaZAPI(formattedPhone, message);
    }
  } catch (error: any) {
    console.error(`[WhatsApp/${provider}] Erro:`, error);
    return { success: false, error: error.message };
  }
}
```

#### sendViaEvolution() — Implementação para Evolution API

```typescript
async function sendViaEvolution(phone: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { apiUrl, apiKey, instance } = getEvolutionConfig();
  const response = await fetch(`${apiUrl}/message/sendText/${instance}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey,
    },
    body: JSON.stringify({
      number: phone,
      text: message,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return { success: false, error: data.message || 'Erro Evolution API' };
  }
  return { success: true, messageId: data.key?.id };
}
```

---

## 7. FORMATAÇÃO DE TELEFONE

```typescript
function formatPhone(phone: string): string {
  // Remove all non-digits
  const clean = phone.replace(/\D/g, '');
  // Add Brazil country code if missing
  if (clean.length === 10 || clean.length === 11) {
    return `55${clean}`;
  }
  return clean;
}

// Exemplos:
// "(34) 99999-9999"  → "5534999999999"
// "34999999999"      → "5534999999999"
// "5534999999999"    → "5534999999999" (mantém)
```

---

## 8. WEBHOOK - RECEBER MENSAGENS

### Arquivo: `/home/enio/carteira-livre/app/api/whatsapp/webhook/route.ts` (ilustrado)

```typescript
import { NextRequest, NextResponse } from 'next/server';

// Verificação do webhook (Meta envia GET para validar)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Receber mensagens
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Evolution API envia: { event, data, ... }
    const event = body.event;
    const data = body.data;
    
    if (event === 'messages.upsert') {
      const message = data;
      const from = message.key?.remoteJid; // número do remetente
      const text = message.message?.conversation 
        || message.message?.extendedTextMessage?.text
        || '';
      
      if (text && from) {
        console.log(`[WhatsApp] ${from}: ${text}`);
        // TODO: Processar mensagem com AI router
      }
    }
    
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('[WhatsApp Webhook] Error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
```

---

## 9. DISPATCHER - NOTIFICAÇÕES DE ALTO NÍVEL

### Arquivo: `/home/enio/carteira-livre/services/notifications/whatsapp-dispatcher.ts`

A função `safeSend()` encapsula o envio:

```typescript
async function safeSend(phone: string, message: string): Promise<NotifyResult> {
  try {
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return { sent: false, error: 'Invalid phone' };
    }
    const result = await sendTextMessage(phone, message);
    return { sent: result.success, messageId: result.messageId, error: result.error };
  } catch (err: any) {
    console.error('[WhatsApp Dispatcher] Error:', err.message);
    return { sent: false, error: err.message };
  }
}
```

**Exemplo de notificação de alto nível:**

```typescript
export async function notifyAdminNewRegistration(
  userName: string,
  role: 'student' | 'instructor',
  email: string,
  phone?: string
): Promise<void> {
  const emoji = role === 'student' ? '🎓' : '👨‍🏫';
  const roleLabel = role === 'student' ? 'Aluno' : 'Instrutor';
  const msg = 
    `${emoji} *Novo Cadastro — ${roleLabel}*\n\n` +
    `👤 ${userName}\n` +
    `📧 ${email}\n` +
    (phone ? `📱 ${phone}\n` : '') +
    `⏰ ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
  
  await notifyAdmins(msg);
}
```

---

## 10. INFRASTRUCTURE - RAILWAY

### Deployment

**Serviço:** Evolution API (self-hosted)  
**Plataforma:** Railway  
**Imagem:** `atendai/evolution-api:v2.3.7` (ou versão mais recente)  
**Database:** PostgreSQL (Railway)  
**Cache:** Redis (opcional)

### Variáveis Railway Necessárias

```env
# ===== SERVER =====
SERVER_URL=https://seu-evolution.railway.app
AUTHENTICATION_API_KEY=sua-chave-super-secreta

# ===== DATABASE =====
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=${{Postgres.DATABASE_URL}}

# ===== WHATSAPP CLOUD API =====
WA_BUSINESS_ACCOUNT_ID=seu_waba_id
WA_BUSINESS_TOKEN=seu_permanent_token

# ===== WEBHOOK =====
WEBHOOK_GLOBAL_URL=https://seu-app.com/api/whatsapp/webhook
WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=true
WEBHOOK_EVENTS_MESSAGES_UPSERT=true
WEBHOOK_EVENTS_SEND_MESSAGE=true

# ===== LOG =====
LOG_LEVEL=WARN
```

---

## 11. STATUS ATUAL (Feb-2026)

### Implementação ✅
- Evolution API v2 rodando em Railway
- Integração com WhatsApp Cloud API da Meta (oficial)
- Multi-provider abstraction (zapi, wasender, evolution, waha)
- Webhook funcionando com Localtunnel

### Pendências
- Migrar webhook de Localtunnel para produção (Vercel)
- Conectar AI router ao webhook
- Definir fluxos de IA por intent (MCP tools integration)

---

## 12. RECOMENDAÇÕES PARA REUTILIZAÇÃO NO FORJA

### 1. **Reutilizar a abstração `zapi.ts`**
   - Já suporta Evolution API
   - Basta copiar `/services/notifications/zapi.ts` ao Forja
   - Configurar `WHATSAPP_PROVIDER=evolution` no `.env`

### 2. **Copiar configuração Railway**
   - Evolution API está em produção e funcional
   - Pode ser reutilizado para múltiplas aplicações (diferentes instâncias)
   - Exemplo: `EVOLUTION_INSTANCE_NAME=forja` para Forja

### 3. **Webhook em Forja**
   - Criar rota similar em `/api/whatsapp/webhook` (ou `/api/notifications/whatsapp`)
   - Usar mesmo padrão de validação (GET) e processamento (POST)
   - Apontar Evolution API webhook para `https://forja.com/api/whatsapp/webhook`

### 4. **Formatação de Telefone**
   - Copiar a função `formatPhone()` — já trata Brasil
   - Compatible com DDD local

### 5. **Tipos TypeScript**
   - Reutilizar interfaces:
     - `SendTextParams`
     - `SendButtonsParams`
     - `SendListParams`
     - `EvolutionResponse`
   - Criar arquivo `/lib/types/whatsapp.ts` no Forja

### 6. **Env Vars no Forja**
   ```env
   EVOLUTION_API_URL=https://mesmo-railway.app
   EVOLUTION_API_KEY=mesma-chave
   EVOLUTION_INSTANCE_NAME=forja
   WHATSAPP_VERIFY_TOKEN=novo-token-forja
   ```

### 7. **Custos Incrementais**
   - Railway: +R$0 (já está rodando)
   - Meta API: ~R$0.05/msg (utility) + GRÁTIS (service)
   - Para 100 notificações/dia: ~R$150/mês

---

## 13. EXEMPLOS DE PAYLOAD COMPLETOS

### Payload 1: Enviar Texto Simples

**Request:**
```bash
curl -X POST \
  'https://seu-evolution.railway.app/message/sendText/forja' \
  -H 'apikey: sua-chave-secreta' \
  -H 'Content-Type: application/json' \
  -d '{
    "number": "5534999999999",
    "text": "Olá! Esta é uma notificação do Forja."
  }'
```

**Response:**
```json
{
  "success": true,
  "key": {
    "id": "true_5534999999999@c.us_1234567890abcdef",
    "remoteJid": "5534999999999@c.us",
    "fromMe": true,
    "id": "1234567890abcdef"
  }
}
```

---

### Payload 2: Enviar com Botões

**Request:**
```bash
curl -X POST \
  'https://seu-evolution.railway.app/message/sendButtons/forja' \
  -H 'apikey: sua-chave-secreta' \
  -H 'Content-Type: application/json' \
  -d '{
    "number": "5534999999999",
    "buttonMessage": {
      "text": "Escolha uma ação:",
      "buttons": [
        {
          "buttonId": "btn_1",
          "buttonText": {
            "displayText": "Confirmar"
          }
        },
        {
          "buttonId": "btn_2",
          "buttonText": {
            "displayText": "Cancelar"
          }
        }
      ],
      "footerText": "Forja"
    }
  }'
```

---

### Payload 3: Verificar Conexão

**Request:**
```bash
curl 'https://seu-evolution.railway.app/instance/connectionState/forja' \
  -H 'apikey: sua-chave-secreta'
```

**Response:**
```json
{
  "instance": {
    "instanceName": "forja",
    "state": "open",
    "number": "5534999999999",
    "integration": "WHATSAPP-CLOUD-API"
  }
}
```

---

## 14. FLUXO DE IMPLEMENTAÇÃO RECOMENDADO NO FORJA

### Fase 1: Setup (1-2 horas)
1. [ ] Copiar `services/notifications/zapi.ts` → `src/lib/whatsapp/providers.ts`
2. [ ] Copiar tipos do evolution-api.ts → `src/lib/types/whatsapp.ts`
3. [ ] Criar `.env` vars: EVOLUTION_API_*, WHATSAPP_VERIFY_TOKEN

### Fase 2: Webhook (2-3 horas)
1. [ ] Criar rota `src/app/api/notifications/whatsapp/route.ts`
2. [ ] Implementar GET validation
3. [ ] Implementar POST message receive
4. [ ] Testar com curl

### Fase 3: Notificações (1-2 horas)
1. [ ] Criar `src/lib/whatsapp/notifications.ts`
2. [ ] Implementar helper functions (sendMessage, sendButtons, etc)
3. [ ] Integrar com eventos do Forja (ex: nova notificação de SMS)

### Fase 4: Testes
1. [ ] Unit tests dos providers
2. [ ] Integration test webhook
3. [ ] E2E test notificação ponta-a-ponta

---

## 15. PONTOS CRÍTICOS

### Segurança
- API Key em `.env` (nunca em code)
- Webhook token verificado em GET
- Telefone nunca em logs (hash ou últimos 4 dígitos)

### Confiabilidade
- Retry automático do Evolution API
- Fire-and-forget notifications (não bloqueia fluxo)
- Logging centralizado de tentativas

### Escalabilidade
- Evolution API aguenta +100k msgs/dia
- Multi-instância (um serviço, múltiplos tenants)
- Webhook async/paralelo

---

## 16. CONTATOS / DOCUMENTAÇÃO OFICIAL

- **Evolution API GitHub:** https://github.com/EvolutionAPI/evolution-api
- **Documentação:** https://doc.evolution.br
- **Meta WhatsApp API:** https://developers.facebook.com/docs/whatsapp
- **Railway:** https://railway.app/docs

---

## Resumo Executivo

**Você pode reutilizar 100% da infraestrutura Evolution API do carteira-livre no Forja:**

1. **Railway está em produção** — já aguenta múltiplas instâncias
2. **Código é reutilizável** — abstração multi-provider em `zapi.ts`
3. **Configuração é simples** — 5 env vars
4. **Webhook é padrão** — GET validate + POST process
5. **Custos incrementais mínimos** — ~R$0 infraestrutura + ~R$5-10/mês por 100 notificações

**Próximo passo:** Copiar `zapi.ts` e criar webhook em Forja.

