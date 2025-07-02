import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    console.log('Webhook received:', body);

    // Extract conversion data from webhook
    const {
      empresa_id,
      valor,
      produto,
      webhook_source = 'unknown',
      email,
      utm_source,
      utm_campaign,
      session_id
    } = body;

    // Validate required fields
    if (!empresa_id || !valor || !produto) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: empresa_id, valor, produto' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to find matching session for attribution
    let matchedSessionId = session_id;

    if (!matchedSessionId && (utm_source || utm_campaign || email)) {
      // Look for session based on UTM parameters or email within last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: sessions } = await supabase
        .from('sessoes')
        .select('session_id')
        .eq('empresa_id', empresa_id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .or(
          utm_source ? `utm_source.eq.${utm_source}` : 
          utm_campaign ? `utm_campaign.eq.${utm_campaign}` : 
          'utm_source.not.is.null'
        )
        .order('created_at', { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0) {
        matchedSessionId = sessions[0].session_id;
      }
    }

    // Insert conversion
    const { data: conversion, error } = await supabase
      .from('conversoes')
      .insert({
        empresa_id,
        sessao_id: matchedSessionId,
        valor: parseFloat(valor),
        produto,
        webhook_source,
        data_conversao: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting conversion:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to insert conversion' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Conversion created:', conversion);

    return new Response(
      JSON.stringify({ 
        success: true, 
        conversion_id: conversion.id,
        matched_session: matchedSessionId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});