/**
 * Process Clique Saves Edge Function
 * 
 * Processes mutual clique save requests and creates persistent squads
 * for users who mutually selected each other.
 * 
 * Run on a schedule (e.g., every hour) or manually triggered.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CliqueSaveRequest {
  id: string;
  instance_id: string;
  squad_id: string;
  requester_id: string;
  selected_member_ids: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all unprocessed clique save requests
    const { data: requests, error: fetchError } = await supabase
      .from('clique_save_requests')
      .select('*')
      .is('processed_at', null)
      .eq('wants_to_save', true);

    if (fetchError) throw fetchError;
    if (!requests || requests.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending requests to process', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Group requests by instance_id + squad_id
    const groupedRequests = new Map<string, CliqueSaveRequest[]>();
    for (const req of requests as CliqueSaveRequest[]) {
      const key = `${req.instance_id}:${req.squad_id}`;
      const existing = groupedRequests.get(key) || [];
      existing.push(req);
      groupedRequests.set(key, existing);
    }

    let processedCount = 0;
    let matchesCreated = 0;
    const notifications: Array<{
      user_id: string;
      type: string;
      title: string;
      body: string;
    }> = [];

    // Process each group
    for (const [key, groupRequests] of groupedRequests) {
      if (groupRequests.length < 2) continue; // Need at least 2 people to have mutual matches

      // Find mutual matches
      const mutualMatches = new Set<string>();
      
      for (const reqA of groupRequests) {
        for (const reqB of groupRequests) {
          if (reqA.requester_id === reqB.requester_id) continue;
          
          // Check if A selected B AND B selected A
          const aSelectedB = reqA.selected_member_ids.includes(reqB.requester_id);
          const bSelectedA = reqB.selected_member_ids.includes(reqA.requester_id);
          
          if (aSelectedB && bSelectedA) {
            mutualMatches.add(reqA.requester_id);
            mutualMatches.add(reqB.requester_id);
          }
        }
      }

      if (mutualMatches.size >= 2) {
        const mutualMemberIds = Array.from(mutualMatches);
        const [instanceId, squadId] = key.split(':');

        // Get original squad info
        const { data: originalSquad } = await supabase
          .from('quest_squads')
          .select('squad_name, instance_id')
          .eq('id', squadId)
          .single();

        // Create a persistent squad
        const { data: newSquad, error: squadError } = await supabase
          .from('squads')
          .insert({
            name: originalSquad?.squad_name 
              ? `${originalSquad.squad_name} (Persistent)` 
              : 'My Clique',
            description: 'Formed through mutual connection after a quest',
            is_persistent: true,
            created_by: mutualMemberIds[0],
            clique_type: 'persistent',
            max_members: 6,
            status: 'active',
            visibility: 'private',
          })
          .select('id')
          .single();

        if (squadError) {
          console.error('Error creating persistent squad:', squadError);
          continue;
        }

        // Add all mutual members
        for (const userId of mutualMemberIds) {
          await supabase
            .from('squad_members')
            .insert({
              squad_id: newSquad.id,
              user_id: userId,
              status: 'active',
              role: userId === mutualMemberIds[0] ? 'leader' : 'member',
            });

          // Create notification
          notifications.push({
            user_id: userId,
            type: 'general',
            title: '🎉 Your Clique is Official!',
            body: `You and ${mutualMemberIds.length - 1} others mutually chose to stay connected. Your new clique is ready!`,
          });
        }

        matchesCreated++;
      }

      // Mark all requests in this group as processed
      const requestIds = groupRequests.map(r => r.id);
      await supabase
        .from('clique_save_requests')
        .update({ processed_at: new Date().toISOString() })
        .in('id', requestIds);

      processedCount += groupRequests.length;
    }

    // Send notifications
    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }

    return new Response(
      JSON.stringify({
        message: 'Processing complete',
        processed: processedCount,
        matchesCreated,
        notificationsSent: notifications.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing clique saves:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
