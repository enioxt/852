'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, RefreshCw, Clock, FileText, AlertCircle, TrendingUp, BarChart3,
  X, Download, Copy, Share2, FileDown, FileText as FileTextIcon, Check,
  Sparkles, ChevronRight, Menu
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

interface HotTopic {
  id: string;
  title: string;
  score: number;
  votes: number;
  category: string | null;
  age_hours: number;
}

interface VersionHistory {
  id: string;
  version: number;
  created_at: string;
  updated_at: string;
  content_summary: string | null;
  total_conversations_all_time: number;
  total_reports_all_time: number;
  model_id: string;
  provider: string;
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
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [versionHistory, setVersionHistory] = useState<VersionHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<number | null>(null);
  const [loadingVersion, setLoadingVersion] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

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

  // ESC key handler + focus trap + swipe
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    // Focus first focusable element
    const timer = setTimeout(() => {
      const firstButton = modalRef.current?.querySelector('button');
      firstButton?.focus();
    }, 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      // Focus trap
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  // Load report when modal opens
  useEffect(() => {
    if (isOpen) {
      loadMasterReport();
      loadHotTopics();
      loadVersionHistory();
    }
  }, [isOpen, loadMasterReport]);

  // Load hot topics
  const loadHotTopics = async () => {
    try {
      setLoadingTopics(true);
      const res = await fetch('/api/hot-topics?limit=8');
      const data = await res.json();
      if (data.topics) {
        setHotTopics(data.topics.slice(0, 6));
      }
    } catch (err) {
      console.error('[MasterModal] Failed to load hot topics:', err);
    } finally {
      setLoadingTopics(false);
    }
  };

  // Load version history
  const loadVersionHistory = async () => {
    try {
      const res = await fetch('/api/ai-reports/master/history');
      const data = await res.json();
      if (data.history) {
        setVersionHistory(data.history);
      }
    } catch (err) {
      console.error('[MasterModal] Failed to load version history:', err);
    }
  };

  // View specific version
  const viewVersion = async (version: number) => {
    if (version === report?.version) {
      setViewingVersion(null);
      return;
    }
    try {
      setLoadingVersion(true);
      const res = await fetch(`/api/ai-reports/master/history/${version}`);
      const data = await res.json();
      if (data.exists) {
        setReport(data.report);
        setViewingVersion(version);
      }
    } catch (err) {
      console.error('[MasterModal] Failed to load version:', err);
    } finally {
      setLoadingVersion(false);
    }
  };

  // Back to current version
  const backToCurrent = async () => {
    setViewingVersion(null);
    await loadMasterReport();
  };

  // Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!touchStartY.current || !touchEndY.current) return;

    const diff = touchStartY.current - touchEndY.current;
    const threshold = 100; // min swipe distance

    // Swipe down to close (only if at top of scroll)
    if (diff < -threshold && contentRef.current) {
      const isAtTop = contentRef.current.scrollTop === 0;
      if (isAtTop) {
        onClose();
      }
    }

    touchStartY.current = null;
    touchEndY.current = null;
  };

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

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="flex flex-col flex-1 p-6 space-y-4">
      {/* Stats skeleton */}
      <div className="flex items-center gap-6 pb-3 border-b border-neutral-800/50">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-neutral-800 animate-pulse" />
            <div className="w-16 h-3 rounded bg-neutral-800 animate-pulse" />
            <div className="w-8 h-4 rounded bg-neutral-800 animate-pulse" />
          </div>
        ))}
      </div>
      {/* Content skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-3/4 rounded bg-neutral-800 animate-pulse" />
        <div className="h-4 w-full rounded bg-neutral-800 animate-pulse" />
        <div className="h-4 w-5/6 rounded bg-neutral-800 animate-pulse" />
        <div className="h-4 w-4/5 rounded bg-neutral-800 animate-pulse" />
        <div className="h-32 w-full rounded bg-neutral-800 animate-pulse mt-4" />
        <div className="h-4 w-full rounded bg-neutral-800 animate-pulse" />
        <div className="h-4 w-3/4 rounded bg-neutral-800 animate-pulse" />
      </div>
    </div>
  );

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

          {/* Modal - Responsive sizing */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 sm:inset-4 md:inset-8 lg:inset-16 z-50 flex items-center justify-center pointer-events-none p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div
              className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-[95vw] md:max-w-[85vw] lg:max-w-[75vw] bg-neutral-950 border border-neutral-800 sm:rounded-2xl overflow-hidden flex flex-col pointer-events-auto shadow-2xl"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-violet-500/20 rounded-lg flex-shrink-0">
                    <Brain className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <h2 id="modal-title" className="text-base sm:text-lg font-semibold text-white truncate">
                      Relatório de Inteligência
                    </h2>
                    {report && (
                      <p className="text-xs text-neutral-400 truncate">
                        v{report.version} • {report.total_conversations_all_time} conversas
                      </p>
                    )}
                  </div>
                </div>

                {/* Desktop Actions */}
                <div className="hidden sm:flex items-center gap-2">
                  {/* History Button */}
                  {versionHistory.length > 1 && (
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm transition"
                    >
                      <Clock className="w-4 h-4" />
                      <span className="hidden lg:inline">Histórico</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-700">{versionHistory.length}</span>
                    </button>
                  )}
                  {/* Update Button */}
                  <button
                    onClick={updating || loading ? undefined : viewingVersion ? backToCurrent : updateMasterReport}
                    disabled={updating || loading}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm transition disabled:opacity-50"
                  >
                    {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : viewingVersion ? <RefreshCw className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                    <span className="hidden sm:inline">{updating ? 'Atualizando...' : viewingVersion ? 'Voltar Atual' : 'Atualizar'}</span>
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

                  {/* Close Desktop */}
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-800 hover:bg-red-900/30 hover:text-red-400 text-neutral-400 transition ml-2"
                    aria-label="Fechar modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Actions Menu Button */}
                <div className="flex sm:hidden items-center gap-2">
                  <button
                    onClick={() => setShowMobileActions(!showMobileActions)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-800 text-neutral-400 transition"
                    aria-label="Ações"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-800 hover:bg-red-900/30 hover:text-red-400 text-neutral-400 transition"
                    aria-label="Fechar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Mobile Actions Dropdown */}
              <AnimatePresence>
                {showMobileActions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="sm:hidden border-t border-neutral-800 bg-neutral-900/50 overflow-hidden"
                  >
                    <div className="p-3 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => { updateMasterReport(); setShowMobileActions(false); }}
                        disabled={updating}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 text-neutral-300 text-sm"
                      >
                        <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
                        Atualizar
                      </button>
                      {report && (
                        <>
                          <button
                            onClick={() => { handleCopyContent(); setShowMobileActions(false); }}
                            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 text-neutral-300 text-sm"
                          >
                            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            Copiar
                          </button>
                          <button
                            onClick={() => { handleExportPDF(); setShowMobileActions(false); }}
                            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 text-neutral-300 text-sm"
                          >
                            <FileDown className="w-4 h-4" />
                            PDF
                          </button>
                          <button
                            onClick={() => { handleExportMarkdown(); setShowMobileActions(false); }}
                            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 text-neutral-300 text-sm"
                          >
                            <FileTextIcon className="w-4 h-4" />
                            MD
                          </button>
                          <button
                            onClick={() => { handleShare(); setShowMobileActions(false); }}
                            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm col-span-2"
                          >
                            <Share2 className="w-4 h-4" />
                            Compartilhar
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Content Area with Sidebar */}
              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                {/* Report Content */}
                <div ref={contentRef} className="flex-1 overflow-hidden flex flex-col min-w-0">
                  {loading ? (
                    <LoadingSkeleton />
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
                      {/* Version Badge - When viewing old version */}
                      {viewingVersion && (
                        <div className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-amber-900/20 border-b border-amber-800/30">
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          <span className="text-xs text-amber-300">
                            Visualizando versão {viewingVersion} (não é a atual)
                          </span>
                          <button
                            onClick={backToCurrent}
                            className="ml-auto text-xs text-amber-400 hover:text-amber-300 underline"
                          >
                            Ver atual
                          </button>
                        </div>
                      )}

                      {/* Stats Bar - Responsive */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 sm:px-6 py-3 bg-neutral-900/30 border-b border-neutral-800">
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-500" />
                          <span className="text-neutral-400">Conversas:</span>
                          <span className="text-white font-medium">{report.total_conversations_all_time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-500" />
                          <span className="text-neutral-400">Relatos:</span>
                          <span className="text-white font-medium">{report.total_reports_all_time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-500" />
                          <span className="text-neutral-400">Insights:</span>
                          <span className="text-white font-medium">{report.insights?.length || 0}</span>
                        </div>
                        <div className="ml-auto flex items-center gap-2 text-[10px] sm:text-xs text-neutral-500">
                          <Clock className="w-3 h-3" />
                          {new Date(report.updated_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>

                      {/* Report Content with Pull-to-Close Hint */}
                      <div className="flex-1 overflow-y-auto p-4 sm:p-6 report-content-scroll relative">
                        {/* Mobile pull hint */}
                        <div className="sm:hidden flex items-center justify-center gap-2 py-2 text-[10px] text-neutral-600 border-b border-neutral-800/50 mb-4">
                          <Sparkles className="w-3 h-3" />
                          Puxe para baixo no topo para fechar
                        </div>
                        <div
                          className="prose prose-invert prose-neutral max-w-none prose-sm sm:prose-base"
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

                {/* Right Sidebar - Hot Topics & History */}
                <div className="hidden lg:flex w-72 flex-col border-l border-neutral-800 bg-neutral-900/20 overflow-hidden">
                  {/* Sidebar Tabs */}
                  <div className="flex border-b border-neutral-800/50">
                    <button
                      onClick={() => setShowHistory(false)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition ${!showHistory ? 'text-white border-b-2 border-amber-400' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Tópicos
                    </button>
                    <button
                      onClick={() => setShowHistory(true)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition ${showHistory ? 'text-white border-b-2 border-violet-400' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Histórico
                      {versionHistory.length > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-neutral-800">{versionHistory.length}</span>
                      )}
                    </button>
                  </div>

                  {/* Hot Topics Panel */}
                  {!showHistory && (
                    <div className="flex-1 overflow-hidden flex flex-col">
                      <div className="p-3 border-b border-neutral-800/50">
                        <p className="text-[10px] text-neutral-500">
                          Os mais discutidos agora
                        </p>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {loadingTopics ? (
                          <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="h-16 rounded-lg bg-neutral-800/30 animate-pulse" />
                            ))}
                          </div>
                        ) : hotTopics.length === 0 ? (
                          <p className="text-xs text-neutral-500 text-center py-4">
                            Nenhum tópico em alta
                          </p>
                        ) : (
                          hotTopics.map((topic) => (
                            <a
                              key={topic.id}
                              href={`/papo-de-corredor?view=discussoes&id=${topic.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-3 rounded-lg bg-neutral-800/30 hover:bg-neutral-800/60 border border-neutral-800/50 hover:border-neutral-700 transition group"
                            >
                              <p className="text-xs text-neutral-300 line-clamp-2 group-hover:text-white transition">
                                {topic.title}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                {topic.category && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                                    {topic.category}
                                  </span>
                                )}
                                <span className="text-[9px] text-neutral-500 flex items-center gap-0.5">
                                  <TrendingUp className="w-2.5 h-2.5" />
                                  {topic.votes || 0}
                                </span>
                              </div>
                            </a>
                          ))
                        )}
                      </div>
                      <div className="p-3 border-t border-neutral-800/50">
                        <a
                          href="/papo-de-corredor"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 text-xs text-neutral-400 hover:text-white transition"
                        >
                          Ver todos os tópicos
                          <ChevronRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* History Panel */}
                  {showHistory && (
                    <div className="flex-1 overflow-hidden flex flex-col">
                      <div className="p-3 border-b border-neutral-800/50">
                        <p className="text-[10px] text-neutral-500">
                          Versões anteriores do relatório
                        </p>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {versionHistory.length === 0 ? (
                          <p className="text-xs text-neutral-500 text-center py-4">
                            Nenhuma versão anterior
                          </p>
                        ) : (
                          versionHistory.map((v) => (
                            <button
                              key={v.id}
                              onClick={() => viewVersion(v.version)}
                              disabled={loadingVersion}
                              className={`w-full text-left p-3 rounded-lg border transition ${viewingVersion === v.version
                                  ? 'bg-violet-900/30 border-violet-700'
                                  : 'bg-neutral-800/30 hover:bg-neutral-800/60 border-neutral-800/50 hover:border-neutral-700'
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-white">
                                  Versão {v.version}
                                </span>
                                {v.version === Math.max(...versionHistory.map(h => h.version)) && !viewingVersion && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-900/30 text-green-400">
                                    Atual
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-neutral-400 mt-1">
                                {new Date(v.created_at).toLocaleDateString('pt-BR')}
                              </p>
                              {v.content_summary && (
                                <p className="text-[10px] text-neutral-500 mt-1 line-clamp-2">
                                  {v.content_summary.slice(0, 60)}...
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2 text-[9px] text-neutral-500">
                                <span>{v.total_conversations_all_time} conversas</span>
                                <span>•</span>
                                <span>{v.total_reports_all_time} relatos</span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                      {viewingVersion && (
                        <div className="p-3 border-t border-neutral-800/50">
                          <button
                            onClick={backToCurrent}
                            className="w-full flex items-center justify-center gap-2 text-xs text-violet-400 hover:text-violet-300 transition"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Voltar para versão atual
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
