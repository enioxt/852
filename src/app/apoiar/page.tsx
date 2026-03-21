'use client';

import { useState } from 'react';
import { Heart, Copy, Check, ExternalLink, Shield, Coins, Github, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/* ─── Donation Addresses ──────────────────────────────────────────────────── */
const WALLETS = [
  { label: 'PIX', address: 'enioxt@gmail.com', network: 'Brasil', icon: '🇧🇷', color: 'from-green-500 to-emerald-600' },
  { label: 'Bitcoin', address: 'bc1qua6c3dqka9kqt73a3xgfperl6jmffsefcr0g7n', network: 'BTC', icon: '₿', color: 'from-orange-500 to-amber-600' },
  { label: 'Ethereum', address: '0x7f43b82a000a1977cc355c6e7ece166dfbb885ab', network: 'EVM', icon: 'Ξ', color: 'from-blue-500 to-indigo-600' },
  { label: 'Solana', address: 'Aw4BXasKPHN98HkqjcNKwD1ug5U6rmXo2GBGQWfhhSh4', network: 'SOL', icon: '◎', color: 'from-purple-500 to-violet-600' },
  { label: 'BNB', address: '0x12e69a0d9571676f3e95007b99ce02b207adb4b0', network: 'BSC', icon: '🔶', color: 'from-yellow-500 to-amber-500' },
];

/* ─── ETHIK Token Info ────────────────────────────────────────────────────── */
const ETHIK_INFO = {
  name: 'ETHIK Token',
  symbol: 'ETHIK',
  contract: '0x633b346b85c4877ace4d47f7aa72c2a092136cb5',
  chain: 'Base (L2)',
  flaunchUrl: 'https://flaunch.gg/base/coins/0x633b346b85c4877ace4d47f7aa72c2a092136cb5',
  description: 'Token de governança ética do ecossistema EGOS na Base chain. Quem contribui recebe pontos EGOS convertíveis em ETHIK.',
  algorithm: 'Distribuição proporcional baseada em crescimento delta (Fibonacci periods)',
  formula: 'user_tokens = (user_delta / total_delta) × token_pool',
  initialScore: 'F₁₂ = 144 pontos',
  period: 'F₇ = 13 dias',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors" title="Copiar endereço">
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-neutral-400" />}
    </button>
  );
}

