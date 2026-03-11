import { generateNicknames } from '@/lib/nickname-generator';

export async function GET() {
  const nicknames = generateNicknames(5);
  return Response.json({ nicknames });
}
