# 📊 Relatório Completo VPS Contabo - Migração Hetzner

**Data:** 27/03/2026  
**VPS Atual:** Contabo (217.216.95.126)  
**Disco:** 484GB total / 157GB usado (33%)  
**RAM:** 24GB  

---

## ✅ Tarefas Concluídas Hoje

### 852 Admin Setup
- ✅ Admin `enioxt@gmail.com` criado/atualizado no sistema
- ✅ Conta MASP `12571402` validada (status: approved)
- ✅ Deploy realizado com sucesso (build 2m 46s)

### Regras de Validação MASP Documentadas

| Regra | Descrição | Implementação |
|-------|-----------|---------------|
| **Formato** | Exatamente 8 dígitos numéricos | `REGEX ^\d{8}$` |
| **Unicidade** | MASP único por conta | `UNIQUE INDEX` |
| **Status** | pending → approved/rejected | `validation_status` column |
| **Auto-reset** | Alteração de MASP = pending | `user-auth.ts:547` |
| **UI Admin** | Painel em `/admin/validations` | Next.js + Supabase |

### Fluxo de Validação
```
Usuário cadastra MASP → Status: pending
↓
Admin acessa /admin/validations
↓
Botão "Aprovar" ou "Rejeitar"
↓
Status atualizado em user_accounts_852
```

---

## 🖥️ Estrutura VPS Completa

### Serviços Docker Ativos (8 containers)

| Container | Imagem | Porta | Status | Função |
|-----------|--------|-------|--------|--------|
| 852-app | 852-app | 127.0.0.1:3001→3000 | ✅ Healthy | Chatbot 852 |
| egos-media-web | nginx | 0.0.0.0:3015→80 | ✅ Up | Media server |
| waha-santiago | waha | 0.0.0.0:3002→3000 | ✅ Up | WhatsApp API |
| infra-api-1 | infra-api | 127.0.0.1:8000→8000 | ✅ Healthy | BR/ACC API |
| infra-frontend-1 | infra-frontend | 127.0.0.1:3000→3000 | ✅ Healthy | BR/ACC Frontend |
| bracc-neo4j | neo4j:5-community | 7474, 7687 | ✅ Healthy | Neo4j Database |
| infra-caddy-1 | caddy:2-alpine | 80, 443 | ✅ Up | Reverse Proxy |
| infra-redis-1 | redis:7-alpine | 6379 | ✅ Healthy | Cache/Queue |

### Diretórios e Tamanhos

```
/opt/
├── 852/              37MB    → Chatbot 852 (Next.js + Docker)
├── bracc/           39GB    → EGOS Inteligência (Neo4j 77M+ nós)
├── egos-bot/       2.2GB    → Bot Telegram EGOS
├── egos-lab/       120MB    → Lab/Website
├── egos-media/     100KB    → Media server
├── santiago/       136KB    → Santiago project
└── scripts/        487MB    → Scripts diversos
```

### Volumes Docker (Backup Necessário)

| Volume | Tamanho | Conteúdo |
|--------|---------|----------|
| infra_neo4j-data | ~38GB | Neo4j BR/ACC (77M entidades) |
| infra_caddy-data | ~100MB | Certificados SSL |
| infra_caddy-config | ~10MB | Configuração Caddy |
| infra_redis-data | ~50MB | Cache/Queues |

---

## 💾 BACKUP OBRIGATÓRIO (Migração Hetzner)

### 1. Bancos de Dados

| Banco | Local/Remoto | Backup | Tamanho Est. |
|-------|--------------|--------|--------------|
| **Neo4j BR/ACC** | Local VPS | `neo4j-admin dump` | ~38GB |
| **Supabase (852)** | Remoto (lhscgsqhiooyatkebose) | SQL Export/API | ~500MB |
| **Supabase (Carteira)** | Remoto (eevhnrqmdwjhwmxdidns) | SQL Export/API | ~2GB |
| **Supabase (Forja)** | Remoto (zqcdkbnwkyitfshjkhqg) | SQL Export/API | ~200MB |
| **Redis** | Local VPS | RDB + AOF | ~100MB |

### 2. Arquivos de Configuração

```
/opt/852/.env                           → Credenciais 852
/opt/bracc/infra/.env                   → Credenciais BR/ACC
/opt/bracc/infra/Caddyfile              → Config proxy reverso
/opt/bracc/infra/docker-compose.yml     → Orquestração
/opt/bracc/infra/neo4j/init.cypher    → Schema Neo4j
/etc/caddy/                             → Se houver Caddy nativo
```

### 3. Dados Persistentes

```
/opt/bracc/infra/neo4j/import/          → Dados importados
/var/lib/docker/volumes/                → Volumes Docker
/opt/egos-bot/                          → Config bot Telegram
```

### 4. SSL Certificates (Let's Encrypt)

