import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "resend";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotifyAdminRequest {
  type: "new_signup" | "quest_full" | "cancellation" | "feedback" | "custom" | "proposal_pending";
  data: Record<string, any>;
}

// HTML escape function to prevent XSS in email templates
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
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Create client with user's token to check admin status
    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(supabaseUrl, supabaseAnon, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    // Verify user is admin
    const { data: isAdminData, error: adminError } = await supabaseClient.rpc("is_admin");
    if (adminError || !isAdminData) {
      console.error("Admin check failed:", adminError);
      return new Response(
        JSON.stringify({ success: false, error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, data }: NotifyAdminRequest = await req.json();

    // Get admin emails
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

    // Get admin emails from profiles
    const adminIds = adminRoles.map((r) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", adminIds);

    // Get auth emails for admins
    const adminEmails: string[] = [];
    for (const adminId of adminIds) {
      const { data: userData } = await supabase.auth.admin.getUserById(adminId);
      if (userData?.user?.email) {
        adminEmails.push(userData.user.email);
      }
    }

    if (adminEmails.length === 0) {
      console.log("No admin emails found");
      return new Response(JSON.stringify({ success: true, message: "No admin emails found" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Build notification content based on type - escape all user-provided data
    let subject: string;
    let html: string;

    switch (type) {
      case "new_signup":
        subject = `🆕 New Quest Signup: ${escapeHtml(data.quest_name || "Unknown Quest")}`;
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #14b8a6;">New Quest Signup!</h2>
            <div style="background: #f0fdfa; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>User:</strong> ${escapeHtml(data.user_email || "Unknown")}</p>
              <p><strong>Quest:</strong> ${escapeHtml(data.quest_name || "Unknown")}</p>
              <p><strong>Current Signups:</strong> ${escapeHtml(String(data.current_count || 0))}/${escapeHtml(String(data.capacity || "?"))}</p>
            </div>
            <p style="color: #666; font-size: 14px;">Check the admin dashboard for more details.</p>
          </div>
        `;
        break;

      case "quest_full":
        subject = `🎉 Quest Full: ${escapeHtml(data.quest_name || "Unknown Quest")}`;
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #22c55e;">Quest is Full!</h2>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>Quest:</strong> ${escapeHtml(data.quest_name || "Unknown")}</p>
              <p><strong>Confirmed:</strong> ${escapeHtml(String(data.confirmed_count || 0))} participants</p>
              <p><strong>Standby:</strong> ${escapeHtml(String(data.standby_count || 0))} participants</p>
            </div>
            <p style="color: #666; font-size: 14px;">Time to finalize the squad!</p>
          </div>
        `;
        break;

      case "cancellation":
        subject = `⚠️ Quest Cancellation: ${escapeHtml(data.quest_name || "Unknown Quest")}`;
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #f59e0b;">Someone Dropped Out</h2>
            <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>User:</strong> ${escapeHtml(data.user_email || "Unknown")}</p>
              <p><strong>Quest:</strong> ${escapeHtml(data.quest_name || "Unknown")}</p>
              <p><strong>Reason:</strong> ${escapeHtml(data.reason || "No reason provided")}</p>
              <p><strong>Remaining:</strong> ${escapeHtml(String(data.remaining_count || 0))}/${escapeHtml(String(data.capacity || "?"))}</p>
            </div>
            <p style="color: #666; font-size: 14px;">Consider promoting someone from the standby list.</p>
          </div>
        `;
        break;

      case "feedback":
        subject = `📝 New Feedback: ${escapeHtml(data.quest_name || "Quest Feedback")}`;
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #8b5cf6;">New Feedback Received</h2>
            <div style="background: #f5f3ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>Quest:</strong> ${escapeHtml(data.quest_name || "Unknown")}</p>
              <p><strong>Rating:</strong> ${"⭐".repeat(Math.min(Math.max(Number(data.rating) || 0, 0), 5))} (${escapeHtml(String(data.rating))}/5)</p>
              <p><strong>Belonging Delta:</strong> ${escapeHtml(String(data.belonging_before || "?"))} → ${escapeHtml(String(data.belonging_after || "?"))}</p>
              ${data.comments ? `<p><strong>Comments:</strong> ${escapeHtml(data.comments)}</p>` : ""}
            </div>
          </div>
        `;
        break;

      case "proposal_pending":
        subject = `🤝 Sponsorship Proposal Needs Review: ${escapeHtml(data.sponsor_name || "Unknown Sponsor")}`;
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #f59e0b;">Sponsorship Proposal Pending Admin Review</h2>
            <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>Sponsor:</strong> ${escapeHtml(data.sponsor_name || "Unknown")}</p>
              <p><strong>Creator:</strong> ${escapeHtml(data.creator_name || "Unknown")}</p>
              ${data.quest_title ? `<p><strong>Quest:</strong> ${escapeHtml(data.quest_title)}</p>` : ""}
              <p><strong>Proposal Type:</strong> ${data.proposal_type === "sponsor_quest" ? "Sponsor Existing Quest" : "Request Custom Quest"}</p>
              ${data.budget ? `<p><strong>Budget/Offering:</strong> ${escapeHtml(data.budget)}</p>` : ""}
            </div>
            <p style="color: #666; font-size: 14px;">
              The creator has accepted this proposal. Please review and approve or reject in the admin console.
            </p>
            <div style="margin-top: 20px;">
              <a href="https://openclique.lovable.app/admin" 
                 style="background: #14b8a6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
                Review in Admin Console
              </a>
            </div>
          </div>
        `;
        break;

      case "custom":
        subject = escapeHtml(data.subject || "Admin Notification");
        // Custom HTML should be sanitized by caller, but we escape the message fallback
        html = data.html || `<p>${escapeHtml(data.message || "No content")}</p>`;
        break;

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    console.log(`Sending ${type} notification to ${adminEmails.length} admin(s)`);

    const emailResponse = await resend.emails.send({
      from: "OpenClique Alerts <alerts@openclique.lovable.app>",
      to: adminEmails,
      subject,
      html,
    });

    console.log("Admin notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending admin notification:", error);
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