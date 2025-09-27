import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { Logger, createCorsHeaders } from '../_shared/logger.ts';
import { RateLimiter, RATE_LIMITS } from '../_shared/rateLimit.ts';

const corsHeaders = createCorsHeaders();

interface ReconciliationResult {
  reportDate: string;
  totalUsers: number;
  balances: {
    rioz: number;
    brl: number;
  };
  ledger: {
    rioz: number;
    brl: number;
  };
  discrepancies: {
    rioz: number;
    brl: number;
    count: number;
    userDiscrepancies: Array<{
      userId: string;
      balanceRioz: number;
      ledgerRioz: number;
      diffRioz: number;
    }>;
  };
  status: 'completed' | 'failed' | 'partial';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Create logging context
  const context = Logger.createContext(req, 'reconcile-balances');
  const logger = new Logger(supabaseUrl, supabaseKey, context);

  // Rate limiting (admin only, but still limit to prevent abuse)
  const rateLimiter = new RateLimiter(supabaseUrl, supabaseKey);
  const rateLimit = await rateLimiter.checkRateLimit(
    context.ipAddress || 'unknown',
    'reconcile-balances',
    RATE_LIMITS['reconcile-balances'],
    false
  );

  if (!rateLimit.allowed) {
    await logger.logRequest(429);
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      {
        status: 429,
        headers: { ...corsHeaders, ...RateLimiter.createHeaders(rateLimit) }
      }
    );
  }

  let statusCode = 200;
  let result: ReconciliationResult | null = null;
  let error: Error | undefined;

  try {
    // Verify user is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      statusCode = 401;
      throw new Error('Authorization header missing');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      statusCode = 401;
      throw new Error('Invalid authorization token');
    }

    context.userId = user.id;

    // Check admin status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      statusCode = 403;
      throw new Error('Admin access required');
    }

    // Start reconciliation process
    await logger.logAudit({
      action: 'reconciliation_started',
      resourceType: 'system',
      severity: 'info'
    });

    console.log(`[${context.correlationId}] Starting balance reconciliation...`);

    // Get all balances
    const { data: balances, error: balancesError } = await supabase
      .from('balances')
      .select('user_id, rioz_balance, brl_balance');

    if (balancesError) {
      throw new Error(`Failed to fetch balances: ${balancesError.message}`);
    }

    // Get all wallet transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('wallet_transactions')
      .select('user_id, tipo, valor');

    if (transactionsError) {
      throw new Error(`Failed to fetch transactions: ${transactionsError.message}`);
    }

    // Calculate totals
    const totalBalanceRioz = balances?.reduce((sum, b) => sum + Number(b.rioz_balance || 0), 0) || 0;
    const totalBalanceBrl = balances?.reduce((sum, b) => sum + Number(b.brl_balance || 0), 0) || 0;
    const totalUsers = balances?.length || 0;

    // Calculate ledger totals (only RIOZ for now)
    const totalLedgerRioz = transactions?.reduce((sum, t) => {
      const amount = Number(t.valor || 0);
      return sum + (t.tipo === 'credito' ? amount : -amount);
    }, 0) || 0;

    // Calculate user-level discrepancies
    const userLedgers = new Map<string, number>();
    transactions?.forEach(t => {
      const userId = t.user_id;
      if (!userId) return;
      
      const current = userLedgers.get(userId) || 0;
      const amount = Number(t.valor || 0);
      userLedgers.set(userId, current + (t.tipo === 'credito' ? amount : -amount));
    });

    const userDiscrepancies: Array<{
      userId: string;
      balanceRioz: number;
      ledgerRioz: number;
      diffRioz: number;
    }> = [];

    balances?.forEach(balance => {
      const userId = balance.user_id;
      if (!userId) return;

      const balanceRioz = Number(balance.rioz_balance || 0);
      const ledgerRioz = userLedgers.get(userId) || 0;
      const diffRioz = balanceRioz - ledgerRioz;

      if (Math.abs(diffRioz) > 0.01) { // Ignore tiny floating point differences
        userDiscrepancies.push({
          userId,
          balanceRioz,
          ledgerRioz,
          diffRioz
        });
      }
    });

    const riozDiscrepancy = totalBalanceRioz - totalLedgerRioz;
    const brlDiscrepancy = totalBalanceBrl - 0; // BRL ledger not implemented yet

    result = {
      reportDate: new Date().toISOString().split('T')[0],
      totalUsers,
      balances: {
        rioz: totalBalanceRioz,
        brl: totalBalanceBrl
      },
      ledger: {
        rioz: totalLedgerRioz,
        brl: 0
      },
      discrepancies: {
        rioz: riozDiscrepancy,
        brl: brlDiscrepancy,
        count: userDiscrepancies.length,
        userDiscrepancies: userDiscrepancies.slice(0, 100) // Limit to first 100 for response size
      },
      status: userDiscrepancies.length === 0 ? 'completed' : 'partial'
    };

    // Save reconciliation report
    const { error: reportError } = await supabase
      .from('reconciliation_reports')
      .upsert({
        report_date: result.reportDate,
        total_users: totalUsers,
        total_rioz_balance: totalBalanceRioz,
        total_brl_balance: totalBalanceBrl,
        ledger_rioz_balance: totalLedgerRioz,
        ledger_brl_balance: 0,
        rioz_discrepancy: riozDiscrepancy,
        brl_discrepancy: brlDiscrepancy,
        discrepancies_found: userDiscrepancies.length,
        status: result.status,
        report_data: {
          userDiscrepancies: userDiscrepancies,
          summary: {
            totalChecked: totalUsers,
            discrepanciesFound: userDiscrepancies.length,
            largestDiscrepancy: userDiscrepancies.length > 0 
              ? Math.max(...userDiscrepancies.map(u => Math.abs(u.diffRioz)))
              : 0
          }
        }
      });

    if (reportError) {
      console.error('Failed to save reconciliation report:', reportError);
    }

    // Log metrics
    await logger.logMetric({ name: 'reconciliation.total_users', value: totalUsers });
    await logger.logMetric({ name: 'reconciliation.rioz_discrepancy', value: Math.abs(riozDiscrepancy) });
    await logger.logMetric({ name: 'reconciliation.user_discrepancies', value: userDiscrepancies.length });

    // Log audit event
    await logger.logAudit({
      action: 'reconciliation_completed',
      resourceType: 'system',
      newValues: {
        totalUsers,
        riozDiscrepancy,
        userDiscrepanciesFound: userDiscrepancies.length
      },
      severity: userDiscrepancies.length > 0 ? 'warn' : 'info'
    });

    console.log(`[${context.correlationId}] Reconciliation completed:`, {
      totalUsers,
      riozDiscrepancy: riozDiscrepancy.toFixed(2),
      userDiscrepancies: userDiscrepancies.length
    });

  } catch (err) {
    error = err as Error;
    console.error(`[${context.correlationId}] Reconciliation failed:`, error);
    
    await logger.logAudit({
      action: 'reconciliation_failed',
      resourceType: 'system',
      newValues: { error: error.message },
      severity: 'error'
    });
  }

  await logger.logRequest(statusCode, error);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: statusCode,
        headers: { ...corsHeaders, ...RateLimiter.createHeaders(rateLimit) }
      }
    );
  }

  return new Response(
    JSON.stringify(result),
    {
      status: 200,
      headers: { 
        ...corsHeaders, 
        ...RateLimiter.createHeaders(rateLimit),
        'Content-Type': 'application/json'
      }
    }
  );
});