import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { agentPrompt } from '@/lib/prompt';

export const maxDuration = 30; // Allow up to 30 seconds for AI response

// Prefer Alibaba Qwen-plus via DashScope (as per EGOS rules), fallback to OpenAI/Gemini
const aiProvider = createOpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.DASHSCOPE_API_KEY ? 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1' : undefined,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: aiProvider(process.env.DASHSCOPE_API_KEY ? 'qwen-plus' : 'gpt-4o-mini'),
      system: agentPrompt,
      messages,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: 'Falha ao processar a mensagem.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
