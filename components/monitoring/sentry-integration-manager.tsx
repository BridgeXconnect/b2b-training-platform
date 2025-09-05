/**
 * Sentry Integration Manager Component
 * Provides UI for managing Sentry monitoring setup
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, Settings, Activity, AlertTriangle } from 'lucide-react';

interface IntegrationHealth {
  connected: boolean;
  permissions: {
    canReadProjects: boolean;
    canCreateDashboards: boolean;
    canCreateAlerts: boolean;
  };
  organization: string;
  project: string;
}

interface SetupResult {
  dashboards: {
    created: number;
    failed: number;
    errors: string[];
  };
  alerts: {
    created: number;
    failed: number;
    errors: string[];
  };
}

export function SentryIntegrationManager() {
  const [health, setHealth] = useState<IntegrationHealth | null>(null);
  const [setupResult, setSetupResult] = useState<SetupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial health status
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sentry/integration?action=health');
      const data = await response.json();
      
      if (response.ok) {
        setHealth(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to check integration health');
      }
    } catch (err) {
      setError('Failed to connect to integration service');
    } finally {
      setLoading(false);
    }
  };

  const runCompleteSetup = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/sentry/integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'setup_complete',
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setSetupResult(data.results);
        // Refresh health status
        await checkHealth();
      } else {
        setError(data.error || 'Setup failed');
      }
    } catch (err) {
      setError('Failed to run setup');
    } finally {
      setLoading(false);
    }
  };

  const createDashboards = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/sentry/integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_dashboards',
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setSetupResult(prev => ({
          ...prev,
          dashboards: data.result,
        } as SetupResult));
      } else {
        setError(data.error || 'Dashboard creation failed');
      }
    } catch (err) {
      setError('Failed to create dashboards');
    } finally {
      setLoading(false);
    }
  };

  const createAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/sentry/integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_alerts',
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setSetupResult(prev => ({
          ...prev,
          alerts: data.result,
        } as SetupResult));
      } else {
        setError(data.error || 'Alert creation failed');
      }
    } catch (err) {
      setError('Failed to create alerts');
    } finally {
      setLoading(false);
    }
  };

  const HealthStatus = ({ connected, label }: { connected: boolean; label: string }) => (
    <div className="flex items-center gap-2">
      {connected ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600" />
      )}
      <span className={connected ? 'text-green-700' : 'text-red-700'}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Health Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Sentry Integration Health
          </CardTitle>
          <CardDescription>
            Monitor the status of your Sentry integration and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !health ? (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 animate-spin" />
              <span>Checking integration health...</span>
            </div>
          ) : health ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Connection Status</h4>
                  <HealthStatus 
                    connected={health.connected} 
                    label={health.connected ? 'Connected' : 'Disconnected'} 
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-2">Organization</h4>
                  <Badge variant="outline">{health.organization}</Badge>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Permissions</h4>
                <div className="space-y-1">
                  <HealthStatus 
                    connected={health.permissions.canReadProjects} 
                    label="Read Projects" 
                  />
                  <HealthStatus 
                    connected={health.permissions.canCreateDashboards} 
                    label="Create Dashboards" 
                  />
                  <HealthStatus 
                    connected={health.permissions.canCreateAlerts} 
                    label="Create Alert Rules" 
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Unable to load health status</div>
          )}
          
          <div className="mt-4">
            <Button onClick={checkHealth} disabled={loading} variant="outline">
              {loading ? 'Checking...' : 'Refresh Status'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Setup Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Integration Setup
          </CardTitle>
          <CardDescription>
            Set up your monitoring infrastructure automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button 
                onClick={runCompleteSetup} 
                disabled={loading || !health?.connected}
                className="w-full"
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
              </Button>
              
              <Button 
                onClick={createDashboards} 
                disabled={loading || !health?.permissions.canCreateDashboards}
                variant="outline"
                className="w-full"
              >
                Create Dashboards
              </Button>
              
              <Button 
                onClick={createAlerts} 
                disabled={loading || !health?.permissions.canCreateAlerts}
                variant="outline"
                className="w-full"
              >
                Create Alerts
              </Button>
            </div>
            
            {!health?.connected && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Integration not connected. Please check your authentication token and permissions.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Results Card */}
      {setupResult && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Results</CardTitle>
            <CardDescription>
              Results from the last integration setup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              {/* Dashboard Results */}
              <div>
                <h4 className="font-medium mb-2">Dashboards</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <Badge variant="outline" className="text-green-700">
                      {setupResult.dashboards.created}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed:</span>
                    <Badge variant="outline" className="text-red-700">
                      {setupResult.dashboards.failed}
                    </Badge>
                  </div>
                  {setupResult.dashboards.errors.length > 0 && (
                    <div className="mt-2">
                      <details className="text-sm">
                        <summary className="cursor-pointer text-red-600">
                          View Errors ({setupResult.dashboards.errors.length})
                        </summary>
                        <ul className="mt-1 space-y-1 text-xs text-red-600">
                          {setupResult.dashboards.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  )}
                </div>
              </div>

              {/* Alert Results */}
              <div>
                <h4 className="font-medium mb-2">Alert Rules</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <Badge variant="outline" className="text-green-700">
                      {setupResult.alerts.created}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed:</span>
                    <Badge variant="outline" className="text-red-700">
                      {setupResult.alerts.failed}
                    </Badge>
                  </div>
                  {setupResult.alerts.errors.length > 0 && (
                    <div className="mt-2">
                      <details className="text-sm">
                        <summary className="cursor-pointer text-red-600">
                          View Errors ({setupResult.alerts.errors.length})
                        </summary>
                        <ul className="mt-1 space-y-1 text-xs text-red-600">
                          {setupResult.alerts.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}