# Forja — Estrutura Recomendada para Evolution API

## Proposta de Diretórios

```
forja/
├── src/
│   ├── lib/
│   │   └── whatsapp/
│   │       ├── providers.ts          ← COPIAR de carteira-livre/services/notifications/zapi.ts
│   │       ├── types.ts              ← Interfaces (SendTextParams, EvolutionResponse, etc)
│   │       ├── notifications.ts      ← Helper functions (notifyUser, notifyAdmin, etc)
│   │       └── format.ts             ← formatPhone(), validations
│   │
│   └── app/
│       └── api/
│           └── notifications/
│               └── whatsapp/
│                   └── route.ts      ← Webhook GET/POST
│
└── scripts/
    └── test-whatsapp.ts             ← Script para testar envio de mensagens
```

---

## 1. FILE: `src/lib/whatsapp/providers.ts`

**Fonte:** Copiar de `carteira-livre/services/notifications/zapi.ts`

**Conteúdo:** Funções de baixo nível
- `getProvider()` — detecta WHATSAPP_PROVIDER
- `sendTextMessage(phone, message)` — enviar texto (multi-provider)
- `sendViaEvolution(phone, message)` — envio específico Evolution
- `getEvolutionConfig()` — lê env vars
- `checkConnection()` — verifica status
- `getQRCode()` — obtém QR code

**Tamanho:** ~600 linhas

---

## 2. FILE: `src/lib/whatsapp/types.ts`

**Novo arquivo criado no Forja**

```typescript
// Evolution API Response Types
export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface WhatsAppMessage {
  to: string;
  text: string;
  buttons?: {
    buttonId: string;
    buttonText: { displayText: string };
  }[];
  footer?: string;
}

export interface ConnectionState {
  connected: boolean;
  phone?: string;
  error?: string;
  provider?: string;
}

export interface EvolutionResponse {
  success: boolean;
  error?: string;
  data?: any;
}

// Notification Event Types
export interface NotificationEvent {
  type: 'sms' | 'whatsapp' | 'email';
  userId: string;
  phone?: string;
  email?: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  sent: boolean;
  messageId?: string;
  error?: string;
  provider: string;
  timestamp: Date;
}
```

---

## 3. FILE: `src/lib/whatsapp/format.ts`

**Novo arquivo criado no Forja**

```typescript
/**
 * Formata número de telefone para padrão Brasil
 * @param phone "(34) 99999-9999" | "34999999999" | "5534999999999"
 * @returns "5534999999999"
 */
export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10 || clean.length === 11) {
    return `55${clean}`;
  }
  return clean;
}

/**
 * Valida se telefone é válido
 */
export function isValidPhone(phone: string): boolean {
  const clean = phone.replace(/\D/g, '');
  return clean.length === 10 || clean.length === 11 || clean.startsWith('55');
}

/**
 * Mascara telefone para privacidade (últimos 4 dígitos)
 */
export function maskPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 4) return '****';
  return '*' + clean.slice(-4);
}

/**
 * Extrai DDD de número brasileiro
 */
export function extractDDD(phone: string): string {
  const clean = formatPhone(phone);
  return clean.slice(2, 4);
}
```

---

## 4. FILE: `src/lib/whatsapp/notifications.ts`

**Novo arquivo criado no Forja**

```typescript
import { sendTextMessage } from './providers';
import { SendMessageResult } from './types';

/**
 * Notificação genérica de WhatsApp
 */
export async function notifyWhatsApp(
  phone: string,
  message: string
): Promise<SendMessageResult> {
  try {
    const result = await sendTextMessage(phone, message);
    // Log para telemetria
    console.log('[WhatsApp Notification]', {
      phone: maskPhone(phone),
      success: result.success,
      messageId: result.messageId,
      timestamp: new Date().toISOString(),
    });
    return result;
  } catch (error: any) {
    console.error('[WhatsApp Error]', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Notifica administrador
 */
export async function notifyAdmin(
  message: string,
  adminPhones = (process.env.ADMIN_PHONES || '').split(',')
): Promise<SendMessageResult[]> {
  const results = await Promise.all(
    adminPhones.map(phone => notifyWhatsApp(phone.trim(), message))
  );
  return results;
}

/**
 * Notifica usuário sobre novo pedido/evento
 */
export async function notifyUserNewOrder(
  phone: string,
  orderId: string,
  orderDescription: string
): Promise<SendMessageResult> {
  const message = 
    `Seu pedido foi criado!\n\n` +
    `ID: ${orderId}\n` +
    `${orderDescription}\n\n` +
    `Clique aqui para acompanhar: https://forja.com/orders/${orderId}`;
  return notifyWhatsApp(phone, message);
}

