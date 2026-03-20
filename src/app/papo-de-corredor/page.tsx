'use client';

import { useState, useEffect } from 'react';
import { Radio, MessageSquare, FileText } from 'lucide-react';
import { HotTopicsFeed } from '@/components/corredor/HotTopicsFeed';
import { IssuesFeed } from '@/components/corredor/IssuesFeed';
import { ReportsFeed } from '@/components/corredor/ReportsFeed';

export default function PapoDeCorredorMasterPage() {
  const [activeTab, setActiveTab] = useState<'hot' | 'issues' | 'reports'>('hot');

  useEffect(() => {
    // If URL has ?tab=discussoes or ?tab=relatos or ?aiReportId or ?id (for issues), auto-focus that tab
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('view');
      if (tabParam === 'discussoes') setActiveTab('issues');
      else if (tabParam === 'relatos') setActiveTab('reports');
      else if (params.has('aiReportId') || params.has('id')) setActiveTab('issues');
    }
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-[family-name:var(--font-geist-sans)]">
      {/* Hub Header */}
      <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-2xl bg-amber-900/20 p-3">
            <Radio className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">O Corredor</h1>
            <p className="text-sm text-neutral-400">Hub central de inteligência, pautas e tendências da corporação.</p>
          </div>
        </div>

        {/* Master Tabs */}
        <div className="flex border-b border-neutral-800 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('hot')}
            className={`flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'hot' ? 'border-amber-500 text-amber-500' : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Radio className="w-4 h-4" />
            Em Alta
          </button>
          
          <button
            onClick={() => setActiveTab('issues')}
            className={`flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'issues' ? 'border-amber-500 text-amber-500' : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Pautas e Discussões</span>
            <span className="sm:hidden">Pautas</span>
          </button>
          
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'reports' ? 'border-amber-500 text-amber-500' : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Relatos e Inteligência</span>
            <span className="sm:hidden">Inteligência</span>
          </button>
        </div>
      </div>

      {/* Render Active Feed Component */}
      <div className="w-full pb-20">
        {activeTab === 'hot' && <HotTopicsFeed />}
        {activeTab === 'issues' && <IssuesFeed />}
        {activeTab === 'reports' && <ReportsFeed />}
      </div>
    </div>
  );
}
