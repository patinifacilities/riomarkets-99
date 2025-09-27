import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { Logger, createCorsHeaders } from '../_shared/logger.ts';

const corsHeaders = createCorsHeaders();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const context = Logger.createContext(req, 'test-reconciliation');
  const logger = new Logger(supabaseUrl, supabaseKey, context);

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Run comprehensive reconciliation validation
    const { data: reconciliationData, error: reconciliationError } = await supabase
      .rpc('validate_accounting_reconciliation');

    if (reconciliationError) {
      await logger.logAudit({
        action: 'reconciliation_test_failed',
        resourceType: 'accounting',
        newValues: { error: reconciliationError.message },
        severity: 'error'
      });
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Reconciliation test failed', 
          details: reconciliationError.message,
          correlationId: context.correlationId
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const result = reconciliationData[0];
    
    // Test specific scenarios for critical functions
    const testResults = {
      reconciliation: result,
      tests: {
        balanceConsistency: result.is_reconciled,
        criticalThreshold: Math.abs(result.rioz_discrepancy) <= 1.0 && Math.abs(result.brl_discrepancy) <= 10.0,
        userCount: result.total_users > 0
      }
    };

    // Log comprehensive test results
    await logger.logAudit({
      action: 'reconciliation_test_completed',
      resourceType: 'accounting',
      newValues: {
        ...testResults,
        timestamp: new Date().toISOString()
      },
      severity: testResults.tests.balanceConsistency ? 'info' : 'warn'
    });

    // Generate recommendations based on test results
    const recommendations = [];
    
    if (!result.is_reconciled) {
      recommendations.push('⚠️ CRITICAL: Accounting discrepancy detected');
      recommendations.push(`RIOZ difference: ${result.rioz_discrepancy}`);
      recommendations.push(`BRL difference: ${result.brl_discrepancy}`);
      
      if (Math.abs(result.rioz_discrepancy) > 100) {
        recommendations.push('🚨 URGENT: RIOZ discrepancy exceeds safe threshold');
      }
      if (Math.abs(result.brl_discrepancy) > 1000) {
        recommendations.push('🚨 URGENT: BRL discrepancy exceeds safe threshold');
      }
      
      recommendations.push('Action required: Review recent exchange operations');
      recommendations.push('Check wallet_transactions consistency');
      recommendations.push('Verify filled order fee calculations');
    } else {
      recommendations.push('✅ Accounting is properly reconciled');
      recommendations.push('✅ All balances match ledger entries');
      recommendations.push('✅ System ready for production');
    }

    const testScore = Object.values(testResults.tests).filter(Boolean).length / Object.keys(testResults.tests).length * 100;

    return new Response(
      JSON.stringify({
        success: true,
        testScore: Math.round(testScore),
        correlationId: context.correlationId,
        timestamp: new Date().toISOString(),
        ...testResults,
        recommendations,
        actionRequired: !result.is_reconciled,
        nextSteps: result.is_reconciled 
          ? ['Monitor ongoing transactions', 'Schedule regular reconciliation checks']
          : ['Investigate discrepancies immediately', 'Halt new transactions until resolved', 'Contact technical team']
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    await logger.logAudit({
      action: 'reconciliation_test_error',
      resourceType: 'accounting',
      newValues: { error: error instanceof Error ? error.message : String(error) },
      severity: 'error'
    });

    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        correlationId: context.correlationId
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});