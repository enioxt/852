'use client';

import { useState, useEffect } from 'react';
import { Settings, Plus, Minus, Type, Contrast } from 'lucide-react';

export default function AccessibilityFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState<number>(100);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}%`;
  }, [fontSize]);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  const increaseFont = () => setFontSize(prev => Math.min(prev + 10, 150));
  const decreaseFont = () => setFontSize(prev => Math.max(prev - 10, 90));
  const toggleContrast = () => setHighContrast(prev => !prev);

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen && (
        <div className="flex flex-col gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/90 p-3 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2">
          <p className="mb-1 text-xs font-semibold text-neutral-400">Acessibilidade</p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={decreaseFont}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              aria-label="Diminuir fonte"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="flex flex-1 items-center justify-center gap-1 text-xs text-white">
              <Type className="h-4 w-4" /> {fontSize}%
            </div>
            <button
              onClick={increaseFont}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              aria-label="Aumentar fonte"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={toggleContrast}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition font-medium ${highContrast ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}
          >
            <Contrast className="h-4 w-4" />
            Alto Contraste
          </button>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="Menu de Acessibilidade"
      >
        <span className="sr-only">Acessibilidade</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/></svg>
      </button>
    </div>
  );
}
