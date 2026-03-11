import { generateText } from 'ai';
import { getModelConfig } from '@/lib/ai-provider';
import { recordEvent } from '@/lib/telemetry';
import {
  getSupabase,
  saveAIReport,
  createIssue,
  getConversationCountSinceLastReport,
} from '@/lib/supabase';

const AI_REPORT_TRIGGER_COUNT = 5;

const REPORT_PROMPT = `Você é um analista de inteligência institucional da Polícia Civil de Minas Gerais.
Sua função é analisar conversas anônimas de policiais civis e gerar um relatório completo de inteligência.

## INSTRUÇÕES
1. Analise TODAS as conversas fornecidas (relatos brutos dos policiais + respostas do agente IA)
2. Analise TODAS as revisões de IA dos relatórios (sugestões, pontos cegos, temas identificados)
3. Identifique padrões, problemas recorrentes, áreas críticas
4. Gere insights acionáveis para a gestão
5. Liste TÓPICOS PENDENTES: sugestões da IA que os policiais NÃO seguiram — estes devem virar issues para discussão

## FORMATO DE RESPOSTA (JSON ESTRITO)
Responda APENAS com JSON válido:
{
  "titulo": "Relatório de Inteligência #N — Período",
  "resumo_executivo": "Resumo em 2-3 parágrafos...",
  "insights": [
    {"titulo": "...", "descricao": "...", "categoria": "infraestrutura|efetivo|assedio|plantao|carreira|tecnologia|outro", "severidade": "critica|alta|media|baixa", "evidencias": "Citações anonimizadas..."}
  ],
  "padroes_detectados": ["padrão 1", "padrão 2"],
  "topicos_pendentes": [
    {"titulo": "...", "descricao": "...", "categoria": "...", "origem": "ai_suggestion"}
  ],
  "recomendacoes": ["recomendação 1", "recomendação 2"],
  "metricas": {
    "total_conversas_analisadas": 0,
    "total_relatorios_analisados": 0,
    "temas_mais_frequentes": ["tema1", "tema2"],
    "severidade_media": "alta|media|baixa"
  }
}`;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const forceGenerate = body.force === true;

    // Check if we should generate (every 5 conversations)
    if (!forceGenerate) {
      const count = await getConversationCountSinceLastReport();
      if (count < AI_REPORT_TRIGGER_COUNT) {
        return Response.json({
          generated: false,
          reason: `Apenas ${count}/${AI_REPORT_TRIGGER_COUNT} conversas desde o último relatório`,
          conversationsSinceLastReport: count,
        });
      }
    }

    const sb = getSupabase();
    if (!sb) {
      return Response.json({ error: 'Supabase não configurado' }, { status: 503 });
    }

    // Fetch recent conversations and reports for analysis
    const { data: conversations } = await sb
      .from('conversations_852')
      .select('messages, title, created_at, message_count')
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: reports } = await sb
      .from('reports_852')
      .select('messages, review_data, created_at')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
      .limit(20);

    const convoList = conversations || [];
    const reportList = reports || [];

    if (convoList.length === 0) {
      return Response.json({ generated: false, reason: 'Sem conversas para analisar' });
    }

    // Build analysis context
    const convoText = convoList.map((c, i) => {
      const msgs = typeof c.messages === 'string' ? JSON.parse(c.messages) : c.messages;
      const text = msgs.map((m: { role: string; content: string }) =>
        `[${m.role === 'user' ? 'POLICIAL' : 'AGENTE 852'}]: ${m.content.slice(0, 500)}`
      ).join('\n');
      return `--- CONVERSA ${i + 1} (${c.created_at?.slice(0, 10)}) ---\n${text}`;
    }).join('\n\n');

    const reviewText = reportList
      .filter(r => r.review_data)
      .map((r, i) => {
        const rd = r.review_data as Record<string, unknown>;
        return `--- REVISÃO IA ${i + 1} ---\nResumo: ${rd.resumo || 'N/A'}\nTemas: ${Array.isArray(rd.temas) ? rd.temas.join(', ') : 'N/A'}\nSugestões: ${Array.isArray(rd.sugestoes) ? rd.sugestoes.map((s: { texto?: string }) => s.texto).join('; ') : 'N/A'}\nPontos Cegos: ${Array.isArray(rd.pontosCegos) ? rd.pontosCegos.join('; ') : 'N/A'}`;
      }).join('\n\n');

    const userMessage = `Analise as seguintes ${convoList.length} conversas e ${reportList.length} relatórios:\n\n## CONVERSAS BRUTAS\n${convoText}\n\n## REVISÕES DA IA (sugestões que podem não ter sido seguidas)\n${reviewText || 'Nenhuma revisão disponível'}\n\nGere o relatório completo em JSON.`;

    const { provider, modelId, providerLabel, pricing } = getModelConfig('intelligence_report');
    const startTime = Date.now();

    const result = await generateText({
      model: provider.chat(modelId),
      system: REPORT_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.3,
    });

    const durationMs = Date.now() - startTime;

    // Parse JSON from response
    let reportJson;
    try {
      let text = result.text.trim();
      // Strip markdown fences
      const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) text = fenceMatch[1].trim();
      reportJson = JSON.parse(text);
    } catch {
      console.error('[852-ai-report] JSON parse failed, raw:', result.text.slice(0, 200));
      return Response.json({ error: 'Falha ao parsear resposta da IA' }, { status: 500 });
    }

    // Calculate cost
    const usage = result.usage as unknown as Record<string, number>;
    const tokensIn = usage?.promptTokens || usage?.inputTokens || 0;
    const tokensOut = usage?.completionTokens || usage?.outputTokens || 0;
    const costUsd = (tokensIn / 1000) * pricing.input + (tokensOut / 1000) * pricing.output;

    // Build HTML content
    const contentHtml = buildReportHtml(reportJson, {
      model: modelId,
      provider: providerLabel,
      costUsd,
      tokensIn,
      tokensOut,
      durationMs,
      conversationCount: convoList.length,
      reportCount: reportList.length,
    });

    // Save AI report
    const reportId = await saveAIReport({
      trigger_type: forceGenerate ? 'manual' : 'auto_5',
      model_id: modelId,
      provider: providerLabel,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      cost_usd: costUsd,
      duration_ms: durationMs,
      conversation_count: convoList.length,
      report_count: reportList.length,
      content_html: contentHtml,
      content_summary: reportJson.resumo_executivo?.slice(0, 500) || null,
      insights: reportJson.insights || null,
      pending_topics: reportJson.topicos_pendentes || null,
      metadata: {
        padroes: reportJson.padroes_detectados,
        recomendacoes: reportJson.recomendacoes,
        metricas: reportJson.metricas,
      },
    });

    // Create issues from pending topics
    const pendingTopics = reportJson.topicos_pendentes || [];
    for (const topic of pendingTopics) {
      await createIssue(
        topic.titulo,
        topic.descricao,
        topic.categoria,
        'ai_suggestion',
        reportId || undefined
      );
    }

    // Record telemetry
    recordEvent({
      event_type: 'ai_report_generated',
      model_id: modelId,
      provider: providerLabel,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      cost_usd: costUsd,
      duration_ms: durationMs,
      metadata: {
        reportId,
        conversationCount: convoList.length,
        reportCount: reportList.length,
        issuesCreated: pendingTopics.length,
        triggerType: forceGenerate ? 'manual' : 'auto_5',
      },
    });

    return Response.json({
      generated: true,
      reportId,
      model: modelId,
      provider: providerLabel,
      cost: { usd: costUsd, tokensIn, tokensOut },
      durationMs,
      issuesCreated: pendingTopics.length,
      summary: reportJson.resumo_executivo?.slice(0, 300),
    });
  } catch (error) {
    console.error('[852-ai-report] error:', error);
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}

