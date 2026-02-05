/**
 * Auto-Close Past Quests Edge Function
 * 
 * Automatically marks quests as 'closed' when their end_datetime passes.
 * Should be called on a schedule (e.g., hourly) via a cron job.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Running auto_close_past_quests...');
    
    // Call the database function to close past quests
    const { data, error } = await supabase.rpc('auto_close_past_quests');
    
    if (error) {
      console.error('Error closing past quests:', error);
      throw error;
    }

    const closedCount = data || 0;
    console.log(`Closed ${closedCount} past quest(s)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        closed_count: closedCount,
        message: `Closed ${closedCount} past quest(s)` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in auto-close-past-quests:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
