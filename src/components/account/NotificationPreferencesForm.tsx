'use client';

import { useEffect, useState } from 'react';
import { Loader2, Bell } from 'lucide-react';

interface NotificationPreferences {
  notify_on_issue_votes: boolean;
  notify_on_issue_comments: boolean;
  notify_on_issue_status_change: boolean;
  digest_frequency: 'immediate' | 'daily' | 'weekly' | 'never';
}

export function NotificationPreferencesForm() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    try {
      const res = await fetch('/api/auth/notification-preferences', {
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch preferences: ${res.status}`);
      }

      const data = await res.json();
      setPrefs(data);
    } catch (error) {
      console.error('[NotificationPreferences] Fetch error:', error);
      // Set defaults if fetch fails
      setPrefs({
        notify_on_issue_votes: true,
        notify_on_issue_comments: true,
        notify_on_issue_status_change: false,
        digest_frequency: 'immediate',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!prefs) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });

      if (!res.ok) {
        throw new Error(`Failed to update preferences: ${res.status}`);
      }

      setMessage({ type: 'success', text: '✓ Preferências salvas com sucesso' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('[NotificationPreferences] Save error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erro ao salvar preferências',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
        <div className="flex items-center gap-2 text-neutral-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Carregando preferências...</span>
        </div>
      </div>
    );
  }

  if (!prefs) {
    return (
      <div className="rounded-2xl border border-red-900/30 bg-red-950/10 p-4">
        <div className="text-sm text-red-300">Erro ao carregar preferências de notificação</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
      <div className="flex items-center gap-2 text-neutral-300">
        <Bell className="h-4 w-4 text-blue-400" />
        <span className="text-sm font-medium">Notificações por Email</span>
      </div>

      <div className="space-y-3 mt-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={prefs.notify_on_issue_votes}
            onChange={(e) =>
              setPrefs((prev) => ({
                ...prev!,
                notify_on_issue_votes: e.target.checked,
              }))
            }
            className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 cursor-pointer"
          />
          <span className="text-sm text-neutral-300">
            Quando alguém vota em um tópico que participei
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={prefs.notify_on_issue_comments}
            onChange={(e) =>
              setPrefs((prev) => ({
                ...prev!,
                notify_on_issue_comments: e.target.checked,
              }))
            }
            className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 cursor-pointer"
          />
          <span className="text-sm text-neutral-300">
            Quando alguém comenta em um tópico que participei
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer opacity-50">
          <input
            type="checkbox"
            checked={prefs.notify_on_issue_status_change}
            disabled
            className="w-4 h-4 rounded border-neutral-700 bg-neutral-800"
          />
          <span className="text-sm text-neutral-400">
            Quando o status de um tópico muda <span className="text-xs">(em breve)</span>
          </span>
        </label>
      </div>

      <div className="mt-4 pt-4 border-t border-neutral-700">
        <h5 className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-2">Frequência</h5>

        <div className="space-y-2">
          {(['immediate', 'daily', 'weekly', 'never'] as const).map((freq) => (
            <label key={freq} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="frequency"
                value={freq}
                checked={prefs.digest_frequency === freq}
                onChange={() =>
                  setPrefs((prev) => ({
                    ...prev!,
                    digest_frequency: freq,
                  }))
                }
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-sm text-neutral-300">
                {freq === 'immediate'
                  ? '⚡ Imediatamente'
                  : freq === 'daily'
                    ? '📅 Resumo diário'
                    : freq === 'weekly'
                      ? '📊 Resumo semanal'
                      : '❌ Desativar'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`text-sm p-3 rounded-xl mt-3 ${
            message.type === 'success'
              ? 'bg-emerald-950/30 border border-emerald-900/50 text-emerald-200'
              : 'bg-red-950/30 border border-red-900/50 text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
          </>
        ) : (
          '💾 Salvar Preferências'
        )}
      </button>

      <p className="text-xs text-neutral-500 mt-2">
        As mudanças entram em efeito imediatamente.
      </p>
    </div>
  );
}
