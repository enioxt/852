/**
 * Conversation Insight API — 852 Inteligência
 *
 * Returns insight analysis for a specific conversation.
 */

import { getCurrentUser } from '@/lib/user-auth';
import { getSupabase } from '@/lib/supabase';
import { analyzeConversation } from '@/lib/cross-conversation-analyzer';
import { recordEvent } from '@/lib/telemetry';

/**
 * GET /api/insights/conversation?conversationId=xxx
 * Get insight analysis for a specific conversation
 */
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    // Allow anonymous but track

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return Response.json(
        { error: 'conversationId é obrigatório' },
        { status: 400 }
      );
    }

    const sb = getSupabase();
    if (!sb) {
      return Response.json(
        { error: 'Supabase não configurado' },
        { status: 503 }
      );
    }

    // Fetch conversation
    const { data: conversation, error } = await sb
      .from('conversations_852')
      .select('id, messages, user_id, lotacao, created_at')
      .eq('id', conversationId)
      .single();

    if (error || !conversation) {
      return Response.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      );
    }

    // Parse messages
    const messages = typeof conversation.messages === 'string'
      ? JSON.parse(conversation.messages)
      : conversation.messages || [];

    // Analyze
    const insight = analyzeConversation(conversation.id, messages, {
      userId: conversation.user_id,
      lotacao: conversation.lotacao,
      createdAt: conversation.created_at,
    });

    // Record telemetry
    recordEvent({
      event_type: 'conversation_insight_viewed',
      metadata: {
        conversationId,
        userId: user?.id,
        themes: insight.themes,
      },
    });

    return Response.json({
      success: true,
      insight,
    });
  } catch (error) {
    console.error('[api/insights/conversation] error:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}
