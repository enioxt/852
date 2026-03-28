# Diagnóstico Completo - Sistema Tira-Voz (852)

**Data:** 28/03/2026  
**Análise:** Sistema de Relatos, Discussões e Relatórios de IA  
**Status:** Documentação de diagnóstico antes da implementação

---

## 1. PROBLEMAS IDENTIFICADOS

### 1.1 FAQs Duplicados
**Localização:**
- `/src/components/chat/FAQModal.tsx` - FAQ no chat (6 itens)
- `/src/app/page.tsx` (linhas 493-521) - FAQ na landing (15 itens)

**Problema:** Duplicação de conteúdo, manutenção difícil, experiência inconsistente.

**Solução Proposta:** Unificar em um único FAQ completo na landing page, remover o FAQModal.tsx ou torná-lo um wrapper que redireciona para a landing.

---

### 1.2 Preview de Relatórios no Hover (Corredor)
**Localização:** `/src/components/corredor/HotTopicsFeed.tsx`

**Problema:** Quando o usuário passa o mouse sobre um relatório no corredor, não há preview/síntese do relatório de IA associado.

**Solução Proposta:**
- Adicionar tooltip/popover com síntese do relatório de IA ao passar o mouse
- Mostrar: título, resumo (3-5 linhas), número de conversas, data
- Incluir link "Ver relatório completo →"

---

### 1.3 Relatos Compartilhados - Só Mostra 1
**Localização:** `/src/components/corredor/ReportsFeed.tsx` (tab 'shared')

**Diagnóstico:**
A lógica atual (`listSharedReports`) filtra por `status === 'shared' || status === 'pending_human' || status === 'published'`.

**Problemas encontrados:**
1. Relatos são salvos no `localStorage` do navegador - não são compartilhados entre dispositivos
2. A API `/api/reports/server` carrega relatórios do servidor, mas pode haver delay/falha
3. O status "shared" só é aplicado quando o usuário explicitamente compartilha
4. A contagem mostra "1 relato(s)" porque é a quantidade real de relatórios compartilhados por aquele usuário naquele dispositivo

**Solução Proposta:**
- Garantir sincronização com servidor Supabase
- Adicionar cache/localStorage sync mais robusto
- Mostrar mensagem informativa quando não houver relatórios
- Adicionar indicador de "sincronizando..."

---

### 1.4 Página Pautas e Discussões - Muito Vaga
**Localização:** `/src/components/corredor/IssuesFeed.tsx`

**Problemas:**
1. Lista simples de títulos com votação
2. Falta contexto sobre o que são as issues
3. Falta preview do conteúdo ao expandir
4. Comentários não mostram threaded view adequadamente
5. Falta destaque para issues geradas por IA

**Solução Proposta:**
- Adicionar card de explicação no topo
- Melhorar layout com mais informações (categoria, status, data)
- Adicionar preview do body ao expandir
- Melhorar threaded comments com indentação visual
- Destacar issues de IA com badge especial

---

### 1.5 Relatórios de Inteligência - Dentro de Caixa
**Localização:** `/src/components/corredor/ReportsFeed.tsx` (tab 'intelligence')

**Problemas:**
1. Relatório mostrado dentro de iframe com borda
2. Preview limitado a 420px de altura
3. Falta opções de exportar/compartilhar
4. Não há cards com preview de 5-10 linhas

**Solução Proposta:**
- Remover iframe/borda, mostrar conteúdo diretamente
- Criar cards com preview (5-10 linhas) para cada relatório
- Ao clicar, expandir para view completa
- Adicionar botões: WhatsApp, Download PDF, Download MD
- Melhorar CSS do relatório gerado

---

### 1.6 Geração Automática de Tópicos - Não Aparece
**Localização:** `/src/app/api/ai-reports/generate/route.ts` (linhas 140-150)

**Diagnóstico:**
O código CRIA as issues automaticamente via `createIssue()`, mas:
1. As issues criadas têm `source: 'ai_suggestion'`
2. Elas aparecem no feed de issues, mas sem destaque especial
3. Não há notificação/visualização específica de "tópicos gerados automaticamente"

**Solução:**
- Já está funcionando, mas precisa de melhor visualização
- Adicionar seção especial "Tópicos Gerados pela IA" no IssuesFeed
- Mostrar badge "Auto-gerado" nos cards

---

## 2. ARQUITETURA DE DADOS

### 2.1 Tabelas Principais (Supabase)

```
conversations_852     - Conversas do chat
reports_852          - Relatos compartilhados
issues_852           - Tópicos/Discussões
issue_votes_852      - Votos em tópicos
issue_comments_852   - Comentários (threaded)
ai_reports_852       - Relatórios de IA gerados
knowledge_sources_852 - Base de conhecimento
user_accounts_852    - Contas de usuários (MASP)
```

### 2.2 Fluxo de Dados

