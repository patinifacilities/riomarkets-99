import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateFiatRequestRequest {
  request_type: 'deposit' | 'withdrawal';
  amount_brl: number;
  pix_key?: string;
  proof_url?: string;
}

interface ProcessFiatRequestRequest {
  request_id: string;
  status: 'approved' | 'rejected';
  admin_notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    if (action === 'create') {
      return await handleCreateRequest(req, supabase, user.id);
    } else if (action === 'process') {
      return await handleProcessRequest(req, supabase, user.id);
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in process-fiat-request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleCreateRequest(req: Request, supabase: any, userId: string) {
  const { request_type, amount_brl, pix_key, proof_url }: CreateFiatRequestRequest = await req.json();

  // Validate input
  if (!request_type || !amount_brl) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (amount_brl <= 0) {
    return new Response(JSON.stringify({ error: 'Amount must be positive' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Rate limiting: max 2 requests per user per day
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const { count } = await supabase
    .from('fiat_requests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneDayAgo.toISOString());

  if (count && count >= 2) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Maximum 2 requests per day.' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Create fiat request
  const { data: request, error } = await supabase
    .from('fiat_requests')
    .insert({
      user_id: userId,
      request_type,
      amount_brl,
      pix_key,
      proof_url,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating fiat request:', error);
    return new Response(JSON.stringify({ error: 'Error creating request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  console.log(`Fiat request created: ${request.id} by user ${userId}`);

  return new Response(JSON.stringify({ request }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleProcessRequest(req: Request, supabase: any, adminId: string) {
  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', adminId)
    .single();

  if (!profile?.is_admin) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { request_id, status, admin_notes }: ProcessFiatRequestRequest = await req.json();

  // Get the request
  const { data: request, error: fetchError } = await supabase
    .from('fiat_requests')
    .select('*')
    .eq('id', request_id)
    .single();

  if (fetchError || !request) {
    return new Response(JSON.stringify({ error: 'Request not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Update request status
  const { error: updateError } = await supabase
    .from('fiat_requests')
    .update({
      status,
      admin_notes,
      processed_by: adminId,
      processed_at: new Date().toISOString()
    })
    .eq('id', request_id);

  if (updateError) {
    console.error('Error updating fiat request:', updateError);
    return new Response(JSON.stringify({ error: 'Error updating request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // If approved, update user balance
  if (status === 'approved') {
    if (request.request_type === 'deposit') {
      // Add BRL to user balance
      const { error: balanceError } = await supabase.rpc('increment_brl_balance', {
        user_id: request.user_id,
        amount_centavos: Math.round(request.amount_brl * 100)
      });

      if (balanceError) {
        console.error('Error updating balance:', balanceError);
        return new Response(JSON.stringify({ error: 'Error updating balance' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    // For withdrawals, balance should already be deducted when request was created
  }

  console.log(`Fiat request ${request_id} ${status} by admin ${adminId}`);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}