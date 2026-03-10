'use client';

import Image from 'next/image';
import { useChat } from '@ai-sdk/react';
import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Send, Download, Share2, Copy, Check,
  FileText, MessageCircle, AlertTriangle, Zap, ChevronDown, Menu
} from 'lucide-react';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import Sidebar from '@/components/chat/Sidebar';
import FAQModal from '@/components/chat/FAQModal';
import MarkdownMessage from '@/components/chat/MarkdownMessage';
import ReportReview from '@/components/chat/ReportReview';
import {
  getConversation, createConversation,
  updateConversation, generateTitle, type StoredMessage
} from '@/lib/chat-store';

const quickActions = [
  { icon: AlertTriangle, label: 'Relatar problema operacional', prompt: 'Quero relatar um problema operacional que afeta o trabalho da equipe na delegacia.' },
  { icon: FileText, label: 'Sugerir melhoria de processo', prompt: 'Tenho uma sugestão para melhorar um processo interno que está causando atrasos.' },
  { icon: MessageCircle, label: 'Falar sobre condições de trabalho', prompt: 'Preciso falar sobre as condições de trabalho na minha unidade.' },
  { icon: Zap, label: 'Problema com sistema/tecnologia', prompt: 'Estou enfrentando problemas com sistemas ou tecnologia utilizados no serviço.' },
];

