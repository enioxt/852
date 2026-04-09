'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Bot, Clock, FileText, Download, Share2, ArrowRight,
  ChevronDown, ChevronUp, Eye, FileDown, MessageSquare,
  CheckCircle2, X
} from 'lucide-react';

interface IntelligenceReportCardProps {
  report: {
    id: string;
    created_at: string;
    content_summary: string | null;
    content_html: string;
    model_id: string;
    provider: string;
    conversation_count: number;
    report_count: number;
    pending_topics: Array<Record<string, unknown>> | null;
    issue_count: number;
    related_issues: Array<{
      id: string;
      title: string;
      status: string;
      votes: number;
      category: string | null;
    }>;
  };
  isExpanded: boolean;
  onToggle: () => void;
}

function getPreviewLines(text: string | null, lines: number): string {
  if (!text) return '';
  const allLines = text.split('\n').filter(l => l.trim());
  return allLines.slice(0, lines).join('\n');
}

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export function IntelligenceReportCard({ report, isExpanded, onToggle }: IntelligenceReportCardProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const previewText = getPreviewLines(
    report.content_summary || stripHtml(report.content_html),
    5
  );

  const fullText = report.content_summary || stripHtml(report.content_html);

  // Export functions
  const handleExportPDF = async () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Relatório Tira-Voz</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; color: #333; }
            h1 { color: #059669; }
            .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
            .summary { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>Relatório de Inteligência - Tira-Voz</h1>
          <div class="meta">
            Gerado em: ${new Date(report.created_at).toLocaleString('pt-BR')}<br>
            Modelo: ${report.model_id}<br>
            Conversas analisadas: ${report.conversation_count}<br>
            Relatos analisados: ${report.report_count}
          </div>
          <div class="summary">
            ${report.content_summary || 'Resumo não disponível'}
          </div>
          <hr>
          <div>
            ${report.content_html}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-tira-voz-${report.id.slice(0, 8)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportMD = () => {
    const mdContent = `# Relatório de Inteligência - Tira-Voz

**Gerado em:** ${new Date(report.created_at).toLocaleString('pt-BR')}  
**Modelo:** ${report.model_id}  
**Conversas analisadas:** ${report.conversation_count}  
**Relatos analisados:** ${report.report_count}  
**Issues geradas:** ${report.issue_count}

---

## Resumo

${report.content_summary || 'Resumo não disponível'}

---

## Conteúdo Completo

${stripHtml(report.content_html)}

---

*Gerado automaticamente pela IA do Tira-Voz*
`;

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-tira-voz-${report.id.slice(0, 8)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareWhatsApp = () => {
    const text = `📊 Relatório Tira-Voz: ${report.content_summary?.slice(0, 100) || 'Análise de inteligência'}... \n\nVeja o relatório completo: ${window.location.origin}/reports?tab=intelligence&reportId=${report.id}`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
    setShowShareMenu(false);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/reports?tab=intelligence&reportId=${report.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 overflow-hidden hover:border-neutral-700 transition-colors">
      {/* Card Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left"
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-white truncate pr-2">
              Relatório de Inteligência #{report.id.slice(0, 8)}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 line-clamp-2">
              {previewText || 'Análise de conversas e relatos da base'}
            </p>
            <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-[10px] sm:text-xs text-neutral-500">
                <Clock className="w-3 h-3" />
                {new Date(report.created_at).toLocaleDateString('pt-BR')}
              </span>
              <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400">
                {report.conversation_count} conversas
              </span>
              <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-blue-900/30 text-blue-400">
                {report.report_count} relatos
              </span>
              {report.issue_count > 0 && (
                <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-amber-900/30 text-amber-400">
                  {report.issue_count} tópicos
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-neutral-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-neutral-500" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-neutral-800 p-4 sm:p-5 space-y-4" ref={contentRef}>
          {/* Summary Preview (10 lines) */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <p className="text-sm text-neutral-300 leading-relaxed">
              {fullText.slice(0, 800)}
              {fullText.length > 800 && (
                <span className="text-neutral-500">... (ver relatório completo abaixo)</span>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar
              </button>

              {showShareMenu && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl overflow-hidden z-50">
                  <button
                    onClick={handleShareWhatsApp}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-800 transition text-left"
                  >
                    <MessageSquare className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-white">WhatsApp</span>
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-800 transition text-left"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-400">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-white">Copiar link</span>
                      </>
                    )}
                  </button>
                  <div className="border-t border-neutral-800" />
                  <button
                    onClick={handleExportPDF}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-800 transition text-left"
                  >
                    <FileDown className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-white">Baixar HTML</span>
                  </button>
                  <button
                    onClick={handleExportMD}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-800 transition text-left"
                  >
                    <Download className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-white">Baixar Markdown</span>
                  </button>
                </div>
              )}
            </div>

            {/* Direct Download Buttons */}
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-700 hover:border-neutral-600 text-neutral-400 hover:text-white text-sm transition"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">HTML</span>
            </button>
            <button
              onClick={handleExportMD}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-700 hover:border-neutral-600 text-neutral-400 hover:text-white text-sm transition"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">MD</span>
            </button>

            <button
              onClick={() => setShowShareMenu(false)}
              className="ml-auto flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-500 hover:text-white text-sm transition"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Fechar</span>
            </button>
          </div>

          {/* Full Report View */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Eye className="w-4 h-4" />
                Relatório completo
              </div>
              <span className="text-xs text-neutral-500">
                {report.model_id} via {report.provider}
              </span>
            </div>
            <div
              className="border border-neutral-700 rounded-xl overflow-hidden bg-slate-950 max-h-[500px] overflow-y-auto report-iframe-container"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#1e3a5f #0f172a',
              }}
            >
              <iframe
                srcDoc={report.content_html}
                className="w-full min-h-[400px] border-0"
                title={`AI Report ${report.id}`}
                sandbox="allow-same-origin"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#1e3a5f #0f172a',
                }}
              />
            </div>
          </div>

          {/* Related Issues */}
          {report.related_issues.length > 0 && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-white">
                <FileText className="w-4 h-4 text-amber-400" />
                Tópicos gerados deste relatório
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {report.related_issues.slice(0, 4).map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/issues?id=${issue.id}`}
                    className="block rounded-lg border border-neutral-800 p-3 hover:border-neutral-700 hover:bg-neutral-900/50 transition"
                  >
                    <p className="text-xs sm:text-sm font-medium text-white line-clamp-2">{issue.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] sm:text-xs text-neutral-500">
                      <span>{issue.votes} votos</span>
                      {issue.category && (
                        <span className="px-1.5 py-0.5 rounded bg-neutral-800">{issue.category}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              {report.related_issues.length > 4 && (
                <Link
                  href={`/issues?aiReportId=${report.id}`}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 transition"
                >
                  Ver todos os {report.related_issues.length} tópicos <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
