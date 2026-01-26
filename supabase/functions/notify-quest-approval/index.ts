import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface QuestApprovalRequest {
  type: "quest_submitted" | "quest_approved" | "quest_rejected";
  quest_id: string;
  quest_title: string;
  creator_name: string;
  creator_email?: string;
  reason?: string;
}

// HTML escape function to prevent XSS
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, quest_id, quest_title, creator_name, creator_email, reason }: QuestApprovalRequest = await req.json();

    console.log(`[notify-quest-approval] Processing ${type} for quest: ${quest_title}`);

    // Get admin user IDs
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admins found to notify");
      return new Response(JSON.stringify({ success: true, message: "No admins to notify" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const adminIds = adminRoles.map((r) => r.user_id);

    // Create in-app notifications for all admins
    const notificationTitle = type === "quest_submitted" 
      ? `Quest needs review: ${quest_title}`
      : type === "quest_approved"
        ? `Quest approved: ${quest_title}`
        : `Quest rejected: ${quest_title}`;

    const notificationBody = type === "quest_submitted"
      ? `${creator_name} submitted a quest for review.`
      : type === "quest_approved"
        ? `The quest by ${creator_name} is now live.`
        : `Reason: ${reason || 'No reason provided'}`;

    const notifications = adminIds.map(adminId => ({
      user_id: adminId,
      type: 'general' as const,
      title: notificationTitle,
      body: notificationBody,
      quest_id: quest_id,
      metadata: {
        notification_type: type,
        creator_name,
        creator_email,
      }
    }));

    const { error: notifError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notifError) {
      console.error("Failed to create in-app notifications:", notifError);
    } else {
      console.log(`Created ${notifications.length} in-app notifications for admins`);
    }

    // Send email notification for quest submissions
    if (type === "quest_submitted") {
      // Get admin emails
      const adminEmails: string[] = [];
      for (const adminId of adminIds) {
        const { data: userData } = await supabase.auth.admin.getUserById(adminId);
        if (userData?.user?.email) {
          adminEmails.push(userData.user.email);
        }
      }

      if (adminEmails.length > 0 && resend) {
        const subject = `📋 Quest Pending Review: ${escapeHtml(quest_title)}`;
        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #14b8a6;">Quest Submitted for Review</h2>
            <div style="background: #f0fdfa; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>Quest:</strong> ${escapeHtml(quest_title)}</p>
              <p><strong>Creator:</strong> ${escapeHtml(creator_name)}</p>
              ${creator_email ? `<p><strong>Email:</strong> ${escapeHtml(creator_email)}</p>` : ''}
            </div>
            <p style="color: #666; font-size: 14px;">
              Review this quest in the admin console to approve or request changes.
            </p>
            <div style="margin-top: 20px;">
              <a href="https://openclique.lovable.app/admin" 
                 style="background: #14b8a6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
                Review Quest
              </a>
            </div>
          </div>
        `;

        try {
          await resend.emails.send({
            from: "OpenClique Alerts <alerts@openclique.lovable.app>",
            to: adminEmails,
            subject,
            html,
          });
          console.log(`Sent email notification to ${adminEmails.length} admin(s)`);
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-quest-approval:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
