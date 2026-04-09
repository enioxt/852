/**
 * Lazy Export Menu — 852 Inteligência
 *
 * Code-splits heavy PDF/DOCX libraries to reduce initial bundle.
 * Only loads jsPDF, docx, file-saver when user clicks export.
 */

'use client';

import { useState, useCallback, lazy, Suspense } from 'react';
import { Download, FileText, ChevronDown, Loader2 } from 'lucide-react';

// Types for lazy-loaded modules
type JsPDFType = typeof import('jspdf').default;
type DocxType = typeof import('docx');
type FileSaverType = typeof import('file-saver');

// Module caches
let jsPDFModule: JsPDFType | null = null;
let docxModule: DocxType | null = null;
let fileSaverModule: FileSaverType | null = null;

// Async loaders
async function loadJsPDF(): Promise<JsPDFType> {
  if (!jsPDFModule) {
    const mod = await import('jspdf');
    jsPDFModule = mod.default;
  }
  return jsPDFModule;
}

async function loadDocx(): Promise<DocxType> {
  if (!docxModule) {
    docxModule = await import('docx');
  }
  return docxModule;
}

async function loadFileSaver(): Promise<FileSaverType> {
  if (!fileSaverModule) {
    fileSaverModule = await import('file-saver');
  }
  return fileSaverModule;
}

// Lightweight version for markdown/text export (no heavy libs needed)
interface LazyExportMenuProps {
  plainText: string;
  markdown: string;
  title: string;
}

export function LazyExportMenu({ plainText, markdown, title }: LazyExportMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [loadingFormat, setLoadingFormat] = useState<string | null>(null);

  const exportPDF = useCallback(async () => {
    setLoadingFormat('pdf');
    try {
      const jsPDF = await loadJsPDF();
      const doc = new jsPDF();
      const splitText = doc.splitTextToSize(plainText, 180);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(splitText, 15, 15);
      doc.save('relato-852.pdf');
    } finally {
      setLoadingFormat(null);
      setShowMenu(false);
    }
  }, [plainText]);

  const exportDocx = useCallback(async () => {
    setLoadingFormat('docx');
    try {
      const docx = await loadDocx();
      const { saveAs } = await loadFileSaver();
      
      const doc = new docx.Document({
        sections: [{
          properties: {},
          children: plainText.split('\n').filter(Boolean).map((line) =>
            new docx.Paragraph({
              children: [
                new docx.TextRun({ text: line })
              ]
            })
          )
        }]
      });
      const blob = await docx.Packer.toBlob(doc);
      saveAs(blob, 'relato-852.docx');
    } finally {
      setLoadingFormat(null);
      setShowMenu(false);
    }
  }, [plainText]);

  const exportMD = useCallback(() => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relato-852.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowMenu(false);
  }, [markdown]);

  const copyText = useCallback(async () => {
    await navigator.clipboard.writeText(plainText);
    setShowMenu(false);
  }, [plainText]);

  const shareText = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({ title, text: plainText });
    } else {
      await copyText();
    }
    setShowMenu(false);
  }, [title, plainText, copyText]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Exportar</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-1 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-1 z-20 min-w-[160px]">
          <button
            onClick={exportPDF}
            disabled={loadingFormat === 'pdf'}
            className="w-full px-3 py-2 text-xs text-left text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2 disabled:opacity-50"
          >
            {loadingFormat === 'pdf' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            PDF
          </button>

          <button
            onClick={exportDocx}
            disabled={loadingFormat === 'docx'}
            className="w-full px-3 py-2 text-xs text-left text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2 disabled:opacity-50"
          >
            {loadingFormat === 'docx' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            DOCX
          </button>

          <button
            onClick={exportMD}
            className="w-full px-3 py-2 text-xs text-left text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5" />
            Markdown
          </button>

          <button
            onClick={copyText}
            className="w-full px-3 py-2 text-xs text-left text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5" />
            Copiar texto
          </button>

          <button
            onClick={shareText}
            className="w-full px-3 py-2 text-xs text-left text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5" />
            Compartilhar
          </button>
        </div>
      )}
    </div>
  );
}
