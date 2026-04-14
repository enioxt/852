'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleMessageProps {
  children: React.ReactNode;
  maxHeight?: number; // Maximum height in pixels before clamping
  isEnabled?: boolean; // Whether the feature is turned on
  fadeClass?: string; // Tailwind class for the from-* gradient
}

export default function CollapsibleMessage({ children, maxHeight = 320, isEnabled = true, fadeClass = 'from-neutral-950' }: CollapsibleMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsClamping, setNeedsClamping] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && isEnabled) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(height);
      if (height > maxHeight) {
        setNeedsClamping(true);
      }
    }
  }, [children, maxHeight, isEnabled]);

  if (!isEnabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full">
      <div
        ref={contentRef}
        className={`w-full overflow-hidden transition-all duration-300 ease-in-out ${needsClamping && !isExpanded ? '' : 'max-h-none'
          }`}
        style={{
          maxHeight: needsClamping && !isExpanded ? `${maxHeight}px` : undefined,
        }}
      >
        {children}
      </div>

      {needsClamping && !isExpanded && (
        <div className={`absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t ${fadeClass} to-transparent pointer-events-none rounded-b-lg`} />
      )}

      {needsClamping && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-200 text-sm font-medium transition-all duration-200 group"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              <span>Mostrar menos</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              <span>Mostrar mais</span>
              <span className="text-xs text-blue-400/70 ml-1">(~{Math.ceil(contentHeight / 20)} linhas)</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
