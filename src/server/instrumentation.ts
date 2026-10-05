import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

const dsn = process.env['SENTRY_DSN'];

if (dsn) {
  Sentry.init({
    dsn,
    integrations: [
      // Automatic HTTP/fetch request tracing
      Sentry.httpIntegration(),
      // Node.js profiling for flame graphs
      nodeProfilingIntegration(),
    ],
    // Capture 100% of traces in dev/staging; reduce in production
    tracesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.2 : 1.0,
    profilesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.2 : 1.0,
    environment: process.env['NODE_ENV'] ?? 'development',
    release: process.env['APP_VERSION'] ?? '0.0.0',
    // Attach server name for multi-instance deployments
    serverName: process.env['HOSTNAME'] ?? 'analog-anime-server',
  });
  console.log('[sentry] Server instrumentation initialized');
} else {
  console.warn('[sentry] SENTRY_DSN not set — server observability disabled');
}
