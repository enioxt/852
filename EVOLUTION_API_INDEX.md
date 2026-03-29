# Evolution API Investigation — Complete Index

**Data:** 2026-03-29  
**Repositório Fonte:** `/home/enio/carteira-livre`  
**Objetivo:** Documentação completa para reutilização em Forja (WhatsApp notifications)

---

## Documentos Gerados

### 1. EVOLUTION_API_CARTEIRA_LIVRE_INVESTIGATION.md (COMPLETO)
**Tamanho:** 16 seções, ~800 linhas

Documentação completa cobrindo:
- Localização de arquivos principais
- Configuração de ambiente (env vars)
- Arquitetura de multi-providers
- Endpoints da Evolution API completos
- Código-fonte (snippets)
- Abstração multi-provider (zapi.ts)
- Webhook (receber mensagens)
- Dispatcher (notificações)
- Infrastructure (Railway)
- Status atual e pendências
- Recomendações para Forja
- Exemplos de payload completos
- Fluxo de implementação
- Pontos críticos (segurança, confiabilidade, escalabilidade)
- Documentação oficial

**Quando usar:** Leitura profunda, entendimento completo, troubleshooting

---

### 2. EVOLUTION_API_QUICK_REFERENCE.md (RESUMO)
**Tamanho:** 12 seções, ~200 linhas

Quick reference cobrindo:
- Onde está a implementação (árvore de diretórios)
- Quick start (5 minutos)
- Endpoints principais (tabela)
- Payload mínimo (exemplo)
- Tipos TypeScript
- Exemplos de código
- Fluxo recomendado no Forja
- Segurança
- Troubleshooting
- Custos
- Próximos passos

**Quando usar:** Referência rápida, durante desenvolvimento, troubleshooting

---

### 3. FORJA_IMPLEMENTATION_STRUCTURE.md (ESTRUTURA)
**Tamanho:** 14 seções, ~500 linhas

Proposta de estrutura para Forja cobrindo:
- Árvore de diretórios recomendada
- 7 arquivos a criar (com código)
- Env vars necessárias
- Scripts de teste
- Integração em endpoints existentes
- Checklist de implementação (4 fases)
- Exemplos de integração before/after
- Custos e timeline
- Arquivos a copiar de carteira-livre

**Quando usar:** Implementação no Forja, referência de arquivos

---

## Arquivos do carteira-livre Investigados

| Arquivo | Linhas | Propósito |
|---------|--------|----------|
| `/services/whatsapp/evolution-api.ts` | 200 | Low-level Evolution API client (sendText, sendButtons, getQRCode) |
| `/services/notifications/zapi.ts` | 600 | Multi-provider abstraction (COPIAR ISTO) |
| `/services/notifications/whatsapp-dispatcher.ts` | 400 | High-level notification helpers |
| `/scripts/setup-evolution-api.ts` | 250 | CLI setup script para Evolution API |
| `/docs/guides/WHATSAPP_SETUP_GUIDE.md` | 500 | Setup completo Meta Business + Railway |

---

## Informações-Chave Extraídas

### Autenticação
- **Method:** API Key via header `apikey`
- **Config:** 3 env vars necessárias
- **Suporte:** Multi-instância (múltiplas aplicações)

### Endpoints Principais
- `POST /message/sendText/{instance}` — Enviar texto
- `POST /message/sendButtons/{instance}` — Enviar com botões
- `POST /message/sendList/{instance}` — Enviar com lista
- `GET /instance/connectionState/{instance}` — Verificar status
- `GET /instance/connect/{instance}` — QR Code para conectar

### Arquitetura
```
Evolution API (Railway) 
  ↓
Multi-provider abstraction (zapi.ts)
  ├─ sendTextMessage() [REUTILIZAR]
  ├─ checkConnection()
  └─ getQRCode()
```

### Reutilização
- **100% reutilizável:** `zapi.ts` já suporta Evolution API
- **0 custo:** Railway já está rodando
- **Configuração:** 5 env vars
- **Timeline:** 6-9 horas para implementação completa

---

## Quick Navigation

### Por Necessidade

**Quero entender a implementação:**
→ Leia `EVOLUTION_API_CARTEIRA_LIVRE_INVESTIGATION.md` seção 1-6

**Quero implementar no Forja:**
→ Leia `FORJA_IMPLEMENTATION_STRUCTURE.md` seção 1-11

**Preciso de referência rápida:**
→ Leia `EVOLUTION_API_QUICK_REFERENCE.md` tudo

**Preciso de um exemplo de payload:**
→ `EVOLUTION_API_CARTEIRA_LIVRE_INVESTIGATION.md` seção 13