export default function ApoiarPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="border-b border-neutral-800/50 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg hover:bg-neutral-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Heart className="w-6 h-6 text-red-400" />
          <h1 className="text-lg font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
            Apoie o Projeto
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            <Heart className="w-4 h-4" /> Open Source &mdash; Feito com amor e ética
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">
            Ajude a manter o <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">EGOS</span> vivo
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            O ecossistema EGOS (852 Inteligência, ATRiAN, Mycelium) é 100% open source.
            Sua contribuição financia desenvolvimento, infraestrutura e a evolução dos
            filtros éticos de IA que protegem nossos usuários.
          </p>
        </section>

        {/* How donations work */}
        <section className="bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Coins className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold">Como funciona</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800">
              <div className="text-2xl mb-2">💸</div>
              <h4 className="font-semibold text-sm text-neutral-200">Doação</h4>
              <p className="text-xs text-neutral-500 mt-1">PIX, Bitcoin, Ethereum, Solana ou Hacash</p>
            </div>
            <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800">
              <div className="text-2xl mb-2">🔄</div>
              <h4 className="font-semibold text-sm text-neutral-200">Distribuição</h4>
              <p className="text-xs text-neutral-500 mt-1">60% dev | 20% buyback ETHIK | 20% reserva</p>
            </div>
            <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800">
              <div className="text-2xl mb-2">🏆</div>
              <h4 className="font-semibold text-sm text-neutral-200">Recompensa</h4>
              <p className="text-xs text-neutral-500 mt-1">Pontos EGOS convertem em tokens ETHIK</p>
            </div>
          </div>
        </section>

        {/* Wallet Addresses */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-400" /> Endereços para doação
          </h3>
          <div className="space-y-3">
            {WALLETS.map((w) => (
              <div key={w.label} className="flex items-center gap-4 bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 hover:border-neutral-700 transition-colors">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${w.color} flex items-center justify-center text-xl font-bold text-white shrink-0`}>
                  {w.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{w.label}</span>
                    <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded">{w.network}</span>
                  </div>
                  <p className="text-xs text-neutral-400 font-mono truncate mt-1">{w.address}</p>
                </div>
                <CopyButton text={w.address} />
              </div>
            ))}
          </div>
        </section>

        {/* ETHIK Token */}
        <section className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🪙</span>
            <div>
              <h3 className="text-xl font-semibold">{ETHIK_INFO.name} ({ETHIK_INFO.symbol})</h3>
              <p className="text-xs text-neutral-500">Base chain (L2) &mdash; Flaunch.gg</p>
            </div>
          </div>
          <p className="text-sm text-neutral-400 mb-4">{ETHIK_INFO.description}</p>
          <a href={ETHIK_INFO.flaunchUrl} target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm hover:bg-amber-500/20 transition-colors">
            🚀 Comprar ETHIK na Flaunch.gg <ExternalLink className="w-3 h-3" />
          </a>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-neutral-900/50 rounded-lg p-3 border border-neutral-800">
              <span className="text-xs text-neutral-500">Algoritmo</span>
              <p className="text-sm font-mono text-amber-300 mt-1">{ETHIK_INFO.formula}</p>
            </div>
            <div className="bg-neutral-900/50 rounded-lg p-3 border border-neutral-800">
              <span className="text-xs text-neutral-500">Score Inicial</span>
              <p className="text-sm font-mono text-amber-300 mt-1">{ETHIK_INFO.initialScore}</p>
            </div>
            <div className="bg-neutral-900/50 rounded-lg p-3 border border-neutral-800">
              <span className="text-xs text-neutral-500">Período</span>
              <p className="text-sm font-mono text-amber-300 mt-1">{ETHIK_INFO.period}</p>
            </div>
            <div className="bg-neutral-900/50 rounded-lg p-3 border border-neutral-800">
              <span className="text-xs text-neutral-500">Anti-inflação</span>
              <p className="text-sm font-mono text-amber-300 mt-1">Max F₂₁ = 21 pts/período</p>
            </div>
          </div>
        </section>

        {/* ATRiAN Section */}
        <section className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 border border-green-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-green-400" />
            <div>
              <h3 className="text-xl font-semibold">ATRiAN</h3>
              <p className="text-xs text-neutral-500">Automated Trust, Reality, and Integrity Assessment Network</p>
            </div>
          </div>
          <p className="text-sm text-neutral-400 mb-4">
            Nosso filtro ético de IA valida respostas em tempo real, detectando fabricação de dados,
            promessas falsas, afirmações absolutas e entidades bloqueadas. Tudo open source.
          </p>
          <div className="grid md:grid-cols-3 gap-3 text-center">
            <div className="bg-neutral-900/50 rounded-lg p-3 border border-neutral-800">
              <div className="text-2xl font-bold text-green-400">6+</div>
              <div className="text-xs text-neutral-500">Categorias de validação</div>
            </div>
            <div className="bg-neutral-900/50 rounded-lg p-3 border border-neutral-800">
              <div className="text-2xl font-bold text-green-400">90+</div>
              <div className="text-xs text-neutral-500">Acrônimos conhecidos</div>
            </div>
            <div className="bg-neutral-900/50 rounded-lg p-3 border border-neutral-800">
              <div className="text-2xl font-bold text-green-400">7</div>
              <div className="text-xs text-neutral-500">Axiomas éticos</div>
            </div>
          </div>
        </section>

        {/* GitHub & Open Source */}
        <section className="text-center space-y-4 pb-12">
          <div className="flex justify-center gap-4">
            <a href="https://github.com/enioxt/852" target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition-colors font-semibold text-sm">
              <Github className="w-5 h-5" /> 852 Inteligência
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </a>
            <a href="https://github.com/enioxt/egos" target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition-colors font-semibold text-sm">
              <Github className="w-5 h-5" /> EGOS Kernel
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </a>
          </div>
          <p className="text-xs text-neutral-600">
            &copy; 2026 Enio Rocha &mdash; EGOS Framework. Licença MIT.
          </p>
        </section>
      </main>
    </div>
  );
}
