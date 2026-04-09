/**
 * BYOK API — User API Key Management
 *
 * Endpoints for users to manage their own API keys.
 */

import { getCurrentUser } from '@/lib/user-auth';
import {
  saveUserApiKey,
  getUserApiKeys,
  deleteUserApiKey,
  validateApiKey,
  type SupportedProvider,
} from '@/lib/byok-manager';
import { recordEvent } from '@/lib/telemetry';

/**
 * POST /api/user/byok
 * Save or update user's API key
 */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { provider, apiKey, label, action } = body;

    if (action === 'delete' && body.keyId) {
      // Delete key
      const deleted = await deleteUserApiKey(user.id, body.keyId);
      if (!deleted) {
        return Response.json({ error: 'Erro ao remover chave' }, { status: 500 });
      }

      recordEvent({
        event_type: 'user_byok_deleted',
        metadata: { userId: user.id, keyId: body.keyId },
      });

      return Response.json({ success: true, message: 'Chave removida com sucesso' });
    }

    // Validate input
    if (!provider || !apiKey) {
      return Response.json({ error: 'Provedor e chave API são obrigatórios' }, { status: 400 });
    }

    // Validate key format
    const validation = validateApiKey(provider as SupportedProvider, apiKey);
    if (!validation.valid) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    // Save key
    const result = await saveUserApiKey(user.id, {
      provider: provider as SupportedProvider,
      apiKey,
      label,
    });

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 500 });
    }

    recordEvent({
      event_type: 'user_byok_added',
      metadata: { userId: user.id, provider, hasLabel: !!label },
    });

    return Response.json({
      success: true,
      keyId: result.keyId,
      message: `Chave ${provider} salva com sucesso.`,
      warning: 'IMPORTANTE: Sua chave é usada apenas nas suas sessões. Nunca compartilhamos sua chave com outros usuários.',
    });
  } catch (error) {
    console.error('[api/user/byok] POST error:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * GET /api/user/byok
 * Get user's saved API keys
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const keys = await getUserApiKeys(user.id);

    return Response.json({
      keys,
      count: keys.length,
    });
  } catch (error) {
    console.error('[api/user/byok] GET error:', error);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}