**Tenho erro e preciso troubleshoot:**
→ `EVOLUTION_API_QUICK_REFERENCE.md` seção 9

---

## Checklist: Antes de Implementar

- [ ] Ler `EVOLUTION_API_QUICK_REFERENCE.md` (10 min)
- [ ] Ler `FORJA_IMPLEMENTATION_STRUCTURE.md` (20 min)
- [ ] Entender fluxo de `zapi.ts` (20 min)
- [ ] Verificar env vars disponíveis (5 min)
- [ ] Preparar Railway (se não tiver Evolution API) (30 min)
- [ ] Começar implementação (6-9 horas)

---

## Estrutura de Arquivos No Forja

```
forja/
├── src/lib/whatsapp/
│   ├── providers.ts         ← COPIAR de zapi.ts (carteira-livre)
│   ├── types.ts             ← CRIAR (interfaces)
│   ├── format.ts            ← CRIAR (formatPhone, etc)
│   └── notifications.ts     ← CRIAR (notifyWhatsApp, notifyAdmin, etc)
├── src/app/api/notifications/whatsapp/
│   └── route.ts             ← CRIAR (webhook GET/POST)
└── scripts/
    └── test-whatsapp.ts     ← CRIAR (testes locais)
```

---

## Env Vars Necessárias

```env
EVOLUTION_API_URL=https://seu-evolution.railway.app
EVOLUTION_API_KEY=sua-chave-secreta
EVOLUTION_INSTANCE_NAME=forja
WHATSAPP_PROVIDER=evolution
WHATSAPP_VERIFY_TOKEN=seu-token-aleatorio
ADMIN_PHONES=5534999999999,5534888888888
```

---

## Código Principal a Copiar

### De: `carteira-livre/services/notifications/zapi.ts`
### Para: `forja/src/lib/whatsapp/providers.ts`

Função principal: `sendTextMessage(phone, message)`
- Detecta provider automaticamente
- Formata número de telefone
- Retorna `{ success, messageId, error }`

---

## Webhook Setup

**Endpoint:** `POST /api/notifications/whatsapp`

1. GET /api/notifications/whatsapp?hub.mode=subscribe&hub.challenge=...
   → Validate com WHATSAPP_VERIFY_TOKEN
   → Return challenge

2. POST /api/notifications/whatsapp
   → Recebe eventos de Evolution API
   → Processa mensagens recebidas

---

## Tipos Principais

```typescript
// Envio
interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Webhook
interface WhatsAppEvent {
  event: 'messages.upsert' | 'messages.set' | 'connection.update';
  data: any;
}
```

---

## Custos Estimados

| Item | Custo |
|------|-------|
| Railway (já em uso) | R$0 |
| Meta API (utility) | R$0.05/msg |
| Meta API (service) | R$0 |
| Estimativa mensal | R$50-150 |

---

## Timeline

| Fase | Horas | Atividade |
|------|-------|----------|
| 1. Setup | 1-2 | Copiar arquivos, criar tipos |
| 2. Webhook | 1-2 | Criar rota, validar GET/POST |
| 3. Notificações | 2-3 | Implementar helpers |
| 4. Testes | 1-2 | Testes unitários e E2E |
| **Total** | **6-9** | **Implementação completa** |

---

## Próximos Passos

1. Ler documentação (1-2 horas)
2. Copiar `zapi.ts` (5 minutos)
3. Criar webhook (2-3 horas)
4. Integrar em endpoints (2-3 horas)
5. Testar (1-2 horas)

---

## Referências Oficiais

- **Evolution API:** https://doc.evolution.br
- **Meta WhatsApp:** https://developers.facebook.com/docs/whatsapp
- **Railway:** https://railway.app/docs
- **GitHub Evolution:** https://github.com/EvolutionAPI/evolution-api

---

## Suporte

- Problemas de configuração → Ler seção 9 de EVOLUTION_API_QUICK_REFERENCE.md
- Problemas de código → Ler seção 5-6 de EVOLUTION_API_CARTEIRA_LIVRE_INVESTIGATION.md
- Problemas de deployment → Ler seção 10 de EVOLUTION_API_CARTEIRA_LIVRE_INVESTIGATION.md

---

## Status da Investigação

- [x] Localizar arquivos
- [x] Ler código-fonte
- [x] Documentar endpoints
- [x] Documentar tipos
- [x] Criar guia de implementação
- [x] Criar referência rápida
- [x] Criar estrutura para Forja
- [x] Listar arquivos a copiar

**Conclusão:** Investigação completa. Pronto para implementação em Forja.

---

**Última atualização:** 2026-03-29  
**Localização:** `/home/enio/852/EVOLUTION_API_*.md`
