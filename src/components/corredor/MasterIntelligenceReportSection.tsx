'use client';

import { useEffect, useState } from 'react';
import { Brain, RefreshCw, Clock, FileText, AlertCircle, TrendingUp, BarChart3 } from 'lucide-react';

interface MasterReport {
  id: string;
  content_html: string;
  version: number;
  total_conversations_all_time: number;
  total_reports_all_time: number;
  updated_at: string;
  insights: unknown[];
}

export default function MasterIntelligenceReportSection() {
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-neutral-700 animate-spin" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-neutral-400">Carregando relatório de inteligência...</h3>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
          <Brain className="w-8 h-8 text-neutral-700" />
        </div>
        <div className="text-center space-y-2 max-w-xl">
          <h3 className="text-lg font-semibold text-neutral-400">Relatório de Inteligência Geral</h3>
          <p className="text-sm text-neutral-600">
            O relatório master ainda não foi criado. Ele será gerado automaticamente 
            quando houver dados suficientes (mínimo 3 conversas ou relatórios).
          </p>
          <button
            onClick={updateMasterReport}
            disabled={updating}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition disabled:opacity-50"
          >
            {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {updating ? 'Gerando...' : 'Gerar Agora'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Stats */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800/50 border border-neutral-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Brain className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Relatório de Inteligência Geral</h2>
              <p className="text-sm text-neutral-400">
                Único relatório master • Auto-atualizável • v{report.version}
              </p>
            </div>
          </div>
          <button
            onClick={updateMasterReport}
            disabled={updating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition disabled:opacity-50"
          >
            {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {updating ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-neutral-950/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
              <BarChart3 className="w-4 h-4" />
              Conversas Analisadas
            </div>
            <div className="text-2xl font-bold text-white">{report.total_conversations_all_time}</div>
          </div>
          <div className="bg-neutral-950/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
              <FileText className="w-4 h-4" />
              Relatos Processados
            </div>
            <div className="text-2xl font-bold text-white">{report.total_reports_all_time}</div>
          </div>
          <div className="bg-neutral-950/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              Insights Gerados
            </div>
            <div className="text-2xl font-bold text-white">{report.insights?.length || 0}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
          <Clock className="w-3 h-3" />
          Última atualização: {new Date(report.updated_at).toLocaleDateString('pt-BR')}
          <span className="mx-2">•</span>
          <span className="text-neutral-600">
            Auto-atualiza quando +3 itens novos são adicionados
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {/* Report Content */}
      <div
        className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#1e3a5f #0f172a',
        }}
      >
        <div
          className="master-report-content"
          dangerouslySetInnerHTML={{ __html: report.content_html }}
        />
      </div>
    </div>
  );
}
