import { generateText } from 'ai';
import { getModelConfig } from '@/lib/ai-provider';
import { recordEvent } from '@/lib/telemetry';
import { buildEspiralDeEscutaPrompt } from '@/lib/prompt';
import { getSupabase, addIssueComment } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { issueId } = await req.json();
    if (!issueId) return Response.json({ error: 'issueId obrigatório' }, { status: 400 });

    const sb = getSupabase();
    if (!sb) return Response.json({ error: 'Supabase não configurado' }, { status: 503 });

    // 1. Fetch issue details
    const { data: issue, error: issueError } = await sb
      .from('issues_852')
      .select('*')
      .eq('id', issueId)
      .single();

    if (issueError || !issue) {
      return Response.json({ error: 'Issue não encontrada' }, { status: 404 });
    }

    // 2. Fetch comments (to understand why it was rejected)
    const { data: comments, error: commentsError } = await sb
      .from('issue_comments_852')
      .select('*')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true });

    if (commentsError) {
      return Response.json({ error: 'Falha ao buscar comentários' }, { status: 500 });
    }

    // 3. Prepare the analysis context
    const commentsText = (comments || [])
      .map((c, i) => `[Comentário ${i + 1}]: ${c.body}`)
      .join('\n');

    const contextText = `
TÍTULO DA ISSUE: ${issue.title}
DESCRIÇÃO ORIGINAL: ${issue.body || 'Sem descrição.'}
VOTOS: ${issue.votes} favoráveis, ${issue.downvotes || 0} contrários.
STATUS ATUAL: ${issue.status}

COMENTÁRIOS DA COMUNIDADE:
${commentsText || 'Nenhum comentário registrado ainda, mas a taxa de rejeição via votos é alta.'}
`.trim();

    // 4. Call LLM for re-analysis
    const { provider, modelId, providerLabel } = getModelConfig('intelligence_report');
    
    const result = await generateText({
      model: provider.chat(modelId),
      system: buildEspiralDeEscutaPrompt(),
      messages: [
        { 
          role: 'user', 
          content: `Realize a re-análise crítica deste tópico com base na rejeição observada:\n\n${contextText}` 
        }
      ],
      temperature: 0.4,
    });

    const analysisText = result.text.trim();

    // 5. Post the AI comment
    const commentId = await addIssueComment(
      issueId, 
      `### 🌀 Espiral de Escuta: Re-análise Crítica [AGENTE 852]\n\n${analysisText}\n\n---\n*Esta re-análise foi disparada automaticamente devido ao alto índice de divergência da comunidade (Approval Rating < 85%).*`,
      true // isAi
    );

    // 6. Record event
    recordEvent({
      event_type: 'issue_commented', // or similar
      metadata: {
        issueId,
        commentId,
        isEspiralDeEscuta: true,
        modelId,
        provider: providerLabel
      }
    });

    return Response.json({ 
      success: true, 
      commentId,
      analysis: analysisText 
    });

  } catch (error) {
    console.error('[852-espiral] error:', error);
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ error: msg }, { status: 500 });
  }
}
