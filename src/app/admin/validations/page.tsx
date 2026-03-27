'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  Users,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  User,
  Building2,
  Activity,
  FileText,
  MessageSquare,
  History,
  X,
  ChevronRight,
  BarChart3,
} from 'lucide-react';

interface ValidationUser {
  id: string;
  email: string;
  display_name: string | null;
  nome_partial: string | null;
  masp: string | null;
  lotacao: string | null;
  validation_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  last_login: string | null;
  validated_by: string | null;
  validated_at: string | null;
  validated_by_name: string | null;
}

interface ValidationSummary {
  pending: number;
  approved: number;
  rejected: number;
  none: number;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export default function AdminValidationsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<ValidationUser[]>([]);
  const [summary, setSummary] = useState<ValidationSummary>({ pending: 0, approved: 0, rejected: 0, none: 0 });
  const [pagination, setPagination] = useState<Pagination>({ total: 0, limit: 50, offset: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const load = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const offset = reset ? 0 : pagination.offset;
      const res = await fetch(`/api/admin/validations/history?status=${statusFilter}&limit=${pagination.limit}&offset=${offset}`);

      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }

      const json = await res.json();

      if (!json.configured) {
        setError(json.message || 'Supabase não configurado');
        return;
      }

      if (reset) {
        setUsers(json.users || []);
        setPagination({ ...json.pagination, offset: json.users?.length || 0 });
      } else {
        setUsers(prev => [...prev, ...(json.users || [])]);
        setPagination(json.pagination);
      }

      setSummary(json.summary);
    } catch {
      setError('Falha ao carregar validações.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [statusFilter, pagination.limit, pagination.offset, router]);

  useEffect(() => {
    load(true);
  }, [statusFilter]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const updateStatus = async (userId: string, status: 'approved' | 'rejected') => {
    setActingId(userId);
    setError(null);
    try {
      const res = await fetch('/api/admin/validations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Falha ao atualizar validação.');
        return;
      }

      setUsers(prev => prev.map(u =>
        u.id === userId
          ? { ...u, validation_status: status }
          : u
      ));

      setSummary(prev => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        [status]: prev[status] + 1
      }));
    } catch {
      setError('Erro de conexão ao atualizar validação.');
    } finally {
      setActingId(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.display_name?.toLowerCase().includes(query) ||
      user.masp?.includes(query) ||
      user.lotacao?.toLowerCase().includes(query)
    );
  });

