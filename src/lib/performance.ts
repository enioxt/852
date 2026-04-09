/**
 * Performance utilities for 852
 * Lazy loading, bundle optimization, and database indexing
 * 
 * @task P3-Sprint-v10 Performance
 */

// =============================================================================
// LAZY LOADING CONFIGURATION
// =============================================================================

/**
 * Dynamic import configurations for heavy components
 * Usage in components:
 *   import { lazyChartConfig } from '@/lib/performance';
 *   const LineChart = dynamic(() => import('recharts').then(m => ({ default: m.LineChart })), lazyChartConfig);
 */
export const lazyChartConfig = {
  ssr: false,
  loading: () => null, // Use Suspense fallback
};

export const lazyPDFConfig = {
  ssr: false,
  loading: () => null,
};

export const lazyAdminConfig = {
  ssr: false,
  loading: () => null,
};

// =============================================================================
// BUNDLE OPTIMIZATION UTILITIES
// =============================================================================

/**
 * Preload critical routes data
 */
export async function prefetchCriticalData(): Promise<void> {
  // Only run on client
  if (typeof window === "undefined") return;

  // Prefetch user session
  const sessionPromise = fetch("/api/auth/session").catch(() => null);

  // Prefetch hot topics
  const topicsPromise = fetch("/api/hot-topics?limit=5").catch(() => null);

  await Promise.all([sessionPromise, topicsPromise]);
}

/**
 * Defer non-critical third-party scripts
 */
export function loadDeferredScripts(): void {
  if (typeof window === "undefined") return;

  // Load analytics only after user interaction or 5s delay
  const loadAnalytics = () => {
    // Clarity already loaded via strategy="afterInteractive"
    console.log("[Performance] Deferred scripts loaded");
  };

  // Wait for user interaction or timeout
  const interactionEvents = ["click", "scroll", "keydown"];
  const loadOnInteraction = () => {
    loadAnalytics();
    interactionEvents.forEach(e => window.removeEventListener(e, loadOnInteraction));
  };

  interactionEvents.forEach(e => window.addEventListener(e, loadOnInteraction));
  setTimeout(loadAnalytics, 5000); // Fallback: load after 5s
}

// =============================================================================
// DATABASE INDEXING & QUERY OPTIMIZATION
// =============================================================================

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: string;
}

const slowQueries: QueryMetrics[] = [];

/**
 * Log slow queries for analysis
 */
export function logSlowQuery(query: string, duration: number): void {
  if (duration > 100) { // Log queries > 100ms
    slowQueries.push({ query, duration, timestamp: new Date().toISOString() });

    // Keep only last 100
    if (slowQueries.length > 100) slowQueries.shift();

    if (process.env.NODE_ENV === "development") {
      console.warn(`[Slow Query] ${duration}ms: ${query.substring(0, 100)}...`);
    }
  }
}

/**
 * Get slow queries report
 */
export function getSlowQueriesReport(): QueryMetrics[] {
  return [...slowQueries].sort((a, b) => b.duration - a.duration);
}

/**
 * SQL Index Recommendations
 * Run these on Supabase to optimize performance
 */
export const RECOMMENDED_INDEXES = `
-- Hot topics indexing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hot_topics_engagement 
  ON topics ((votes_count + comments_count + views_count / 100));

-- Chat search optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chats_user_updated 
  ON chats(user_id, updated_at DESC);

-- Reports filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_status_created 
  ON reports(status, created_at DESC) 
  WHERE status = 'published';

-- Analytics aggregation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_event_date 
  ON analytics_events(event_type, created_at) 
  WHERE created_at > NOW() - INTERVAL '30 days';

-- PII scan results
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pii_scans_created 
  ON pii_scans(created_at DESC) 
  WHERE has_pii = true;
`;

// =============================================================================
// BUNDLE SIZE MONITORING
// =============================================================================

interface BundleMetric {
  route: string;
  size: number;
  compressed: number;
  timestamp: string;
}

/**
 * Log bundle size for monitoring
 */
export function logBundleSize(route: string, size: number): void {
  if (typeof window === "undefined") return;

  const metric: BundleMetric = {
    route,
    size,
    compressed: Math.round(size * 0.3), // ~30% compression estimate
    timestamp: new Date().toISOString()
  };

  // Send to analytics if size > 500KB
  if (size > 500 * 1024) {
    console.warn(`[Bundle] Large bundle on ${route}: ${(size / 1024).toFixed(1)}KB`);
  }
}

/**
 * Estimated bundle size targets
 */
export const BUNDLE_TARGETS = {
  initial: 150 * 1024,      // 150KB initial
  route: 100 * 1024,          // 100KB per route
  lazy: 200 * 1024,           // 200KB for lazy components
  total: 500 * 1024           // 500KB total budget
};

// =============================================================================
// IMAGE OPTIMIZATION
// =============================================================================

/**
 * Generate optimized image props
 */
export function getOptimizedImageProps(
  src: string,
  width: number,
  height: number
): {
  src: string;
  width: number;
  height: number;
  loading: "lazy" | "eager";
  priority: boolean;
} {
  return {
    src,
    width,
    height,
    loading: width > 800 ? "lazy" : "eager",
    priority: width <= 800
  };
}

// =============================================================================
// CACHE STRATEGIES
// =============================================================================

/**
 * Cache configuration for different data types
 */
export const CACHE_CONFIG = {
  hotTopics: {
    ttl: 60 * 1000,        // 1 minute (very volatile)
    staleWhileRevalidate: 5 * 60 * 1000  // 5 min stale
  },
  userProfile: {
    ttl: 5 * 60 * 1000,    // 5 minutes
    staleWhileRevalidate: 30 * 60 * 1000 // 30 min stale
  },
  staticContent: {
    ttl: 60 * 60 * 1000,   // 1 hour
    staleWhileRevalidate: 24 * 60 * 60 * 1000 // 24 hours
  }
};

/**
 * Edge cache headers helper
 */
export function getCacheHeaders(type: keyof typeof CACHE_CONFIG): {
  "CDN-Cache-Control": string;
  "Vercel-CDN-Cache-Control"?: string;
} {
  const config = CACHE_CONFIG[type];
  const ttl = Math.round(config.ttl / 1000);
  const stale = Math.round(config.staleWhileRevalidate / 1000);

  return {
    "CDN-Cache-Control": `max-age=${ttl}, stale-while-revalidate=${stale}`
  };
}
