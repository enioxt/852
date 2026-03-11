'use client';

import { Send } from 'lucide-react';

interface ChatInputAreaProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

export default function ChatInputArea({ input, onInputChange, onSubmit, isLoading, inputRef }: ChatInputAreaProps) {
  return (
    <div className="border-t border-neutral-800/50 bg-neutral-950 p-4">
      <form onSubmit={onSubmit} className="max-w-3xl mx-auto">
        <div className="relative flex items-end bg-neutral-900 border border-neutral-800 rounded-2xl focus-within:border-neutral-600 transition">
          <textarea
            ref={inputRef}
            value={input}
            onChange={onInputChange}
            placeholder="Relate o problema ou faça uma pergunta..."
            className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none resize-none max-h-40 min-h-[44px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
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
          Tira-Voz • Canal anônimo • Entre com sua conta se quiser sincronizar conversas entre dispositivos
        </p>
      </form>
    </div>
  );
}
