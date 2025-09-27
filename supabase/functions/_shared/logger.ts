import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

export interface LogContext {
  correlationId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  method: string;
  endpoint: string;
  startTime: Date;
}

export interface AuditLogData {
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  severity?: 'info' | 'warn' | 'error' | 'critical';
}

export interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, any>;
}

export class Logger {
  private supabase;
  private context: LogContext;

  constructor(supabaseUrl: string, supabaseKey: string, context: LogContext) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.context = context;
  }

  async logRequest(statusCode: number, error?: Error, requestSize?: number, responseSize?: number) {
    const duration = Date.now() - this.context.startTime.getTime();
    
    try {
      await this.supabase
        .from('request_logs')
        .insert({
          correlation_id: this.context.correlationId,
          user_id: this.context.userId || null,
          ip_address: this.context.ipAddress || null,
          method: this.context.method,
          endpoint: this.context.endpoint,
          status_code: statusCode,
          duration_ms: duration,
          request_size: requestSize || null,
          response_size: responseSize || null,
          error_message: error?.message || null,
          stack_trace: error?.stack || null
        });
    } catch (logError) {
      console.error('Failed to log request:', logError);
    }

    // Console log for immediate debugging
    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    console[logLevel](`[${this.context.correlationId}] ${this.context.method} ${this.context.endpoint} - ${statusCode} (${duration}ms)`, {
      userId: this.context.userId,
      error: error?.message,
      duration
    });
  }

  async logAudit(data: AuditLogData) {
    try {
      await this.supabase
        .from('audit_logs')
        .insert({
          user_id: this.context.userId || null,
          action: data.action,
          resource_type: data.resourceType,
          resource_id: data.resourceId || null,
          old_values: data.oldValues || null,
          new_values: data.newValues || null,
          ip_address: this.context.ipAddress || null,
          user_agent: this.context.userAgent || null,
          correlation_id: this.context.correlationId,
          severity: data.severity || 'info'
        });

      console.info(`[AUDIT] [${this.context.correlationId}] ${data.action} on ${data.resourceType}`, {
        userId: this.context.userId,
        resourceId: data.resourceId,
        severity: data.severity
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  async logMetric(data: MetricData) {
    try {
      await this.supabase
        .from('system_metrics')
        .insert({
          metric_name: data.name,
          metric_value: data.value,
          tags: data.tags || {},
          correlation_id: this.context.correlationId
        });

      console.info(`[METRIC] [${this.context.correlationId}] ${data.name}: ${data.value}`, data.tags);
    } catch (error) {
      console.error('Failed to log metric:', error);
    }
  }

  static generateCorrelationId(): string {
    return crypto.randomUUID();
  }

  static extractIpAddress(req: Request): string | undefined {
    // Try various headers for IP address
    const xForwardedFor = req.headers.get('x-forwarded-for');
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }
    
    const xRealIp = req.headers.get('x-real-ip');
    if (xRealIp) {
      return xRealIp;
    }

    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    if (cfConnectingIp) {
      return cfConnectingIp;
    }

    return undefined;
  }

  static createContext(req: Request, endpoint: string): LogContext {
    return {
      correlationId: req.headers.get('x-correlation-id') || Logger.generateCorrelationId(),
      ipAddress: Logger.extractIpAddress(req),
      userAgent: req.headers.get('user-agent') || undefined,
      method: req.method,
      endpoint,
      startTime: new Date()
    };
  }
}

export function createCorsHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Expose-Headers': 'x-correlation-id, x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset',
    ...additionalHeaders
  };
}