/**
 * Notifica sobre status de pedido
 */
export async function notifyOrderStatus(
  phone: string,
  orderId: string,
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
): Promise<SendMessageResult> {
  const statusMessages = {
    pending: 'Seu pedido foi registrado. Aguardando confirmação.',
    confirmed: 'Pedido confirmado! Será enviado em breve.',
    shipped: 'Seu pedido saiu para entrega!',
    delivered: 'Pedido entregue! Obrigado por sua compra.',
    cancelled: 'Seu pedido foi cancelado.'
  };

  const message = 
    `Atualizacao: ${statusMessages[status]}\n\n` +
    `ID: ${orderId}`;
  return notifyWhatsApp(phone, message);
}

// Mais funções conforme necessidade...
```

---

## 5. FILE: `src/app/api/notifications/whatsapp/route.ts`

**Novo arquivo criado no Forja**

```typescript
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/notifications/whatsapp
 * Webhook validation from Evolution API
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || '';

  if (!verifyToken) {
    console.error('[WhatsApp Webhook] WHATSAPP_VERIFY_TOKEN não está configurado');
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  if (mode === 'subscribe' && token === verifyToken && challenge) {
    console.log('[WhatsApp Webhook] Verificação bem-sucedida');
    return new Response(challenge, { status: 200 });
  }

  console.warn('[WhatsApp Webhook] Tentativa de acesso não autorizado', { mode, token });
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

/**
 * POST /api/notifications/whatsapp
 * Recebe mensagens do Evolution API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const event = body.event;
    const data = body.data;

    console.log('[WhatsApp Webhook] Evento recebido', { event });

    // Tipos de eventos esperados
    if (event === 'messages.upsert') {
      const message = data;
      const from = message.key?.remoteJid;
      const text = message.message?.conversation || '';

      if (text && from) {
        console.log('[WhatsApp] Mensagem de', from, ':', text);
        
        // TODO: Processar a mensagem
        // - Extrair intenção (IA)
        // - Chamar função apropriada
        // - Responder ao usuário
      }
    } else if (event === 'messages.set') {
      // Mensagens editadas/deletadas
      console.log('[WhatsApp] Mensagem modificada');
    } else if (event === 'connection.update') {
      // Status da conexão WhatsApp alterou
      const status = data?.state || 'unknown';
      console.log('[WhatsApp] Conexão:', status);
    } else {
      console.log('[WhatsApp] Evento desconhecido:', event);
    }

    // Sempre retornar OK (não bloqueia Evolution API)
    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('[WhatsApp Webhook] Erro ao processar:', error.message);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
```

---

## 6. FILE: `.env` (Forja)

**Adicionar estas variáveis:**

```env
# ===== WHATSAPP / EVOLUTION API =====
WHATSAPP_PROVIDER=evolution
EVOLUTION_API_URL=https://seu-evolution.railway.app
EVOLUTION_API_KEY=sua-chave-super-secreta
EVOLUTION_INSTANCE_NAME=forja

# ===== WEBHOOK =====
WHATSAPP_VERIFY_TOKEN=seu-token-aleatorio-bem-secreto

# ===== NOTIFICAÇÕES ADMIN =====
ADMIN_PHONES=5534999999999,5534888888888
```

---

## 7. SCRIPT: `scripts/test-whatsapp.ts`

**Novo arquivo para testes locais**

```typescript
import { sendTextMessage } from '../src/lib/whatsapp/providers';
import { checkConnection } from '../src/lib/whatsapp/providers';

async function test() {
  console.log('Testing Evolution API...\n');

  // 1. Verificar conexão
  console.log('1. Checking connection...');
  const connection = await checkConnection();
  console.log('Connection:', connection);

  if (!connection.connected) {
    console.log('WARNING: WhatsApp not connected. Scan QR code first.');
    process.exit(1);
  }

  // 2. Enviar mensagem de teste
  console.log('\n2. Sending test message...');
  const testPhone = process.argv[2] || '5534999999999';
  const result = await sendTextMessage(testPhone, 'Teste de notificação Forja!');
  console.log('Result:', result);

  if (result.success) {
    console.log('SUCCESS! Message sent to', testPhone);
    console.log('Message ID:', result.messageId);
  } else {
    console.log('FAILED:', result.error);
    process.exit(1);
  }
}

test().catch(console.error);
```

**Usar:**
```bash
npx tsx scripts/test-whatsapp.ts 5534999999999
```

---

## 8. PACKAGE.JSON

**Adicionar scripts:**

```json
{
  "scripts": {
    "test:whatsapp": "tsx scripts/test-whatsapp.ts",
    "test:whatsapp:admin": "tsx scripts/test-whatsapp.ts $ADMIN_PHONES",
    "whatsapp:connection": "tsx -e \"import { checkConnection } from './src/lib/whatsapp/providers'; checkConnection().then(console.log)\""
  }
}
```

---

## 9. ENV VARIABLES SUMMARY

| Variável | Fonte | Exemplo |
|----------|-------|---------|
| `EVOLUTION_API_URL` | Railway | `https://evolution-api-production.railway.app` |
| `EVOLUTION_API_KEY` | Railway | `your-secret-api-key-here` |
| `EVOLUTION_INSTANCE_NAME` | Você define | `forja` |
| `WHATSAPP_PROVIDER` | Você define | `evolution` |
| `WHATSAPP_VERIFY_TOKEN` | Você gera | `random-secret-token-12345` |
| `ADMIN_PHONES` | Você define | `5534999999999,5534888888888` |

---

## 10. ARQUIVOS A COPIAR DE carteira-livre

1. **De:** `carteira-livre/services/notifications/zapi.ts`
   **Para:** `forja/src/lib/whatsapp/providers.ts`
   **Ação:** Copiar integralmente

2. **De:** `carteira-livre/scripts/setup-evolution-api.ts`
   **Para:** `forja/scripts/setup-evolution-api.ts`
   **Ação:** Copiar e adaptar EVOLUTION_INSTANCE_NAME

---

## 11. CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Setup Inicial (1-2 horas)
- [ ] Criar diretório `src/lib/whatsapp/`
- [ ] Copiar `zapi.ts` → `providers.ts`
- [ ] Criar `types.ts`
- [ ] Criar `format.ts`
- [ ] Criar `notifications.ts` (vazio, com stubs)
- [ ] Adicionar env vars ao `.env`

### Fase 2: Webhook (1-2 horas)
- [ ] Criar `src/app/api/notifications/whatsapp/route.ts`
- [ ] Implementar GET (validação)
- [ ] Implementar POST (receber mensagens)
- [ ] Testar com curl
- [ ] Atualizar Evolution API webhook URL

### Fase 3: Notificações (2-3 horas)
- [ ] Implementar `notifyWhatsApp()`
- [ ] Implementar `notifyAdmin()`
- [ ] Implementar `notifyUserNewOrder()` e outras
- [ ] Integrar em endpoints existentes (criar pedido, etc)
- [ ] Adicionar testes unitários

### Fase 4: Testes E2E (1-2 horas)
- [ ] Criar script de teste (`test-whatsapp.ts`)
- [ ] Testar envio manual
- [ ] Testar webhook com localhost
- [ ] Testar em produção

**Tempo total:** ~6-9 horas

---

## 12. EXEMPLO: INTEGRAÇÃO EM ENDPOINT

**Antes (sem WhatsApp):**
```typescript
// POST /api/orders
export async function POST(req: NextRequest) {
  const data = await req.json();
  const order = await createOrder(data);
  return NextResponse.json(order);
}
```

**Depois (com WhatsApp):**
```typescript
// POST /api/orders
export async function POST(req: NextRequest) {
  const data = await req.json();
  const order = await createOrder(data);
  
  // Notificar via WhatsApp
  if (data.phone) {
    notifyUserNewOrder(
      data.phone,
      order.id,
      order.description
    ).catch(err => console.error('WhatsApp notification failed:', err));
  }
  
  // Notificar admin
  notifyAdmin(`Novo pedido: ${order.id}`).catch(console.error);
  
  return NextResponse.json(order);
}
```

---

## 13. CUSTOS & TIMELINE

- **Setup:** 1-2 dias
- **Railway:** R$0 (compartilhado com carteira-livre)
- **Meta API:** ~R$0.05/msg
- **Estimativa:** R$50-150/mês para 1k-3k notificações

---

## 14. DOCUMENTAÇÃO REFERENTE

- Completo: `/home/enio/852/EVOLUTION_API_CARTEIRA_LIVRE_INVESTIGATION.md`
- Quick ref: `/home/enio/852/EVOLUTION_API_QUICK_REFERENCE.md`
- carteira-livre: `/home/enio/carteira-livre/docs/guides/WHATSAPP_SETUP_GUIDE.md`

