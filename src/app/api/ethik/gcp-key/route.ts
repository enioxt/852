import { NextResponse } from 'next/server';
import { getGcpRoleManager } from '@/lib/gcp-keys';
import { getEthikAgent } from '@/lib/ethik-agent';

// Exemplo de Preço da API Key Temporária
const KEY_PRICE_USD = 0.50; // $0.50 for a temporary Gemini API Key 

export async function POST(req: Request) {
  try {
    const paymentHeader = req.headers.get('x-payment-proof');
    
    // 1. x402 Challenge (Se não pagou, retorna 402)
    if (!paymentHeader) {
      return NextResponse.json(
        { 
          error: 'Payment Required',
          message: 'To generate an ephemeral GCP API Key, please provide USDC payment proof.',
          x402: {
            price: KEY_PRICE_USD,
            token: 'USDC',
            chain: 'base',
            recipient: '0x7f43b82a000a1977cc355c6e7ece166dfbb885ab', // Placeholder for ETHIK vault
          }
        },
        { status: 402 } // HTTP 402 Payment Required
      );
    }

    // 2. Validate Payment (mock para demonstração)
    console.log(`[x402] Verifying payment proof: ${paymentHeader}`);
    const rxHash = paymentHeader.trim(); // in real life, verify via RPC and EIP-712
    
    // 3. Registrar Transação no Agente ETHIK
    const ethik = getEthikAgent();
    await ethik.recordPayment({
      tx_hash: rxHash,
      chain: 'base',
      token: 'USDC',
      amount_raw: (KEY_PRICE_USD * 1e6).toString(), 
      amount_usd: KEY_PRICE_USD,
      payer_address: '0xClientAddress...', // extrair do proof
      api_endpoint: '/api/ethik/gcp-key',
    });

    // 4. Gerar a Chave Restrita do GCP 
    const gcpManager = getGcpRoleManager();
    const apiKey = await gcpManager.createEphemeralKey(KEY_PRICE_USD, ['generativelanguage.googleapis.com']);

    // 5. Retornar a chave efêmera
    return NextResponse.json({
      success: true,
      message: 'Payment verified. Ephemeral GCP API Key generated.',
      key: apiKey,
      validFor: `${Math.max(10, Math.floor(KEY_PRICE_USD * 10 * 60))} minutes`,
      restrictions: ['generativelanguage.googleapis.com']
    });

  } catch (error: any) {
    console.error('[ETHIK] /api/ethik/gcp-key error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
