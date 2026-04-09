/**
 * BYOK Manager — Bring Your Own API Key
 *
 * Allows users to use their own API keys for AI providers.
 * Supports: OpenAI, Anthropic (Claude), Google (Gemini)
 */

import { getSupabase } from './supabase';
import { createOpenAI } from '@ai-sdk/openai';

export type SupportedProvider = 'openai' | 'anthropic' | 'google';

export interface UserApiKey {
  id: string;
  userId: string;
  provider: SupportedProvider;
  keyHash: string; // Hashed key for storage (we don't store plaintext)
  keyPreview: string; // Last 4 chars for display: "sk-...abcd"
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  label?: string;
}

export interface ByokConfig {
  provider: SupportedProvider;
  apiKey: string;
  label?: string;
}

// Hash function for API keys (simple hash for identification, not encryption)
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate preview of API key (e.g., "sk-...abcd")
 */
export function generateKeyPreview(key: string): string {
  if (key.length <= 8) return '*'.repeat(key.length);
  const prefix = key.slice(0, 3);
  const suffix = key.slice(-4);
  return `${prefix}...${suffix}`;
}

/**
 * Validate API key format for different providers
 */
export function validateApiKey(provider: SupportedProvider, key: string): { valid: boolean; error?: string } {
  switch (provider) {
    case 'openai':
      // OpenAI keys start with "sk-" and are 51 chars
      if (!key.startsWith('sk-')) {
        return { valid: false, error: 'Chave OpenAI deve começar com "sk-"' };
      }
      if (key.length < 40) {
        return { valid: false, error: 'Chave OpenAI parece incompleta' };
      }
      return { valid: true };

    case 'anthropic':
      // Anthropic keys start with "sk-ant-" 
      if (!key.startsWith('sk-ant-')) {
        return { valid: false, error: 'Chave Anthropic deve começar com "sk-ant-"' };
      }
      return { valid: true };

    case 'google':
      // Google AI Studio keys are typically longer
      if (key.length < 20) {
        return { valid: false, error: 'Chave Google parece incompleta' };
      }
      return { valid: true };

    default:
      return { valid: false, error: 'Provedor não suportado' };
  }
}

/**
 * Save user's API key
 */
export async function saveUserApiKey(
  userId: string,
  config: ByokConfig
): Promise<{ success: boolean; error?: string; keyId?: string }> {
  // Validate key format
  const validation = validateApiKey(config.provider, config.apiKey);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const sb = getSupabase();
  if (!sb) return { success: false, error: 'Supabase não configurado' };

  // Hash the key for storage reference
  const keyHash = await hashApiKey(config.apiKey);
  const keyPreview = generateKeyPreview(config.apiKey);

  // Check if user already has a key for this provider
  const { data: existing } = await sb
    .from('user_api_keys_852')
    .select('id')
    .eq('user_id', userId)
    .eq('provider', config.provider)
    .single();

  if (existing?.id) {
    // Update existing
    const { error } = await sb
      .from('user_api_keys_852')
      .update({
        key_hash: keyHash,
        key_preview: keyPreview,
        updated_at: new Date().toISOString(),
        label: config.label || null,
      })
      .eq('id', existing.id);

    if (error) {
      console.error('[byok] update error:', error);
      return { success: false, error: 'Erro ao atualizar chave' };
    }

    return { success: true, keyId: existing.id };
  }

  // Insert new
  const { data, error } = await sb
    .from('user_api_keys_852')
    .insert({
      user_id: userId,
      provider: config.provider,
      key_hash: keyHash,
      key_preview: keyPreview,
      is_active: true,
      label: config.label || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[byok] insert error:', error);
    return { success: false, error: 'Erro ao salvar chave' };
  }

  return { success: true, keyId: data?.id };
}

/**
 * Get user's saved API keys
 */
export async function getUserApiKeys(userId: string): Promise<Omit<UserApiKey, 'keyHash'>[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('user_api_keys_852')
    .select('id, user_id, provider, key_preview, is_active, created_at, updated_at, label')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[byok] get error:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    provider: row.provider as SupportedProvider,
    keyPreview: row.key_preview,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    label: row.label,
  }));
}

/**
 * Delete user's API key
 */
export async function deleteUserApiKey(userId: string, keyId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb
    .from('user_api_keys_852')
    .delete()
    .eq('id', keyId)
    .eq('user_id', userId); // Security: ensure user owns this key

  if (error) {
    console.error('[byok] delete error:', error);
    return false;
  }

  return true;
}

/**
 * Check if user has BYOK enabled for chat
 */
export async function hasUserEnabledByok(userId: string): Promise<{ enabled: boolean; provider?: SupportedProvider }> {
  const sb = getSupabase();
  if (!sb) return { enabled: false };

  const { data } = await sb
    .from('user_api_keys_852')
    .select('provider')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (!data) return { enabled: false };
  return { enabled: true, provider: data.provider as SupportedProvider };
}

/**
 * Create AI provider instance from user's API key
 * Note: This requires the actual API key from client-side or secure storage
 */
export function createUserProvider(provider: SupportedProvider, apiKey: string) {
  switch (provider) {
    case 'openai':
      return createOpenAI({ apiKey });
    // Note: For Anthropic and Google, we'd need their respective SDK adapters
    // This is simplified for the core OpenAI-compatible interface
    default:
      throw new Error(`Provider ${provider} not yet implemented for BYOK`);
  }
}
