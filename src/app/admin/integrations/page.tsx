'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle, ArrowLeft, Bot, Bell, CheckCircle2,
  ChevronDown, ExternalLink, Eye, EyeOff,
  Loader2, Mail, RefreshCw, Save, Settings2, Shield,
  BarChart3, Globe, XCircle, Zap,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface Integration {
  key: string;
  name: string;
  description: string;
  group: string;
  isSecret: boolean;
  isRequired: boolean;
  placeholder: string;
  docsUrl: string | null;
  maskedValue: string;
  isConfigured: boolean;
  source: 'db' | 'env' | 'missing';
  lastTestedAt: string | null;
  testResult: 'ok' | 'error' | null;
  testMessage: string | null;
}

interface EditState {
  key: string;
  value: string;
  showValue: boolean;
}

const GROUP_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  ai:            { label: 'IA / Modelos',       icon: Bot,       color: 'text-amber-400' },
  email:         { label: 'Email / SMTP',        icon: Mail,      color: 'text-blue-400' },
  notifications: { label: 'Notificações',        icon: Bell,      color: 'text-green-400' },
  auth:          { label: 'Autenticação',        icon: Shield,    color: 'text-purple-400' },
  analytics:     { label: 'Analytics',           icon: BarChart3, color: 'text-rose-400' },
  meta:          { label: 'Meta / URLs',         icon: Globe,     color: 'text-neutral-400' },
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/integrations');
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      setIntegrations(data.integrations || []);
      setGroups(data.groups || []);
      // Expand AI group by default
      setExpandedGroups(prev => ({ ai: true, ...prev }));
    } catch {
      setError('Erro ao carregar integrações');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function saveValue() {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/integrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: editing.key, value: editing.value }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function testIntegration(key: string) {
    setTesting(key);
    setTestResults(prev => ({ ...prev, [key]: { ok: false, message: 'Testando...' } }));
    try {
      const res = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', key }),
      });
      const data = await res.json();
      setTestResults(prev => ({ ...prev, [key]: data }));
      await load(); // Refresh to show persisted test result
    } catch {
      setTestResults(prev => ({ ...prev, [key]: { ok: false, message: 'Erro de rede' } }));
    } finally {
      setTesting(null);
    }
  }

  const configuredCount = integrations.filter(i => i.isConfigured).length;
  const requiredCount = integrations.filter(i => i.isRequired).length;
  const requiredConfigured = integrations.filter(i => i.isRequired && i.isConfigured).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.push('/conta')} className="text-neutral-500 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Settings2 className="w-6 h-6 text-amber-400" />
              Integration Hub
            </h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              Configure uma vez. Funciona em qualquer ambiente.
            </p>
          </div>
          <button onClick={load} className="p-2 rounded-lg border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-900/20 border border-red-800/50 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto"><XCircle className="w-4 h-4" /></button>
          </div>
        )}

        {/* Summary bar */}
        <div className="mb-6 p-4 rounded-2xl border border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{configuredCount}<span className="text-neutral-500 text-lg">/{integrations.length}</span></p>
                <p className="text-xs text-neutral-500">configuradas</p>
              </div>
              <div className="w-px h-10 bg-neutral-800" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{requiredConfigured}<span className="text-neutral-500 text-lg">/{requiredCount}</span></p>
                <p className="text-xs text-neutral-500">obrigatórias</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {requiredConfigured === requiredCount ? (
                <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Sistema pronto
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-400 text-sm font-medium">
                  <AlertCircle className="w-4 h-4" /> {requiredCount - requiredConfigured} obrigatória(s) faltando
                </span>
              )}
            </div>
          </div>
          {/* Bootstrap reminder */}
          <div className="mt-3 pt-3 border-t border-neutral-800/50">
            <p className="text-xs text-neutral-500">
              <span className="text-neutral-400 font-medium">Bootstrap (sempre no .env):</span>{' '}
              <code className="text-amber-400/80">SUPABASE_URL</code>{' '}
              <code className="text-amber-400/80">SUPABASE_SERVICE_ROLE_KEY</code>{' '}
              <code className="text-amber-400/80">CONFIG_ENCRYPTION_KEY</code>
              {' '}— todos os demais gerenciados aqui.
            </p>
          </div>
        </div>

        {/* Groups */}
        {groups.map(group => {
          const meta = GROUP_META[group] || { label: group, icon: Settings2, color: 'text-neutral-400' };
          const GroupIcon = meta.icon;
          const groupItems = integrations.filter(i => i.group === group);
          const groupConfigured = groupItems.filter(i => i.isConfigured).length;
          const isOpen = expandedGroups[group] !== false;

          return (
            <div key={group} className="mb-4">
              <button
                onClick={() => setExpandedGroups(prev => ({ ...prev, [group]: !isOpen }))}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800/60 transition text-left"
              >
                <GroupIcon className={`w-5 h-5 ${meta.color} flex-shrink-0`} />
                <span className="font-semibold text-white flex-1">{meta.label}</span>
                <span className="text-xs text-neutral-500">{groupConfigured}/{groupItems.length}</span>
                <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="mt-2 space-y-2 pl-1">
                  {groupItems.map(item => (
                    <IntegrationCard
                      key={item.key}
                      item={item}
                      editing={editing}
                      saving={saving}
                      testing={testing}
                      localTestResult={testResults[item.key]}
                      onEdit={() => setEditing({ key: item.key, value: '', showValue: false })}
                      onCancelEdit={() => setEditing(null)}
                      onChangeValue={(v) => setEditing(prev => prev ? { ...prev, value: v } : null)}
                      onToggleShow={() => setEditing(prev => prev ? { ...prev, showValue: !prev.showValue } : null)}
                      onSave={saveValue}
                      onTest={() => testIntegration(item.key)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Integration Card ─────────────────────────────────────────────────────────

function IntegrationCard({
  item,
  editing,
  saving,
  testing,
  localTestResult,
  onEdit,
  onCancelEdit,
  onChangeValue,
  onToggleShow,
  onSave,
  onTest,
}: {
  item: Integration;
  editing: EditState | null;
  saving: boolean;
  testing: string | null;
  localTestResult?: { ok: boolean; message: string };
  onEdit: () => void;
  onCancelEdit: () => void;
  onChangeValue: (v: string) => void;
  onToggleShow: () => void;
  onSave: () => void;
  onTest: () => void;
}) {
  const isEditing = editing?.key === item.key;
  const isTesting = testing === item.key;
  const testResult = localTestResult ?? (item.testResult ? { ok: item.testResult === 'ok', message: item.testMessage || '' } : null);

  const sourceLabel: Record<string, string> = {
    db: 'DB',
    env: '.env',
    missing: '',
  };

  return (
    <div className={`rounded-xl border ${item.isConfigured ? 'border-neutral-800' : item.isRequired ? 'border-amber-800/50' : 'border-neutral-800/50'} bg-neutral-900/40 p-4 transition-all`}>
      <div className="flex items-start gap-3">
        {/* Status dot */}
        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${item.isConfigured ? (testResult?.ok === false ? 'bg-red-400' : 'bg-green-400') : item.isRequired ? 'bg-amber-400 animate-pulse' : 'bg-neutral-600'}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white text-sm">{item.name}</span>
            {item.isRequired && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">obrigatório</span>}
            {item.isConfigured && item.source !== 'missing' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500">{sourceLabel[item.source]}</span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-0.5 leading-snug">{item.description}</p>

          {/* Current value masked */}
          {item.isConfigured && !isEditing && (
            <p className="text-xs font-mono text-neutral-400 mt-1.5">{item.maskedValue}</p>
          )}

          {/* Test result */}
          {testResult && (
            <div className={`mt-2 flex items-center gap-1.5 text-xs ${testResult.ok ? 'text-green-400' : 'text-red-400'}`}>
              {testResult.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              {testResult.message}
            </div>
          )}

          {/* Edit form */}
          {isEditing && (
            <div className="mt-3 space-y-2">
              <div className="relative">
                <input
                  type={editing?.showValue || !item.isSecret ? 'text' : 'password'}
                  value={editing?.value || ''}
                  onChange={e => onChangeValue(e.target.value)}
                  placeholder={item.placeholder || `Novo valor para ${item.key}`}
                  autoFocus
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-600 pr-10"
                />
                {item.isSecret && (
                  <button onClick={onToggleShow} className="absolute right-2 top-2 text-neutral-500 hover:text-neutral-300">
                    {editing?.showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-500 disabled:opacity-50 transition"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Salvar
                </button>
                <button onClick={onCancelEdit} className="px-3 py-1.5 rounded-lg border border-neutral-700 text-neutral-400 text-xs hover:text-white transition">
                  Cancelar
                </button>
                <p className="text-[10px] text-neutral-600 ml-1">Criptografado com AES-256-GCM</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {item.docsUrl && (
              <a href={item.docsUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-300 transition" title="Documentação">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {item.isConfigured && (
              <button
                onClick={onTest}
                disabled={isTesting}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-green-400 transition"
                title="Testar integração"
              >
                {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              </button>
            )}
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-amber-400 transition"
              title={item.isConfigured ? 'Editar' : 'Configurar'}
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
