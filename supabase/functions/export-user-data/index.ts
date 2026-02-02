/**
 * =============================================================================
 * Export User Data Edge Function
 * Generates a comprehensive JSON export of all user data
 * =============================================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const userId = user.id;
    console.log(`Exporting data for user: ${userId}`);

    // Collect all user data
    const exportData: Record<string, unknown> = {
      export_metadata: {
        exported_at: new Date().toISOString(),
        user_id: userId,
        email: user.email,
        version: '1.0',
      },
    };

    // Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    exportData.profile = profile;

    // Quest signups
    const { data: questSignups } = await supabase
      .from('quest_signups')
      .select('*, quests(title, slug)')
      .eq('user_id', userId);
    exportData.quest_signups = questSignups || [];

    // Squad memberships
    const { data: squadMemberships } = await supabase
      .from('squad_members')
      .select('*, quest_squads(id, squad_name)')
      .eq('user_id', userId);
    exportData.squad_memberships = squadMemberships || [];

    // Clique memberships (persistent squads)
    const { data: cliqueMemberships } = await supabase
      .from('squad_members')
      .select('*, squads(id, name, description)')
      .eq('user_id', userId);
    exportData.clique_memberships = cliqueMemberships || [];

    // XP and level
    const { data: userXp } = await supabase
      .from('user_xp')
      .select('*')
      .eq('user_id', userId)
      .single();
    exportData.xp = userXp;

    // XP transactions
    const { data: xpTransactions } = await supabase
      .from('xp_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    exportData.xp_transactions = xpTransactions || [];

    // Badges
    const { data: badges } = await supabase
      .from('user_badges')
      .select('*, badge_templates(name, description, icon)')
      .eq('user_id', userId);
    exportData.badges = badges || [];

    // Achievements
    const { data: achievements } = await supabase
      .from('user_achievements')
      .select('*, achievement_templates(name, description, icon)')
      .eq('user_id', userId);
    exportData.achievements = achievements || [];

    // Traits
    const { data: traits } = await supabase
      .from('user_traits')
      .select('*, trait_library(display_name, description, category)')
      .eq('user_id', userId);
    exportData.traits = traits || [];

    // Streaks
    const { data: streaks } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId);
    exportData.streaks = streaks || [];

    // Social energy
    const { data: socialEnergy } = await supabase
      .from('user_social_energy')
      .select('*')
      .eq('user_id', userId);
    exportData.social_energy = socialEnergy || [];

    // Feedback submitted
    const { data: feedback } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', userId);
    exportData.feedback_submitted = feedback || [];

    // Notifications
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);
    exportData.notifications = notifications || [];

    // Support tickets
    const { data: supportTickets } = await supabase
      .from('support_tickets')
      .select('*, ticket_messages(*)')
      .eq('user_id', userId);
    exportData.support_tickets = supportTickets || [];

    // Trust scores
    const { data: trustScores } = await supabase
      .from('trust_scores')
      .select('*')
      .eq('user_id', userId);
    exportData.trust_scores = trustScores || [];

    // Identity snapshots
    const { data: identitySnapshots } = await supabase
      .from('identity_snapshots')
      .select('*')
      .eq('user_id', userId);
    exportData.identity_snapshots = identitySnapshots || [];

    // Referrals
    const { data: referrals } = await supabase
      .from('referrals')
      .select('*')
      .or(`referrer_id.eq.${userId},referred_id.eq.${userId}`);
    exportData.referrals = referrals || [];

    console.log(`Successfully exported data for user: ${userId}`);

    return new Response(JSON.stringify(exportData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: unknown) {
    console.error('Export error:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: message === 'Unauthorized' ? 401 : 500,
      }
    );
  }
});
