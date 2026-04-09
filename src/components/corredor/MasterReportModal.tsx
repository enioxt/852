'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, RefreshCw, Clock, FileText, AlertCircle, TrendingUp, BarChart3,
  X, Download, Copy, Share2, FileDown, FileText as FileTextIcon, Check
} from 'lucide-react';
import jsPDF from 'jspdf';

interface MasterReport {
  id: string;
  content_html: string;
  version: number;
  total_conversations_all_time: number;
  total_reports_all_time: number;
  updated_at: string;
  insights: unknown[];
}

interface MasterReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MasterReportModal({ isOpen, onClose }: MasterReportModalProps) {
  const [report, setReport] = useState<MasterReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'full'>('summary');

  const loadMasterReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ai-reports/master');
      const data = await res.json();

      if (data.exists) {
        setReport(data.report);
      } else {
        setReport(null);
      }
    } catch (err) {
      setError('Falha ao carregar relatório master');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadMasterReport();
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, loadMasterReport]);

  const updateMasterReport = async () => {
    try {
      setUpdating(true);
      setError(null);
      const res = await fetch('/api/ai-reports/master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      });
      const data = await res.json();

      if (data.updated) {
        await loadMasterReport();
      } else {
        setError(data.reason || 'Não foi possível atualizar');
      }
    } catch (err) {
      setError('Falha ao atualizar relatório');
    } finally {
      setUpdating(false);
    }
  };

  const handleCopyContent = async () => {
    if (!report) return;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = report.content_html;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    await navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/papo-de-corredor?view=relatos&tab=intelligence`;
    if (navigator.share) {
      await navigator.share({
        title: 'Relatório de Inteligência 852',
        text: 'Relatório completo de inteligência da plataforma Tira-Voz',
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportPDF = () => {
    if (!report) return;
    const doc = new jsPDF('p', 'pt', 'a4');
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = report.content_html;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    doc.setFontSize(16);
    doc.text('Relatório de Inteligência - Tira-Voz', 40, 40);
    doc.setFontSize(10);
    doc.text(`Versão ${report.version} • ${new Date(report.updated_at).toLocaleDateString('pt-BR')}`, 40, 60);
    doc.setFontSize(12);
    
    const splitText = doc.splitTextToSize(textContent, 520);
    let y = 100;
    for (let i = 0; i < splitText.length; i++) {
      if (y > 750) {
        doc.addPage();
        y = 40;
      }
      doc.text(splitText[i], 40, y);
      y += 20;
    }
    doc.save(`relatorio-inteligencia-852-v${report.version}.pdf`);
  };

  const handleExportMarkdown = () => {
    if (!report) return;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = report.content_html;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    const markdown = `# Relatório de Inteligência - Tira-Voz

**Versão:** ${report.version}  
**Atualizado:** ${new Date(report.updated_at).toLocaleDateString('pt-BR')}  
**Conversas:** ${report.total_conversations_all_time}  
**Relatos:** ${report.total_reports_all_time}

---

${textContent}
`;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-inteligencia-852-v${report.version}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 sm:inset-8 md:inset-12 lg:inset-16 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="w-full max-w-[75vw] h-full bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col pointer-events-auto shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-500/20 rounded-lg">
                    <Brain className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Relatório de Inteligência</h2>
                    {report && (
                      <p className="text-xs text-neutral-400">
                        v{report.version} • {report.total_conversations_all_time} conversas • {report.total_reports_all_time} relatos
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Update Button */}
                  <button
                    onClick={updateMasterReport}
                    disabled={updating || loading}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm transition disabled:opacity-50"
                  >
                    {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    <span className="hidden sm:inline">{updating ? 'Atualizando...' : 'Atualizar'}</span>
                  </button>

                  {/* Export Buttons */}
                  {report && (
                    <>
                      <button
                        onClick={handleCopyContent}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm transition"
                        title="Copiar conteúdo"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
                      </button>

                      <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm transition"
                        title="Exportar PDF"
                      >
                        <FileDown className="w-4 h-4" />
                        <span className="hidden sm:inline">PDF</span>
                      </button>

                      <button
                        onClick={handleExportMarkdown}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm transition"
                        title="Exportar Markdown"
                      >
                        <FileTextIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">MD</span>
                      </button>

                      <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm transition"
                      >
                        <Share2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Compartilhar</span>
                      </button>
                    </>
                  )}

                  {/* Close */}
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-800 hover:bg-red-900/30 hover:text-red-400 text-neutral-400 transition ml-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {loading ? (
                  <div className="flex flex-col items-center justify-center flex-1 gap-4">
                    <RefreshCw className="w-10 h-10 text-neutral-600 animate-spin" />
                    <p className="text-neutral-400">Carregando relatório...</p>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center flex-1 p-8">
                    <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400">{error}</span>
                    </div>
                  </div>
                ) : !report ? (
                  <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8">
                    <Brain className="w-16 h-16 text-neutral-700" />
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-neutral-400">Relatório não disponível</h3>
                      <p className="text-sm text-neutral-600 mt-2">
                        O relatório master será gerado automaticamente quando houver dados suficientes.
                      </p>
                    </div>
                    <button
                      onClick={updateMasterReport}
                      disabled={updating}
                      className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition"
                    >
                      {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                      {updating ? 'Gerando...' : 'Gerar Agora'}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Stats Bar */}
                    <div className="flex items-center gap-6 px-6 py-3 bg-neutral-900/30 border-b border-neutral-800">
                      <div className="flex items-center gap-2 text-sm">
                        <BarChart3 className="w-4 h-4 text-neutral-500" />
                        <span className="text-neutral-400">Conversas:</span>
                        <span className="text-white font-medium">{report.total_conversations_all_time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-neutral-500" />
                        <span className="text-neutral-400">Relatos:</span>
                        <span className="text-white font-medium">{report.total_reports_all_time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-neutral-500" />
                        <span className="text-neutral-400">Insights:</span>
                        <span className="text-white font-medium">{report.insights?.length || 0}</span>
                      </div>
                      <div className="ml-auto flex items-center gap-2 text-xs text-neutral-500">
                        <Clock className="w-3 h-3" />
                        Atualizado: {new Date(report.updated_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    {/* Report Content */}
                    <div className="flex-1 overflow-y-auto p-6 report-content-scroll">
                      <div
                        className="prose prose-invert prose-neutral max-w-none"
                        style={{
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#1e3a5f #0f172a',
                        }}
                        dangerouslySetInnerHTML={{ __html: report.content_html }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
