import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const maxDuration = 30;

const FILE_LIMIT_BYTES = 5 * 1024 * 1024;
const TEXT_LIMIT_CHARS = 20_000;
const PARSE_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 };
const ALLOWED_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'txt', 'md']);

function normalizeExtractedText(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[\t ]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function clampText(value: string) {
  if (value.length <= TEXT_LIMIT_CHARS) {
    return { text: value, truncated: false };
  }

  return {
    text: `${value.slice(0, TEXT_LIMIT_CHARS)}\n\n[trecho truncado para manter o processamento leve]`,
    truncated: true,
  };
}

function getExtension(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return ext;
}

async function parsePdf(buffer: Buffer): Promise<string> {
  const pdfModule = await import('pdf-parse');
  const parser = ((pdfModule as { default?: unknown }).default ?? pdfModule) as unknown as (dataBuffer: Buffer | Uint8Array) => Promise<{ text?: string }>;
  const parsed = await parser(buffer);
  return typeof parsed.text === 'string' ? parsed.text : '';
}

async function parseWord(buffer: Buffer): Promise<string> {
  const wordModule = await import('word-extractor');
  const WordExtractor = ((wordModule as { default?: unknown }).default ?? wordModule) as unknown as new () => {
    extract(source: string | Buffer): Promise<{
      getBody(): string;
      getFootnotes?(): string;
      getEndnotes?(): string;
    }>;
  };
  const extractor = new WordExtractor();
  const document = await extractor.extract(buffer);
  const body = typeof document.getBody === 'function' ? document.getBody() : '';
  const footnotes = typeof document.getFootnotes === 'function' ? document.getFootnotes() || '' : '';
  const endnotes = typeof document.getEndnotes === 'function' ? document.getEndnotes() || '' : '';
  return [body, footnotes, endnotes].filter(Boolean).join('\n\n');
}

async function parseTextFile(buffer: Buffer): Promise<string> {
  return buffer.toString('utf-8');
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req.headers);
    const rate = checkRateLimit(`upload-parse:${ip}`, PARSE_LIMIT.limit, PARSE_LIMIT.windowMs);
    if (!rate.allowed) {
      return Response.json({ error: 'Muitos arquivos em pouco tempo. Aguarde alguns minutos.' }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return Response.json({ error: 'Arquivo obrigatorio.' }, { status: 400 });
    }

    if (file.size === 0) {
      return Response.json({ error: 'O arquivo enviado esta vazio.' }, { status: 400 });
    }

    if (file.size > FILE_LIMIT_BYTES) {
      return Response.json({ error: 'O arquivo excede o limite de 5MB.' }, { status: 413 });
    }

    const extension = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return Response.json({ error: 'Formato nao suportado. Use PDF, DOC, DOCX, TXT ou MD.' }, { status: 415 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let extractedText = '';
    if (extension === 'pdf') {
      extractedText = await parsePdf(buffer);
    } else if (extension === 'doc' || extension === 'docx') {
      extractedText = await parseWord(buffer);
    } else {
      extractedText = await parseTextFile(buffer);
    }

    const normalized = normalizeExtractedText(extractedText);
    if (!normalized) {
      return Response.json({ error: 'Nao foi possivel extrair texto util do arquivo.' }, { status: 422 });
    }

    const { text, truncated } = clampText(normalized);

    return Response.json({
      fileName: file.name,
      extension,
      mimeType: file.type || 'application/octet-stream',
      text,
      truncated,
      charCount: normalized.length,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Erro desconhecido';
    return Response.json({ error: 'Falha ao processar o arquivo.', detail }, { status: 500 });
  }
}
