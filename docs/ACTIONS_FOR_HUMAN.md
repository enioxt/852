# 📝 AÇÕES PARA EXECUTAR — 852 Inteligência

> Data: 2026-04-09  
> Status: P0 (Urgente)

---

## ✅ RESOLVIDO PELO AGENTE

### 1. Sistema de Relatório Master Único
- [x] Migration: `20260409160000_single_intelligence_report.sql` (campos cumulativos)
- [x] API: `/api/ai-reports/master` (GET/POST para relatório único)
- [x] Componente: `MasterIntelligenceReportSection.tsx`
- [x] Integração: ReportsFeed.tsx mostra apenas o relatório master

### 2. Correção de Scrollbars
- [x] CSS global: scrollbars azul escuro (#1e3a5f) no tema dark
- [x] Override para iframes e relatórios
- [x] Firefox support via scrollbar-color

---

## 🔧 AÇÕES NECESSÁRIAS DO HUMANO

### Bloco 1: Aplicar Migrations (PRIORIDADE ALTA)

```bash
# 1. Entrar na pasta do projeto
cd /home/enio/852

# 2. Aplicar migration do relatório master único
supabase db push --db-url "$SUPABASE_DB_URL"

# OU via SQL Editor no Supabase Dashboard:
# Cole o conteúdo de:
# supabase/migrations/20260409160000_single_intelligence_report.sql
```

### Bloco 2: Limpar Relatórios Duplicados

```sql
-- Executar no SQL Editor do Supabase:

-- 1. Ver relatórios atuais
SELECT id, created_at, is_master_report 
FROM ai_reports_852 
ORDER BY created_at DESC;

-- 2. Marcar relatórios antigos como arquivados (não excluir)
UPDATE ai_reports_852 
SET is_master_report = false 
WHERE is_master_report IS NULL OR is_master_report = false;

-- 3. Criar primeiro master report (ou atualizar se existir)
-- Isso será feito automaticamente pela API ao acessar /papo-de-corredor
```

### Bloco 3: Deploy e Teste

```bash
# 1. Build local
npm run build

# 2. Verificar se não há erros de TypeScript
npx tsc --noEmit

# 3. Commit e push
git add -A
git commit -m "feat: relatório master único + scrollbars dark"
git push origin main

# 4. Deploy no servidor (VPS)
# Via GitHub Actions ou manual:
# cd /opt/852 && git pull && npm install && npm run build
```

### Bloco 4: Testar Funcionalidade

1. Acesse: `https://852.egos.ia.br/papo-de-corredor`
2. Clique na aba "Inteligência"
3. Verifique:
   - [ ] Apenas 1 relatório master é mostrado
   - [ ] Versão é exibida (v1, v2...)
   - [ ] Stats de conversas/relatórios aparecem
   - [ ] Botão "Atualizar" funciona
   - [ ] Scrollbars estão azul escuro (não brancas)

### Bloco 5: Configurar Auto-Update (Opcional)

Para que o relatório se atualize automaticamente quando houver novos dados:

```bash
# Adicionar ao crontab (executa a cada 30 minutos)
*/30 * * * * curl -X POST https://852.egos.ia.br/api/ai-reports/master
```

Ou configurar no sistema de notificações existente para chamar a API quando novos relatos forem adicionados.

---

## 🎨 VERIFICAR SCROLLBARS

Após o deploy, verifique estas áreas:

- [ ] Scrollbar da página inteira (lateral direita)
- [ ] Scrollbar dentro do relatório de inteligência (iframe)
- [ ] Scrollbar no painel de chat
- [ ] Scrollbar em qualquer modal/popup

Todas devem ser:
- **Track (fundo):** `#0f172a` (slate-950)
- **Thumb (barra):** `#1e3a5f` (brand-blue)
- **Hover:** `#3b82f6` (brand-blue-light)

---

## 🐛 SE ALGO DER ERRADO

### Scrollbar ainda branca?
```bash
# Limpar cache do navegador (Ctrl+Shift+R)
# Ou adicionar ?v=2 na URL
```

### Relatório não aparece?
```bash
# Verificar logs da API
curl https://852.egos.ia.br/api/ai-reports/master
# Deve retornar { "exists": true/false, ... }
```

### Duplicados ainda aparecem?
```sql
-- Verificar no banco
SELECT COUNT(*) FROM ai_reports_852 WHERE is_master_report = true;
-- Deve retornar 1 (ou 0 se ainda não criou)
```

---

## 📁 ARQUIVOS CRIADOS/MODIFICADOS

```
NOVOS:
├── src/app/api/ai-reports/master/route.ts
├── src/components/corredor/MasterIntelligenceReportSection.tsx
├── supabase/migrations/20260409160000_single_intelligence_report.sql
└── docs/ACTIONS_FOR_HUMAN.md (este arquivo)

MODIFICADOS:
├── src/app/globals.css (scrollbar styling)
├── src/components/corredor/ReportsFeed.tsx
├── src/components/corredor/IntelligenceReportCard.tsx
├── src/lib/telemetry.ts
└── TASKS.md
```

---

## ⚡ PRÓXIMAS TAREFAS (PARA PRÓXIMO AGENTE)

### P0 (Esta semana)
- [ ] OSINT-006: Map Brasil.IO, Escavador, Jusbrasil integration
- [ ] OSINT-007: Create DM templates for PCMG, PMMG, PF delegacias
- [ ] OSINT-008: Implement HIBP API alerts

### P1 (Próximas 2 semanas)
- [ ] X-COM-006: Adaptar setup script para /opt/x-automation/
- [ ] X-COM-007: Deploy X monitoring no VPS
- [ ] X-COM-008: x-smart-scheduler.ts (análise de audiência)

---

**Fim do documento. Execute os blocos na ordem indicada.**
