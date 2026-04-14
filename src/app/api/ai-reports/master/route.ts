/**
 * Master Intelligence Report API — 852 Inteligência
 *
 * Single cumulative report that auto-updates with new data.
 * Replaces multiple periodic reports with one master report.
 */

import { generateText } from 'ai';
import { getModelConfig } from '@/lib/ai-provider';
import { recordEvent } from '@/lib/telemetry';
import { buildIntelligenceReportPrompt } from '@/lib/prompt';
import { applyInsightWeighting } from '@/lib/insight-weighting';
import {
  detectCrossReportPatterns,
  describePatterns,
} from '@/lib/ai-reports-v2';
import { getSupabase } from '@/lib/supabase';

const MIN_NEW_ITEMS_FOR_UPDATE = 3; // Minimum new conversations/reports to trigger update

/**
 * GET /api/ai-reports/master
 * Get the current master intelligence report (single source of truth)
 */
export async function GET() {
  try {
    const sb = getSupabase();
    if (!sb) {
      return Response.json({ error: 'Supabase não configurado' }, { status: 503 });
    }

    // Query only basic columns that exist pre-migration (schema cache safe)
    const { data: reports, error: queryError } = await sb
      .from('ai_reports_852')
      .select('id, content_html, content_summary, created_at, updated_at, model_id, provider, metadata')
      .order('created_at', { ascending: false })
      .limit(5);

    if (queryError) {
      console.error('[852-master-report] Query error:', JSON.stringify(queryError));
      return Response.json({
        exists: false,
        message: 'Database query failed.',
        debug: { code: queryError.code, message: queryError.message },
      });
    }

    if (!reports || reports.length === 0) {
      return Response.json({
        exists: false,
        message: 'Master report not yet created. It will be generated when sufficient data is available.',
      });
    }

    // Use the most recent report as master (temporary until schema cache refreshes)
    const masterReport = reports[0];

    return Response.json({
      exists: true,
      report: masterReport,
      stats: {
        totalConversations: 0,
        totalReports: reports.length,
        version: 1,
        lastUpdated: masterReport.updated_at,
      },
    });
  } catch (error) {
    console.error('[852-master-report] GET error:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST /api/ai-reports/master
 * Create or update the master intelligence report
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const forceUpdate = body.force === true;

    const sb = getSupabase();
    if (!sb) {
      return Response.json({ error: 'Supabase não configurado' }, { status: 503 });
    }

    // Get existing master report
    const { data: existingMaster } = await sb
      .from('ai_reports_852')
      .select('*')
      .eq('is_master_report', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    // Get all new data since last sync (or all data if no master exists)
    const lastConvoId = existingMaster?.last_synced_conversation_id;
    const lastReportId = existingMaster?.last_synced_report_id;

    // Query for new conversations
    let convoQuery = sb
      .from('conversations_852')
      .select('id, messages, title, created_at, message_count')
      .order('created_at', { ascending: false });

    if (lastConvoId && !forceUpdate) {
      const { data: lastConvo } = await sb
        .from('conversations_852')
        .select('created_at')
        .eq('id', lastConvoId)
        .single();
      if (lastConvo) {
        convoQuery = convoQuery.gt('created_at', lastConvo.created_at);
      }
    }

    const { data: newConversations } = await convoQuery;

    // Query for new reports
    let reportQuery = sb
      .from('reports_852')
      .select('id, messages, review_data, created_at')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    if (lastReportId && !forceUpdate) {
      const { data: lastReport } = await sb
        .from('reports_852')
        .select('created_at')
        .eq('id', lastReportId)
        .single();
      if (lastReport) {
        reportQuery = reportQuery.gt('created_at', lastReport.created_at);
      }
    }

    const { data: newReports } = await reportQuery;

    const newConvoList = newConversations || [];
    const newReportList = newReports || [];

    // Check if we have enough new data to justify an update
    if (!forceUpdate && newConvoList.length + newReportList.length < MIN_NEW_ITEMS_FOR_UPDATE) {
      return Response.json({
        updated: false,
        reason: `Apenas ${newConvoList.length} conversas e ${newReportList.length} relatórios novos. Mínimo necessário: ${MIN_NEW_ITEMS_FOR_UPDATE}.`,
        newItems: {
          conversations: newConvoList.length,
          reports: newReportList.length,
        },
        masterReport: existingMaster || null,
      });
    }

    // Get ALL historical data for context (not just new items)
    const { data: allConversations } = await sb
      .from('conversations_852')
      .select('id, messages, title, created_at, message_count')
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: allReports } = await sb
      .from('reports_852')
      .select('id, messages, review_data, created_at')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
      .limit(100);

    const convoList = allConversations || [];
    const reportList = allReports || [];

    if (convoList.length === 0) {
      return Response.json({
        updated: false,
        reason: 'Sem conversas para analisar.',
      });
    }

    // Build analysis context
    const convoText = convoList.slice(0, 20).map((c, i) => {
      const msgs = typeof c.messages === 'string' ? JSON.parse(c.messages) : c.messages;
      const text = msgs.map((m: { role: string; content: string }) =>
        `[${m.role === 'user' ? 'POLICIAL' : 'AGENTE 852'}]: ${m.content.slice(0, 500)}`
      ).join('\n');
      return `--- CONVERSA ${i + 1} (${c.created_at?.slice(0, 10)}) ---\n${text}`;
    }).join('\n\n');

    const reviewText = reportList
      .filter(r => r.review_data)
      .slice(0, 15)
      .map((r, i) => {
        const rd = r.review_data as Record<string, unknown>;
        return `--- REVISÃO IA ${i + 1} ---\nResumo: ${rd.resumo || 'N/A'}\nTemas: ${Array.isArray(rd.temas) ? rd.temas.join(', ') : 'N/A'}`;
      }).join('\n\n');

    // Detect patterns
    const reportReviewsMap = new Map(reportList.map(r => [r.id, r.review_data as Record<string, unknown>]));
    const crossPatterns = detectCrossReportPatterns(
      convoList.map(c => ({
        id: String(c.id || 'unknown'),
        messages: Array.isArray(c.messages) ? c.messages : (typeof c.messages === 'string' ? JSON.parse(c.messages) : []),
        created_at: String(c.created_at || ''),
      })),
      reportReviewsMap
    );
    const patternDescription = describePatterns(crossPatterns);

    // Get cumulative stats
    const cumulativeStats = existingMaster ? {
      totalConversations: existingMaster.total_conversations_all_time,
      totalReports: existingMaster.total_reports_all_time,
      previousInsights: existingMaster.cumulative_insights || [],
    } : null;

    const userMessage = `Analise TODOS os dados acumulados do sistema 852 Inteligência:

## ESTATÍSTICAS CUMULATIVAS
${cumulativeStats ? `- Total conversas desde início: ${cumulativeStats.totalConversations}\n- Total relatórios desde início: ${cumulativeStats.totalReports}\n- Versão do relatório: ${existingMaster.version + 1}` : '- Primeira versão do relatório master'}

## NOVOS DADOS DESTA ATUALIZAÇÃO
- ${newConvoList.length} novas conversas
- ${newReportList.length} novos relatórios

## PADRÕES CRUZADOS (v2)
${patternDescription}

## CONVERSAS RECENTES (últimas 20)
${convoText}

## REVISÕES RECENTES (últimas 15)
${reviewText}

Gere um RELATÓRIO MASTER ÚNICO que:
1. Agregue insights de TODO o histórico
2. Destaque NOVOS padrões desde a última versão
3. Mantenha visão cumulativa (não apenas últimos dias)
4. Categorize por: infraestrutura, efetivo, tecnologia, bem-estar, processos
5. Inclua métricas operacionais totais

Responda em JSON.`.trim();

    const { provider, modelId, providerLabel, pricing } = getModelConfig('intelligence_report');
    const startTime = Date.now();

    const result = await generateText({
      model: provider.chat(modelId),
      system: buildIntelligenceReportPrompt(),
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.3,
    });

    const durationMs = Date.now() - startTime;

    // Parse JSON
    let reportJson;
    try {
      let text = result.text.trim();
      const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) text = fenceMatch[1].trim();
      reportJson = JSON.parse(text);
    } catch {
      console.error('[852-master-report] JSON parse failed');
      return Response.json({ error: 'Falha ao parsear resposta da IA' }, { status: 500 });
    }

    // Apply weighting
    if (Array.isArray(reportJson.insights) && reportJson.insights.length > 0) {
      try {
        const weightedInsights = applyInsightWeighting(reportJson.insights);
        reportJson.insights = weightedInsights.map(i => ({
          ...i,
          _weight_metadata: {
            category_weight: i.weight,
            severity_score: i.severidade_score,
            final_score: i.final_score
          }
        }));
      } catch (error) {
        console.error('[852-master-report] Weighting failed:', error);
      }
    }

    // Calculate cost
    const usage = result.usage as unknown as Record<string, number>;
    const tokensIn = usage?.promptTokens || usage?.inputTokens || 0;
    const tokensOut = usage?.completionTokens || usage?.outputTokens || 0;
    const costUsd = (tokensIn / 1000) * pricing.input + (tokensOut / 1000) * pricing.output;

    // Build HTML
    const contentHtml = buildMasterReportHtml(reportJson, {
      model: modelId,
      provider: providerLabel,
      costUsd,
      tokensIn,
      tokensOut,
      durationMs,
      totalConversations: convoList.length + (existingMaster?.total_conversations_all_time || 0),
      totalReports: reportList.length + (existingMaster?.total_reports_all_time || 0),
      newConversations: newConvoList.length,
      newReports: newReportList.length,
      version: (existingMaster?.version || 0) + 1,
    });

    // Save or update master report
    const lastConvo = convoList[0];
    const lastReport = reportList[0];

    let masterId: string;

    if (existingMaster) {
      // Update existing master
      const { error: updateError } = await sb
        .from('ai_reports_852')
        .update({
          content_html: contentHtml,
          content_summary: reportJson.resumo_executivo?.slice(0, 500) || null,
          insights: reportJson.insights || null,
          total_conversations_all_time: existingMaster.total_conversations_all_time + newConvoList.length,
          total_reports_all_time: existingMaster.total_reports_all_time + newReportList.length,
          last_synced_conversation_id: lastConvo?.id || existingMaster.last_synced_conversation_id,
          last_synced_report_id: lastReport?.id || existingMaster.last_synced_report_id,
          cumulative_insights: [...(existingMaster.cumulative_insights || []), ...(reportJson.insights || [])].slice(0, 50),
          version: (existingMaster.version || 1) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingMaster.id);

      if (updateError) {
        console.error('[852-master-report] Update error:', updateError);
        return Response.json({ error: 'Falha ao atualizar master report' }, { status: 500 });
      }

      masterId = existingMaster.id;
    } else {
      // Create new master
      const { data: newMaster, error: insertError } = await sb
        .from('ai_reports_852')
        .insert({
          trigger_type: 'master_initial',
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
          is_master_report: true,
          total_conversations_all_time: convoList.length,
          total_reports_all_time: reportList.length,
          last_synced_conversation_id: lastConvo?.id,
          last_synced_report_id: lastReport?.id,
          cumulative_insights: reportJson.insights || [],
          version: 1,
        })
        .select('id')
        .single();

      if (insertError || !newMaster) {
        console.error('[852-master-report] Insert error:', insertError);
        return Response.json({ error: 'Falha ao criar master report' }, { status: 500 });
      }

      masterId = newMaster.id;
    }

    // Record telemetry
    recordEvent({
      event_type: 'master_intelligence_report_updated',
      model_id: modelId,
      provider: providerLabel,
      cost_usd: costUsd,
      metadata: {
        masterId,
        version: (existingMaster?.version || 0) + 1,
        newConversations: newConvoList.length,
        newReports: newReportList.length,
        totalConversations: convoList.length + (existingMaster?.total_conversations_all_time || 0),
        totalReports: reportList.length + (existingMaster?.total_reports_all_time || 0),
      },
    });

    return Response.json({
      updated: true,
      masterId,
      version: (existingMaster?.version || 0) + 1,
      stats: {
        newConversations: newConvoList.length,
        newReports: newReportList.length,
        totalConversations: convoList.length + (existingMaster?.total_conversations_all_time || 0),
        totalReports: reportList.length + (existingMaster?.total_reports_all_time || 0),
      },
      cost: { usd: costUsd, tokensIn, tokensOut },
    });
  } catch (error) {
    console.error('[852-master-report] error:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}

function buildMasterReportHtml(
  report: Record<string, unknown>,
  meta: {
    model: string;
    provider: string;
    costUsd: number;
    tokensIn: number;
    tokensOut: number;
    durationMs: number;
    totalConversations: number;
    totalReports: number;
    newConversations: number;
    newReports: number;
    version: number;
  }
): string {
  const insights = Array.isArray(report.insights) ? report.insights : [];
  const patterns = Array.isArray(report.padroes_detectados) ? report.padroes_detectados : [];
  const recommendations = Array.isArray(report.recomendacoes) ? report.recomendacoes : [];

  return `
<article class="ai-report master-report">
  <header class="master-header">
    <div class="version-badge">v${meta.version}</div>
    <h1>📊 Relatório de Inteligência Geral — 852</h1>
    <p class="subtitle">Visão cumulativa de todas as operações desde o início do sistema</p>
    <div class="meta">
      <span class="ai-badge">🤖 Gerado por IA</span>
      <span class="model">${meta.model}</span>
      <span class="cost">$${meta.costUsd.toFixed(4)}</span>
    </div>
  </header>

  <section class="cumulative-stats">
    <h2>Estatísticas Cumulativas</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-number">${meta.totalConversations}</span>
        <span class="stat-label">Conversas Totais</span>
        ${meta.newConversations > 0 ? `<span class="stat-new">+${meta.newConversations} novas</span>` : ''}
      </div>
      <div class="stat-card">
        <span class="stat-number">${meta.totalReports}</span>
        <span class="stat-label">Relatórios Totais</span>
        ${meta.newReports > 0 ? `<span class="stat-new">+${meta.newReports} novos</span>` : ''}
      </div>
      <div class="stat-card">
        <span class="stat-number">${insights.length}</span>
        <span class="stat-label">Insights Gerados</span>
      </div>
    </div>
  </section>

  <section class="summary">
    <h2>Resumo Executivo</h2>
    <p>${report.resumo_executivo || 'N/A'}</p>
  </section>

  ${insights.length > 0 ? `
  <section class="insights">
    <h2>Insights por Categoria</h2>
    <div class="insights-grid">
    ${insights.map((ins: Record<string, string>) => `
      <div class="insight-card insight-${ins.severidade || 'media'}">
        <div class="insight-header">
          <span class="category-tag">${ins.categoria || 'geral'}</span>
          <span class="severity-badge ${ins.severidade || 'media'}">${ins.severidade || 'media'}</span>
        </div>
        <h3>${ins.titulo || 'Insight'}</h3>
        <p>${ins.descricao || ''}</p>
        ${ins.evidencias ? `<blockquote>${ins.evidencias}</blockquote>` : ''}
      </div>
    `).join('')}
    </div>
  </section>
  ` : ''}

  ${patterns.length > 0 ? `
  <section class="patterns">
    <h2>Padrões Detectados</h2>
    <ul class="patterns-list">
      ${patterns.map((p: string) => `<li>${p}</li>`).join('')}
    </ul>
  </section>
  ` : ''}

  ${recommendations.length > 0 ? `
  <section class="recommendations">
    <h2>Recomendações Estratégicas</h2>
    <ol class="recommendations-list">
      ${recommendations.map((r: string) => `<li>${r}</li>`).join('')}
    </ol>
  </section>
  ` : ''}

  <footer class="report-footer">
    <p>Relatório Master v${meta.version} • Atualizado em ${new Date().toLocaleDateString('pt-BR')}</p>
    <p class="next-update">Próxima atualização automática: quando +3 novos itens forem adicionados</p>
  </footer>
</article>
<style>
.master-report { max-width: 900px; margin: 0 auto; }
.master-header { text-align: center; margin-bottom: 2rem; }
.version-badge { 
  display: inline-block; 
  background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
  color: white; 
  padding: 0.25rem 0.75rem; 
  border-radius: 999px; 
  font-size: 0.875rem; 
  font-weight: 600;
  margin-bottom: 1rem;
}
.subtitle { color: #94a3b8; font-size: 1rem; }
.cumulative-stats { 
  background: linear-gradient(135deg, #0f172a, #1e293b); 
  padding: 1.5rem; 
  border-radius: 12px; 
  margin-bottom: 2rem;
  border: 1px solid #334155;
}
.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.stat-card { text-align: center; padding: 1rem; }
.stat-number { display: block; font-size: 2.5rem; font-weight: 700; color: #60a5fa; }
.stat-label { display: block; font-size: 0.875rem; color: #94a3b8; margin-top: 0.25rem; }
.stat-new { display: inline-block; font-size: 0.75rem; color: #22c55e; background: rgba(34, 197, 94, 0.1); padding: 0.125rem 0.5rem; border-radius: 999px; margin-top: 0.5rem; }
.insights-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
.insight-card { 
  background: #1e293b; 
  padding: 1rem; 
  border-radius: 8px; 
  border-left: 4px solid #3b82f6;
}
.insight-card.insight-alta { border-left-color: #ef4444; }
.insight-card.insight-media { border-left-color: #f59e0b; }
.insight-card.insight-baixa { border-left-color: #22c55e; }
.insight-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.category-tag { font-size: 0.75rem; color: #60a5fa; text-transform: uppercase; letter-spacing: 0.05em; }
.severity-badge { font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 4px; }
.severity-badge.alta { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
.severity-badge.media { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
.severity-badge.baixa { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
.report-footer { 
  margin-top: 2rem; 
  padding-top: 1rem; 
  border-top: 1px solid #334155; 
  text-align: center; 
  color: #64748b; 
  font-size: 0.875rem; 
}
.next-update { font-size: 0.75rem; color: #475569; margin-top: 0.5rem; }
</style>
`.trim();
}
