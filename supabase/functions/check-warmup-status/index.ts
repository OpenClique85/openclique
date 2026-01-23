/**
 * Check Warm-Up Status Edge Function
 * 
 * Runs on a schedule to:
 * 1. Notify admins when squads reach "ready_for_review"
 * 2. Alert admins when squads are stuck in "warming_up" for 24+ hours
 * 
 * Can also be called manually to trigger checks.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML escape function
function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') return String(unsafe ?? '');
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;
    
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    console.log("Checking warm-up status...");
    console.log("Current time:", now.toISOString());
    console.log("Stalled threshold:", twentyFourHoursAgo.toISOString());

    // Get all squads in warming_up or ready_for_review status
    const { data: squads, error: squadsError } = await supabase
      .from('quest_squads')
      .select(`
        id,
        squad_name,
        status,
        updated_at,
        instance_id,
        quest_instances(id, title, scheduled_date, start_time)
      `)
      .in('status', ['warming_up', 'ready_for_review']);

    if (squadsError) {
      console.error("Error fetching squads:", squadsError);
      throw squadsError;
    }

    console.log(`Found ${squads?.length || 0} squads in warm-up states`);

    const readyForReviewSquads: any[] = [];
    const stalledSquads: any[] = [];
    const notifications: any[] = [];

    for (const squad of squads || []) {
      const instance = squad.quest_instances as any;
      
      // Check for ready_for_review squads that haven't been notified recently
      if (squad.status === 'ready_for_review') {
        // Check if we already sent a notification for this squad
        const { data: existingNotification } = await supabase
          .from('notifications')
          .select('id')
          .eq('type', 'squad_ready_review')
          .eq('body', squad.id)
          .gte('created_at', twentyFourHoursAgo.toISOString())
          .limit(1);

        if (!existingNotification || existingNotification.length === 0) {
          readyForReviewSquads.push({
            ...squad,
            instance_title: instance?.title,
            instance_date: instance?.scheduled_date,
          });
        }
      }

      // Check for stalled warm-ups (warming_up for 24+ hours)
      if (squad.status === 'warming_up') {
        const updatedAt = new Date(squad.updated_at);
        const hoursInWarmUp = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursInWarmUp >= 24) {
          // Check if we already notified about this stalled squad in last 24h
          const { data: existingNotification } = await supabase
            .from('notifications')
            .select('id')
            .eq('type', 'squad_warmup_stalled')
            .eq('body', squad.id)
            .gte('created_at', twentyFourHoursAgo.toISOString())
            .limit(1);

          if (!existingNotification || existingNotification.length === 0) {
            stalledSquads.push({
              ...squad,
              instance_title: instance?.title,
              instance_date: instance?.scheduled_date,
              hours_stalled: Math.floor(hoursInWarmUp),
            });
          }
        }
      }
    }

    console.log(`Ready for review: ${readyForReviewSquads.length}, Stalled: ${stalledSquads.length}`);

    // Get admin user IDs for in-app notifications
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminIds = adminRoles?.map((r) => r.user_id) || [];

    // Create in-app notifications for ready_for_review squads
    for (const squad of readyForReviewSquads) {
      for (const adminId of adminIds) {
        notifications.push({
          user_id: adminId,
          type: 'squad_ready_review',
          title: `Squad Ready for Approval: ${squad.squad_name}`,
          body: squad.id, // Store squad ID for deduplication
          quest_id: null,
        });
      }

      // Log ops event
      await supabase.from('ops_events').insert({
        event_type: 'squad_status_change',
        squad_id: squad.id,
        metadata: {
          notification_sent: true,
          notification_type: 'ready_for_review',
          squad_name: squad.squad_name,
        },
      });
    }

    // Create in-app notifications for stalled squads
    for (const squad of stalledSquads) {
      for (const adminId of adminIds) {
        notifications.push({
          user_id: adminId,
          type: 'squad_warmup_stalled',
          title: `Squad Warm-Up Stalled: ${squad.squad_name}`,
          body: squad.id, // Store squad ID for deduplication
          quest_id: null,
        });
      }

      // Log ops event
      await supabase.from('ops_events').insert({
        event_type: 'squad_status_change',
        squad_id: squad.id,
        metadata: {
          notification_sent: true,
          notification_type: 'warmup_stalled',
          hours_stalled: squad.hours_stalled,
          squad_name: squad.squad_name,
        },
      });
    }

    // Insert all notifications
    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error("Error inserting notifications:", notifError);
      } else {
        console.log(`Created ${notifications.length} in-app notifications`);
      }
    }

    // Send email notifications to admins
    if (resend && (readyForReviewSquads.length > 0 || stalledSquads.length > 0)) {
      // Get admin emails
      const adminEmails: string[] = [];
      for (const adminId of adminIds) {
        const { data: userData } = await supabase.auth.admin.getUserById(adminId);
        if (userData?.user?.email) {
          adminEmails.push(userData.user.email);
        }
      }

      if (adminEmails.length > 0) {
        let emailSubject = "";
        let emailHtml = "";

        if (readyForReviewSquads.length > 0 && stalledSquads.length > 0) {
          emailSubject = `🔔 ${readyForReviewSquads.length} Squad(s) Ready for Review, ${stalledSquads.length} Stalled`;
        } else if (readyForReviewSquads.length > 0) {
          emailSubject = `✅ ${readyForReviewSquads.length} Squad(s) Ready for Admin Approval`;
        } else {
          emailSubject = `⚠️ ${stalledSquads.length} Squad(s) Stalled in Warm-Up`;
        }

        emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #14b8a6;">Squad Warm-Up Status Update</h2>
            
            ${readyForReviewSquads.length > 0 ? `
              <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #22c55e;">
                <h3 style="color: #22c55e; margin-top: 0;">Ready for Approval (${readyForReviewSquads.length})</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  ${readyForReviewSquads.map(s => `
                    <li style="margin: 8px 0;">
                      <strong>${escapeHtml(s.squad_name)}</strong><br/>
                      <span style="color: #666; font-size: 14px;">Quest: ${escapeHtml(s.instance_title || 'Unknown')} • ${escapeHtml(s.instance_date || 'TBD')}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
            
            ${stalledSquads.length > 0 ? `
              <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b;">
                <h3 style="color: #f59e0b; margin-top: 0;">Stalled Warm-Ups (${stalledSquads.length})</h3>
                <p style="color: #666; font-size: 14px;">These squads have been in warm-up for 24+ hours without completing.</p>
                <ul style="margin: 0; padding-left: 20px;">
                  ${stalledSquads.map(s => `
                    <li style="margin: 8px 0;">
                      <strong>${escapeHtml(s.squad_name)}</strong> - ${s.hours_stalled}h in warm-up<br/>
                      <span style="color: #666; font-size: 14px;">Quest: ${escapeHtml(s.instance_title || 'Unknown')}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
            
            <div style="margin-top: 20px;">
              <a href="https://openclique.lovable.app/admin" 
                 style="background: #14b8a6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
                Open Admin Console
              </a>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              This is an automated notification from OpenClique.
            </p>
          </div>
        `;

        try {
          const emailResponse = await resend.emails.send({
            from: "OpenClique Alerts <alerts@openclique.lovable.app>",
            to: adminEmails,
            subject: emailSubject,
            html: emailHtml,
          });
          console.log("Admin email sent:", emailResponse);
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
        }
      }
    }

    const result = {
      success: true,
      checked_at: now.toISOString(),
      ready_for_review_count: readyForReviewSquads.length,
      stalled_count: stalledSquads.length,
      notifications_created: notifications.length,
      ready_for_review_squads: readyForReviewSquads.map(s => ({
        id: s.id,
        name: s.squad_name,
        instance: s.instance_title,
      })),
      stalled_squads: stalledSquads.map(s => ({
        id: s.id,
        name: s.squad_name,
        hours_stalled: s.hours_stalled,
        instance: s.instance_title,
      })),
    };

    console.log("Check complete:", JSON.stringify(result, null, 2));

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error checking warm-up status:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
