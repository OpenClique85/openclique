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

// Import rate limiting
import { checkRateLimit, rateLimitResponse, sanitizeString, isValidUUID, INPUT_LIMITS } from "../_shared/rate-limit.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { squad_id, notification_type, title, body: notifBody, metadata, exclude_user_ids } = body;

    if (!squad_id || !notification_type || !title || !notifBody) {
      return new Response(
        JSON.stringify({ error: "squad_id, notification_type, title, and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate UUID
    if (!isValidUUID(squad_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid squad_id format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit notifications per squad
    const rateCheck = checkRateLimit(squad_id, { 
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,      // 10 notifications per minute per squad
      keyPrefix: 'notify-clique'
    });
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck, corsHeaders);
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeString(title, INPUT_LIMITS.TITLE);
    const sanitizedBody = sanitizeString(notifBody, INPUT_LIMITS.MESSAGE);

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
      title: sanitizedTitle,
      body: (sanitizedBody || "").slice(0, 200),
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
  } catch (error: unknown) {
    console.error("Error in notify-clique-members:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
