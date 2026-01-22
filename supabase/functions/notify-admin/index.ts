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
  type: "new_signup" | "quest_full" | "cancellation" | "feedback" | "custom";
  data: Record<string, any>;
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

    // Build notification content based on type
    let subject: string;
    let html: string;

    switch (type) {
      case "new_signup":
        subject = `🆕 New Quest Signup: ${data.quest_name || "Unknown Quest"}`;
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #14b8a6;">New Quest Signup!</h2>
            <div style="background: #f0fdfa; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>User:</strong> ${data.user_email || "Unknown"}</p>
              <p><strong>Quest:</strong> ${data.quest_name || "Unknown"}</p>
              <p><strong>Current Signups:</strong> ${data.current_count || 0}/${data.capacity || "?"}</p>
            </div>
            <p style="color: #666; font-size: 14px;">Check the admin dashboard for more details.</p>
          </div>
        `;
        break;

      case "quest_full":
        subject = `🎉 Quest Full: ${data.quest_name || "Unknown Quest"}`;
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #22c55e;">Quest is Full!</h2>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>Quest:</strong> ${data.quest_name || "Unknown"}</p>
              <p><strong>Confirmed:</strong> ${data.confirmed_count || 0} participants</p>
              <p><strong>Standby:</strong> ${data.standby_count || 0} participants</p>
            </div>
            <p style="color: #666; font-size: 14px;">Time to finalize the squad!</p>
          </div>
        `;
        break;

      case "cancellation":
        subject = `⚠️ Quest Cancellation: ${data.quest_name || "Unknown Quest"}`;
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #f59e0b;">Someone Dropped Out</h2>
            <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>User:</strong> ${data.user_email || "Unknown"}</p>
              <p><strong>Quest:</strong> ${data.quest_name || "Unknown"}</p>
              <p><strong>Reason:</strong> ${data.reason || "No reason provided"}</p>
              <p><strong>Remaining:</strong> ${data.remaining_count || 0}/${data.capacity || "?"}</p>
            </div>
            <p style="color: #666; font-size: 14px;">Consider promoting someone from the standby list.</p>
          </div>
        `;
        break;

      case "feedback":
        subject = `📝 New Feedback: ${data.quest_name || "Quest Feedback"}`;
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #8b5cf6;">New Feedback Received</h2>
            <div style="background: #f5f3ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>Quest:</strong> ${data.quest_name || "Unknown"}</p>
              <p><strong>Rating:</strong> ${"⭐".repeat(data.rating || 0)} (${data.rating}/5)</p>
              <p><strong>Belonging Delta:</strong> ${data.belonging_before || "?"} → ${data.belonging_after || "?"}</p>
              ${data.comments ? `<p><strong>Comments:</strong> ${data.comments}</p>` : ""}
            </div>
          </div>
        `;
        break;

      case "custom":
        subject = data.subject || "Admin Notification";
        html = data.html || `<p>${data.message || "No content"}</p>`;
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
