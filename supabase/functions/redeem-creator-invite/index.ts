import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RedeemInviteRequest {
  token: string;
  user_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token to verify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid auth token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { token: inviteToken, user_id }: RedeemInviteRequest = await req.json();

    // Verify the user matches
    if (user.id !== user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "User mismatch" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate the invite
    const { data: invite, error: inviteError } = await supabase
      .from("creator_invites")
      .select("id, email, expires_at, redeemed_at")
      .eq("token", inviteToken)
      .maybeSingle();

    if (inviteError || !invite) {
      console.error("Invite lookup error:", inviteError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid invite token" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if already redeemed
    if (invite.redeemed_at) {
      return new Response(
        JSON.stringify({ success: false, error: "Invite already redeemed" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: "Invite has expired" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark as redeemed
    const { error: updateError } = await supabase
      .from("creator_invites")
      .update({ redeemed_at: new Date().toISOString() })
      .eq("id", invite.id);

    if (updateError) {
      console.error("Failed to redeem invite:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to redeem invite" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Invite ${invite.id} redeemed by user ${user_id}`);

    return new Response(
      JSON.stringify({ success: true, message: "Invite redeemed successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error redeeming invite:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
