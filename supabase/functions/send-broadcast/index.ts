/**
 * Send Broadcast Edge Function
 * 
 * Sends broadcast messages to clique members, leaders, or selected cliques.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instance_id, target, message, squad_ids, sender_id } = await req.json();

    if (!instance_id || !target || !message || !sender_id) {
      return new Response(
        JSON.stringify({ error: "instance_id, target, message, and sender_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get squads for this instance
    let squadsQuery = supabase
      .from("quest_squads")
      .select(`
        id,
        squad_name,
        squad_members(user_id, role)
      `)
      .eq("quest_id", instance_id)
      .neq("status", "draft");

    if (target === "selected" && squad_ids?.length) {
      squadsQuery = squadsQuery.in("id", squad_ids);
    }

    const { data: squads, error: squadsError } = await squadsQuery;

    if (squadsError) throw squadsError;

    if (!squads?.length) {
      return new Response(
        JSON.stringify({ error: "No squads found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build recipient list based on target
    const recipientIds = new Set<string>();

    for (const squad of squads) {
      const members = (squad.squad_members as any[]) || [];
      for (const member of members) {
        if (target === "all") {
          recipientIds.add(member.user_id);
        } else if (target === "leaders" && member.role === "leader") {
          recipientIds.add(member.user_id);
        }
      }
    }

    if (recipientIds.size === 0) {
      return new Response(
        JSON.stringify({ error: "No recipients found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create notifications for each recipient
    const notifications = Array.from(recipientIds).map((userId) => ({
      user_id: userId,
      type: "broadcast",
      title: "Message from Social Chair",
      body: message.slice(0, 200),
      metadata: {
        instance_id,
        sender_id,
        full_message: message,
      },
    }));

    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (insertError) {
      console.error("Failed to create notifications:", insertError);
      throw insertError;
    }

    // Log the broadcast
    console.log(`Broadcast sent: ${recipientIds.size} recipients, target=${target}, instance=${instance_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        recipients_count: recipientIds.size,
        squads_count: squads.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-broadcast:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
