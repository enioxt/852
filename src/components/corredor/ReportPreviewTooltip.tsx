'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bot, Clock, MessageCircle, FileText, ArrowRight, X } from 'lucide-react';

interface ReportPreviewTooltipProps {
  reportId: string;
  title?: string;
  summary?: string;
  conversationCount?: number;
  reportCount?: number;
  createdAt?: string;
  children: React.ReactNode;
}

export function ReportPreviewTooltip({
  reportId,
  title,
  summary,
  conversationCount,
  reportCount,
  createdAt,
  children,
}: ReportPreviewTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const previewText = summary
    ? summary.slice(0, 200) + (summary.length > 200 ? '...' : '')
    : 'Relatório de inteligência gerado automaticamente pela IA a partir de conversas e relatos da base.';

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => {
        if (!isExpanded) {
          setIsVisible(false);
        }
      }}
    >
      {children}

      {/* Tooltip */}
      {isVisible && (
        <div
          className={`absolute z-50 ${
            isExpanded ? 'w-96' : 'w-80'
          } bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden transition-all duration-200`}
          style={{
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%) translateY(8px)',
          }}
        >
          {/* Header */}
          <div className="flex items-start gap-3 p-4 border-b border-neutral-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {title || 'Relatório de Inteligência'}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {conversationCount !== undefined && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-400">
                    {conversationCount} conversas
                  </span>
                )}
                {reportCount !== undefined && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-400">
                    {reportCount} relatos
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
                setIsExpanded(false);
              }}
              className="p-1 hover:bg-neutral-800 rounded-lg transition"
            >
              <X className="w-4 h-4 text-neutral-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <p className="text-xs text-neutral-300 leading-relaxed">
              {isExpanded ? summary || previewText : previewText.slice(0, 150) + '...'}
            </p>

            {/* Preview stats */}
            <div className="flex items-center gap-3 text-[10px] text-neutral-500">
              {createdAt && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(createdAt).toLocaleDateString('pt-BR')}
                </span>
              )}
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                IA Analysis
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Link
                href={`/reports?tab=intelligence&reportId=${reportId}`}
                onClick={() => {
                  setIsVisible(false);
                  setIsExpanded(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
              >
                Ver relatório
                <ArrowRight className="w-3 h-3" />
              </Link>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="px-3 py-2 rounded-lg border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-600 text-xs transition"
              >
                {isExpanded ? 'Reduzir' : 'Expandir'}
              </button>
            </div>
          </div>

          {/* Arrow */}
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-neutral-900 border-l border-t border-neutral-700 rotate-45"
            style={{ zIndex: -1 }}
          />
        </div>
      )}
    </div>
  );
}
