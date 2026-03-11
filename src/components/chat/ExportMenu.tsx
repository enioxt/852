'use client';

import { useState } from 'react';
import { Download, FileText, ChevronDown, Share2, Copy, Check } from 'lucide-react';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
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
  const formattedReport = buildFormattedReport({
    messages: messages.map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: getMessageText(message),
    })),
    reporterTypeLabel: 'Relator protegido',
  });

  const generateMarkdown = () => {
    return formattedReport.markdown;
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(formattedReport.plainText, 180);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(splitText, 15, 15);
    doc.save('relato-852.pdf');
  };

  const exportDocx = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: formattedReport.plainText.split('\n').filter(Boolean).map((line) =>
          new Paragraph({
            children: [
              new TextRun({ text: line })
            ]
          })
        )
      }]
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'relato-852.docx');
  };

  const exportMD = () => {
    const blob = new Blob([generateMarkdown()], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, 'relato-852.md');
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(formattedReport.plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = async () => {
    if (navigator.share) {
      await navigator.share({
        title: formattedReport.title,
        text: formattedReport.plainText,
      });
      return;
    }

    await copyText();
  };

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
        <div className="absolute right-0 top-full mt-1 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-1 z-20 min-w-[140px]">
          <button onClick={() => { exportPDF(); onToggleExport(); }} className="w-full px-3 py-2 text-xs text-left text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={() => { exportDocx(); onToggleExport(); }} className="w-full px-3 py-2 text-xs text-left text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> DOCX
          </button>
          <button onClick={() => { exportMD(); onToggleExport(); }} className="w-full px-3 py-2 text-xs text-left text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> Markdown
          </button>
          <button onClick={() => { void copyText(); onToggleExport(); }} className="w-full px-3 py-2 text-xs text-left text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copiado' : 'Copiar texto'}
          </button>
          <button onClick={() => { void shareText(); onToggleExport(); }} className="w-full px-3 py-2 text-xs text-left text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2">
            <Share2 className="w-3.5 h-3.5" /> Compartilhar texto
          </button>
        </div>
      )}
    </div>
  );
}
