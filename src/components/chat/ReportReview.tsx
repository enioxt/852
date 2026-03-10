'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X, Shield, AlertTriangle, CheckCircle, Send, Share2,
  Trash2, Copy, Check, Loader2, ChevronDown, ChevronUp,
  Eye, EyeOff, MessageCircle, Lightbulb
} from 'lucide-react';
import { scanForPII, sanitizeText, getPIISummary, type PIIFinding } from '@/lib/pii-scanner';
import {
  createReport, shareReport, deleteReport, getShareUrl,
  type ReportMessage
} from '@/lib/report-store';

interface ReviewData {
  completude: number;
  resumo: string;
  temas: string[];
  pontosCegos: string[];
  sugestoes: string[];
  impacto: string;
}

interface Props {
  messages: Array<{ role: string; content: string }>;
  conversationId: string;
  onClose: () => void;
  onSuggestionClick?: (suggestion: string) => void;
}

type Step = 'scanning' | 'pii_review' | 'ai_review' | 'ready' | 'shared';

export default function ReportReview({ messages, conversationId, onClose, onSuggestionClick }: Props) {
  const [step, setStep] = useState<Step>('scanning');
  const [piiFindings, setPiiFindings] = useState<PIIFinding[]>([]);
  const [acceptedRemovals, setAcceptedRemovals] = useState<Set<number>>(new Set());
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['pii', 'ai']));

  // Step 1: Scan for PII on mount
  useEffect(() => {
    const allText = messages.map(m => m.content).join('\n');
    const findings = scanForPII(allText);
    setPiiFindings(findings);
    // Auto-accept all removals by default
    setAcceptedRemovals(new Set(findings.map((_, i) => i)));
    setStep(findings.length > 0 ? 'pii_review' : 'ai_review');
  }, [messages]);

  // Step 2: Auto-trigger AI review when entering ai_review step
  useEffect(() => {
    if (step === 'ai_review' && !reviewData && !reviewLoading) {
      runAIReview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const toggleRemoval = (index: number) => {
    setAcceptedRemovals(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const getSanitizedMessages = useCallback((): ReportMessage[] => {
    const acceptedFindings = piiFindings.filter((_, i) => acceptedRemovals.has(i));
    return messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: sanitizeText(m.content, acceptedFindings.filter(f => {
        const msgText = m.content;
        return msgText.includes(f.matched);
      })),
    }));
  }, [messages, piiFindings, acceptedRemovals]);

  const runAIReview = async () => {
    setReviewLoading(true);
    setReviewError(null);
    try {
      const sanitized = getSanitizedMessages();
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: sanitized }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${res.status}`);
      }

      // Read streamed response
      const reader = res.body?.getReader();
      if (!reader) throw new Error('Sem resposta do servidor');

      let fullText = '';
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      // Parse JSON from response (may have markdown wrapping)
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Resposta inválida do agente');

      const data: ReviewData = JSON.parse(jsonMatch[0]);
      setReviewData(data);
      setStep('ready');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setReviewError(msg);
      // Still allow sharing even if review fails
      setStep('ready');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleShare = () => {
    const sanitized = getSanitizedMessages();
    const report = createReport(
      conversationId,
      messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      sanitized,
      acceptedRemovals.size,
      reviewData?.sugestoes,
    );
    shareReport(report.id);
    setReportId(report.id);
    setStep('shared');
  };

  const handleDelete = () => {
    if (reportId) {
      deleteReport(reportId);
      setReportId(null);
    }
    onClose();
  };

  const handleCopyLink = async () => {
    if (!reportId) return;
    await navigator.clipboard.writeText(getShareUrl(reportId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/chat` : '';
    const text = encodeURIComponent(
      `Colega, relatei problemas da nossa delegacia pelo 852 Inteligência. É anônimo e seguro. Acessa e relata também: ${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const userMessageCount = messages.filter(m => m.role === 'user').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Revisão do Relatório</h2>
              <p className="text-[11px] text-neutral-500">
                {step === 'scanning' && 'Analisando dados sensíveis...'}
                {step === 'pii_review' && `${piiFindings.length} dado(s) sensível(is) encontrado(s)`}
                {step === 'ai_review' && 'Analisando completude do relato...'}
                {step === 'ready' && 'Relatório pronto para compartilhar'}
                {step === 'shared' && 'Relatório compartilhado com sucesso'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Progress Steps */}
          <div className="flex items-center gap-2 text-[11px]">
            <StepIndicator active={step === 'scanning' || step === 'pii_review'} done={step !== 'scanning' && step !== 'pii_review'} label="1. Privacidade" />
            <div className="flex-1 h-px bg-neutral-800" />
            <StepIndicator active={step === 'ai_review'} done={step === 'ready' || step === 'shared'} label="2. Análise IA" />
            <div className="flex-1 h-px bg-neutral-800" />
            <StepIndicator active={step === 'ready'} done={step === 'shared'} label="3. Compartilhar" />
          </div>

          {/* Scanning spinner */}
          {step === 'scanning' && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <p className="text-sm text-neutral-400">Verificando dados sensíveis...</p>
            </div>
          )}

          {/* PII Review */}
          {(step === 'pii_review' || ((step === 'ready' || step === 'ai_review' || step === 'shared') && piiFindings.length > 0)) && (
            <div className="space-y-2">
              <button
                onClick={() => toggleSection('pii')}
                className="w-full flex items-center justify-between py-2 text-left"
              >
                <div className="flex items-center gap-2">
                  {piiFindings.length > 0 ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                  <span className="text-sm font-medium text-white">Dados Sensíveis</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-400">
                    {acceptedRemovals.size}/{piiFindings.length} remoções
                  </span>
                </div>
                {expandedSections.has('pii') ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
              </button>

              {expandedSections.has('pii') && (
                <div className="space-y-2 pl-6">
                  {piiFindings.length === 0 ? (
                    <p className="text-xs text-green-400">Nenhum dado sensível detectado.</p>
                  ) : (
                    <>
                      <p className="text-xs text-neutral-500">{getPIISummary(piiFindings)}</p>
                      {piiFindings.map((f, i) => (
                        <label key={i} className="flex items-start gap-3 p-3 rounded-xl bg-neutral-800/50 border border-neutral-800 hover:border-neutral-700 cursor-pointer transition">
                          <input
                            type="checkbox"
                            checked={acceptedRemovals.has(i)}
                            onChange={() => toggleRemoval(i)}
                            className="mt-0.5 rounded border-neutral-600 bg-neutral-700 text-blue-500 focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 font-medium">{f.label}</span>
                            </div>
                            <p className="text-xs text-neutral-300 mt-1 font-mono break-all">
                              &quot;{f.matched}&quot; → <span className="text-amber-400">{f.suggestion}</span>
                            </p>
                          </div>
                        </label>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* AI Review */}
          {(step === 'ai_review' || step === 'ready' || step === 'shared') && (
            <div className="space-y-2">
              <button
                onClick={() => toggleSection('ai')}
                className="w-full flex items-center justify-between py-2 text-left"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Análise do Agente</span>
                  {reviewData && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      reviewData.completude >= 7 ? 'bg-green-900/30 text-green-400' :
                      reviewData.completude >= 4 ? 'bg-amber-900/30 text-amber-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                      {reviewData.completude}/10 completo
                    </span>
                  )}
                </div>
                {expandedSections.has('ai') ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
              </button>

              {expandedSections.has('ai') && (
                <div className="pl-6 space-y-3">
                  {reviewLoading && (
                    <div className="flex items-center gap-2 py-4">
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                      <p className="text-xs text-neutral-400">Analisando qualidade do relato...</p>
                    </div>
                  )}

                  {reviewError && (
                    <div className="p-3 rounded-xl bg-red-900/20 border border-red-800/30 text-xs text-red-400">
                      {reviewError}
                      <button onClick={runAIReview} className="ml-2 underline hover:text-red-300">Tentar novamente</button>
                    </div>
                  )}

                  {reviewData && (
                    <>
                      {/* Summary */}
                      <div className="p-3 rounded-xl bg-neutral-800/50 border border-neutral-800">
                        <p className="text-xs text-neutral-300 leading-relaxed">{reviewData.resumo}</p>
                      </div>

                      {/* Topics */}
                      {reviewData.temas.length > 0 && (
                        <div>
                          <p className="text-[11px] text-neutral-500 mb-1.5">Temas identificados</p>
                          <div className="flex flex-wrap gap-1.5">
                            {reviewData.temas.map((t, i) => (
                              <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-blue-900/20 text-blue-400 border border-blue-800/30">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Blind spots + Suggestions */}
                      {reviewData.sugestoes.length > 0 && (
                        <div>
                          <p className="text-[11px] text-neutral-500 mb-1.5">Sugestões para enriquecer o relato</p>
                          <div className="space-y-1.5">
                            {reviewData.sugestoes.map((s, i) => (
                              <button
                                key={i}
                                onClick={() => onSuggestionClick?.(s)}
                                className="w-full text-left p-2.5 rounded-xl bg-neutral-800/50 border border-neutral-800 hover:border-blue-700 hover:bg-blue-900/10 text-xs text-neutral-300 hover:text-white transition group flex items-start gap-2"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-neutral-600 group-hover:text-blue-400 mt-0.5 flex-shrink-0" />
                                {s}
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-neutral-600 mt-2">Clique para continuar a conversa com essa pergunta</p>
                        </div>
                      )}

                      {/* Impact */}
                      {reviewData.impacto && (
                        <div className="p-3 rounded-xl bg-green-900/10 border border-green-800/20">
                          <p className="text-[11px] text-green-400 font-medium mb-1">Impacto do relato</p>
                          <p className="text-xs text-neutral-400 leading-relaxed">{reviewData.impacto}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Preview Toggle */}
          {(step === 'ready' || step === 'shared') && (
            <div className="space-y-2">
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className="flex items-center gap-2 text-xs text-neutral-500 hover:text-white transition"
              >
                {showOriginal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showOriginal ? 'Ocultar prévia' : 'Ver prévia do relatório'}
              </button>

              {showOriginal && (
                <div className="max-h-48 overflow-y-auto rounded-xl bg-neutral-800/30 border border-neutral-800 p-3 space-y-2">
                  {getSanitizedMessages()
                    .filter(m => m.role === 'user')
                    .map((m, i) => (
                      <p key={i} className="text-xs text-neutral-400 leading-relaxed">{m.content}</p>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Shared Success */}
          {step === 'shared' && (
            <div className="p-4 rounded-xl bg-green-900/10 border border-green-800/20 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-sm font-medium text-green-400">Relatório compartilhado com sucesso!</p>
              </div>
              <p className="text-xs text-neutral-400">
                Seu relato foi registrado de forma anônima. Você tem total controle e pode apagar a qualquer momento.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={handleCopyLink} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 text-xs text-neutral-300 hover:text-white hover:bg-neutral-700 transition">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar link'}
                </button>
                <button onClick={shareWhatsApp} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-800/30 text-xs text-green-400 hover:bg-green-800/50 transition">
                  <Share2 className="w-3.5 h-3.5" />
                  Compartilhar no WhatsApp
                </button>
                <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-900/20 text-xs text-red-400 hover:bg-red-900/40 transition">
                  <Trash2 className="w-3.5 h-3.5" />
                  Apagar relatório
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 flex items-center justify-between">
          <div className="text-[10px] text-neutral-600">
            {userMessageCount} mensagem(ns) do policial
          </div>
          <div className="flex items-center gap-2">
            {step === 'pii_review' && (
              <button
                onClick={() => setStep('ai_review')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition"
              >
                Continuar <ChevronDown className="w-3.5 h-3.5 rotate-[-90deg]" />
              </button>
            )}
            {step === 'ready' && (
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-medium hover:bg-green-500 transition"
              >
                <Send className="w-3.5 h-3.5" />
                Compartilhar relatório
              </button>
            )}
            {step === 'shared' && (
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-800 text-white text-xs font-medium hover:bg-neutral-700 transition"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${active ? 'text-blue-400' : done ? 'text-green-400' : 'text-neutral-600'}`}>
      {done ? (
        <CheckCircle className="w-3.5 h-3.5" />
      ) : active ? (
        <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-400 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        </div>
      ) : (
        <div className="w-3.5 h-3.5 rounded-full border-2 border-neutral-700" />
      )}
      <span className="font-medium">{label}</span>
    </div>
  );
}
