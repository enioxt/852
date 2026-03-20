'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText, Loader2, Download, Eye, Sparkles,
  Users, Trash2, MessageCircle, ArrowRight, Shield, Clock, Bot, AlertCircle
} from 'lucide-react';
import { listSharedReports, deleteReport, type Report, loadAllPublicReports, deleteReportFromServer } from '@/lib/report-store';
import { getOrCreateSessionHash } from '@/lib/session';
import MarkdownMessage from '@/components/chat/MarkdownMessage';

type Tab = 'shared' | 'intelligence' | 'generator';

interface IntelligenceIssue {
  id: string;
  title: string;
  status: string;
  votes: number;
  category: string | null;
}

interface IntelligenceReport {
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
  related_issues: IntelligenceIssue[];
}

const EXAMPLE_PROMPTS = [
  'Relatório semanal de problemas estruturais nas delegacias do interior de MG',
  'Análise de tendências: falta de efetivo vs. sobrecarga de trabalho por região',
  'Dashboard executivo: top 10 problemas mais relatados pelos policiais civis',
  'Relatório de engajamento da plataforma Tira-Voz - métricas do mês',
];

export function ReportsFeed() {
  const [requestedTab, setRequestedTab] = useState<string | null>(null);
  const [requestedReportId, setRequestedReportId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('shared');
  const [reports, setReports] = useState<Report[]>([]);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [intelReports, setIntelReports] = useState<IntelligenceReport[]>([]);
  const [expandedIntelReport, setExpandedIntelReport] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionHash] = useState(() => (typeof window === 'undefined' ? '' : getOrCreateSessionHash()));
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const localReports = listSharedReports();
    setReports(localReports);

    if (!sessionHash) return;

    const loadServerReports = async () => {
      try {
        const serverReports = await loadAllPublicReports(sessionHash);
        if (serverReports.length > 0) {
          setReports(serverReports);
        }
      } catch (loadError) {
        console.error('[852-reports] failed to load shared reports:', loadError instanceof Error ? loadError.message : 'Unknown');
      }
    };

    void loadServerReports();
  }, [sessionHash]);

  useEffect(() => {
    const loadIntelligenceReports = async () => {
      try {
        const res = await fetch('/api/ai-reports?limit=12');
        if (!res.ok) return;
        const data = await res.json();
        setIntelReports(Array.isArray(data.reports) ? data.reports : []);
      } catch (loadError) {
        console.error('[852-reports] failed to load intelligence reports:', loadError instanceof Error ? loadError.message : 'Unknown');
      }
    };

    void loadIntelligenceReports();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setRequestedTab(params.get('tab'));
    setRequestedReportId(params.get('reportId'));
  }, []);

  useEffect(() => {
    if (requestedTab === 'generator' || requestedTab === 'shared' || requestedTab === 'intelligence') {
      setTab(requestedTab);
    }
  }, [requestedTab]);

  useEffect(() => {
    if (requestedTab === 'intelligence' && requestedReportId) {
      setExpandedIntelReport(requestedReportId);
    }
  }, [requestedReportId, requestedTab]);

  const handleDeleteReport = async (id: string) => {
    const report = reports.find((item) => item.id === id);
    if (report?.serverId) {
      await deleteReportFromServer(report.serverId);
    }
    deleteReport(id);
    setExpandedReport(null);
    if (sessionHash) {
      try {
        const refreshed = await loadAllPublicReports(sessionHash);
        setReports(refreshed);
      } catch {
        setReports(prev => prev.filter(r => r.id !== id));
      }
    } else {
      setReports(prev => prev.filter(r => r.id !== id));
    }
  };

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setHtml(null);

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao gerar relatório');
      }

      const text = await res.text();
      setHtml(text);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const downloadHtml = () => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-852-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="w-full text-neutral-200 flex flex-col">
      <div className="mx-auto flex w-full max-w-4xl items-start justify-end px-4 pt-4 sm:px-6">
        {html && tab === 'generator' && (
          <button onClick={downloadHtml} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition text-sm">
            <Download className="w-4 h-4" /> Baixar HTML
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-4 border-b border-neutral-800 bg-neutral-950">
        <div className="max-w-4xl mx-auto flex">
          <button
            onClick={() => setTab('shared')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition ${
              tab === 'shared'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Users className="w-4 h-4" />
            Relatos Compartilhados
            {reports.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-900/30 text-blue-400">{reports.length}</span>
            )}
          </button>
          <button
            onClick={() => setTab('generator')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition ${
              tab === 'generator'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Gerador de Relatórios
          </button>
          <button
            onClick={() => setTab('intelligence')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition ${
              tab === 'intelligence'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Bot className="w-4 h-4" />
            Inteligência
            {intelReports.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400">{intelReports.length}</span>
            )}
          </button>
        </div>
      </div>

      <main className="flex-1 p-4 max-w-4xl mx-auto w-full space-y-4">
        {/* ═══ Shared Reports Tab ═══ */}
        {tab === 'shared' && (
          <>
            {reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-neutral-700" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-neutral-400">Nenhum relato compartilhado</h3>
                  <p className="text-sm text-neutral-600 max-w-md">
                    Quando você compartilhar um relato pelo chat, ele aparecerá aqui. Você tem total controle e pode apagar a qualquer momento.
                  </p>
                </div>
                <Link
                  href="/chat"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition mt-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Iniciar conversa
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-500">
                    {reports.length} relato(s) compartilhado(s) por policiais • Visíveis em qualquer dispositivo
                  </p>
                </div>

                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden"
                  >
                    {/* Report Header */}
                    <button
                      onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-800/30 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-900/20 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {report.title || `Relato — ${report.sanitizedMessages.filter(m => m.role === 'user').length} mensagem(ns)`}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1 text-[10px] text-neutral-500">
                              <Clock className="w-3 h-3" /> {formatDate(report.sharedAt || report.createdAt)}
                            </span>
                            {report.piiRemoved > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-400">
                                {report.piiRemoved} dado(s) removido(s)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Eye className="w-4 h-4 text-neutral-600" />
                    </button>

                    {/* Report Content (expanded) */}
                    {expandedReport === report.id && (
                      <div className="border-t border-neutral-800 p-4 space-y-3">
                        {(report.reporterTypeLabel || report.tags?.length || report.summary) && (
                          <div className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                            {report.reporterTypeLabel && (
                              <p className="text-[11px] text-neutral-500">{report.reporterTypeLabel}</p>
                            )}
                            {report.tags && report.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {report.tags.map((tag) => (
                                  <span key={tag} className="text-[10px] px-2 py-1 rounded-lg bg-blue-900/20 text-blue-400 border border-blue-800/30">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {report.summary && (
                              <p className="text-xs text-neutral-400 leading-relaxed">{report.summary}</p>
                            )}
                          </div>
                        )}

                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {report.formattedMarkdown ? (
                            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 text-sm text-neutral-300 leading-relaxed">
                              <MarkdownMessage content={report.formattedMarkdown} />
                            </div>
                          ) : (
                            report.sanitizedMessages.map((m, i) => (
                              <div key={i} className={`flex gap-2 ${m.role === 'user' ? '' : 'opacity-60'}`}>
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                  m.role === 'user' ? 'bg-blue-900/30 text-blue-400' : 'bg-neutral-800 text-neutral-500'
                                }`}>
                                  {m.role === 'user' ? 'Policial' : '852-IA'}
                                </span>
                                <p className="text-xs text-neutral-400 leading-relaxed flex-1">{m.content}</p>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                          <p className="text-[10px] text-neutral-600">
                            {report.isOwn ? 'Você tem total controle sobre este relato' : 'Relato de outro policial — visível a todos'}
                          </p>
                          {report.isOwn && (
                            <button
                              onClick={() => void handleDeleteReport(report.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/20 text-red-400 text-xs hover:bg-red-900/40 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Apagar relato
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'intelligence' && (
          <>
            {intelReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-neutral-700" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-neutral-400">Nenhum relatório de inteligência ainda</h3>
                  <p className="text-sm text-neutral-600 max-w-xl">
                    Esses relatórios agregam conversas, relatos compartilhados e tópicos pendentes para gerar issues automaticamente.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-neutral-500">
                    {intelReports.length} relatório(s) de inteligência • SSOT para temas que viraram issues automaticamente
                  </p>
                </div>

                {intelReports.map((report) => (
                  <div key={report.id} className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
                    <button
                      onClick={() => setExpandedIntelReport(expandedIntelReport === report.id ? null : report.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-800/30 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-900/20 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            Relatório de inteligência • {report.issue_count} issue(s) vinculada(s)
                          </p>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1 text-[10px] text-neutral-500">
                              <Clock className="w-3 h-3" /> {new Date(report.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-400">
                              {report.conversation_count} conversas
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-400">
                              {Array.isArray(report.pending_topics) ? report.pending_topics.length : 0} tópicos pendentes
                            </span>
                          </div>
                        </div>
                      </div>
                      <Eye className="w-4 h-4 text-neutral-600" />
                    </button>

                    {expandedIntelReport === report.id && (
                      <div className="border-t border-neutral-800 p-4 space-y-4">
                        {report.content_summary && (
                          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                            <p className="text-xs text-neutral-300 leading-relaxed">{report.content_summary}</p>
                          </div>
                        )}

                        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-neutral-400">
                              <Eye className="w-4 h-4" /> Preview do relatório
                            </div>
                            <div className="border border-neutral-700 rounded-xl overflow-hidden bg-white">
                              <iframe
                                srcDoc={report.content_html}
                                className="w-full min-h-[420px] border-0"
                                title={`AI Report ${report.id}`}
                                sandbox="allow-same-origin"
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
                              <div className="flex items-center gap-2 text-sm text-white">
                                <AlertCircle className="w-4 h-4 text-amber-400" /> Issues geradas
                              </div>
                              {report.related_issues.length === 0 ? (
                                <p className="text-xs text-neutral-500">Nenhuma issue vinculada a este relatório.</p>
                              ) : (
                                <div className="space-y-2">
                                  {report.related_issues.map((issue) => (
                                    <Link
                                      key={issue.id}
                                      href={`/issues?aiReportId=${report.id}`}
                                      className="block rounded-lg border border-neutral-800 p-3 hover:border-neutral-700 hover:bg-neutral-900/50 transition"
                                    >
                                      <p className="text-xs font-medium text-white">{issue.title}</p>
                                      <div className="mt-1 flex items-center gap-2 text-[10px] text-neutral-500 flex-wrap">
                                        <span>{issue.votes} voto(s)</span>
                                        <span>{issue.status}</span>
                                        {issue.category && <span>{issue.category}</span>}
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              )}
                              <Link
                                href={`/issues?aiReportId=${report.id}`}
                                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition"
                              >
                                Ver issues deste relatório <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══ Generator Tab ═══ */}
        {tab === 'generator' && (
          <>
            <div className="space-y-3">
              <div className="flex gap-2">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Descreva o relatório que deseja gerar..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none min-h-[80px]"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      generate();
                    }
                  }}
                />
                <button
                  onClick={generate}
                  disabled={loading || !prompt.trim()}
                  className="px-4 bg-purple-600 text-white rounded-xl hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition flex-shrink-0 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                </button>
              </div>
              {!html && (
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_PROMPTS.map((ep, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(ep)}
                      className="text-xs bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-full text-neutral-400 hover:text-white hover:border-purple-500/50 transition"
                    >
                      {ep.length > 60 ? ep.slice(0, 60) + '...' : ep}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                <p className="text-sm text-neutral-400">Gerando relatório com IA...</p>
              </div>
            )}

            {html && !loading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <Eye className="w-4 h-4" /> Preview do Relatório
                </div>
                <div className="border border-neutral-700 rounded-xl overflow-hidden bg-white">
                  <iframe
                    ref={iframeRef}
                    srcDoc={html}
                    className="w-full min-h-[600px] border-0"
                    title="Report Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
