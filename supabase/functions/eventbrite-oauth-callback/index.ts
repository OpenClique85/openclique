/**
 * Eventbrite OAuth Callback Edge Function
 * 
 * Exchanges authorization code for access token and stores connection.
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
    const { code, user_id } = await req.json();

    if (!code || !user_id) {
      return new Response(
        JSON.stringify({ error: "code and user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientId = Deno.env.get("EVENTBRITE_CLIENT_ID");
    const clientSecret = Deno.env.get("EVENTBRITE_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!clientId || !clientSecret) {
      console.error("Missing Eventbrite credentials");
      return new Response(
        JSON.stringify({ error: "Eventbrite integration not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Exchange code for token
    const tokenResponse = await fetch("https://www.eventbrite.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to exchange authorization code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch user info from Eventbrite
    const userResponse = await fetch("https://www.eventbriteapi.com/v3/users/me/", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    let eventbriteUserId: string | null = null;
    let eventbriteEmail: string | null = null;

    if (userResponse.ok) {
      const userData = await userResponse.json();
      eventbriteUserId = userData.id;
      eventbriteEmail = userData.emails?.[0]?.email;
    }

    // Store connection in database
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    const { error: upsertError } = await supabase
      .from("eventbrite_connections")
      .upsert({
        user_id: user_id,
        access_token: accessToken,
        eventbrite_user_id: eventbriteUserId,
        eventbrite_email: eventbriteEmail,
        is_active: true,
        connected_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });

    if (upsertError) {
      console.error("Failed to store connection:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to store connection" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Eventbrite connected for user ${user_id}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in eventbrite-oauth-callback:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