```
infra_caddy-data:/data/caddy/certificates/ → Certificados automáticos
```

---

## 🧹 LIMPEZA RECOMENDADA (BR/ACC - Não Usado)

### Componentes que podem ser removidos:

1. **ETL Data** (`/opt/bracc/etl/` - 186MB)
   - Scripts de ingestão (não está rodando)
   - Pode ser arquivado

2. **Neo4j Data** (`infra_neo4j-data` - 38GB)
   - ⚠️ **NÃO REMOVER SEM BACKUP**
   - Se não for usar: `docker volume rm infra_neo4j-data`
   - Recomendação: Fazer dump antes

3. **Frontend BR/ACC** (`infra-frontend-1`)
   - Pode parar se não usar: `docker compose stop frontend`

4. **API BR/ACC** (`infra-api-1`)
   - Pode parar se não usar: `docker compose stop api`

### Comandos de Limpeza Segura:
```bash
# Parar serviços BR/ACC (se não usar)
cd /opt/bracc/infra && docker compose stop api frontend

# Backup Neo4j antes de qualquer coisa
docker exec bracc-neo4j neo4j-admin database dump neo4j --to=/backups/neo4j-$(date +%Y%m%d).dump

# Limpar logs Docker (libera espaço)
docker system prune -a --volumes -f
```

---

## 🔄 PLANO DE MIGRAÇÃO HETZNER

### Fase 1: Preparação (1-2 dias)
1. ✅ **Criar servidor Hetzner** (CX42 ou CPX31)
2. ✅ **Instalar Docker + Docker Compose**
3. ✅ **Configurar firewall (UFW)**
4. ⏳ **Backup completo Neo4j** (38GB)
5. ⏳ **Export SQL Supabase** (todas as instâncias)
6. ⏳ **Copiar .env files** (sem commit)

### Fase 2: Migração (1 dia)
1. ⏳ **Restaurar Neo4j** no novo VPS
2. ⏳ **Deploy 852** (docker compose up)
3. ⏳ **Deploy BR/ACC** (se for manter)
4. ⏳ **Configurar Caddy** (proxy reverso)
5. ⏳ **Testar endpoints**

### Fase 3: DNS Cutover (30 min)
1. ⏳ **Atualizar DNS** (852.egos.ia.br)
2. ⏳ **Atualizar DNS** (inteligencia.egos.ia.br)
3. ⏳ **Verificar SSL**
4. ⏳ **Monitorar logs**

### Fase 4: Validação (1 dia)
1. ⏳ **Testar login admin**
2. ⏳ **Testar validação MASP**
3. ⏳ **Testar chatbot**
4. ⏳ **Verificar métricas**

---

## 📋 CHECKLIST BACKUP (Execução)

```bash
# 1. Neo4j Backup
docker exec bracc-neo4j neo4j-admin database dump neo4j --to=/var/lib/neo4j/backups/neo4j-$(date +%Y%m%d).dump

# 2. Copiar para local
scp root@217.216.95.126:/opt/bracc/infra/neo4j/backups/neo4j-*.dump ./backups/

# 3. .env files
scp root@217.216.95.126:/opt/852/.env ./backups/852.env
scp root@217.216.95.126:/opt/bracc/infra/.env ./backups/bracc.env

# 4. Docker volumes
docker run --rm -v infra_neo4j-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/neo4j-data.tar.gz -C /data .
docker run --rm -v infra_caddy-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/caddy-data.tar.gz -C /data .

# 5. Caddy config
scp root@217.216.95.126:/opt/bracc/infra/Caddyfile ./backups/

# 6. Git repos (já no GitHub)
# 852: github.com/enioxt/852
# br-acc: github.com/enioxt/EGOS-Inteligencia
```

---

## 🎯 RESUMO EXECUTIVO

### O que está rodando e funcionando:
- ✅ 852 Inteligência (chatbot) - https://852.egos.ia.br
- ✅ Admin panel com validação MASP
- ✅ Conta enioxt@gmail.com validada
- ✅ Deploy automatizado via Docker

### O que precisa de backup:
1. **Neo4j** (38GB) - Prioridade MÁXIMA
2. **.env files** (credenciais)
3. **Certificados SSL** (Caddy)
4. **Configurações Docker**

### O que pode ser limpo:
- BR/ACC pode ser parado (se não usar)
- Logs Docker antigos
- ETL scripts (186MB) - arquivar

### Custo estimado Hetzner:
- **CPX31** (4 vCPU, 8GB RAM, 160GB NVMe): €8.20/mês
- **CX42** (4 vCPU, 16GB RAM, 320GB NVMe): €14.70/mês
- **Armazenamento extra** (500GB): €20/mês
- **Total:** €28-35/mês vs ~$36/mês (Contabo)

---

**Próximo passo recomendado:** Executar backup Neo4j e env files antes de qualquer ação de migração.
