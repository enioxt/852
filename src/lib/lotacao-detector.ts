/**
 * Lotação Detector — 852 Inteligência
 *
 * Detects and extracts police station/department (lotação) mentions
 * from user messages for auto-linking to user profile.
 */

import { getSupabase } from './supabase';

export interface LotaçãoMatch {
  rawText: string;
  normalizedName: string;
  confidence: number; // 0-1
  type: 'delegacia' | 'departamento' | 'divisão' | 'seção' | 'unidade';
}

// Common patterns for police units in MG
const LOTACAO_PATTERNS = [
  // Delegacias
  /(?:delegacia|delegacia\s+de|d[ep]\s+)([\w\s]+?)(?:\s+(?:de|da|do)\s+)?([\w\s]+)/i,
  /(?:dh|dipo|deam|drci|depol|dcpc|drex|dccm|dicrim|dpc|dpca|dpma|dprc|dsap)\s+([\w\s]+)/i,
  // Departamentos
  /(?:departamento|departamento\s+de|dep\s+)([\w\s]+)/i,
  // Divisões
  /(?:divisão|divisão\s+de|div\s+)([\w\s]+)/i,
  // Seções
  /(?:seção|secao|seção\s+de|sec\s+)([\w\s]+)/i,
  // Generic "trabalho em" / "lotado em"
  /(?:trabalho|trabalhar|lotado|lotação)\s+(?:em|na|no)\s+([\w\s]+)/i,
];

// Known police units for validation (subset of common ones)
const KNOWN_UNITS = [
  'dh', 'dipo', 'deam', 'drci', 'depol', 'dcpc', 'drex', 'dccm', 'dicrim',
  'dpc', 'dpca', 'dpma', 'dprc', 'dsap', 'ic', 'iml', 'goc', 'cope',
  '1ª delegacia', '2ª delegacia', '3ª delegacia', '4ª delegacia', '5ª delegacia',
  'delegacia de homicídios', 'delegacia de invest. sobre pessoas',
  'delegacia da mulher', 'delegacia de crimes contra a vida',
];

/**
 * Detect lotação mentions in user message
 */
export function detectLotacao(text: string): LotaçãoMatch | null {
  const normalized = text.toLowerCase();

  for (const pattern of LOTACAO_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      // Extract the captured group (the lotação name)
      const rawText = match[1] || match[0];
      const normalizedName = normalizeLotacaoName(rawText);

      // Calculate confidence based on pattern match quality
      let confidence = 0.6; // base confidence

      // Boost confidence if matches known units
      if (KNOWN_UNITS.some(unit => normalizedName.includes(unit))) {
        confidence = 0.9;
      }

      // Boost if explicit lotação words are used
      if (/lotado|lotação|trabalho em/i.test(text)) {
        confidence = Math.min(0.95, confidence + 0.1);
      }

      return {
        rawText: rawText.trim(),
        normalizedName,
        confidence,
        type: inferLotacaoType(normalizedName),
      };
    }
  }

  return null;
}

/**
 * Normalize lotação name for storage
 */
function normalizeLotacaoName(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Infer the type of lotação
 */
function inferLotacaoType(normalizedName: string): LotaçãoMatch['type'] {
  if (/delegacia|dh|d[ep]\s+\d/.test(normalizedName)) return 'delegacia';
  if (/departamento|depol|dipo/.test(normalizedName)) return 'departamento';
  if (/divisão|div|dicrim|drci/.test(normalizedName)) return 'divisão';
  if (/seção|sec/.test(normalizedName)) return 'seção';
  return 'unidade';
}

/**
 * Check if we should ask user to confirm lotação
 */
export function shouldAskForLotacaoConfirmation(
  detectedLotacao: LotaçãoMatch,
  userMessageCount: number
): boolean {
  // Only ask on early messages (first 3)
  if (userMessageCount > 3) return false;

  // Only ask if confidence is medium-high but not certain
  return detectedLotacao.confidence >= 0.6 && detectedLotacao.confidence < 0.95;
}

/**
 * Generate confirmation prompt for detected lotação
 */
export function generateLotacaoConfirmationPrompt(detected: LotaçãoMatch): string {
  const suggestions = [
    `Você mencionou "${detected.rawText}". Posso vincular isso ao seu perfil como sua lotação atual?`,
    `Entendi que você está em "${detected.rawText}". Posso salvar essa informação no seu perfil?`,
    `Detectei que você trabalha em "${detected.rawText}". Posso registrar isso no seu perfil para personalizar as respostas?`,
  ];

  // Pick based on confidence
  if (detected.confidence > 0.8) {
    return suggestions[0];
  } else if (detected.confidence > 0.7) {
    return suggestions[1];
  }
  return suggestions[2];
}

/**
 * Save lotação to user profile
 */
export async function saveUserLotacao(
  userId: string,
  lotacao: string
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb
    .from('users_852')
    .update({
      lotacao: lotacao,
      lotacao_updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('[lotacao] save error:', error);
    return false;
  }

  return true;
}

/**
 * Get user's saved lotação
 */
export async function getUserLotacao(userId: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('users_852')
    .select('lotacao')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data.lotacao || null;
}