  const formatDate = (value: string | null) => {
    if (!value) return '—';
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
      pending: { label: 'Pendente', cls: 'bg-amber-900/40 text-amber-400 border-amber-800/40', icon: Clock3 },
      approved: { label: 'Aprovado', cls: 'bg-green-900/40 text-green-400 border-green-800/40', icon: CheckCircle2 },
      rejected: { label: 'Rejeitado', cls: 'bg-red-900/40 text-red-400 border-red-800/40', icon: ShieldX },
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${c.cls}`}>
        <Icon className="w-3.5 h-3.5" />
        {c.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="border-b border-neutral-800/50 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="p-2 rounded-lg hover:bg-neutral-800 transition">
            <ArrowLeft className="w-4 h-4 text-neutral-400" />
          </Link>
          <ShieldCheck className="w-5 h-5 text-green-400" />
          <div>
            <h1 className="text-lg font-semibold text-white">Validação MASP — 852</h1>
            <p className="text-xs text-neutral-500">Gerenciamento de contas e validações</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/telemetry" className="h-10 px-4 inline-flex items-center gap-2 rounded-xl border border-neutral-800 text-sm text-neutral-300 hover:bg-neutral-900 transition">
            <BarChart3 className="w-4 h-4" />
            Telemetria
          </Link>
          <button onClick={() => load(true)} disabled={loading} className="p-2 rounded-lg hover:bg-neutral-800 transition text-neutral-400 hover:text-white disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
          <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-neutral-800 transition text-neutral-400 hover:text-red-400">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <div className="rounded-xl border border-red-800/40 bg-red-900/10 px-4 py-3 text-sm text-red-300 flex items-center justify-between">
            {error}
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-900/20 rounded"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard icon={Clock3} label="Pendentes" value={summary.pending} tone="amber" onClick={() => setStatusFilter('pending')} active={statusFilter === 'pending'} />
          <SummaryCard icon={CheckCircle2} label="Aprovados" value={summary.approved} tone="green" onClick={() => setStatusFilter('approved')} active={statusFilter === 'approved'} />
          <SummaryCard icon={ShieldX} label="Rejeitados" value={summary.rejected} tone="red" onClick={() => setStatusFilter('rejected')} active={statusFilter === 'rejected'} />
          <SummaryCard icon={Users} label="Total" value={pagination.total} tone="blue" onClick={() => setStatusFilter('all')} active={statusFilter === 'all'} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input type="text" placeholder="Buscar por email, nome, MASP ou lotação..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-700" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white [&>option]:bg-neutral-900">
              <option value="all">Todos os status</option>
              <option value="pending">Pendentes</option>
              <option value="approved">Aprovados</option>
              <option value="rejected">Rejeitados</option>
            </select>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-3">
          {loading && users.length === 0 ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-neutral-500" /></div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-400">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <>
              {filteredUsers.map((user) => (
                <div key={user.id} className={`rounded-2xl border ${expandedUser === user.id ? 'border-neutral-700 bg-neutral-900/60' : 'border-neutral-800 bg-neutral-900/40'} overflow-hidden transition-colors`}>
                  <div className="p-4 flex items-center gap-4">
                    <button onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)} className="p-1 hover:bg-neutral-800 rounded-lg transition">
                      {expandedUser === user.id ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
                    </button>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <InfoItem icon={User} label="Nome" value={user.display_name || user.nome_partial || '—'} subvalue={user.email} />
                      <InfoItem icon={ShieldCheck} label="MASP" value={user.masp || '—'} subvalue={getStatusBadge(user.validation_status)} />
                      <InfoItem icon={Building2} label="Lotação" value={user.lotacao || 'Não informada'} subvalue={`Cadastro: ${formatDate(user.created_at)}`} />
                      <InfoItem icon={Activity} label="Último Acesso" value={formatDate(user.last_login)} subvalue={user.validated_by_name ? `Validado por: ${user.validated_by_name}` : 'Não validado'} />
                    </div>
                    {user.validation_status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateStatus(user.id, 'approved')} disabled={actingId === user.id} className="h-9 px-3 rounded-lg bg-green-600 hover:bg-green-500 disabled:bg-neutral-800 text-sm text-white transition inline-flex items-center gap-1.5">
                          {actingId === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Aprovar
                        </button>
                        <button onClick={() => updateStatus(user.id, 'rejected')} disabled={actingId === user.id} className="h-9 px-3 rounded-lg border border-red-800/40 bg-red-900/10 hover:bg-red-900/20 disabled:border-neutral-800 text-sm text-red-300 transition inline-flex items-center gap-1.5">
                          <ShieldX className="w-3.5 h-3.5" />
                          Rejeitar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expanded Detail */}
                  {expandedUser === user.id && (
                    <div className="border-t border-neutral-800 p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-white flex items-center gap-2"><User className="w-4 h-4 text-neutral-500" />Informações da Conta</h4>
                          <div className="space-y-2 text-sm">
                            <DetailRow label="ID" value={user.id} />
                            <DetailRow label="Email" value={user.email} />
                            <DetailRow label="Status" value={getStatusBadge(user.validation_status)} />
                            <DetailRow label="Cadastro" value={formatDate(user.created_at)} />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-white flex items-center gap-2"><History className="w-4 h-4 text-neutral-500" />Histórico de Validação</h4>
                          <div className="space-y-2 text-sm">
                            <DetailRow label="Status Atual" value={user.validation_status} />
                            <DetailRow label="Validado em" value={formatDate(user.validated_at)} />
                            <DetailRow label="Validado por" value={user.validated_by_name || '—'} />
                            <DetailRow label="Validado por ID" value={user.validated_by || '—'} />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-white flex items-center gap-2"><Activity className="w-4 h-4 text-neutral-500" />Informações</h4>
                          <div className="space-y-2 text-sm">
                            <DetailRow label="MASP" value={user.masp || '—'} />
                            <DetailRow label="Lotação" value={user.lotacao || '—'} />
                            <DetailRow label="Último Login" value={formatDate(user.last_login)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {pagination.hasMore && (
                <button onClick={() => load(false)} disabled={loadingMore} className="w-full py-3 rounded-xl border border-neutral-800 bg-neutral-900/50 text-sm text-neutral-400 hover:bg-neutral-800 transition flex items-center justify-center gap-2">
                  {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                  Carregar mais ({pagination.total - users.length} restantes)
                </button>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, tone, onClick, active }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; tone: 'amber' | 'green' | 'red' | 'blue'; onClick: () => void; active: boolean }) {
  const tones: Record<string, string> = {
    amber: 'text-amber-400 bg-amber-900/20 border-amber-800/30 hover:bg-amber-900/30',
    green: 'text-green-400 bg-green-900/20 border-green-800/30 hover:bg-green-900/30',
    red: 'text-red-400 bg-red-900/20 border-red-800/30 hover:bg-red-900/30',
    blue: 'text-blue-400 bg-blue-900/20 border-blue-800/30 hover:bg-blue-900/30',
  };
  return (
    <button onClick={onClick} className={`rounded-xl border p-4 text-left transition ${tones[tone]} ${active ? 'ring-2 ring-white/20' : ''}`}>
      <div className="flex items-center gap-2 mb-2"><Icon className="w-4 h-4" /><span className="text-xs font-medium opacity-80">{label}</span></div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </button>
  );
}

function InfoItem({ icon: Icon, label, value, subvalue }: { icon: typeof User; label: string; value: React.ReactNode; subvalue?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-neutral-500 flex items-center gap-1"><Icon className="w-3 h-3" />{label}</p>
      <p className="text-sm text-white truncate mt-0.5">{value}</p>
      {subvalue && <div className="text-xs text-neutral-500 mt-0.5">{subvalue}</div>}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-neutral-800/50 last:border-0">
      <span className="text-neutral-500">{label}</span>
      <span className="text-neutral-300">{value}</span>
    </div>
  );
}
