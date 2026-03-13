/**
 * 🛡️ AI Name Validator — 852 Inteligência
 *
 * Uses Gemini 2.0 Flash via OpenRouter to detect real person names.
 * Blocks real names and suggests anonymous alternatives.
 */

import { generateText } from 'ai';
import { getModelConfig } from './ai-provider';
import { generateNicknames } from './nickname-generator';
import { buildNameValidationPrompt } from './prompt';

export interface NameValidationResult {
  valid: boolean;
  reason?: string;
  suggestions?: string[];
}

export async function validateDisplayName(name: string): Promise<NameValidationResult> {
  const trimmed = name.trim();

  if (trimmed.length < 3) {
    return { valid: false, reason: 'Nome muito curto (mínimo 3 caracteres)' };
  }
  if (trimmed.length > 30) {
    return { valid: false, reason: 'Nome muito longo (máximo 30 caracteres)' };
  }

  const words = trimmed.split(/\s+/);
  const looksLikeFullName =
    words.length >= 2 &&
    words.every(w => /^[A-ZÀ-Ú]/.test(w) && w.length >= 2);

  if (!looksLikeFullName) {
    return { valid: true };
  }

  try {
    const config = getModelConfig('name_validation');
    const { text } = await generateText({
      model: config.provider(config.modelId),
      system: buildNameValidationPrompt(),
      prompt: `Texto para classificar: "${trimmed}". Responda apenas com JSON válido.`,
      temperature: 0,
    });

    const cleaned = text.replace(/```json\s*|\s*```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.isRealName && parsed.confidence > 0.6) {
      return {
        valid: false,
        reason: 'Para sua segurança, nomes reais não são permitidos. Use um codinome anônimo.',
        suggestions: generateNicknames(3),
      };
    }
  } catch {
    // AI failure should not block registration
  }

  return { valid: true };
}