function buildReportHtml(
  report: Record<string, unknown>,
  meta: { model: string; provider: string; costUsd: number; tokensIn: number; tokensOut: number; durationMs: number; conversationCount: number; reportCount: number }
): string {
  const insights = Array.isArray(report.insights) ? report.insights : [];
  const patterns = Array.isArray(report.padroes_detectados) ? report.padroes_detectados : [];
  const recommendations = Array.isArray(report.recomendacoes) ? report.recomendacoes : [];
  const pendingTopics = Array.isArray(report.topicos_pendentes) ? report.topicos_pendentes : [];

  return `
<article class="ai-report">
  <header>
    <h1>${report.titulo || 'Relatório de Inteligência'}</h1>
    <div class="meta">
      <span class="ai-badge">🤖 Gerado por IA</span>
      <span class="model">Modelo: ${meta.model}</span>
      <span class="provider">Provedor: ${meta.provider}</span>
      <span class="cost">Custo: $${meta.costUsd.toFixed(4)} (${meta.tokensIn.toLocaleString()} tokens entrada, ${meta.tokensOut.toLocaleString()} tokens saída)</span>
      <span class="duration">Tempo: ${(meta.durationMs / 1000).toFixed(1)}s</span>
      <span class="scope">${meta.conversationCount} conversas e ${meta.reportCount} relatórios analisados</span>
    </div>
  </header>

  <section class="summary">
    <h2>Resumo Executivo</h2>
    <p>${report.resumo_executivo || 'N/A'}</p>
  </section>

  ${insights.length > 0 ? `
  <section class="insights">
    <h2>Insights (${insights.length})</h2>
    ${insights.map((ins: Record<string, string>) => `
    <div class="insight insight-${ins.severidade || 'media'}">
      <h3>${ins.titulo || 'Insight'}</h3>
      <span class="category">${ins.categoria || 'geral'}</span>
      <span class="severity">${ins.severidade || 'media'}</span>
      <p>${ins.descricao || ''}</p>
      ${ins.evidencias ? `<blockquote>${ins.evidencias}</blockquote>` : ''}
    </div>
    `).join('')}
  </section>
  ` : ''}

  ${patterns.length > 0 ? `
  <section class="patterns">
    <h2>Padrões Detectados</h2>
    <ul>${patterns.map((p: string) => `<li>${p}</li>`).join('')}</ul>
  </section>
  ` : ''}

  ${pendingTopics.length > 0 ? `
  <section class="pending">
    <h2>Tópicos Pendentes (${pendingTopics.length})</h2>
    <p class="pending-note">Estes tópicos foram identificados pela IA mas não foram discutidos pelos policiais. Foram criados como issues para discussão aberta.</p>
    <ul>${pendingTopics.map((t: Record<string, string>) => `<li><strong>${t.titulo}</strong>: ${t.descricao || ''} <span class="category">[${t.categoria || 'geral'}]</span></li>`).join('')}</ul>
  </section>
  ` : ''}

  ${recommendations.length > 0 ? `
  <section class="recommendations">
    <h2>Recomendações</h2>
    <ol>${recommendations.map((r: string) => `<li>${r}</li>`).join('')}</ol>
  </section>
  ` : ''}
</article>`.trim();
}
