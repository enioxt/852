/**
 * AI Insights for Observability
 * POST /api/admin/telemetry/ai-insights
 * 
 * Analyzes logs and provides AI-powered insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { getModelConfig } from '@/lib/ai-provider';
import { getCurrentAdmin } from '@/lib/admin-auth';
import { generateText } from 'ai';
import { getStats } from '@/lib/telemetry';

// Allow AI responses up to 30 seconds
export const maxDuration = 30;

const OBS_SYSTEM = `Você é um analista de sistemas especializado em observabilidade e DevOps.
Analise as estatísticas e logs de telemetria fornecidos e forneça insights acionáveis em português.
Seja muito conciso e direto. Use bullet points com marcadores visuais.
Foque em: padrões de erro, problemas de performance, custos inesperados, métricas de saúde, taxa de sucesso de requisições AI, comportamento nas violações ATRiAN, etc.`;

export async function POST(request: NextRequest) {
  // Verificação básica de admin (poderia reutilizar auth existente)
  // Como as rotas em /admin do 852 normalmente dependem de jwt do middleware ou algo similar, vamos assumir protegido ou adicionar checagem mínima:
  
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { analysisType = 'general', days = 7 } = body;

    const stats = await getStats(days);

    if (!stats || stats.totalEvents === 0) {
      return NextResponse.json({
        insight: 'Não há eventos suficientes para análise no período selecionado.',
        type: analysisType,
      });
    }

    const logSummary = `
## Resumo dos Eventos (últimos ${days} dias)

**Total:** ${stats.totalEvents}
**Conversas Iniciadas:** ${stats.totalChats}
**Erros:** ${stats.errors}
**Rate Limits (Abusos):** ${stats.rateLimitHits}

### Uso e Custos:
**Tokens In/Out:** ${stats.totalTokensIn} / ${stats.totalTokensOut}
**Custo Estimado (USD):** $${stats.totalCostUsd.toFixed(4)}
**Por Provedor:** ${JSON.stringify(stats.byProvider)}
**Por Modelo:** ${JSON.stringify(stats.byModel)}

### ATRiAN (Sistema de Ética):
${stats.atrian ? `
**Violações:** ${stats.atrian.totalViolations}
**Score Médio:** ${stats.atrian.avgScore}
**Por Categoria:** ${JSON.stringify(stats.atrian.byCategory)}
**Por Gravidade:** ${JSON.stringify(stats.atrian.byLevel)}
`: 'Nenhuma violação grave detectada.'}

### Eventos Recentes:
${stats.recentEvents.slice(0, 15).map((e: any) => `- [${e.event_type}] ${e.error_message || ''} ${e.client_ip_hash ? '(IP '+e.client_ip_hash+')' : ''}`).join('\n')}
`;

    let prompt = '';
    
    switch (analysisType) {
      case 'errors':
        prompt = `Analise os seguintes erros do sistema e eventos de limite de taxa (rate limits) e forneça:
1. Padrões identificados de abuso ou falhas.
2. Causa raiz provável
3. Sugestões de correção ou mitigação.
4. Prioridade de resolução.

${logSummary}`;
        break;
      
      case 'security':
        prompt = `Analise os logs com foco em segurança e violações ATRiAN:
1. Padrões anômalos de acesso e abuso de rate limit.
2. Análise profunda das violações de regras ATRiAN (Sistema Ético Base).
3. Recomendações de hardening no prompt ou sistema base.

${logSummary}`;
        break;
      
      default:
        prompt = `Forneça uma análise geral da saúde do sistema:
1. Visão geral da saúde e uso do volume de AI (custo e eficiência).
2. Principais problemas (se houver).
3. Tendências de uso e qualidade.
4. Ações recomendadas de infra.

${logSummary}`;
    }

    const { provider, modelId: resolvedModelId } = getModelConfig('intelligence_report');

    const { text } = await generateText({
      model: provider.chat(resolvedModelId),
      system: OBS_SYSTEM,
      prompt,
      temperature: 0.3,
    });

    return NextResponse.json({
      insight: text,
      type: analysisType,
      logsAnalyzed: stats.totalEvents,
      period: { days },
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('AI Insights error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
