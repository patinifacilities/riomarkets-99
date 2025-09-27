import { supabase } from '@/integrations/supabase/client';
import { track } from './analytics';

export interface TelemetryEvent {
  name: string;
  value?: number;
  tags?: Record<string, any>;
  userId?: string;
}

export interface SystemHealth {
  timestamp: Date;
  activeUsers: number;
  errorRate: number;
  avgResponseTime: number;
  exchangeVolume24h: number;
  reconciliationStatus: 'healthy' | 'warning' | 'error';
  lastReconciliation?: Date;
}

class TelemetryService {
  private correlationId: string = '';

  constructor() {
    this.correlationId = crypto.randomUUID();
  }

  // Client-side event tracking
  async trackEvent(event: TelemetryEvent) {
    try {
      // Send to analytics first (for immediate processing)
      track(event.name, {
        value: event.value,
        ...event.tags,
        userId: event.userId,
        timestamp: Date.now()
      });

      // Store in database for historical analysis (async)
      if (event.value !== undefined) {
        await supabase
          .from('system_metrics')
          .insert({
            metric_name: event.name,
            metric_value: event.value,
            tags: event.tags || {},
            correlation_id: this.correlationId
          });
      }
    } catch (error) {
      console.warn('Failed to track telemetry event:', error);
    }
  }

  // Business metrics
  async trackExchangeOperation(operation: 'buy' | 'sell', amount: number, userId: string) {
    await this.trackEvent({
      name: 'exchange.operation',
      value: amount,
      tags: { operation, currency: 'RIOZ' },
      userId
    });
  }

  async trackMarketBet(marketId: string, amount: number, option: string, userId: string) {
    await this.trackEvent({
      name: 'market.bet_placed',
      value: amount,
      tags: { marketId, option },
      userId
    });
  }

  async trackUserLogin(userId: string, method: 'email' | 'google' = 'email') {
    await this.trackEvent({
      name: 'auth.login',
      value: 1,
      tags: { method },
      userId
    });
  }

  async trackError(error: Error, context?: string, userId?: string) {
    await this.trackEvent({
      name: 'system.error',
      value: 1,
      tags: {
        error: error.message,
        context,
        stack: error.stack?.substring(0, 500) // Truncate for storage
      },
      userId
    });
  }

  // Performance metrics
  async trackPageLoad(page: string, loadTime: number, userId?: string) {
    await this.trackEvent({
      name: 'performance.page_load',
      value: loadTime,
      tags: { page },
      userId
    });
  }

  async trackApiCall(endpoint: string, duration: number, statusCode: number, userId?: string) {
    await this.trackEvent({
      name: 'api.call',
      value: duration,
      tags: { endpoint, statusCode },
      userId
    });
  }

  // System health metrics
  async getSystemHealth(): Promise<SystemHealth | null> {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get recent metrics
      const { data: metrics } = await supabase
        .from('system_metrics')
        .select('*')
        .gte('timestamp', yesterday.toISOString())
        .order('timestamp', { ascending: false });

      if (!metrics || metrics.length === 0) {
        return null;
      }

      // Calculate active users (unique user logins in last 24h)
      const loginMetrics = metrics.filter(m => m.metric_name === 'auth.login');
      const uniqueUsers = new Set(
        loginMetrics
          .map(m => (m.tags as any)?.userId)
          .filter(Boolean)
      ).size;

      // Calculate error rate
      const totalEvents = metrics.length;
      const errorEvents = metrics.filter(m => m.metric_name === 'system.error').length;
      const errorRate = totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0;

      // Calculate average response time
      const apiCalls = metrics.filter(m => m.metric_name === 'api.call');
      const avgResponseTime = apiCalls.length > 0
        ? apiCalls.reduce((sum, m) => sum + Number(m.metric_value), 0) / apiCalls.length
        : 0;

      // Calculate exchange volume
      const exchangeOps = metrics.filter(m => m.metric_name === 'exchange.operation');
      const exchangeVolume24h = exchangeOps.reduce((sum, m) => sum + Number(m.metric_value), 0);

      // Get reconciliation status
      const { data: lastReconciliation } = await supabase
        .from('reconciliation_reports')
        .select('*')
        .order('report_date', { ascending: false })
        .limit(1)
        .single();

      let reconciliationStatus: 'healthy' | 'warning' | 'error' = 'healthy';
      if (!lastReconciliation) {
        reconciliationStatus = 'warning';
      } else if (lastReconciliation.discrepancies_found > 0) {
        reconciliationStatus = 'error';
      } else if (new Date(lastReconciliation.report_date).getTime() < Date.now() - 2 * 24 * 60 * 60 * 1000) {
        reconciliationStatus = 'warning'; // No reconciliation in 2 days
      }

      return {
        timestamp: now,
        activeUsers: uniqueUsers,
        errorRate: Math.round(errorRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime),
        exchangeVolume24h: Math.round(exchangeVolume24h * 100) / 100,
        reconciliationStatus,
        lastReconciliation: lastReconciliation ? new Date(lastReconciliation.created_at) : undefined
      };

    } catch (error) {
      console.error('Failed to get system health:', error);
      return null;
    }
  }

  // Cleanup old metrics (call periodically)
  async cleanupOldMetrics(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      await supabase
        .from('system_metrics')
        .delete()
        .lt('timestamp', cutoffDate.toISOString());

    } catch (error) {
      console.warn('Failed to cleanup old metrics:', error);
    }
  }
}

// Export singleton instance
export const telemetry = new TelemetryService();

// Convenience functions
export const trackExchange = telemetry.trackExchangeOperation.bind(telemetry);
export const trackBet = telemetry.trackMarketBet.bind(telemetry);
export const trackLogin = telemetry.trackUserLogin.bind(telemetry);
export const trackError = telemetry.trackError.bind(telemetry);
export const trackPageLoad = telemetry.trackPageLoad.bind(telemetry);
export const trackApiCall = telemetry.trackApiCall.bind(telemetry);
export const getSystemHealth = telemetry.getSystemHealth.bind(telemetry);