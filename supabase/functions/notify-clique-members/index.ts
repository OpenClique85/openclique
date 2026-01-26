/**
 * Notify Clique Members Edge Function
 * 
 * Sends notifications to all members of a clique/squad.
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
    const { squad_id, notification_type, title, body, metadata, exclude_user_ids } = await req.json();

    if (!squad_id || !notification_type || !title || !body) {
      return new Response(
        JSON.stringify({ error: "squad_id, notification_type, title, and body are required" }),
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

    // Get squad members
    const { data: members, error: membersError } = await supabase
      .from("squad_members")
      .select("user_id")
      .eq("squad_id", squad_id)
      .eq("status", "active");

    if (membersError) throw membersError;

    if (!members?.length) {
      return new Response(
        JSON.stringify({ success: true, notifications_sent: 0, message: "No active members found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter out excluded users
    const excludeSet = new Set(exclude_user_ids || []);
    const recipientIds = members
      .map((m) => m.user_id)
      .filter((id) => !excludeSet.has(id));

    if (recipientIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, notifications_sent: 0, message: "No recipients after exclusions" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create notifications
    const notifications = recipientIds.map((userId) => ({
      user_id: userId,
      type: notification_type,
      title,
      body: body.slice(0, 200),
      metadata: {
        ...metadata,
        squad_id,
      },
    }));

    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (insertError) {
      console.error("Failed to create notifications:", insertError);
      throw insertError;
    }

    console.log(`[notify-clique-members] Sent ${recipientIds.length} notifications for squad ${squad_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications_sent: recipientIds.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in notify-clique-members:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
