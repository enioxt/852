/**
 * User Lotação API — 852 Inteligência
 *
 * Handles lotação detection, confirmation, and saving to user profile.
 */

import { getCurrentUser } from '@/lib/user-auth';
import {
  detectLotacao,
  saveUserLotacao,
  getUserLotacao,
  generateLotacaoConfirmationPrompt,
  shouldAskForLotacaoConfirmation,
} from '@/lib/lotacao-detector';
import { recordEvent } from '@/lib/telemetry';

/**
 * POST /api/user/lotacao
 * Detect lotação from text and optionally save it
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { text, confirm, lotacao } = body;

    // If confirming a previously detected lotação
    if (confirm && lotacao) {
      const saved = await saveUserLotacao(user.id, lotacao);
      if (!saved) {
        return Response.json({ error: 'Erro ao salvar lotação' }, { status: 500 });
      }

      recordEvent({
        event_type: 'user_lotacao_confirmed',
        metadata: { userId: user.id, lotacao },
      });

      return Response.json({
        success: true,
        lotacao,
        message: 'Lotação salva com sucesso no seu perfil.',
      });
    }

    // If just detecting from text
    if (text) {
      const detected = detectLotacao(text);

      if (!detected) {
        return Response.json({
          detected: false,
          message: 'Nenhuma lotação detectada no texto.',
        });
      }

      // Check if we should ask for confirmation
      const userMessageCount = body.messageCount || 1;
      const shouldConfirm = shouldAskForLotacaoConfirmation(detected, userMessageCount);

      // If confidence is very high and user has explicitly confirmed, auto-save
      if (detected.confidence >= 0.95 && body.autoConfirm) {
        await saveUserLotacao(user.id, detected.normalizedName);

        recordEvent({
          event_type: 'user_lotacao_auto_saved',
          metadata: { userId: user.id, lotacao: detected.normalizedName, confidence: detected.confidence },
        });

        return Response.json({
          detected: true,
          saved: true,
          lotacao: detected,
          message: `Lotação "${detected.rawText}" detectada e salva automaticamente.`,
        });
      }

      return Response.json({
        detected: true,
        lotacao: detected,
        shouldConfirm,
        confirmationPrompt: shouldConfirm ? generateLotacaoConfirmationPrompt(detected) : null,
        currentLotacao: await getUserLotacao(user.id),
      });
    }

    return Response.json({ error: 'Texto ou confirmação necessários' }, { status: 400 });
  } catch (error) {
    console.error('[api/user/lotacao] error:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * GET /api/user/lotacao
 * Get current user's saved lotação
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const lotacao = await getUserLotacao(user.id);

    return Response.json({
      lotacao,
      hasLotacao: !!lotacao,
    });
  } catch (error) {
    console.error('[api/user/lotacao] GET error:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}
