'use client';

import MasterIntelligenceReportSection from './MasterIntelligenceReportSection';

interface ReportsFeedProps {
  category?: string;
}

/**
 * ReportsFeed - Simplified to show only Master Intelligence Report
 * Removed: Shared Reports tab, Generator tab
 * Kept: Only Master Intelligence Report (single source of truth)
 */
export function ReportsFeed({ category = 'all' }: ReportsFeedProps) {
  return (
    <div className="w-full text-neutral-200 flex flex-col">
      <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
        <MasterIntelligenceReportSection />
      </main>
    </div>
  );
}
