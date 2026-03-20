# HARVEST — 852 Inteligência

*Knowledge base para padrões recorrentes, decisões arquiteturais e gotchas do projeto.*

## 2026-03-20 | P1 Sprint - Inteligência e Moderação Orgânica

### 1. Espiral de Escuta (AI Feedback Loop Trigger)
**Padrão Arquitetural**: O sistema implementou o trigger da "Espiral de Escuta". Em vez de cron jobs pesados reavaliando todo o banco, optamos por um trigger atrelado ao próprio endpoint de votação (`/api/issues`). Se a taxa de aprovação (*Approval Rating*) cair abaixo de 85% com um quorum mínimo (5 votos explícitos, agora suportando downvotes), a rota despacha um background fetch "fire-and-forget" para `/api/issues/reanalyze`.
**Gotcha**: A chamada fetch em background usa o origin dinâmico para evitar bloqueios de domínio no deploy Caddy local. `fetch(url).catch()` garante que a UI não seja bloqueada pela IA reavaliando o tópico no Supabase. O modelo instruído foi o `qwen-max` agindo com "escuta ativa" (`buildEspiralDeEscutaPrompt`).

### 2. Fluxo Multi-Camada (Moderação Institucional)
**Decisão:** Foi introduzido o status `pending_human` para a tabela `reports_852`. 
- Isso previne que spams, doxxing ou material inadequado (que tenha bypassado o PII scanner) polua o board público automaticamente.
- Relatos são postados inicialmente como `pending_human`.
- O dashboard administrativo (`/admin/curadoria`) é a interface única para transicionar para `published`. Só então a `createIssue` (Fórum Público) é engatilhada.
**Padrão**: Reutilização dos pacotes e cards do painel de `validations` para criar a `curadoria`, mantendo a linguagem visual dos administradores intacta.

### 3. In-Chat Correlation Engine
**Padrão Arquitetural**: Para remover as bolhas de chat isoladas, a UI do `/chat` monitora o `onFinish` do AI SDK pipeline. Quando a IA envia a mensagem completa, extraímos palavras-chave do texto renderizado e disparamos um debounced background fetch `useQuery` injetando cartões "Relacionados na Corporação" usando `CorrelationPanel` logo abaixo da resposta da IA. 

### 4. Dual-Write Remote Drafts
**Padrão**: Local Storage atua com precedência MÁXIMA para velocidade; writes em cloud ocorrem num debounce assíncrono para usuários atestados. Isso salva recursos pesados de escrita e protege os relatórios parciais.
