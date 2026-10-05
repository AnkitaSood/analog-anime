import * as Sentry from '@sentry/angular';

/**
 * Initializes Sentry browser SDK for the Angular client.
 *
 * Call this at the very top of `main.ts` — before Angular bootstraps — so that
 * Sentry captures errors and performance data from the earliest moment.
 *
 * Provides: error tracking, performance monitoring (browser tracing),
 * session replay, and release health.
 */
export function initBrowserSentry() {
  // Skip during SSR — Sentry browser SDK requires a DOM environment.
  if (typeof window === 'undefined') return;

  const dsn =
    ((window as unknown as Record<string, unknown>)['__SENTRY_DSN__'] as string | undefined) ?? '';

  if (!dsn) {
    console.warn('[sentry] No SENTRY_DSN found — client observability disabled');
    return;
  }

  Sentry.init({
    dsn,
    integrations: [
      // Automatic performance tracing for route changes and HTTP requests
      Sentry.browserTracingIntegration(),
      // Session replay — records DOM to replay user sessions on errors
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    // Capture 100% of traces in dev/staging; reduce to 10–20% in production
    tracesSampleRate: 1.0,
    // Record 10% of all sessions, but 100% of sessions with errors
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: 'development',
  });

  console.log('[sentry] Browser Sentry initialized');
}
