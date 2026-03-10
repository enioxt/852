'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, FileText, Loader2, Download, Eye, Sparkles,
  Users, Trash2, MessageCircle, ArrowRight, Shield, Clock
} from 'lucide-react';
import { listSharedReports, deleteReport, type Report } from '@/lib/report-store';

type Tab = 'shared' | 'generator';

const EXAMPLE_PROMPTS = [
  'Relatório semanal de problemas estruturais nas delegacias do interior de MG',
  'Análise de tendências: falta de efetivo vs. sobrecarga de trabalho por região',
  'Dashboard executivo: top 10 problemas mais relatados pelos policiais civis',
  'Relatório de engajamento da plataforma 852 Inteligência - métricas do mês',
];

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('shared');
  const [reports, setReports] = useState<Report[]>([]);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setReports(listSharedReports());
  }, []);

  const handleDeleteReport = (id: string) => {
    deleteReport(id);
    setReports(listSharedReports());
    setExpandedReport(null);
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
    <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col">
      <header className="flex items-center justify-between p-4 bg-neutral-900 border-b border-neutral-800 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-neutral-400" />
          </Link>
          <div className="p-2 bg-blue-600/20 rounded-full">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-white">Relatórios</h1>
            <p className="text-xs text-neutral-400">Relatos compartilhados e gerador de relatórios</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {html && tab === 'generator' && (
            <button onClick={downloadHtml} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition text-sm">
              <Download className="w-4 h-4" /> Baixar HTML
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-neutral-800 bg-neutral-950">
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
                    {reports.length} relato(s) compartilhado(s) • Dados armazenados localmente neste navegador
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
                            Relato — {report.sanitizedMessages.filter(m => m.role === 'user').length} mensagem(ns)
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
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {report.sanitizedMessages.map((m, i) => (
                            <div key={i} className={`flex gap-2 ${m.role === 'user' ? '' : 'opacity-60'}`}>
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                m.role === 'user' ? 'bg-blue-900/30 text-blue-400' : 'bg-neutral-800 text-neutral-500'
                              }`}>
                                {m.role === 'user' ? 'Policial' : '852-IA'}
                              </span>
                              <p className="text-xs text-neutral-400 leading-relaxed flex-1">{m.content}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                          <p className="text-[10px] text-neutral-600">
                            Você tem total controle sobre este relato
                          </p>
                          <button
                            onClick={() => handleDeleteReport(report.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/20 text-red-400 text-xs hover:bg-red-900/40 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Apagar relato
                          </button>
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

      <footer className="p-4 text-center border-t border-neutral-800 text-xs text-neutral-500">
        852 Inteligência — Relatórios gerados por IA
      </footer>
    </div>
  );
}
