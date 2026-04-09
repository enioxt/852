'use client';

import { useEffect, useState } from 'react';
import { Brain, RefreshCw, Clock, FileText, AlertCircle } from 'lucide-react';

interface MasterReport {
  id: string;
  content_html: string;
  version: number;
  total_conversations_all_time: number;
  total_reports_all_time: number;
  updated_at: string;
  insights: unknown[];
}

export default function MasterReportPage() {
  const [report, setReport] = useState<MasterReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMasterReport();
  }, []);

  const loadMasterReport = async () => {
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
  };

  const updateMasterReport = async () => {
    try {
      setUpdating(true);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-6 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Carregando relatório de inteligência...</span>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
            <Brain className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Relatório Master — 852</h1>
            <p className="text-slate-400 mb-6">
              O relatório de inteligência geral ainda não foi criado. Ele será gerado automaticamente 
              quando houver dados suficientes (mínimo 3 conversas ou relatórios).
            </p>
            <button
              onClick={updateMasterReport}
              disabled={updating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition disabled:opacity-50"
            >
              {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {updating ? 'Gerando...' : 'Gerar Agora'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Brain className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Relatório Master — 852</h1>
              <p className="text-sm text-slate-400">
                Único relatório de inteligência geral • Auto-atualizável
              </p>
            </div>
          </div>
          <button
            onClick={updateMasterReport}
            disabled={updating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition disabled:opacity-50"
          >
            {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {updating ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <FileText className="w-4 h-4" />
              Versão
            </div>
            <div className="text-2xl font-bold text-white">v{report.version}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <Brain className="w-4 h-4" />
              Conversas
            </div>
            <div className="text-2xl font-bold text-white">{report.total_conversations_all_time}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <Clock className="w-4 h-4" />
              Atualizado
            </div>
            <div className="text-sm font-medium text-white">
              {new Date(report.updated_at).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Report Content */}
        <div
          className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden"
          style={{
            // Dark scrollbar styling
            scrollbarWidth: 'thin',
            scrollbarColor: '#334155 #0f172a',
          }}
        >
          <div
            className="master-report-scroll"
            dangerouslySetInnerHTML={{ __html: report.content_html }}
          />
        </div>

        {/* Info */}
        <div className="mt-4 text-center text-xs text-slate-500">
          Este relatório é único e cumulativo. Ele se atualiza automaticamente conforme novos dados chegam.
          • Insights: {report.insights?.length || 0}
          • Próxima atualização: quando +3 itens novos forem adicionados
        </div>
      </div>
    </div>
  );
}
