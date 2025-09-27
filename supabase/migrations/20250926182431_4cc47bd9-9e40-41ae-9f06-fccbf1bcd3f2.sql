-- Reconciliation & Rate Limit System Tables

-- Rate limiting table
CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  ip_address INET,
  endpoint TEXT NOT NULL,
  requests_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_rate_limits_user_endpoint ON public.rate_limits(user_id, endpoint);
CREATE INDEX idx_rate_limits_ip_endpoint ON public.rate_limits(ip_address, endpoint);
CREATE INDEX idx_rate_limits_window ON public.rate_limits(window_start);

-- Reconciliation reports table
CREATE TABLE public.reconciliation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_users INTEGER NOT NULL DEFAULT 0,
  total_rioz_balance NUMERIC NOT NULL DEFAULT 0,
  total_brl_balance NUMERIC NOT NULL DEFAULT 0,
  ledger_rioz_balance NUMERIC NOT NULL DEFAULT 0,
  ledger_brl_balance NUMERIC NOT NULL DEFAULT 0,
  rioz_discrepancy NUMERIC NOT NULL DEFAULT 0,
  brl_discrepancy NUMERIC NOT NULL DEFAULT 0,
  discrepancies_found INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  report_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(report_date)
);

-- System metrics table for telemetry
CREATE TABLE public.system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  tags JSONB DEFAULT '{}',
  correlation_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for metrics queries
CREATE INDEX idx_system_metrics_name_timestamp ON public.system_metrics(metric_name, timestamp);
CREATE INDEX idx_system_metrics_correlation ON public.system_metrics(correlation_id);

-- Audit log table for financial operations
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  correlation_id UUID,
  severity TEXT NOT NULL DEFAULT 'info',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for audit queries
CREATE INDEX idx_audit_logs_user_action ON public.audit_logs(user_id, action);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(created_at);
CREATE INDEX idx_audit_logs_correlation ON public.audit_logs(correlation_id);

-- Request logs table for detailed logging
CREATE TABLE public.request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id UUID NOT NULL,
  user_id UUID,
  ip_address INET,
  method TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  status_code INTEGER,
  duration_ms INTEGER,
  request_size INTEGER,
  response_size INTEGER,
  error_message TEXT,
  stack_trace TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for request log queries
CREATE INDEX idx_request_logs_correlation ON public.request_logs(correlation_id);
CREATE INDEX idx_request_logs_endpoint_timestamp ON public.request_logs(endpoint, created_at);
CREATE INDEX idx_request_logs_user_timestamp ON public.request_logs(user_id, created_at);

-- Enable Row Level Security
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rate_limits (admin only)
CREATE POLICY "Admin can manage rate limits"
ON public.rate_limits
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- RLS Policies for reconciliation_reports (admin only)
CREATE POLICY "Admin can view reconciliation reports"
ON public.reconciliation_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- RLS Policies for system_metrics (admin only)
CREATE POLICY "Admin can view system metrics"
ON public.system_metrics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- RLS Policies for audit_logs (admin can view all, users can view their own)
CREATE POLICY "Admin can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs
FOR SELECT
USING (user_id = auth.uid());

-- RLS Policies for request_logs (admin only)
CREATE POLICY "Admin can view request logs"
ON public.request_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Function to clean old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete rate limit records older than 1 hour
  DELETE FROM public.rate_limits 
  WHERE window_start < now() - interval '1 hour';
END;
$$;

-- Function to get current reconciliation status
CREATE OR REPLACE FUNCTION public.get_reconciliation_status()
RETURNS TABLE(
  balances_rioz NUMERIC,
  balances_brl NUMERIC,
  ledger_rioz NUMERIC,
  ledger_brl NUMERIC,
  rioz_diff NUMERIC,
  brl_diff NUMERIC,
  last_report_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH balance_sums AS (
    SELECT 
      COALESCE(SUM(rioz_balance), 0) as total_rioz,
      COALESCE(SUM(brl_balance), 0) as total_brl
    FROM public.balances
  ),
  ledger_sums AS (
    SELECT 
      COALESCE(SUM(CASE WHEN tipo = 'credito' THEN valor ELSE -valor END), 0) as ledger_balance
    FROM public.wallet_transactions
  ),
  last_report AS (
    SELECT report_date 
    FROM public.reconciliation_reports 
    ORDER BY report_date DESC 
    LIMIT 1
  )
  SELECT 
    bs.total_rioz,
    bs.total_brl,
    ls.ledger_balance,
    0::NUMERIC, -- BRL ledger (not implemented yet)
    bs.total_rioz - ls.ledger_balance,
    bs.total_brl - 0::NUMERIC,
    lr.report_date
  FROM balance_sums bs, ledger_sums ls, last_report lr;
END;
$$;

-- Trigger to update updated_at on rate_limits
CREATE TRIGGER update_rate_limits_updated_at
  BEFORE UPDATE ON public.rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();