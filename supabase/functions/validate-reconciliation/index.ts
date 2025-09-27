import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ReconciliationResult {
  total_users: number;
  total_rioz_balance: number;
  total_brl_balance: number;
  ledger_rioz_net: number;
  ledger_brl_net: number;
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
  const correlationId = `reconcile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  function structuredLog(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId,
      operation: 'validate_reconciliation',
      data
    };
    console.log(JSON.stringify(logEntry));
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    structuredLog('info', 'Starting accounting reconciliation validation');

    // Call the reconciliation validation function
    const { data: reconciliationData, error: reconciliationError } = await supabase
      .rpc('validate_accounting_reconciliation');

    if (reconciliationError) {
      structuredLog('error', 'Reconciliation validation failed', reconciliationError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to validate reconciliation', 
          correlationId,
          details: reconciliationError.message 
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const result: ReconciliationResult = reconciliationData[0];
    
    structuredLog('info', 'Reconciliation validation completed', {
      isReconciled: result.is_reconciled,
      riozDiscrepancy: result.rioz_discrepancy,
      brlDiscrepancy: result.brl_discrepancy,
      totalUsers: result.total_users
    });

    // Log reconciliation audit trail
    await supabase.from('audit_logs').insert({
      action: 'reconciliation_check',
      resourceType: 'accounting',
      resourceId: correlationId,
      newValues: {
        ...result,
        correlationId
      },
      severity: result.is_reconciled ? 'info' : 'warn'
    });

    // If not reconciled, trigger warning
    if (!result.is_reconciled) {
      structuredLog('warn', 'ACCOUNTING DISCREPANCY DETECTED', {
        riozDiscrepancy: result.rioz_discrepancy,
        brlDiscrepancy: result.brl_discrepancy,
        requiresInvestigation: true
      });
      
      // Save reconciliation report for admin review
      await supabase.from('reconciliation_reports').insert({
        total_users: result.total_users,
        total_rioz_balance: result.total_rioz_balance,
        total_brl_balance: result.total_brl_balance,
        ledger_rioz_balance: result.ledger_rioz_net,
        ledger_brl_balance: result.ledger_brl_net,
        rioz_discrepancy: result.rioz_discrepancy,
        brl_discrepancy: result.brl_discrepancy,
        status: 'discrepancy_found',
        discrepancies_found: Math.abs(result.rioz_discrepancy) > 0.01 || Math.abs(result.brl_discrepancy) > 0.01 ? 1 : 0,
        report_data: {
          correlationId,
          timestamp: result.last_check,
          automated_check: true
        }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        reconciliation: result,
        correlationId,
        recommendations: result.is_reconciled 
          ? ['Accounting is properly reconciled'] 
          : [
              'Review recent exchange transactions',
              'Check for missing wallet transaction entries',
              'Verify fee calculations in filled orders',
              'Investigate balance adjustment operations'
            ]
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    structuredLog('error', 'Reconciliation validation exception', {
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