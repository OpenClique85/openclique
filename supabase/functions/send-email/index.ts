import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "resend";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  to: string | string[];
  subject: string;
  template: "quest_confirmation" | "quest_reminder" | "quest_cancelled" | "custom";
  variables?: Record<string, string>;
  customHtml?: string;
}

// Email templates
const templates: Record<string, (vars: Record<string, string>) => string> = {
  quest_confirmation: (vars) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #14b8a6; margin: 0;">🎉 You're In!</h1>
      </div>
      <p style="font-size: 16px; color: #333;">Hey ${vars.display_name || "Adventurer"}!</p>
      <p style="font-size: 16px; color: #333;">Great news — you've been confirmed for <strong>${vars.quest_name || "your quest"}</strong>!</p>
      
      <div style="background: #f0fdfa; border-left: 4px solid #14b8a6; padding: 15px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>📅 When:</strong> ${vars.quest_date || "TBD"}</p>
        <p style="margin: 0 0 10px 0;"><strong>📍 Where:</strong> ${vars.quest_location || "TBD"}</p>
        <p style="margin: 0;"><strong>👥 Squad Size:</strong> ${vars.squad_size || "3-6"} people</p>
      </div>
      
      ${vars.whatsapp_link ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${vars.whatsapp_link}" style="background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            💬 Join Your Squad's WhatsApp
          </a>
        </div>
      ` : ""}
      
      <p style="font-size: 14px; color: #666;">See you there!</p>
      <p style="font-size: 14px; color: #666;">— The OpenClique Team</p>
    </div>
  `,
  
  quest_reminder: (vars) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #f59e0b; margin: 0;">⏰ Quest Reminder!</h1>
      </div>
      <p style="font-size: 16px; color: #333;">Hey ${vars.display_name || "Adventurer"}!</p>
      <p style="font-size: 16px; color: #333;">Just a friendly reminder that <strong>${vars.quest_name || "your quest"}</strong> is coming up ${vars.time_until || "soon"}!</p>
      
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>📅 When:</strong> ${vars.quest_date || "TBD"}</p>
        <p style="margin: 0 0 10px 0;"><strong>📍 Where:</strong> ${vars.quest_location || "TBD"}</p>
      </div>
      
      <p style="font-size: 14px; color: #666;">Can't make it? Please let us know ASAP so we can fill your spot.</p>
      <p style="font-size: 14px; color: #666;">— The OpenClique Team</p>
    </div>
  `,
  
  quest_cancelled: (vars) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #ef4444; margin: 0;">Quest Update</h1>
      </div>
      <p style="font-size: 16px; color: #333;">Hey ${vars.display_name || "Adventurer"},</p>
      <p style="font-size: 16px; color: #333;">We're sorry to let you know that <strong>${vars.quest_name || "your quest"}</strong> has been cancelled.</p>
      
      ${vars.reason ? `<p style="font-size: 14px; color: #666;"><strong>Reason:</strong> ${vars.reason}</p>` : ""}
      
      <p style="font-size: 14px; color: #666;">We know this is disappointing. Keep an eye out for new quests — there's always another adventure around the corner!</p>
      <p style="font-size: 14px; color: #666;">— The OpenClique Team</p>
    </div>
  `,
  
  custom: (vars) => vars.content || "",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the token and check admin role
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Invalid token");
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const { to, subject, template, variables = {}, customHtml }: SendEmailRequest = await req.json();

    // Get the HTML content
    let html: string;
    if (template === "custom" && customHtml) {
      // Replace variables in custom HTML
      html = customHtml.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || "");
    } else if (templates[template]) {
      html = templates[template](variables);
    } else {
      throw new Error(`Unknown template: ${template}`);
    }

    const toArray = Array.isArray(to) ? to : [to];
    
    console.log(`Sending ${template} email to ${toArray.length} recipient(s)`);

    const emailResponse = await resend.emails.send({
      from: "OpenClique <noreply@openclique.lovable.app>",
      to: toArray,
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the communication
    for (const recipient of toArray) {
      await supabase.from("comms_log").insert({
        user_id: user.id, // Admin who sent it
        type: "email",
        subject,
        body: html,
        sent_at: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: error.message.includes("Unauthorized") ? 403 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
