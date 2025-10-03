import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { amount } = await req.json();

    if (!amount || amount < 5) {
      return new Response(JSON.stringify({ error: 'Amount must be at least 5 BRL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ABACATEPAY_API_KEY');
    if (!apiKey) {
      console.error('ABACATEPAY_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Payment gateway not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Abacatepay API to generate PIX payment
    const abacateResponse = await fetch('https://api.abacatepay.com/v1/billing/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        frequency: 'ONE_TIME',
        methods: ['PIX'],
        products: [{
          externalId: `deposit-${user.id}-${Date.now()}`,
          name: 'Depósito RIOZ Markets',
          description: `Depósito de R$ ${amount.toFixed(2)}`,
          quantity: 1,
          price: Math.round(amount * 100), // Abacatepay expects amount in cents
        }],
        returnUrl: `${req.headers.get('origin')}/wallet`,
        completionUrl: `${req.headers.get('origin')}/wallet?success=true`,
        metadata: {
          userId: user.id,
          type: 'deposit',
        },
      }),
    });

    if (!abacateResponse.ok) {
      const errorData = await abacateResponse.text();
      console.error('Abacatepay API error:', errorData);
      return new Response(JSON.stringify({ error: 'Failed to generate PIX payment' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paymentData = await abacateResponse.json();
    
    console.log('Full payment data from Abacatepay:', JSON.stringify(paymentData, null, 2));

    // Create fiat request record
    const { error: insertError } = await supabaseClient
      .from('fiat_requests')
      .insert({
        user_id: user.id,
        request_type: 'deposit',
        amount_brl: amount,
        status: 'pending',
      });

    if (insertError) {
      console.error('Error creating fiat request:', insertError);
    }

    // Extract QR code data - Abacatepay may return it in different formats
    let qrCodeUrl = '';
    let qrCodeText = '';
    let expiresAt = '';

    // Try different possible response structures
    if (paymentData.bill) {
      qrCodeUrl = paymentData.bill.qrCode || paymentData.bill.qrcode?.base64 || '';
      qrCodeText = paymentData.bill.qrCodeText || paymentData.bill.qrcode?.payload || '';
      expiresAt = paymentData.bill.expiresAt || paymentData.bill.expiration || '';
    } else if (paymentData.pix) {
      qrCodeUrl = paymentData.pix.qrCode || paymentData.pix.qrcode?.base64 || '';
      qrCodeText = paymentData.pix.qrCodeText || paymentData.pix.qrcode?.payload || '';
      expiresAt = paymentData.pix.expiresAt || paymentData.pix.expiration || '';
    } else {
      qrCodeUrl = paymentData.qrCode || paymentData.qrcode?.base64 || '';
      qrCodeText = paymentData.qrCodeText || paymentData.qrcode?.payload || '';
      expiresAt = paymentData.expiresAt || paymentData.expiration || '';
    }

    console.log('Extracted QR data:', { qrCodeUrl: qrCodeUrl?.substring(0, 50), qrCodeText: qrCodeText?.substring(0, 50), expiresAt });

    return new Response(JSON.stringify({
      success: true,
      paymentId: paymentData.id,
      qrCode: qrCodeUrl,
      qrCodeText: qrCodeText,
      expiresAt: expiresAt,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-pix-payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
