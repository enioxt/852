# 🚀 Deploy Concluído - Migração Hetzner

**Data:** 28/03/2026  
**Hora:** 08:15 UTC-3  
**Status:** ✅ **ONLINE NO HETZNER**

---

## 📍 Infraestrutura Atualizada

| Recurso | Anterior (Contabo) | Atual (Hetzner) |
|---------|-------------------|-----------------|
| **IP** | 217.216.95.126 | **204.168.217.125** |
| **Hostname** | contabo | **hetzner** |
| **SSH Key** | ~/.ssh/id_ed25519 | **~/.ssh/hetzner_ed25519** |
| **Status** | ❌ Desativado | ✅ **Ativo** |

---

## ✅ Tarefas Concluídas

### 1. SSH Config Atualizado
```
Host hetzner vps egos-intel
    HostName 204.168.217.125
    User root
    IdentityFile ~/.ssh/hetzner_ed25519

Host contabo-old
    HostName 217.216.95.126
    User root
    IdentityFile ~/.ssh/id_ed25519
```

### 2. Deploy 852 no Hetzner
- ✅ Rsync do código fonte
- ✅ Build da imagem Docker (852-app)
- ✅ Container reiniciado e healthy
- ✅ Aplicação acessível via https://852.egos.ia.br

### 3. Documentação Atualizada
- ✅ `AGENTS.md` — VPS atualizado para Hetzner
- ✅ `docs/VPS_MIGRATION_REPORT.md` — Migração documentada
- ✅ `~/.ssh/config` — Configuração SSH atualizada

---

## 🎨 Features Deployadas (Commit c26908d)

| Feature | Componente | Status |
|---------|-----------|--------|
| **FAQ Unificado** | FAQModal.tsx | ✅ Online |
| **Hover Preview** | ReportPreviewTooltip.tsx | ✅ Online |
| **Cards Relatórios** | IntelligenceReportCard.tsx | ✅ Online |
| **IssuesFeed Melhorado** | IssuesFeed.tsx | ✅ Online |
| **Fix Duplicação** | HotTopicsMarquee.tsx | ✅ Online |

### Funcionalidades dos Cards de Relatório:
- ✅ Preview 5 linhas (fechado) / 10 linhas (expandido)
- ✅ Compartilhar WhatsApp
- ✅ Copiar link
- ✅ Download HTML
- ✅ Download Markdown
- ✅ View relatório completo

---

## 🔧 Comandos Úteis

```bash
# Acessar VPS Hetzner
ssh hetzner

# Ver logs do 852
docker logs -f 852-app

# Restart do 852
docker compose restart app

# Build e deploy
./scripts/release.sh

# Verificar saúde
curl http://127.0.0.1:3001/api/health
```

---

## 📊 Status dos Serviços no Hetzner

```
Container 852-app:    ✅ Running (Port 3001)
Container infra-caddy: ✅ Running (Ports 80, 443)
Network infra_bracc: ✅ Active
```

---

## 🌐 URLs Importantes

| URL | Propósito |
|-----|-----------|
| https://852.egos.ia.br | **Aplicação Principal** |
| https://852.egos.ia.br/papo-de-corredor | Hub de Inteligência |
| https://852.egos.ia.br/chat | Chat com IA |

---

## ⚠️ IPs Antigos (Contabo) - DESATIVAR

Os seguintes IPs do Contabo **não devem mais ser usados**:
- `217.216.95.126` — VPS antigo

Atualizar em:
- [ ] DNS/registro A (se houver)
- [ ] Documentação externa
- [ ] Configurações de firewall
- [ ] Scripts de monitoramento

---

## 📝 Próximos Passos

1. **Validar Funcionalidades** — Testar exports, previews, etc.
2. **Testar Mobile** — Verificar responsividade
3. **Limpar Contabo** — Cancelar VPS antigo quando confirmar estabilidade
4. **Atualizar outros projetos** — Verificar se há outros no Contabo

---

**Deploy realizado com sucesso! 🎉**

As melhorias do Papo de Corredor estão agora **online no Hetzner**.
