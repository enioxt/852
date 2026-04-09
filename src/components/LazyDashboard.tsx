/**
 * Lazy Loaded Dashboard Component — 852 Inteligência
 *
 * Code-split Recharts to reduce initial bundle size.
 * Only loads chart library when dashboard is accessed.
 */

'use client';

import { Suspense, lazy } from 'react';
import { Activity, TrendingUp, Users, Clock, Loader2 } from 'lucide-react';

// Lazy load the heavy dashboard page
const DashboardPage = lazy(() => import('@/app/dashboard/page'));

// Loading fallback
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-6">
      {/* Header skeleton */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 animate-pulse" />
          <div className="h-6 w-48 bg-neutral-800 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-neutral-800 rounded-xl animate-pulse" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-neutral-800 animate-pulse" />
              <div className="w-16 h-5 bg-neutral-800 rounded animate-pulse" />
            </div>
            <div className="h-8 w-20 bg-neutral-800 rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-neutral-800 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-5 h-5 rounded bg-neutral-800 animate-pulse" />
          <div className="h-5 w-48 bg-neutral-800 rounded animate-pulse" />
        </div>
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-neutral-600 animate-spin" />
        </div>
      </div>
    </div>
  );
}

export default function LazyDashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPage />
    </Suspense>
  );
}
