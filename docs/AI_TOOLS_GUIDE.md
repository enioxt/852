# Guia de Uso — AI Tools (Web Search)

> Ferramentas de busca institucional para o Tira-Voz

## Visão Geral

O sistema de **AI Tools** permite que o chatbot busque informações institucionais da PCMG em tempo real, fornecendo dados atualizados aos policiais.

## Ferramentas Disponíveis

### 1. `institutional_search`

Busca informações sobre estrutura organizacional, portarias, procedimentos e dados da PCMG.

**Parâmetros:**
| Parâmetro | Tipo | Descrição | Padrão |
|-----------|------|-----------|--------|
| `query` | string | Termo de busca (ex: "estrutura DIPO") | obrigatório |
| `category` | enum | Categoria: `estrutura`, `portaria`, `estatistica`, `legislacao`, `comunicado`, `geral` | `geral` |
| `limit` | number | Máximo de resultados | `5` |

**Exemplo de uso:**
```typescript
const results = await institutionalSearch(
  'delegacia de homicídios',
  'estrutura',
  3
);
```

### 2. `legal_search`

Busca fundamentação legal: artigos de lei, súmulas, jurisprudência.

**Parâmetros:**
| Parâmetro | Tipo | Descrição | Padrão |
|-----------|------|-----------|--------|
| `query` | string | Termo legal (ex: "artigo 301 CPP") | obrigatório |
| `source` | enum | Fonte: `cp`, `cpp`, `cf`, `lei`, `sumula`, `jurisprudencia` | `lei` |
| `context` | string | Contexto adicional da pergunta | opcional |

## Fontes de Dados

### 1. Web Search Externo (Prioritário)

Quando configurado, busca em fontes externas em tempo real:

- **Serper.dev** (Google Search API): Requer `SERPER_API_KEY`
- **Brave Search API**: Requer `BRAVE_API_KEY`

**Configuração:**
```bash
# .env.local
SERPER_API_KEY=your_serper_key_here
BRAVE_API_KEY=your_brave_key_here
```

### 2. Base de Conhecimento Curada (Fallback)

Se web search não disponível, usa base de conhecimento local com dados sobre:

- Estrutura organizacional (DH, DIPO, DEAM, DICrim, etc.)
- Legislação (Estatuto 869/1952, Regime Disciplinar 5.406/1969)
- Procedimentos (REDS, mandados, registros)
- Benefícios e direitos
- Saúde e bem-estar

## Testes

```bash
# Executar testes unitários
bun test src/lib/ai-tools.test.ts

# Ou com npm
npm test -- src/lib/ai-tools.test.ts
```

## Integração com Chat

As tools estão configuradas em `/src/lib/ai-tools.ts` e podem ser integradas ao fluxo de chat via AI SDK:

```typescript
import { institutionalSearch, INSTITUTIONAL_SEARCH_TOOL } from '@/lib/ai-tools';

// No streamText:
tools: {
  institutional_search: {
    description: INSTITUTIONAL_SEARCH_TOOL.description,
    parameters: INSTITUTIONAL_SEARCH_TOOL.parameters,
    execute: async ({ query, category, limit }) => {
      return await institutionalSearch(query, category, limit);
    },
  },
}
```

**Nota:** A integração completa com `streamText` tools requer alinhamento de versão com AI SDK (atualmente comentado).

## Eventos de Telemetria

| Evento | Descrição |
|--------|-----------|
| `tool_use_institutional_search` | Busca institucional executada |
| `tool_use_legal_search` | Busca legal executada |

## Privacidade e Segurança

- Queries de busca não contêm PII (CPF, MASP, REDS são mascarados antes da busca)
- Resultados são filtrados por relevância (score > 0.5)
- URLs externos são validados antes de exibição
- Dados sensíveis da PCMG são mantidos na base de conhecimento local

## Troubleshooting

### Nenhum resultado retornado

1. Verificar se `SERPER_API_KEY` ou `BRAVE_API_KEY` está configurado
2. Verificar logs em `[ai-tools]` para erros de API
3. Confirmar que query não está vazia

### Resultados irrelevantes

- Ajustar parâmetro `category` para refinar busca
- Usar termos mais específicos na query
- Verificar se termo existe na base de conhecimento curada

## Roadmap

- [ ] Integração completa com AI SDK tools
- [ ] Cache de resultados frequentes
- [ ] Supabase full-text search para documentos internos
- [ ] Expansão da base de conhecimento curada

---

**Autor:** Cascade (EGOS Agent)  
**Atualizado:** 2026-04-08  
**Versão:** 1.0.0
