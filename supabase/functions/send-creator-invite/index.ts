import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    // Create admin client with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify the caller is an admin
    const authHeader = req.headers.get('authorization');
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

    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email and name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating invite for ${email} (${name})`);

    // Create the invite record
    const { data: invite, error: insertError } = await supabase
      .from('creator_invites')
      .insert({
        email,
        application_id: application_id || null,
        invited_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating invite:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create invite', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Invite created with token: ${invite.token.substring(0, 8)}...`);

    // Send the invite email via Resend
    if (resendApiKey) {
      const origin = req.headers.get('origin') || 'https://openclique.lovable.app';
      const inviteUrl = `${origin}/creators/onboard?token=${invite.token}`;

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f0f0f; color: #ffffff; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; padding: 40px;">
            <h1 style="color: #f472b6; margin-bottom: 24px; font-size: 28px;">Welcome to OpenClique, ${name}! 🎉</h1>
            
            <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Great news! Your application to become a Quest Creator has been approved. You're now part of an exclusive community of local experts who design unforgettable experiences for Austin adventurers.
            </p>
            
            <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
              Click the button below to set up your creator profile and start designing your first quest.
            </p>
            
            <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #f472b6 0%, #a855f7 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Complete Your Profile
            </a>
            
            <p style="color: #9ca3af; font-size: 14px; margin-top: 32px;">
              This invite link expires in 7 days. If you have any questions, reply to this email or reach out to us.
            </p>
            
            <hr style="border: none; border-top: 1px solid #374151; margin: 32px 0;">
            
            <p style="color: #6b7280; font-size: 12px; text-align: center;">
              OpenClique • Austin, TX<br>
              Making friendship feel like an adventure
            </p>
          </div>
        </body>
        </html>
      `;

      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'OpenClique <hello@openclique.co>',
            to: email,
            subject: `You're Invited to Create Quests on OpenClique! 🚀`,
            html: emailHtml,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.text();
          console.error('Resend API error:', errorData);
          // Don't fail the whole request if email fails
        } else {
          console.log('Invite email sent successfully');
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the whole request if email fails
      }
    } else {
      console.warn('RESEND_API_KEY not configured, skipping email');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        invite_id: invite.id,
        message: `Invite created for ${email}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
