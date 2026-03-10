'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Star, GitBranch, MessageSquare, Users, Shield, AlertTriangle, Zap, ChevronDown, ChevronUp, Wallet } from 'lucide-react';
import { MOCK_LEADERBOARD, ETHIK_RULES, POINT_VALUES, type Contributor } from '@/lib/ethik';

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🏆</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="text-sm font-mono text-slate-500">#{rank}</span>;
}

function ContributorRow({ c, expanded, onToggle }: { c: Contributor; expanded: boolean; onToggle: () => void }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-4 hover:bg-slate-800/50 transition text-left">
        <RankBadge rank={c.rank} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white truncate">{c.displayName}</span>
            {c.penaltyScore > 0 && (
              <span className="text-xs bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded" title={`Penalty: -${c.penaltyScore}%`}>
                <AlertTriangle className="w-3 h-3 inline" /> -{c.penaltyScore}%
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500">@{c.githubUsername}</span>
        </div>
        <div className="text-right">
          <div className="font-bold text-blue-400">{c.totalPoints.toLocaleString()}</div>
          <div className="text-xs text-slate-500">pts</div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {expanded && (
        <div className="border-t border-slate-800 p-4 bg-slate-950/50 space-y-3">
          <div className="grid grid-cols-5 gap-2 text-center">
            <div>
              <GitBranch className="w-4 h-4 mx-auto text-green-400 mb-1" />
              <div className="text-sm font-semibold text-white">{c.sources.commits}</div>
              <div className="text-xs text-slate-500">commits</div>
            </div>
            <div>
              <Zap className="w-4 h-4 mx-auto text-purple-400 mb-1" />
              <div className="text-sm font-semibold text-white">{c.sources.prs}</div>
              <div className="text-xs text-slate-500">PRs</div>
            </div>
            <div>
              <Star className="w-4 h-4 mx-auto text-yellow-400 mb-1" />
              <div className="text-sm font-semibold text-white">{c.sources.stars}</div>
              <div className="text-xs text-slate-500">stars</div>
            </div>
            <div>
              <MessageSquare className="w-4 h-4 mx-auto text-blue-400 mb-1" />
              <div className="text-sm font-semibold text-white">{c.sources.reports}</div>
              <div className="text-xs text-slate-500">relatos</div>
            </div>
            <div>
              <Users className="w-4 h-4 mx-auto text-cyan-400 mb-1" />
              <div className="text-sm font-semibold text-white">{c.sources.referrals}</div>
              <div className="text-xs text-slate-500">refs</div>
            </div>
          </div>
          {c.walletAddress && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Wallet className="w-3 h-3" />
              <span className="font-mono">{c.walletAddress}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EthikPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);

  const totalPoints = MOCK_LEADERBOARD.reduce((sum, c) => sum + c.totalPoints, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="p-2 bg-yellow-600/20 rounded-full">
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-white">ETHIK Leaderboard</h1>
            <p className="text-xs text-slate-400">Distribuição justa por contribuição</p>
          </div>
        </div>
        <button onClick={() => setShowRules(!showRules)} className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition" title="Regras">
          <Shield className="w-5 h-5" />
        </button>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Rules Panel */}
        {showRules && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="font-bold text-white flex items-center gap-2"><Shield className="w-5 h-5 text-blue-400" /> Regras ETHIK</h2>

            <div className="space-y-3 text-sm text-slate-300">
              <div>
                <h3 className="font-semibold text-white mb-1">Distribuição</h3>
                <p>{ETHIK_RULES.distributionMethod}</p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-1">Pontuação</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800 rounded-lg p-2 flex justify-between"><span>Commit</span><span className="text-green-400">+{POINT_VALUES.commit}</span></div>
                  <div className="bg-slate-800 rounded-lg p-2 flex justify-between"><span>PR Merged</span><span className="text-green-400">+{POINT_VALUES.pr_merged}</span></div>
                  <div className="bg-slate-800 rounded-lg p-2 flex justify-between"><span>Issue</span><span className="text-green-400">+{POINT_VALUES.issue_opened}</span></div>
                  <div className="bg-slate-800 rounded-lg p-2 flex justify-between"><span>Star</span><span className="text-green-400">+{POINT_VALUES.star}</span></div>
                  <div className="bg-slate-800 rounded-lg p-2 flex justify-between"><span>Relato</span><span className="text-green-400">+{POINT_VALUES.chat_report}</span></div>
                  <div className="bg-slate-800 rounded-lg p-2 flex justify-between"><span>Referral</span><span className="text-green-400">+{POINT_VALUES.referral}</span></div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-orange-400 mb-1">Penalidade por Venda</h3>
                <p>Se o token cair {ETHIK_RULES.penaltyThreshold}%+ e você vender, seu score é temporariamente reduzido para futuros airdrops. A penalidade expira em {ETHIK_RULES.penaltyDecayDays} dias.</p>
              </div>

              <div>
                <h3 className="font-semibold text-green-400 mb-1">Contestação</h3>
                <p>{ETHIK_RULES.contestPolicy}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{MOCK_LEADERBOARD.length}</div>
            <div className="text-xs text-slate-400">Contributors</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{totalPoints.toLocaleString()}</div>
            <div className="text-xs text-slate-400">Total Points</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">$ETHIK</div>
            <div className="text-xs text-slate-400">Token</div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-2">
          {MOCK_LEADERBOARD.map((c) => (
            <ContributorRow
              key={c.id}
              c={c}
              expanded={expandedId === c.id}
              onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
            />
          ))}
        </div>

        {/* Register CTA */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-5 text-center space-y-3">
          <h3 className="font-bold text-white text-lg">Quer participar?</h3>
          <p className="text-sm text-slate-300">Contribua com código, estrelas, relatos ou referências. Registre sua wallet para ser elegível aos próximos airdrops.</p>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold transition">
            Registrar Wallet
          </button>
        </div>
      </main>

      <footer className="p-4 text-center border-t border-slate-800 text-xs text-slate-500">
        ETHIK — Powered by EGOS Ecosystem
      </footer>
    </div>
  );
}
