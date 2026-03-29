/**
 * AES-256-GCM encrypt/decrypt for app_config_852 table values.
 * Uses CONFIG_ENCRYPTION_KEY from process.env.
 * If key is missing, values are stored as plaintext with a warning.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const KEY_LEN = 32; // 256-bit

function getKey(): Buffer {
  const raw = process.env.CONFIG_ENCRYPTION_KEY || '';
  if (!raw) {
    console.warn('[crypto-config] CONFIG_ENCRYPTION_KEY not set — config stored unencrypted');
  }
  // Pad or truncate to exactly 32 bytes
  return Buffer.from(raw.padEnd(KEY_LEN, '0').slice(0, KEY_LEN));
}

/** Encrypt a plaintext string. Returns "iv:authTag:ciphertext" (all base64). */
export function encryptConfig(plain: string): string {
  const iv = randomBytes(12); // 96-bit IV recommended for GCM
  const key = getKey();
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

/** Decrypt a value produced by encryptConfig. Returns null on failure. */
export function decryptConfig(encoded: string): string | null {
  try {
    const parts = encoded.split(':');
    // Handle legacy plaintext (no colons in expected position)
    if (parts.length !== 3) return encoded; // treat as raw plaintext
    const [ivB64, tagB64, ctB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const ct = Buffer.from(ctB64, 'base64');
    const key = getKey();
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

/** Returns true if a stored value looks like an encrypted blob (iv:tag:ct). */
export function isEncryptedValue(value: string): boolean {
  const parts = value.split(':');
  return parts.length === 3 && parts.every(p => p.length > 0);
}
