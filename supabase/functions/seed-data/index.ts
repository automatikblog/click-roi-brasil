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

    const { empresa_id } = await req.json();

    if (!empresa_id) {
      return new Response(
        JSON.stringify({ error: 'Missing empresa_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create sample campaigns
    const campaigns = [
      { nome: 'Black Friday Meta Ads', canal: 'Meta Ads', investimento: 2500.00 },
      { nome: 'Google Search Principal', canal: 'Google Ads', investimento: 1800.00 },
      { nome: 'TikTok Viral Video', canal: 'TikTok Ads', investimento: 800.00 },
      { nome: 'Google Shopping', canal: 'Google Ads', investimento: 1200.00 },
      { nome: 'Meta Retargeting', canal: 'Meta Ads', investimento: 900.00 },
    ];

    // Insert campaigns over the last 30 days
    const campaignInserts = [];
    for (let i = 0; i < campaigns.length; i++) {
      const campaign = campaigns[i];
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      
      campaignInserts.push({
        ...campaign,
        empresa_id,
        periodo: date.toISOString()
      });
    }

    const { data: insertedCampaigns } = await supabase
      .from('campanhas')
      .insert(campaignInserts)
      .select();

    // Create sample sessions (last 30 days)
    const sessions = [];
    const utmSources = ['facebook', 'google', 'tiktok', 'instagram', 'direct'];
    const utmMediums = ['cpc', 'social', 'organic', 'referral'];
    const deviceTypes = ['desktop', 'mobile', 'tablet'];

    for (let i = 0; i < 150; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(Math.floor(Math.random() * 24));
      
      const sourceIndex = Math.floor(Math.random() * utmSources.length);
      const source = utmSources[sourceIndex];
      
      sessions.push({
        session_id: `sess_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        empresa_id,
        utm_source: Math.random() > 0.2 ? source : null,
        utm_medium: Math.random() > 0.3 ? utmMediums[Math.floor(Math.random() * utmMediums.length)] : null,
        utm_campaign: Math.random() > 0.4 ? `campaign_${Math.floor(Math.random() * 10)}` : null,
        gclid: source === 'google' && Math.random() > 0.5 ? `gclid_${Math.random().toString(36).substr(2, 15)}` : null,
        fbclid: source === 'facebook' && Math.random() > 0.5 ? `fbclid_${Math.random().toString(36).substr(2, 15)}` : null,
        ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        device_type: deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
        created_at: date.toISOString()
      });
    }

    const { data: insertedSessions } = await supabase
      .from('sessoes')
      .insert(sessions)
      .select();

    // Create sample conversions (link some to sessions)
    const conversions = [];
    const products = ['Curso Digital Marketing', 'Ebook Growth', 'Mentoria 1:1', 'Workshop Online', 'Consultoria'];
    const webhookSources = ['hotmart', 'kiwify', 'eduzz', 'monetizze'];

    for (let i = 0; i < 45; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(Math.floor(Math.random() * 24));
      
      // 70% chance of linking to a session
      const linkedSession = Math.random() > 0.3 && insertedSessions ? 
        insertedSessions[Math.floor(Math.random() * insertedSessions.length)].session_id : null;
      
      conversions.push({
        empresa_id,
        sessao_id: linkedSession,
        valor: Math.round((Math.random() * 500 + 50) * 100) / 100,
        produto: products[Math.floor(Math.random() * products.length)],
        webhook_source: webhookSources[Math.floor(Math.random() * webhookSources.length)],
        data_conversao: date.toISOString()
      });
    }

    const { data: insertedConversions } = await supabase
      .from('conversoes')
      .insert(conversions)
      .select();

    return new Response(
      JSON.stringify({ 
        success: true,
        created: {
          campaigns: insertedCampaigns?.length || 0,
          sessions: insertedSessions?.length || 0,
          conversions: insertedConversions?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Seed data error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});