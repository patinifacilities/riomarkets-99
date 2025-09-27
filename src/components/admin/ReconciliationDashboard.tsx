import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { RefreshCw, AlertTriangle, CheckCircle, TrendingUp, Users, DollarSign } from 'lucide-react';
import { getSystemHealth, type SystemHealth } from '@/lib/telemetry';

interface ReconciliationReport {
  id: string;
  report_date: string;
  total_users: number;
  total_rioz_balance: number;
  total_brl_balance: number;
  ledger_rioz_balance: number;
  rioz_discrepancy: number;
  brl_discrepancy: number;
  discrepancies_found: number;
  status: string;
  created_at: string;
  report_data?: {
    userDiscrepancies?: Array<{
      userId: string;
      balanceRioz: number;
      ledgerRioz: number;
      diffRioz: number;
    }>;
    summary?: {
      totalChecked: number;
      discrepanciesFound: number;
      largestDiscrepancy: number;
    };
  };
}

export const ReconciliationDashboard: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReconciliationReport[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reconciliation_reports')
        .select('*')
        .order('report_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setReports((data || []) as ReconciliationReport[]);
    } catch (error) {
      console.error('Failed to fetch reconciliation reports:', error);
      toast.error('Failed to load reconciliation reports');
    }
  };

  const fetchSystemHealth = async () => {
    const health = await getSystemHealth();
    setSystemHealth(health);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchReports(), fetchSystemHealth()]);
      setIsLoading(false);
    };

    loadData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const runReconciliation = async () => {
    if (!user) return;

    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('reconcile-balances', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;

      toast.success('Reconciliation completed successfully');
      await fetchReports();
      await fetchSystemHealth();
    } catch (error: any) {
      console.error('Reconciliation failed:', error);
      toast.error(`Reconciliation failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadge = (status: string, discrepancies: number) => {
    if (status === 'completed' && discrepancies === 0) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>;
    }
    if (discrepancies > 0) {
      return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Issues Found</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
  };

  const getHealthBadge = (status: 'healthy' | 'warning' | 'error') => {
    const variants = {
      healthy: { className: 'bg-green-100 text-green-800', icon: CheckCircle },
      warning: { className: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      error: { className: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };
    
    const { className, icon: Icon } = variants[status];
    return (
      <Badge className={className}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const latestReport = reports[0];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reconciliation Dashboard</h1>
        <Button 
          onClick={runReconciliation} 
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Running...' : 'Run Reconciliation'}
        </Button>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users (24h)</p>
                  <p className="text-2xl font-bold">{systemHealth.activeUsers}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Error Rate</p>
                  <p className="text-2xl font-bold">{systemHealth.errorRate.toFixed(2)}%</p>
                </div>
                <TrendingUp className={`w-8 h-8 ${systemHealth.errorRate > 5 ? 'text-red-500' : 'text-green-500'}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  <p className="text-2xl font-bold">{systemHealth.avgResponseTime}ms</p>
                </div>
                <RefreshCw className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Exchange Volume (24h)</p>
                  <p className="text-2xl font-bold">{formatCurrency(systemHealth.exchangeVolume24h)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Latest Reconciliation Status */}
      {latestReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Latest Reconciliation</span>
              {getStatusBadge(latestReport.status, latestReport.discrepancies_found)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Balance Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Users:</span>
                    <span className="font-mono">{latestReport.total_users}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RIOZ Balance:</span>
                    <span className="font-mono">{formatCurrency(latestReport.total_rioz_balance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>BRL Balance:</span>
                    <span className="font-mono">{formatCurrency(latestReport.total_brl_balance)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Ledger Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>RIOZ Ledger:</span>
                    <span className="font-mono">{formatCurrency(latestReport.ledger_rioz_balance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RIOZ Discrepancy:</span>
                    <span className={`font-mono ${Math.abs(latestReport.rioz_discrepancy) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                      {latestReport.rioz_discrepancy > 0 ? '+' : ''}{formatCurrency(latestReport.rioz_discrepancy)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Issues Found:</span>
                    <span className={`font-mono ${latestReport.discrepancies_found > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {latestReport.discrepancies_found}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {latestReport.discrepancies_found > 0 && latestReport.report_data?.userDiscrepancies && (
              <div>
                <Separator className="my-4" />
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Found {latestReport.discrepancies_found} user balance discrepancies. 
                    Largest discrepancy: {formatCurrency(latestReport.report_data.summary?.largestDiscrepancy || 0)}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* System Health Status */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>System Health</span>
              {getHealthBadge(systemHealth.reconciliationStatus)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Last Reconciliation:</span>
                <span className="ml-2 font-mono">
                  {systemHealth.lastReconciliation 
                    ? systemHealth.lastReconciliation.toLocaleDateString('pt-BR')
                    : 'Never'
                  }
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">System Status:</span>
                <span className="ml-2 font-mono">
                  {systemHealth.reconciliationStatus === 'healthy' ? 'All systems operational' : 
                   systemHealth.reconciliationStatus === 'warning' ? 'Minor issues detected' : 
                   'Critical issues found'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{new Date(report.report_date).toLocaleDateString('pt-BR')}</p>
                    <p className="text-sm text-muted-foreground">
                      {report.total_users} users • {formatCurrency(report.total_rioz_balance)} RIOZ
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(report.status, report.discrepancies_found)}
                  {report.discrepancies_found > 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      {report.discrepancies_found} issues
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};