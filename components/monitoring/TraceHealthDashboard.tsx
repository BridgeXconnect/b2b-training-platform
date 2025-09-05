'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Zap,
  RefreshCw,
  Eye,
  Link
} from 'lucide-react';
import { TraceTestingSuite, quickTraceHealthCheck, type TraceHealthReport, type TraceTestResult } from '@/lib/services/trace-testing';
import { logger } from '@/lib/logger';

interface TraceHealthDashboardProps {
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

export function TraceHealthDashboard({ 
  autoRefresh = true, 
  refreshInterval = 30 
}: TraceHealthDashboardProps) {
  const [healthReport, setHealthReport] = useState<TraceHealthReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  // Quick health check on component mount
  useEffect(() => {
    performQuickCheck();
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      performQuickCheck();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const performQuickCheck = async () => {
    try {
      const quickCheck = await quickTraceHealthCheck();
      
      if (!quickCheck.healthy) {
        setError('Quick health check failed - trace correlation may not be working');
      } else {
        setError(null);
      }
      
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to perform quick health check');
      logger.sentryError(
        err instanceof Error ? err : new Error(String(err)),
        'TRACE_MONITORING',
        { operation: 'quick_health_check' }
      );
    }
  };

  const runFullTestSuite = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const testSuite = new TraceTestingSuite();
      const report = await testSuite.runFullTraceSuite();
      
      setHealthReport(report);
      setLastUpdated(new Date());
      
      // Log the results for monitoring
      logger.addBreadcrumb('Trace health test completed', 'monitoring', {
        overallHealth: report.overallHealth,
        correlationRate: report.correlationRate,
        successfulTests: report.testResults.filter(t => t.success).length,
        totalTests: report.testResults.length,
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to run trace test suite: ${errorMessage}`);
      
      logger.sentryError(
        err instanceof Error ? err : new Error(String(err)),
        'TRACE_MONITORING',
        { operation: 'full_test_suite' }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTestIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            Distributed Tracing Health
          </h2>
          <p className="text-gray-600 text-sm">
            Monitor trace correlation between frontend and backend systems
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={runFullTestSuite}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Run Full Test Suite
          </Button>
          <Button
            variant="outline"
            onClick={() => setDetailsVisible(!detailsVisible)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {detailsVisible ? 'Hide' : 'Show'} Details
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Link className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Trace Correlation</p>
                <p className="text-2xl font-bold">
                  {healthReport ? `${Math.round(healthReport.correlationRate * 100)}%` : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Latency</p>
                <p className="text-2xl font-bold">
                  {healthReport ? `${Math.round(healthReport.averageLatency)}ms` : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Test Success</p>
                <p className="text-2xl font-bold">
                  {healthReport ? 
                    `${healthReport.testResults.filter(t => t.success).length}/${healthReport.testResults.length}` : 
                    '—'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overall Health</p>
                <div className="mt-1">
                  {healthReport ? (
                    <Badge className={getHealthColor(healthReport.overallHealth)}>
                      {healthReport.overallHealth}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Unknown</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <p className="text-sm text-gray-500 text-center">
          Last updated: {lastUpdated.toLocaleString()}
        </p>
      )}

      {/* Detailed Test Results */}
      {detailsVisible && healthReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Detailed Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {healthReport.testResults.map((test, index) => (
                <TestResultCard key={index} test={test} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {healthReport && healthReport.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {healthReport.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Individual test result card component
 */
function TestResultCard({ test }: { test: TraceTestResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getTestIcon(test.success)}
          <div>
            <h4 className="font-medium text-gray-900">{test.testName}</h4>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Correlation: {Math.round(test.correlationRate * 100)}%</span>
              <span>Time: {Math.round(test.performanceMs)}ms</span>
              {test.errors.length > 0 && (
                <span className="text-red-600">{test.errors.length} error(s)</span>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Hide' : 'Show'} Details
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Frontend Trace ID:</span>
              <span className="ml-2 font-mono text-xs">{test.traceId || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium">Backend Trace ID:</span>
              <span className="ml-2 font-mono text-xs">{test.backendTraceId || 'N/A'}</span>
            </div>
          </div>

          {test.errors.length > 0 && (
            <div>
              <span className="font-medium text-red-600">Errors:</span>
              <ul className="mt-1 ml-4 space-y-1">
                {test.errors.map((error, index) => (
                  <li key={index} className="text-red-600 text-xs">• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {Object.keys(test.details).length > 0 && (
            <div>
              <span className="font-medium">Details:</span>
              <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
                {JSON.stringify(test.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getTestIcon(success: boolean) {
  return success ? (
    <CheckCircle className="h-4 w-4 text-green-500" />
  ) : (
    <XCircle className="h-4 w-4 text-red-500" />
  );
}