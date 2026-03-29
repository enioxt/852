# Evolution API — Quick Reference Card

## 1. ONDE ESTÁ A IMPLEMENTAÇÃO

```
carteira-livre/
├── services/
│   ├── whatsapp/evolution-api.ts      ← Low-level Evolution API client
│   └── notifications/
│       ├── zapi.ts                    ← Multi-provider abstraction (COPIAR ISTO!)
│       └── whatsapp-dispatcher.ts     ← High-level notification helpers
├── scripts/setup-evolution-api.ts     ← CLI setup script
├── docs/guides/WHATSAPP_SETUP_GUIDE.md ← Documentação completa
└── .env.example                       ← Template de variáveis
```

---

## 2. QUICK START (5 MIN)

### Variáveis de Ambiente
```env
EVOLUTION_API_URL=https://seu-evolution.railway.app
EVOLUTION_API_KEY=sua-chave-super-secreta
EVOLUTION_INSTANCE_NAME=forja
WHATSAPP_PROVIDER=evolution
```

### Usar (1 linha)
```typescript
import { sendTextMessage } from '@/services/notifications/zapi';

await sendTextMessage('5534999999999', 'Olá! 👋');
```

---

## 3. ENDPOINTS PRINCIPAIS

| Método | Endpoint | Propósito |
|--------|----------|----------|
| POST | `/message/sendText/{instance}` | Enviar texto |
| POST | `/message/sendButtons/{instance}` | Enviar com botões |
| POST | `/message/sendList/{instance}` | Enviar com lista |
| GET | `/instance/connectionState/{instance}` | Verificar conexão |
| GET | `/instance/connect/{instance}` | QR Code |
| POST | `/instance/create` | Criar instância |
| GET | `/instance/fetchInstances` | Listar instâncias |

---

## 4. PAYLOAD MÍNIMO

### Enviar Mensagem Simples
```bash
curl -X POST 'https://evolution-api.railway.app/message/sendText/forja' \
  -H 'apikey: sua-chave' \
  -H 'Content-Type: application/json' \
  -d '{
    "number": "5534999999999",
    "text": "Olá!"
  }'
```

### Response
```json
{
  "success": true,
  "key": { "id": "msg-id-unique" }
}
```

---

## 5. TIPOS TYPESCRIPT

```typescript
interface WhatsAppMessage {
  to: string;              // "5534999999999"
  text: string;            // Mensagem
  buttons?: Button[];      // Opcional
  footer?: string;         // "Forja"
}

interface Button {
  buttonId: string;        // "1", "2", etc
  buttonText: {
    displayText: string;   // "Confirmar"
  };
}

interface MessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
```

---

## 6. EXEMPLOS DE CÓDIGO

### Texto Simples
```typescript
const result = await sendTextMessage(
  '5534999999999',
  'Olá! Sua notificação está pronta.'
);
```

### Com Botões
```typescript
const result = await sendViaEvolution('5534999999999', 'Escolha uma opção:', {
  buttons: [
    { buttonId: '1', buttonText: { displayText: 'Sim' } },
    { buttonId: '2', buttonText: { displayText: 'Não' } }
  ]
});
```

### Com Lista
```typescript
await sendList({
  to: '5534999999999',
  title: 'Opções',
  sections: [
    {
      title: 'Seção 1',
      rows: [
        { title: 'Item 1', rowId: 'item_1' }
      ]
    }
  ]
});
```

---

## 7. FLUXO RECOMENDADO NO FORJA

### 1️⃣ Setup (cópia de arquivo)
```bash
# Copiar abstração multi-provider
cp carteira-livre/services/notifications/zapi.ts \
   forja/src/lib/whatsapp/providers.ts
```

### 2️⃣ Env vars
```env
EVOLUTION_API_URL=https://mesmo-evolution-api.railway.app
EVOLUTION_API_KEY=mesma-chave
EVOLUTION_INSTANCE_NAME=forja
WHATSAPP_PROVIDER=evolution
```

### 3️⃣ Webhook em Forja
```typescript
// src/app/api/notifications/whatsapp/route.ts
export async function POST(req: NextRequest) {
  const { event, data } = await req.json();
  if (event === 'messages.upsert') {
    const { from, text } = data;
    // Processar mensagem
  }
  return NextResponse.json({ status: 'ok' });
}
```

### 4️⃣ Usar em qualquer lugar
```typescript
import { sendTextMessage } from '@/lib/whatsapp/providers';

// Em um endpoint
export async function POST(req: NextRequest) {
  const { phone, message } = await req.json();
  await sendTextMessage(phone, message);
  return NextResponse.json({ ok: true });
}
```

---

## 8. SEGURANÇA

- API Key: sempre em `.env`, nunca commitar
- Webhook token: validar em GET antes de processar POST
- Telefone: nunca fazer log de número completo (hash ou últimos 4 dígitos)
- CORS: configurado no Evolution API para seu domínio

---

## 9. TROUBLESHOOTING

| Problema | Solução |
|----------|---------|
| 401 Unauthorized | Verificar EVOLUTION_API_KEY |
| 404 Instance not found | Verificar EVOLUTION_INSTANCE_NAME |
| Message not delivered | Verificar se número está válido (55 + DDD + 9XXXX) |
| Webhook não recebe | Verificar WHATSAPP_VERIFY_TOKEN e URL |

---

## 10. CUSTOS

- **Railway:** R$0 (já está rodando)
- **Meta API:** R$0.05/msg (utility messages)
- **Meta API:** R$0 (service messages — cliente inicia)
- **Exemplo:** 100 notifs/dia = ~R$150/mês

---

## 11. LINK PARA DOCUMENTAÇÃO COMPLETA

Veja: `/home/enio/852/EVOLUTION_API_CARTEIRA_LIVRE_INVESTIGATION.md`

---

## 12. PRÓXIMOS PASSOS (Forja)

- [ ] Copiar `zapi.ts` para `src/lib/whatsapp/providers.ts`
- [ ] Configurar env vars no `.env`
- [ ] Criar webhook em `src/app/api/notifications/whatsapp/route.ts`
- [ ] Testar com `curl`
- [ ] Integrar com eventos do Forja
- [ ] Escrever testes unitários

**Tempo total:** ~6 horas (incluindo testes)
