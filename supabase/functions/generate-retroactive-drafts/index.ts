/**
 * generate-retroactive-drafts - Creates draft trait assignments for users who match a newly approved trait
 * 
 * When a new trait is added to the library, this function scans existing user data
 * (quest completions, feedback, etc.) to find users who likely have this trait
 * and creates draft_traits entries for admin review.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  trait_slug: string;
  trigger_criteria?: string[];
  limit?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { trait_slug, trigger_criteria = [], limit = 100 } = await req.json() as RequestBody;

    if (!trait_slug) {
      return new Response(
        JSON.stringify({ error: 'trait_slug is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get trait details from library
    const { data: trait, error: traitError } = await supabase
      .from('trait_library')
      .select('*')
      .eq('slug', trait_slug)
      .single();

    if (traitError || !trait) {
      return new Response(
        JSON.stringify({ error: `Trait not found: ${trait_slug}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use trigger_criteria to identify candidate users
    // For now, we use a simple heuristic based on category
    let candidateUserIds: string[] = [];

    if (trait.category === 'activity' || trait.category === 'interest') {
      // Find users who've completed quests in related progression trees
      const { data: signups } = await supabase
        .from('quest_signups')
        .select('user_id, quest:quests(progression_tree)')
        .eq('status', 'completed')
        .limit(limit * 5);

      // Get unique user IDs
      const userIdSet = new Set<string>();
      signups?.forEach((s: any) => {
        if (s.user_id) userIdSet.add(s.user_id);
      });
      candidateUserIds = Array.from(userIdSet).slice(0, limit);
    } else if (trait.category === 'personality' || trait.category === 'social') {
      // Find users with positive feedback or high XP
      const { data: feedbackUsers } = await supabase
        .from('feedback')
        .select('user_id')
        .gte('rating_1_5', 4)
        .limit(limit);

      candidateUserIds = [...new Set(feedbackUsers?.map((f: any) => f.user_id) || [])].slice(0, limit);
    } else {
      // Default: get active users with completed quests
      const { data: activeUsers } = await supabase
        .from('quest_signups')
        .select('user_id')
        .eq('status', 'completed')
        .limit(limit);

      candidateUserIds = [...new Set(activeUsers?.map((u: any) => u.user_id) || [])].slice(0, limit);
    }

    // Check which users already have this trait (confirmed or draft)
    const { data: existingTraits } = await supabase
      .from('user_traits')
      .select('user_id')
      .eq('trait_slug', trait_slug);

    const { data: existingDrafts } = await supabase
      .from('draft_traits')
      .select('user_id')
      .eq('trait_slug', trait_slug);

    const existingUserIds = new Set([
      ...(existingTraits?.map((t: any) => t.user_id) || []),
      ...(existingDrafts?.map((d: any) => d.user_id) || []),
    ]);

    // Filter out users who already have the trait
    const newCandidates = candidateUserIds.filter(id => !existingUserIds.has(id));

    // Create draft traits for new candidates
    if (newCandidates.length > 0) {
      const draftRecords = newCandidates.map(userId => ({
        user_id: userId,
        trait_slug: trait_slug,
        source: 'retroactive_batch',
        confidence: 0.6, // Medium confidence for retroactive assignments
        explanation: `Auto-generated from ${trait.category} trait approval`,
        status: 'pending',
        decision_trace: {
          generated_at: new Date().toISOString(),
          trigger_criteria: trigger_criteria,
          batch_type: 'retroactive',
        },
      }));

      const { error: insertError } = await supabase
        .from('draft_traits')
        .insert(draftRecords);

      if (insertError) {
        console.error('Error inserting draft traits:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create draft traits', details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update the proposal with retroactive count
    if (trigger_criteria.length > 0) {
      await supabase
        .from('emerging_trait_proposals')
        .update({ retroactive_drafts_created: newCandidates.length })
        .eq('proposed_slug', trait_slug);
    }

    console.log(`[generate-retroactive-drafts] Created ${newCandidates.length} draft traits for ${trait_slug}`);

    return new Response(
      JSON.stringify({
        success: true,
        trait_slug,
        candidates_found: candidateUserIds.length,
        drafts_created: newCandidates.length,
        already_assigned: existingUserIds.size,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[generate-retroactive-drafts] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
