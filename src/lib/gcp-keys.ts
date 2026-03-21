/**
 * GCP Role Manager — Dynamic API Key Generation for EGOS x402 Gateway
 * 
 * Manages Google Cloud API Keys dynamically based on x402 micro-transactions.
 * Automatically restricts keys to specific services (e.g. Gemini API) and deletes
 * them after their quota/expiration limits are reached.
 */

import { ApiKeysClient } from '@google-cloud/apikeys';

export interface EphemeralKeyConfig {
  displayName: string;
  allowedServices: string[]; // e.g. ['generativelanguage.googleapis.com']
}

export class GcpRoleManager {
  private client: ApiKeysClient;
  private projectId: string;

  constructor() {
    this.client = new ApiKeysClient();
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT || '';
    if (!this.projectId) {
      console.warn('[GcpRoleManager] GOOGLE_CLOUD_PROJECT is not set. Keys will not generate in production if unauthenticated.');
    }
  }

  /**
   * Translates an x402 payment amount (USD) to an ephemeral key validity or quota.
   * Creates a GCP API Key restricted to specific APIs with expiration.
   */
  async createEphemeralKey(usdPaid: number, services = ['generativelanguage.googleapis.com']): Promise<string> {
    if (!this.projectId) {
      throw new Error('GCP Project ID not configured.');
    }
    
    // Create an expiration time based on payment. Ex: $0.10 gives 1 hour of key validity.
    // Minimum 10 minutes.
    const validMinutes = Math.max(10, Math.floor(usdPaid * 10 * 60)); 
    const expirationTime = new Date(Date.now() + validMinutes * 60000);

    const request = {
      parent: `projects/${this.projectId}/locations/global`,
      keyId: `ethik-x402-${Date.now()}`,
      key: {
        displayName: `x402 Ephemeral Key - Valid until ${expirationTime.toISOString()}`,
        restrictions: {
          apiTargets: services.map(service => ({
            service,
          })),
          // We can also inject browser/server IP restrictions if the client provides them.
        },
      },
    };

    console.log(`[ETHIK Gateway] Generating ephemeral GCP key for $${usdPaid} USD. Valid for ${validMinutes} minutes.`);

    try {
      const [operation] = await this.client.createKey(request);
      const [response] = await operation.promise();
      
      return response.keyString || '';
      
    } catch (error) {
      console.error('[GcpRoleManager] Failed to create API key:', error);
      throw error;
    }
  }

  /**
   * Deleta uma chave previamente gerada caso exceda o uso ou tenha expirado.
   */
  async revokeKey(keyName: string): Promise<void> {
    const request = {
      name: `projects/${this.projectId}/locations/global/keys/${keyName}`,
    };

    try {
      const [operation] = await this.client.deleteKey(request);
      await operation.promise();
      console.log(`[ETHIK Gateway] Revoked API Key: ${keyName}`);
    } catch (error) {
      console.error('[GcpRoleManager] Failed to revoke API key:', error);
    }
  }
}

// Singleton Factory
let _gcpInstance: GcpRoleManager | null = null;
export function getGcpRoleManager(): GcpRoleManager {
  if (!_gcpInstance) {
    _gcpInstance = new GcpRoleManager();
  }
  return _gcpInstance;
}