```
Chat → Conversas (localStorage + Supabase)
   ↓
Compartilhar → reports_852 (status: shared)
   ↓
A cada 5 relatos → AI Report Generator
   ↓
AI Report → ai_reports_852 + issues_852 (auto)
   ↓
Issues → Votos → Hot Topics
```

---

## 3. ENDPOINTS E APIs

### 3.1 APIs Existentes

| Endpoint | Função | Status |
|----------|--------|--------|
| `/api/chat` | Chat streaming com IA | ✅ |
| `/api/report` | Gerar relatório HTML | ✅ |
| `/api/ai-reports` | Listar relatórios de IA | ✅ |
| `/api/ai-reports/generate` | Gerar relatório de IA automaticamente | ✅ |
| `/api/issues` | CRUD de issues | ✅ |
| `/api/hot-topics` | Listar tópicos em alta | ✅ |
| `/api/reports/server` | CRUD de relatórios no servidor | ✅ |
| `/api/stats` | Estatísticas públicas | ✅ |
| `/api/auth/*` | Autenticação | ✅ |

### 3.2 APIs Necessárias (Novas)

| Endpoint | Função | Prioridade |
|----------|--------|------------|
| `/api/ai-reports/[id]/export` | Exportar relatório em PDF/MD | P1 |
| `/api/reports/[id]/share` | Compartilhar no WhatsApp | P2 |

---

## 4. MELHORIAS PRIORITÁRIAS

### P0 (Crítico)
1. ✅ Merge FAQs - Unificar em um só
2. ✅ Preview de relatórios no hover (Corredor)
3. ✅ Melhorar apresentação de Relatórios de IA

### P1 (Alto)
4. Adicionar exportação PDF/MD/WhatsApp para relatórios
5. Melhorar layout de Issues (mais informativo)
6. Adicionar cards de preview para relatórios

### P2 (Médio)
7. Melhorar sincronização de relatórios compartilhados
8. Adicionar notificações de tópicos auto-gerados
9. Otimizar para mobile (testes responsivos)

---

## 5. PLANO DE IMPLEMENTAÇÃO

### Fase 1: Foundation (2h)
- [ ] Merge FAQs - criar componente único
- [ ] Atualizar page.tsx e FAQModal.tsx
- [ ] Testar responsividade

### Fase 2: Corredor (3h)
- [ ] Adicionar hover preview em HotTopicsFeed
- [ ] Criar componente ReportPreviewTooltip
- [ ] Integrar com API de AI reports

### Fase 3: Relatórios (4h)
- [ ] Refatorar ReportsFeed (tab intelligence)
- [ ] Criar cards com preview
- [ ] Implementar exportação PDF/MD
- [ ] Adicionar botão WhatsApp
- [ ] Melhorar CSS do relatório

### Fase 4: Issues (2h)
- [ ] Melhorar layout de IssuesFeed
- [ ] Adicionar preview ao expandir
- [ ] Destacar issues auto-geradas

### Fase 5: Polimento (1h)
- [ ] Testes mobile
- [ ] Revisão de texto
- [ ] Ajustes finos de CSS

---

## 6. NOTAS TÉCNICAS

### 6.1 Bibliotecas Úteis
- `jspdf` ou `html2pdf.js` - Exportação PDF
- `react-markdown` - Renderizar MD
- `html-to-markdown` - Converter HTML para MD

### 6.2 Padrões CSS
- Usar `bg-neutral-950` para fundo escuro
- `rounded-2xl` para cards
- `border-neutral-800` para bordas sutis
- `text-neutral-200` para texto primário
- `text-neutral-400` para texto secundário

### 6.3 Responsividade
- Mobile: 1 coluna, padding reduzido
- Tablet: 2 colunas
- Desktop: 3 colunas onde aplicável
- Usar `sm:`, `md:`, `lg:` prefixes do Tailwind

---

## 7. DECISÕES A TOMAR

### 7.1 FAQ
- **Decisão:** Manter FAQ completo na landing page (15 itens)
- **Ação:** Remover FAQModal.tsx ou transformar em link para landing

### 7.2 Exportação de Relatórios
- **Decisão:** Implementar exportação client-side (sem API extra)
- **Tecnologia:** `html2pdf.js` para PDF, `Blob` para MD

### 7.3 Preview de Relatórios
- **Decisão:** Criar componente `ReportPreviewCard` reutilizável
- **Conteúdo:** Título, 5-10 linhas de resumo, metadata, CTAs

---

## 8. REFERÊNCIAS

- `/src/components/corredor/HotTopicsFeed.tsx` - Feed de tópicos
- `/src/components/corredor/IssuesFeed.tsx` - Discussões
- `/src/components/corredor/ReportsFeed.tsx` - Relatórios
- `/src/app/page.tsx` - Landing page com FAQ
- `/src/app/api/ai-reports/generate/route.ts` - Gerador de IA
- `/src/lib/report-store.ts` - Store de relatórios
- `/src/lib/supabase.ts` - Cliente Supabase

---

*Documento criado para planejamento. Não é um arquivo de produção.*
