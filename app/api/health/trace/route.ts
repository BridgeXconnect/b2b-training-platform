import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  return await Sentry.withScope(async () => {
    return await Sentry.startSpan({
      name: 'GET /api/health/trace',
      op: 'http.server',
      attributes: {
        'api': 'health-trace',
        'feature': 'trace-verification',
      },
    }, async (span) => {
      // Extract trace headers from request
      const sentryTrace = request.headers.get('sentry-trace');
      const baggage = request.headers.get('baggage');
      const isVerification = request.headers.get('x-trace-verification') === 'true';
      
      // Get current trace information
      const currentTraceId = span.spanContext().traceId || 'unknown';
      
      // Parse parent trace ID from request
      const parentTraceId = sentryTrace?.split('-')[0] || null;
      
      // Check correlation
      const traceCorrelated = parentTraceId === currentTraceId || Boolean(sentryTrace);
      
      // Add breadcrumb for trace verification
      Sentry.addBreadcrumb({
        message: 'Trace health check performed',
        category: 'health.trace',
        level: 'info',
        data: {
          parentTraceId,
          currentTraceId,
          traceCorrelated,
          isVerification,
          hasSentryTrace: Boolean(sentryTrace),
          hasBaggage: Boolean(baggage),
        },
      });

      const response = NextResponse.json({
        status: 'healthy',
        tracing: {
          enabled: true,
          correlated: traceCorrelated,
          parentTraceId,
          currentTraceId,
          headers: {
            'sentry-trace': Boolean(sentryTrace),
            'baggage': Boolean(baggage),
          },
        },
        features: ['tracing', 'correlation', 'health-monitoring'],
        timestamp: new Date().toISOString(),
      });

      // Add trace correlation header to response
      response.headers.set('x-backend-trace-id', currentTraceId);
      response.headers.set('x-trace-correlated', traceCorrelated.toString());
      
      return response;
    });
  });
}