function getMessageText(message: { content?: string; parts?: Array<{ type?: string; text?: string }> }): string {
  if (typeof message.content === 'string' && message.content) return message.content;
  if (Array.isArray(message.parts)) {
    return message.parts.filter((part) => part.type === 'text').map((part) => part.text ?? '').join('');
  }
  return '';
}

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showReportReview, setShowReportReview] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading, error, setInput } = useChat({
    api: '/api/chat',
    streamProtocol: 'text',
    onError: (err) => {
      console.error('[852-chat] useChat error:', err.message, err);
    },
    onFinish: () => {
      // persist after AI responds
    },
  });

  // Auto-resize textarea
  const adjustTextarea = useCallback(() => {
    const el = inputRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }
  }, []);

  useEffect(() => { adjustTextarea(); }, [input, adjustTextarea]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Persist messages to localStorage
  useEffect(() => {
    if (messages.length === 0 || !activeConvId) return;
    const stored: StoredMessage[] = messages.map(m => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: getMessageText(m),
    }));
    const title = stored.length > 0 ? generateTitle(stored[0].content) : 'Nova conversa';
    updateConversation(activeConvId, stored, title);
  }, [messages, activeConvId]);

  const handleNewConversation = useCallback(() => {
    const conv = createConversation();
    setActiveConvId(conv.id);
    setMessages([]);
    setInput('');
    inputRef.current?.focus();
  }, [setMessages, setInput]);

  const handleSelectConversation = useCallback((id: string) => {
    const conv = getConversation(id);
    if (!conv) return;
    setActiveConvId(id);
    const restored = conv.messages.map(m => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      parts: [{ type: 'text' as const, text: m.content }],
      createdAt: new Date(),
    }));
    setMessages(restored);
  }, [setMessages]);

  const handleQuickAction = (prompt: string) => {
    if (!activeConvId) {
      const conv = createConversation();
      setActiveConvId(conv.id);
    }
    setInput(prompt);
    inputRef.current?.focus();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (!activeConvId) {
      const conv = createConversation();
      setActiveConvId(conv.id);
    }
    handleSubmit(e);
  };

  const copyMessage = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export functions
  const generateMarkdown = () => {
    return messages.map((m: any) => `**${m.role === 'user' ? 'Policial' : '852-IA'}**:\n${getMessageText(m)}\n`).join('\n---\n');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const text = messages.map((m: any) => `${m.role === 'user' ? 'Policial' : '852-IA'}: ${getMessageText(m)}`).join('\n\n');
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
        children: messages.map((m: any) =>
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

  const shareWhatsApp = () => {
    const shareUrl = `${window.location.origin}/chat`;
    const text = encodeURIComponent(`Colega, relatei nossos problemas de forma anônima pelo 852 Inteligência. Acessa aí e relata também: ${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div
      className="flex h-screen bg-neutral-950 text-neutral-200 font-[family-name:var(--font-geist-sans)]"
      style={{
        backgroundImage: "linear-gradient(to bottom, rgba(10,10,10,0.95), rgba(10,10,10,0.98)), url('/brand/bg-pattern.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'fixed inset-y-0 left-0 z-40 md:relative md:z-auto' : 'hidden md:block'}`}>
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeConversationId={activeConvId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onShowFAQ={() => setShowFAQ(true)}
      />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-4 h-14 border-b border-neutral-800/50 bg-neutral-950 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition md:hidden"
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-semibold text-white">852 Inteligência</h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/40 text-green-400 font-medium">Anônimo</span>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowExport(!showExport)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exportar</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showExport && (
                  <div className="absolute right-0 top-full mt-1 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl py-1 z-20 min-w-[140px]">
                    <button onClick={() => { exportPDF(); setShowExport(false); }} className="w-full px-3 py-2 text-xs text-left text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" /> PDF
                    </button>
                    <button onClick={() => { exportDocx(); setShowExport(false); }} className="w-full px-3 py-2 text-xs text-left text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" /> DOCX
                    </button>
                    <button onClick={() => { exportMD(); setShowExport(false); }} className="w-full px-3 py-2 text-xs text-left text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" /> Markdown
                    </button>
                  </div>
                )}
              </div>
            )}
            {messages.length >= 2 && (
              <button
                onClick={() => setShowReportReview(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-green-400 hover:text-green-300 hover:bg-green-900/20 transition border border-green-800/30"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Enviar Relatório</span>
              </button>
            )}
            <button onClick={shareWhatsApp} className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition" title="Compartilhar">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* Welcome Screen */
            <div className="flex flex-col items-center justify-center h-full px-4">
              <div className="max-w-2xl w-full text-center space-y-8">
                <div className="space-y-3">
                  <Image src="/brand/logo-852.png" alt="852 Inteligência" width={64} height={64} className="w-16 h-16 rounded-2xl object-cover mx-auto shadow-lg shadow-blue-900/30" />
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Como posso ajudar?
                  </h2>
                  <p className="text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
                    Canal seguro e anônimo de inteligência institucional. Relate problemas, sugira melhorias — sem identificação.
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickAction(action.prompt)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800/80 hover:border-neutral-700 text-left transition group"
                    >
                      <action.icon className="w-4 h-4 text-neutral-500 group-hover:text-blue-400 transition flex-shrink-0" />
                      <span className="text-xs text-neutral-400 group-hover:text-neutral-200 transition">{action.label}</span>
                    </button>
                  ))}
                </div>

                <p className="text-[10px] text-neutral-600 max-w-xs mx-auto">
                  Não cite nomes, CPFs, REDS ou dados pessoais. O foco é em problemas estruturais e processuais.
                </p>
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((m: any) => {
                const text = getMessageText(m);
                const isUser = m.role === 'user';
                return (
                  <div key={m.id} className="group">
                    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                      {/* Avatar */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isUser ? 'bg-blue-600' : 'bg-neutral-800 border border-neutral-700'
                      }`}>
                        {isUser ? (
                          <span className="text-[10px] font-bold text-white">P</span>
                        ) : (
                          <Image src="/brand/agent-avatar.png" alt="Agente 852" width={28} height={28} className="w-7 h-7 rounded-lg object-cover" />
                        )}
                      </div>
                      {/* Content */}
                      <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : ''}`}>
                        <div className={`inline-block text-left max-w-full ${
                          isUser
                            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-md px-4 py-3'
                            : 'text-neutral-200'
                        }`}>
                          {isUser ? (
                            <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">{text}</div>
                          ) : (
                            <div className="text-sm leading-relaxed break-words prose-sm">
                              <MarkdownMessage content={text} />
                            </div>
                          )}
                        </div>
                        {/* Action buttons (assistant only) */}
                        {!isUser && (
                          <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => copyMessage(text, m.id)}
                              className="p-1 rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition"
                              title="Copiar"
                            >
                              {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex gap-3">
                  <Image src="/brand/agent-avatar.png" alt="Agente 852" width={28} height={28} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex items-center gap-1 py-3">
                    <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              {error && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-red-900/30 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <p className="text-sm text-red-400 py-2">Erro ao processar: {error?.message || 'Tente novamente.'}</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Input Area */}
        <div className="border-t border-neutral-800/50 bg-neutral-950 p-4">
          <form onSubmit={handleFormSubmit} className="max-w-3xl mx-auto">
            <div className="relative flex items-end bg-neutral-900 border border-neutral-800 rounded-2xl focus-within:border-neutral-600 transition">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                placeholder="Relate o problema ou faça uma pergunta..."
                className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none resize-none max-h-40 min-h-[44px]"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleFormSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="m-1.5 p-2 bg-white text-black rounded-xl hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-neutral-600 text-center mt-2">
              852 Inteligência • Canal anônimo • Suas conversas ficam apenas neste navegador
            </p>
          </form>
        </div>
      </div>

      {/* FAQ Modal */}
      {showFAQ && <FAQModal onClose={() => setShowFAQ(false)} />}

      {/* Report Review Modal */}
      {showReportReview && activeConvId && (
        <ReportReview
          messages={messages.map(m => ({ role: m.role, content: getMessageText(m) }))}
          conversationId={activeConvId}
          onClose={() => setShowReportReview(false)}
          onSuggestionClick={(suggestion) => {
            setShowReportReview(false);
            setInput(suggestion);
            inputRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}
