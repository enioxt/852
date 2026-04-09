'use client';

import { useState, useCallback } from 'react';
import { Download, FileText, ChevronDown, Share2, Copy, Check, Loader2 } from 'lucide-react';

// Module caches for lazy-loaded libraries
let jsPDFModule: typeof import('jspdf').default | null = null;
let docxModule: typeof import('docx') | null = null;
let fileSaverModule: { saveAs: (data: Blob | string, filename?: string) => void } | null = null;

// Async loaders
async function loadJsPDF() {
  if (!jsPDFModule) {
    const mod = await import('jspdf');
    jsPDFModule = mod.default;
  }
  return jsPDFModule;
}

async function loadDocx() {
  if (!docxModule) {
    docxModule = await import('docx');
  }
  return docxModule;
}

async function loadFileSaver() {
  if (!fileSaverModule) {
    const mod = await import('file-saver'); fileSaverModule = { saveAs: mod.saveAs || (mod as unknown as { default: { saveAs: (data: Blob | string, filename?: string) => void } }).default.saveAs };
  }
  return fileSaverModule;
}

import { getMessageText } from '@/components/chat/MessageList';
import { buildFormattedReport } from '@/lib/report-format';

interface ExportMenuProps {
  messages: Array<{ role: string; content?: string; parts?: Array<{ type?: string; text?: string }> }>;
  showExport: boolean;
  onToggleExport: () => void;
}

export function ShareWhatsAppButton() {
  const shareWhatsApp = () => {
    const shareUrl = `${window.location.origin}/chat`;
    const text = encodeURIComponent(`Colega, relatei nossos problemas de forma anônima pelo Tira-Voz. Acessa aí e relata também: ${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <button onClick={shareWhatsApp} className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition" title="Compartilhar">
      <Share2 className="w-4 h-4" />
    </button>
  );
}

export default function ExportMenu({ messages, showExport, onToggleExport }: ExportMenuProps) {
  const [copied, setCopied] = useState(false);
  const [loadingFormat, setLoadingFormat] = useState<string | null>(null);

  const formattedReport = buildFormattedReport({
    messages: messages.map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: getMessageText(message),
    })),
    reporterTypeLabel: 'Relator protegido',
  });

  const generateMarkdown = () => formattedReport.markdown;

  const exportPDF = useCallback(async () => {
    setLoadingFormat('pdf');
    try {
      const jsPDF = await loadJsPDF();
      const doc = new jsPDF();
      const splitText = doc.splitTextToSize(formattedReport.plainText, 180);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(splitText, 15, 15);
      doc.save('relato-852.pdf');
    } finally {
      setLoadingFormat(null);
      onToggleExport();
    }
  }, [formattedReport.plainText, onToggleExport]);

  const exportDocx = useCallback(async () => {
    setLoadingFormat('docx');
    try {
      const docx = await loadDocx();
      const { saveAs } = await loadFileSaver();

      const doc = new docx.Document({
        sections: [{
          properties: {},
          children: formattedReport.plainText.split('\n').filter(Boolean).map((line) =>
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
      onToggleExport();
    }
  }, [formattedReport.plainText, onToggleExport]);

  const exportMD = useCallback(() => {
    const blob = new Blob([generateMarkdown()], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relato-852.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onToggleExport();
  }, [onToggleExport]);

  const copyText = useCallback(async () => {
    await navigator.clipboard.writeText(formattedReport.plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onToggleExport();
  }, [formattedReport.plainText, onToggleExport]);

  const shareText = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({
        title: formattedReport.title,
        text: formattedReport.plainText,
      });
    } else {
      await copyText();
    }
    onToggleExport();
  }, [formattedReport, copyText, onToggleExport]);

  return (
    <div className="relative">
      <button
        onClick={onToggleExport}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Exportar</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      {showExport && (
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
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado' : 'Copiar texto'}
          </button>
          <button
            onClick={shareText}
            className="w-full px-3 py-2 text-xs text-left text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2"
          >
            <Share2 className="w-3.5 h-3.5" />
            Compartilhar texto
          </button>
        </div>
      )}
    </div>
  );
}
