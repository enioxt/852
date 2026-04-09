'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  MousePointerClick,
  Eye,
  ArrowLeft,
  LogOut,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Info,
} from 'lucide-react';

interface ClarityConfig {
  projectId: string;
  isActive: boolean;
  recordingRate: number;
  heatmapEnabled: boolean;
  sessionReplayEnabled: boolean;
}

export default function AdminClarityPage() {
  const [config, setConfig] = useState<ClarityConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check admin auth
    fetch('/api/admin/me', { cache: 'no-store' })
      .then((res) => {
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        // Load Clarity config
        const projectId = process.env.NEXT_PUBLIC_CLARITY_ID || '';
        setConfig({
          projectId,
          isActive: !!projectId,
          recordingRate: 100,
          heatmapEnabled: true,
          sessionReplayEnabled: true,
        });
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const copyProjectId = () => {
    if (config?.projectId) {
      navigator.clipboard.writeText(config.projectId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const clarityDashboardUrl = config?.projectId
    ? `https://clarity.microsoft.com/projects/view/${config.projectId}`
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="border-b border-neutral-800/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="p-2 rounded-lg hover:bg-neutral-800 transition">
            <ArrowLeft className="w-4 h-4 text-neutral-400" />
          </Link>
          <MousePointerClick className="w-5 h-5 text-blue-400" />
          <h1 className="text-lg font-semibold text-white">Clarity Heatmaps — 852</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/telemetry"
            className="h-10 px-4 inline-flex items-center rounded-xl border border-neutral-800 text-sm text-neutral-300 hover:bg-neutral-900 transition"
          >
            Telemetria
          </Link>
          <Link
            href="/admin/analytics"
            className="h-10 px-4 inline-flex items-center rounded-xl border border-neutral-800 text-sm text-neutral-300 hover:bg-neutral-900 transition"
          >
            Analytics
          </Link>
          <button
            onClick={handleLogout}
            className="h-10 px-3 inline-flex items-center gap-2 rounded-xl border border-red-900/50 text-sm text-red-400 hover:bg-red-900/20 transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="p-6 max-w-5xl mx-auto">
        {/* Status Card */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`w-3 h-3 rounded-full ${
                config?.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <h2 className="text-lg font-semibold text-white">
              Status: {config?.isActive ? 'Ativo' : 'Inativo'}
            </h2>
          </div>

          {config?.isActive ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-neutral-800/50 rounded-lg p-4">
                <span className="text-sm text-neutral-400">Project ID</span>
                <div className="flex items-center gap-2">
                  <code className="text-sm text-blue-400 font-mono">{config.projectId}</code>
                  <button
                    onClick={copyProjectId}
                    className="p-2 rounded-lg hover:bg-neutral-700 transition"
                    title="Copiar ID"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-neutral-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-neutral-800/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-white">{config.recordingRate}%</div>
                  <div className="text-sm text-neutral-500">Taxa de Gravação</div>
                </div>
                <div className="bg-neutral-800/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">
                    {config.heatmapEnabled ? 'Sim' : 'Não'}
                  </div>
                  <div className="text-sm text-neutral-500">Heatmaps</div>
                </div>
                <div className="bg-neutral-800/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-400">
                    {config.sessionReplayEnabled ? 'Sim' : 'Não'}
                  </div>
                  <div className="text-sm text-neutral-500">Session Replay</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">Clarity não está configurado</p>
                <p className="text-sm text-red-400/70 mt-1">
                  Adicione NEXT_PUBLIC_CLARITY_ID ao arquivo .env para ativar o tracking.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Links */}
        {clarityDashboardUrl && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <a
              href={clarityDashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl p-4 flex items-center justify-between transition"
            >
              <div>
                <div className="font-medium">Dashboard Clarity</div>
                <div className="text-sm text-blue-200">Ver heatmaps e sessões</div>
              </div>
              <ExternalLink className="w-5 h-5" />
            </a>

            <a
              href={`${clarityDashboardUrl}/heatmaps`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl p-4 flex items-center justify-between transition"
            >
              <div>
                <div className="font-medium">Heatmaps</div>
                <div className="text-sm text-neutral-400">Cliques e scroll</div>
              </div>
              <MousePointerClick className="w-5 h-5 text-blue-400" />
            </a>

            <a
              href={`${clarityDashboardUrl}/recordings`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl p-4 flex items-center justify-between transition"
            >
              <div>
                <div className="font-medium">Session Recordings</div>
                <div className="text-sm text-neutral-400">Gravações de sessão</div>
              </div>
              <Eye className="w-5 h-5 text-purple-400" />
            </a>

            <a
              href="https://learn.microsoft.com/en-us/clarity/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl p-4 flex items-center justify-between transition"
            >
              <div>
                <div className="font-medium">Documentação</div>
                <div className="text-sm text-neutral-400">Guia oficial Clarity</div>
              </div>
              <Info className="w-5 h-5 text-green-400" />
            </a>
          </div>
        )}

        {/* Tracked Events */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-800">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Eventos Rastreados
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-medium text-neutral-300 mb-2">Navegação</h3>
                <ul className="space-y-1 text-neutral-500">
                  <li>• nav_click</li>
                  <li>• mobile_tab_clicked</li>
                  <li>• quick_action_clicked</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-neutral-300 mb-2">Chat</h3>
                <ul className="space-y-1 text-neutral-500">
                  <li>• chat_started</li>
                  <li>• chat_message_sent</li>
                  <li>• chat_ai_response_received</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-neutral-300 mb-2">Relatórios</h3>
                <ul className="space-y-1 text-neutral-500">
                  <li>• report_review_opened</li>
                  <li>• report_shared</li>
                  <li>• report_exported</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-neutral-300 mb-2">Fórum</h3>
                <ul className="space-y-1 text-neutral-500">
                  <li>• issue_created</li>
                  <li>• issue_voted</li>
                  <li>• issue_commented</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-neutral-300 mb-2">Autenticação</h3>
                <ul className="space-y-1 text-neutral-500">
                  <li>• user_registered</li>
                  <li>• user_logged_in</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-neutral-300 mb-2">Sugestões</h3>
                <ul className="space-y-1 text-neutral-500">
                  <li>• suggestion_submitted</li>
                  <li>• file_uploaded</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-neutral-800">
              <p className="text-sm text-neutral-500">
                Use <code className="text-blue-400">data-clarity-zone</code> em elementos para
                rastrear zonas de calor específicas. Exemplo:{' '}
                <code className="text-neutral-400">
                  &lt;button data-clarity-zone=&quot;chat-input&quot;&gt;Enviar&lt;/button&gt;
                </code>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
