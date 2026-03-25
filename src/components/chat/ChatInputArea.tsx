'use client';

import { Send, Mic } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ChatInputAreaProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  setInput: (value: string) => void;
}

export default function ChatInputArea({ input, onInputChange, onSubmit, isLoading, inputRef, setInput }: ChatInputAreaProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);
  const recognitionRef = useRef<any>(null);
  
  const currentInputRef = useRef(input);
  useEffect(() => {
    currentInputRef.current = input;
  }, [input]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        queueMicrotask(() => setHasSpeechSupport(false));
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'pt-BR';

      recognition.onresult = (event: any) => {
        let newTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            newTranscript += event.results[i][0].transcript;
          }
        }
        
        if (newTranscript) {
          const current = currentInputRef.current.trim();
          const nextVal = current ? current + ' ' + newTranscript.trim() : newTranscript.trim();
          setInput(nextVal);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('[852-speech] erro:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [setInput]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Falha ao iniciar speech:', err);
      }
    }
  };

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
          <div className="flex items-center m-1.5 flex-shrink-0">
            {hasSpeechSupport && (
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isLoading}
                className={`p-2 rounded-xl transition mr-1.5 ${isRecording ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
                title={isRecording ? "Parar gravação" : "Falar relatoria vazada"}
              >
                <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !isRecording)}
              className="p-2 bg-white text-black rounded-xl hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-[10px] text-neutral-600 text-center mt-2">
          Tira-Voz • Canal anônimo • Entre com sua conta se quiser sincronizar conversas entre dispositivos
        </p>
      </form>
    </div>
  );
}
