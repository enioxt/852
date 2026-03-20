'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleMessageProps {
  children: React.ReactNode;
  maxHeight?: number; // Maximum height in pixels before clamping
  isEnabled?: boolean; // Whether the feature is turned on
}

export default function CollapsibleMessage({ children, maxHeight = 320, isEnabled = true }: CollapsibleMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsClamping, setNeedsClamping] = useState(false);

  // We can use a ref callback to measure the content
  const measureRef = (node: HTMLDivElement | null) => {
    if (node && isEnabled && !needsClamping) {
      if (node.scrollHeight > maxHeight) {
        setNeedsClamping(true);
      }
    }
  };

  if (!isEnabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full">
      <div
        ref={measureRef}
        className={`w-full overflow-hidden transition-all duration-300 ease-in-out ${
          needsClamping && !isExpanded ? '' : 'max-h-none'
        }`}
        style={{
          maxHeight: needsClamping && !isExpanded ? `${maxHeight}px` : undefined,
        }}
      >
        {children}
      </div>

      {needsClamping && !isExpanded && (
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-[#1c4ed8] to-transparent pointer-events-none rounded-b-lg" />
      )}

      {needsClamping && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-[11px] font-medium uppercase tracking-wider text-blue-300 hover:text-blue-100 transition-colors flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Mostrar mais
            </>
          )}
        </button>
      )}
    </div>
  );
}
