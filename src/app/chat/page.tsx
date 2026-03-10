'use client';

import { useChat } from '@ai-sdk/react';
import { useRef, useEffect } from 'react';
import { Send, Download, Share2, ShieldAlert, Bot } from 'lucide-react';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateMarkdown = () => {
    return messages.map((m: any) => `**${m.role === 'user' ? 'Policial' : 'Sindpol-IA'}**:\n${m.content}\n`).join('\n---\n');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(generateMarkdown(), 180);
    doc.text(splitText, 10, 10);
    doc.save('relato-sindpol.pdf');
  };

  const exportDocx = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: messages.map((m: any) => 
          new Paragraph({
            children: [
              new TextRun({ text: `${m.role === 'user' ? 'Policial' : 'Sindpol-IA'}: `, bold: true }),
              new TextRun({ text: m.content })
            ]
          })
        )
      }]
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'relato-sindpol.docx');
  };

  const exportMD = () => {
    const blob = new Blob([generateMarkdown()], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, 'relato-sindpol.md');
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent("Colega, relatei nossos problemas de forma anônima pro Agente de Inteligência do Sindpol. Acessa aí e relata também a sua realidade: https://sindpol.ia.br/chat");
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200">
      <header className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-full">
            <Bot className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-white">Sindpol Inteligência</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-green-500" /> Canal Seguro e Anônimo
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={shareWhatsApp} className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-slate-400">
            <ShieldAlert className="w-12 h-12 text-slate-600" />
            <p className="max-w-xs">
              Bem-vindo ao canal seguro do Sindpol-MG. Tudo relatado aqui é <strong>anônimo</strong>. Por favor, <strong>não cite nomes de pessoas, nem CPFs, nem números de processos ou inquéritos</strong>. Nosso objetivo é coletar problemas estruturais e processuais para levarmos ao comando.
            </p>
          </div>
        )}
        
        {messages.map((m: any) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
            }`}>
              {m.role !== 'user' && (
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold text-blue-400">Agente Sindpol</span>
                </div>
              )}
              <div className="whitespace-pre-wrap text-sm">{m.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-400 border border-slate-700 rounded-2xl rounded-bl-none p-4 text-sm flex items-center gap-2">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse delay-75">●</span>
              <span className="animate-pulse delay-150">●</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-slate-900 border-t border-slate-800 pb-safe">
        {messages.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
            <button onClick={exportPDF} className="text-xs flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-full text-slate-300 whitespace-nowrap">
              <Download className="w-3 h-3" /> PDF
            </button>
            <button onClick={exportDocx} className="text-xs flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-full text-slate-300 whitespace-nowrap">
              <Download className="w-3 h-3" /> DOCX
            </button>
            <button onClick={exportMD} className="text-xs flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-full text-slate-300 whitespace-nowrap">
              <Download className="w-3 h-3" /> MarkDown
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Relate o fluxo ou problema (não cite nomes)..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32 min-h-[50px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </footer>
    </div>
  );
}
