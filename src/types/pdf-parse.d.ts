declare module 'pdf-parse' {
  type PDFParseResult = {
    text: string;
    numpages?: number;
    numrender?: number;
    info?: unknown;
    metadata?: unknown;
    version?: string;
  };

  export default function pdfParse(dataBuffer: Buffer | Uint8Array): Promise<PDFParseResult>;
}
