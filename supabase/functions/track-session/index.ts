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
    console.log('Session tracking:', body);

    const {
      empresa_id,
      utm_source,
      utm_medium,
      utm_campaign,
      gclid,
      fbclid,
      referrer,
      user_agent
    } = body;

    // Validate required field
    if (!empresa_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: empresa_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique session ID
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get client IP
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';

    // Detect device type from user agent
    const detectDeviceType = (userAgent: string | null): string => {
      if (!userAgent) return 'unknown';
      
      const ua = userAgent.toLowerCase();
      if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        return 'mobile';
      } else if (ua.includes('tablet') || ua.includes('ipad')) {
        return 'tablet';
      }
      return 'desktop';
    };

    const deviceType = detectDeviceType(user_agent);

    // Insert session
    const { data: session, error } = await supabase
      .from('sessoes')
      .insert({
        session_id: sessionId,
        empresa_id,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        gclid: gclid || null,
        fbclid: fbclid || null,
        ip: clientIP,
        device_type: deviceType,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting session:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to insert session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Session created:', session);

    return new Response(
      JSON.stringify({ 
        success: true, 
        session_id: sessionId,
        tracking_active: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Session tracking error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});