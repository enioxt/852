import { verifyEmailToken } from '@/lib/user-auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token') || '';
    const result = await verifyEmailToken(token);
    return Response.json(result, { status: result.status === 'error' ? 500 : 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return Response.json({ status: 'error', error: msg }, { status: 500 });
  }
}
