# TASKS — Tira-Voz (852)

## 🚀 P3 - Sprint v10 (Analytics & Performance — 2026-04-09)

### Analytics Avançado
- [x] **Dashboard de engajamento**: métricas de retenção, churn, tempo médio de sessão (lib/analytics.ts + API + UI)
- [x] **Funnel de conversão**: track de landing → chat → report → share completo
- [x] **Heatmap de cliques**: lib/clarity.ts + /admin/clarity + tracking events
- [x] **Análise de sentimento**: lib/sentiment.ts + migration + API + lexicon PT-BR
- [x] **Relatórios exportáveis**: /api/admin/export CSV com BOM para Excel
- [x] **Relatório Master Único**: /api/ai-reports/master + MasterIntelligenceReportSection (consolida todos em 1)
- [x] **Correção scrollbars**: tema dark azul (#1e3a5f) em toda a aplicação

### Performance & Otimização
- [x] **Edge caching**: Cache de hot topics e stats no edge (headers CDN-Cache-Control)
- [x] **Lazy loading**: Code-splitting Recharts (ChartsModule.tsx) + PDF export lazy
- [x] **Database indexing**: 15 índices criados (hot topics, analytics, sentiment)
- [x] **Bundle optimization**: ~25% reduction via lazy loading Recharts/jsPDF/docx

### Integrações Futuras
- [ ] **REDS Integration**: API bridge para consulta de ocorrências (autenticado)
- [ ] **SEI Protocolo**: Geração de protocolos SEI para relatos oficiais
- [ ] **InteliLink Bridge**: Conector para sistema de inteligência policial
- [ ] **Google Drive Export**: Salvar relatórios direto no Drive (OAuth)

### UX & Acessibilidade
- [ ] **Tema claro**: Alternative light mode (toggle dark/light)
- [ ] **Fonte ajustável**: Controles de acessibilidade para idosos
- [ ] **Leitor de tela**: ARIA labels completos em todas as páginas
- [ ] **Keyboard navigation**: Navegação 100% por teclado

## ⏭️ Backlog
