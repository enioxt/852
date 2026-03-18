'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react';

interface Invite {
  id: string;
  email: string;
  invited_by: string | null;
  note: string | null;
  created_at: string;
  used_at: string | null;
}

export default function AdminInvitesPage() {
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newNote, setNewNote] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/invites');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setInvites(data.invites || []);
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void fetchInvites();
  }, [fetchInvites]);

  const handleAdd = async () => {
    if (!newEmail.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail.trim(), note: newNote.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Falha ao adicionar convite.');
        return;
      }
      setInvites(prev => [data.invite, ...prev]);
      setNewEmail('');
      setNewNote('');
    } catch {
      setError('Erro de conexão');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch('/api/admin/invites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Falha ao remover.');
        return;
      }
      setInvites(prev => prev.filter(i => i.id !== id));
    } catch {
      setError('Erro de conexão');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const usedCount = invites.filter(i => i.used_at).length;
  const pendingCount = invites.length - usedCount;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/validations" className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-sm font-semibold">Convites e Allowlist</h1>
              <p className="text-xs text-neutral-500">Gerenciar emails autorizados</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => void fetchInvites()} className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white" title="Atualizar">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={handleLogout} className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-red-400" title="Sair">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        {error ? (
          <div className="rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
            <div className="flex items-center gap-2 text-neutral-500">
              <Users className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Total</span>
            </div>
            <p className="mt-2 text-2xl font-semibold">{invites.length}</p>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
            <div className="flex items-center gap-2 text-amber-500">
              <Mail className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Pendentes</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-amber-400">{pendingCount}</p>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
            <div className="flex items-center gap-2 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Usados</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-emerald-400">{usedCount}</p>
          </div>
        </div>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">Adicionar convite</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="h-11 flex-1 rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 text-sm text-white outline-none transition focus:border-blue-700"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <input
              type="text"
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Nota opcional (ex: delegacia, indicação)"
              className="h-11 flex-1 rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 text-sm text-white outline-none transition focus:border-blue-700"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newEmail.trim()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Adicionar
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60">
          <div className="border-b border-neutral-800 px-5 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">Lista de convites</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
            </div>
          ) : invites.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-500">Nenhum convite cadastrado.</div>
          ) : (
            <div className="divide-y divide-neutral-800/60">
              {invites.map(invite => (
                <div key={invite.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-white">{invite.email}</span>
                      {invite.used_at ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Usado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/40 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                          Pendente
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
                      {invite.note ? <span>{invite.note}</span> : null}
                      <span>Adicionado {new Date(invite.created_at).toLocaleDateString('pt-BR')}</span>
                      {invite.invited_by ? <span>por {invite.invited_by}</span> : null}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(invite.id)}
                    disabled={deletingId === invite.id}
                    className="rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-800 hover:text-red-400 disabled:opacity-50"
                    title="Remover convite"
                  >
                    {deletingId === invite.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
