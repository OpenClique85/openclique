import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the caller is authenticated and is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { application_id, email, name } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating sponsor invite for ${email}`);

    // Create the invite
    const { data: invite, error: insertError } = await supabase
      .from('sponsor_invites')
      .insert({
        email,
        application_id,
        invited_by: user.id,
      })
      .select('id, token')
      .single();

    if (insertError) {
      console.error('Error creating invite:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create invite', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Invite created with ID: ${invite.id}`);

    // Send email if Resend is configured
    if (resendApiKey) {
      const inviteUrl = `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/sponsors/onboard?token=${invite.token}`;
      
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'OpenClique <noreply@openclique.com>',
            to: email,
            subject: 'You\'re invited to become an OpenClique Sponsor!',
            html: `
              <h1>Welcome to OpenClique!</h1>
              <p>Hi ${name || 'there'},</p>
              <p>You've been invited to join OpenClique as a Brand/Venue Sponsor. As a sponsor, you can:</p>
              <ul>
                <li>Sponsor existing quests and reach engaged audiences</li>
                <li>Offer your venue for quest creators to use</li>
                <li>Create rewards for quest participants</li>
                <li>Commission new quests from our top creators</li>
              </ul>
              <p><a href="${inviteUrl}" style="background: #E91E63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Complete Your Sponsor Profile</a></p>
              <p>This invite expires in 7 days.</p>
              <p>– The OpenClique Team</p>
            `,
          }),
        });

        if (!emailResponse.ok) {
          console.error('Email send failed:', await emailResponse.text());
        } else {
          console.log('Invite email sent successfully');
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
        // Don't fail the request if email fails
      }
    }

    return new Response(
      JSON.stringify({ success: true, invite_id: invite.id }),
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
