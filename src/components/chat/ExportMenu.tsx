'use client';

import { Download, FileText, ChevronDown, Share2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { getMessageText } from '@/components/chat/MessageList';

interface ExportMenuProps {
  messages: Array<{ role: string; content?: string; parts?: Array<{ type?: string; text?: string }> }>;
  showExport: boolean;
  onToggleExport: () => void;
}

export function ShareWhatsAppButton() {
  const shareWhatsApp = () => {
    const shareUrl = `${window.location.origin}/chat`;
    const text = encodeURIComponent(`Colega, relatei nossos problemas de forma anônima pelo 852 Inteligência. Acessa aí e relata também: ${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <button onClick={shareWhatsApp} className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition" title="Compartilhar">
      <Share2 className="w-4 h-4" />
    </button>
  );
}

export default function ExportMenu({ messages, showExport, onToggleExport }: ExportMenuProps) {
  const generateMarkdown = () => {
    return messages.map((m) => `**${m.role === 'user' ? 'Policial' : '852-IA'}**:\n${getMessageText(m)}\n`).join('\n---\n');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const text = messages.map((m) => `${m.role === 'user' ? 'Policial' : '852-IA'}: ${getMessageText(m)}`).join('\n\n');
    const splitText = doc.splitTextToSize(text, 180);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(splitText, 15, 15);
    doc.save('relato-852.pdf');
  };

  const exportDocx = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: messages.map((m) =>
          new Paragraph({
            children: [
              new TextRun({ text: `${m.role === 'user' ? 'Policial' : '852-IA'}: `, bold: true }),
              new TextRun({ text: getMessageText(m) })
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
        </div>
      )}
    </div>
  );
}
