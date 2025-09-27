import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ExchangeReconciliationResult {
  total_users: number;
  total_rioz_balance: number;
  total_brl_balance: number;
  exchange_rioz_net: number;
  exchange_brl_net: number;
  rioz_discrepancy: number;
  brl_discrepancy: number;
  is_reconciled: boolean;
  last_check: string;
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Generate correlation ID
  const correlationId = `exchange-reconcile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  function structuredLog(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId,
      operation: 'validate_exchange_reconciliation',
      data
    };
    console.log(JSON.stringify(logEntry));
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    structuredLog('info', 'Starting exchange reconciliation validation');

    // Call the new exchange-specific reconciliation function
    const { data: reconciliationData, error: reconciliationError } = await supabase
      .rpc('validate_exchange_reconciliation');

    if (reconciliationError) {
      structuredLog('error', 'Exchange reconciliation validation failed', reconciliationError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to validate exchange reconciliation', 
          correlationId,
          details: reconciliationError.message 
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const result: ExchangeReconciliationResult = reconciliationData[0];
    
    const reconciliationSeverity = result.is_reconciled ? 'info' : 
      (Math.abs(result.rioz_discrepancy) > 100 || Math.abs(result.brl_discrepancy) > 1000) ? 'error' : 'warn';
    
    structuredLog(reconciliationSeverity, 'Exchange reconciliation validation completed', {
      isReconciled: result.is_reconciled,
      riozDiscrepancy: result.rioz_discrepancy,
      brlDiscrepancy: result.brl_discrepancy,
      totalUsers: result.total_users,
      exchangeFilled: {
        rioz: result.exchange_rioz_net,
        brl: result.exchange_brl_net
      }
    });

    // Log reconciliation audit trail
    await supabase.from('audit_logs').insert({
      action: 'exchange_reconciliation_check',
      resource_type: 'exchange_accounting',
      resource_id: correlationId,
      new_values: {
        ...result,
        correlationId
      },
      severity: result.is_reconciled ? 'info' : 'warn',
      correlation_id: correlationId
    });

    // Log telemetry event
    await supabase.rpc('log_exchange_event', {
      p_user_id: null, // System event
      p_event_type: 'exchange_reconciliation_check',
      p_event_data: {
        ...result,
        correlationId
      },
      p_correlation_id: correlationId
    });

    // Generate recommendations based on reconciliation status
    const recommendations = [];
    if (result.is_reconciled) {
      recommendations.push('Exchange accounting is properly reconciled');
    } else {
      recommendations.push('Exchange discrepancy detected - review needed');
      
      if (Math.abs(result.rioz_discrepancy) > 0.01) {
        recommendations.push(`RIOZ discrepancy: ${result.rioz_discrepancy} - check filled exchange orders`);
      }
      
      if (Math.abs(result.brl_discrepancy) > 0.01) {
        recommendations.push(`BRL discrepancy: ${result.brl_discrepancy} - verify exchange transactions`);
      }
      
      if (result.total_users > 0 && result.exchange_rioz_net === 0 && result.exchange_brl_net === 0) {
        recommendations.push('No filled exchange orders found - users may have balances from external sources');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reconciliation: result,
        correlationId,
        recommendations,
        healthCheck: {
          exchangeSystem: 'operational',
          accountingIntegrity: result.is_reconciled ? 'verified' : 'requires_attention',
          lastCheck: result.last_check
        }
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    structuredLog('error', 'Exchange reconciliation validation exception', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        correlationId 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});