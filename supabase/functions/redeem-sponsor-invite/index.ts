import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RedeemInviteRequest {
  token: string;
  user_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authToken = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { token: inviteToken, user_id }: RedeemInviteRequest = await req.json();

    if (!inviteToken || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Token and user_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user_id matches the authenticated user
    if (user.id !== user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID mismatch' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Attempting to redeem sponsor invite for user ${user_id}`);

    // Find the invite
    const { data: invite, error: fetchError } = await supabase
      .from('sponsor_invites')
      .select('id, email, expires_at, redeemed_at')
      .eq('token', inviteToken)
      .single();

    if (fetchError || !invite) {
      console.error('Invite not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Invalid invite token' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already redeemed
    if (invite.redeemed_at) {
      return new Response(
        JSON.stringify({ error: 'Invite has already been redeemed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Invite has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark invite as redeemed
    const { error: updateError } = await supabase
      .from('sponsor_invites')
      .update({ redeemed_at: new Date().toISOString() })
      .eq('id', invite.id);

    if (updateError) {
      console.error('Error updating invite:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to redeem invite' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sponsor invite ${invite.id} redeemed successfully`);

    return new Response(
      JSON.stringify({ success: true, email: invite.email }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
