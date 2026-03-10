'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Loader2, Download, Eye, Sparkles } from 'lucide-react';

const EXAMPLE_PROMPTS = [
  'Relatório semanal de problemas estruturais nas delegacias do interior de MG',
  'Análise de tendências: falta de efetivo vs. sobrecarga de trabalho por região',
  'Dashboard executivo: top 10 problemas mais relatados pelos policiais civis',
  'Relatório de engajamento da plataforma 852 Inteligência - métricas do mês',
];

export default function ReportsPage() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <header className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="p-2 bg-purple-600/20 rounded-full">
            <FileText className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-white">Gerador de Relatórios</h1>
            <p className="text-xs text-slate-400">Prompt → HTML completo em segundos</p>
          </div>
        </div>
        {html && (
          <button onClick={downloadHtml} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition text-sm">
            <Download className="w-4 h-4" /> Baixar HTML
          </button>
        )}
      </header>

      <main className="flex-1 p-4 max-w-4xl mx-auto w-full space-y-4">
        {/* Prompt Input */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Descreva o relatório que deseja gerar..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none min-h-[80px]"
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

          {/* Example Prompts */}
          {!html && (
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((ep, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(ep)}
                  className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-slate-400 hover:text-white hover:border-purple-500/50 transition"
                >
                  {ep.length > 60 ? ep.slice(0, 60) + '...' : ep}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            <p className="text-sm text-slate-400">Gerando relatório com IA...</p>
          </div>
        )}

        {/* Report Preview */}
        {html && !loading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Eye className="w-4 h-4" /> Preview do Relatório
            </div>
            <div className="border border-slate-700 rounded-xl overflow-hidden bg-white">
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
      </main>

      <footer className="p-4 text-center border-t border-slate-800 text-xs text-slate-500">
        852 Inteligência — Relatórios gerados por IA
      </footer>
    </div>
  );
}
