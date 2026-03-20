'use client';

import Image from 'next/image';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import MarkdownMessage from '@/components/chat/MarkdownMessage';
import CollapsibleMessage from '@/components/chat/CollapsibleMessage';
import InlineCorrelation, { CorrelationData } from '@/components/chat/InlineCorrelation';

export function getMessageText(message: { content?: string; parts?: Array<{ type?: string; text?: string }> }): string {
  if (typeof message.content === 'string' && message.content) return message.content;
  if (Array.isArray(message.parts)) {
    return message.parts.filter((part) => part.type === 'text').map((part) => part.text ?? '').join('');
  }
  return '';
}

interface MessageListProps {
  messages: Array<{ id: string; role: string; content?: string; parts?: Array<{ type?: string; text?: string }> }>;
  isLoading: boolean;
  error: Error | undefined;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  correlations?: Record<string, CorrelationData>;
}

export default function MessageList({ messages, isLoading, error, copiedId, onCopy, messagesEndRef, correlations = {} }: MessageListProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {messages.map((m) => {
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
                  <CollapsibleMessage maxHeight={isUser ? 160 : 360} fadeClass={isUser ? 'from-[#1c4ed8]' : 'from-neutral-950'}>
                    {isUser ? (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">{text}</div>
                    ) : (
                      <div className="text-sm leading-relaxed break-words prose-sm">
                        <MarkdownMessage content={text} />
                      </div>
                    )}
                  </CollapsibleMessage>
                </div>
                {/* Action buttons (assistant only) */}
                {!isUser && (
                  <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onCopy(text, m.id)}
                      className="p-1 rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition"
                      title="Copiar"
                    >
                      {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
                
                {/* Visual Corridor Match */}
                {!isUser && correlations[m.id] && (
                  <InlineCorrelation data={correlations[m.id]} />
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
  );
}
