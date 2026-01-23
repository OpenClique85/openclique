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
  template: "quest_confirmation" | "quest_reminder" | "quest_cancelled" | "quest_approved" | "quest_needs_changes" | "quest_rejected" | "support_reply" | "admin_dm" | "custom";
  variables?: Record<string, string>;
  customHtml?: string;
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

// Email templates with escaped variables
const templates: Record<string, (vars: Record<string, string>) => string> = {
  quest_confirmation: (vars) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #14b8a6; margin: 0;">🎉 You're In!</h1>
      </div>
      <p style="font-size: 16px; color: #333;">Hey ${escapeHtml(vars.display_name || "Adventurer")}!</p>
      <p style="font-size: 16px; color: #333;">Great news — you've been confirmed for <strong>${escapeHtml(vars.quest_name || "your quest")}</strong>!</p>
      
      <div style="background: #f0fdfa; border-left: 4px solid #14b8a6; padding: 15px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>📅 When:</strong> ${escapeHtml(vars.quest_date || "TBD")}</p>
        <p style="margin: 0 0 10px 0;"><strong>📍 Where:</strong> ${escapeHtml(vars.quest_location || "TBD")}</p>
        <p style="margin: 0;"><strong>👥 Squad Size:</strong> ${escapeHtml(vars.squad_size || "3-6")} people</p>
      </div>
      
      ${vars.whatsapp_link ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${escapeHtml(vars.whatsapp_link)}" style="background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
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
      <p style="font-size: 16px; color: #333;">Hey ${escapeHtml(vars.display_name || "Adventurer")}!</p>
      <p style="font-size: 16px; color: #333;">Just a friendly reminder that <strong>${escapeHtml(vars.quest_name || "your quest")}</strong> is coming up ${escapeHtml(vars.time_until || "soon")}!</p>
      
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>📅 When:</strong> ${escapeHtml(vars.quest_date || "TBD")}</p>
        <p style="margin: 0 0 10px 0;"><strong>📍 Where:</strong> ${escapeHtml(vars.quest_location || "TBD")}</p>
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
      <p style="font-size: 16px; color: #333;">Hey ${escapeHtml(vars.display_name || "Adventurer")},</p>
      <p style="font-size: 16px; color: #333;">We're sorry to let you know that <strong>${escapeHtml(vars.quest_name || "your quest")}</strong> has been cancelled.</p>
      
      ${vars.reason ? `<p style="font-size: 14px; color: #666;"><strong>Reason:</strong> ${escapeHtml(vars.reason)}</p>` : ""}
      
      <p style="font-size: 14px; color: #666;">We know this is disappointing. Keep an eye out for new quests — there's always another adventure around the corner!</p>
      <p style="font-size: 14px; color: #666;">— The OpenClique Team</p>
    </div>
  `,
  
  quest_approved: (vars) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #10b981; margin: 0;">🎉 Your Quest is Approved!</h1>
      </div>
      <p style="font-size: 16px; color: #333;">Hey ${escapeHtml(vars.creator_name || "Creator")}!</p>
      <p style="font-size: 16px; color: #333;">Great news — your quest <strong>"${escapeHtml(vars.quest_title || "your quest")}"</strong> has been approved!</p>
      
      <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 16px;">
          ${vars.is_published === 'true' 
            ? '✅ Your quest is now <strong>live</strong> and accepting signups!' 
            : '✅ Your quest is approved and ready to be published when you\'re ready.'}
        </p>
      </div>
      
      ${vars.quest_url ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${escapeHtml(vars.quest_url)}" style="background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            View Your Quest
          </a>
        </div>
      ` : ""}
      
      <p style="font-size: 14px; color: #666;">Congratulations on creating something awesome!</p>
      <p style="font-size: 14px; color: #666;">— The OpenClique Team</p>
    </div>
  `,
  
  quest_needs_changes: (vars) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #f59e0b; margin: 0;">📝 Quest Feedback</h1>
      </div>
      <p style="font-size: 16px; color: #333;">Hey ${escapeHtml(vars.creator_name || "Creator")},</p>
      <p style="font-size: 16px; color: #333;">We've reviewed your quest <strong>"${escapeHtml(vars.quest_title || "your quest")}"</strong> and have some feedback to help make it even better.</p>
      
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-weight: bold;">Reviewer Feedback:</p>
        <p style="margin: 0; font-size: 14px;">${escapeHtml(vars.admin_notes || "Please check the Creator Portal for details.")}</p>
      </div>
      
      ${vars.edit_url ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${escapeHtml(vars.edit_url)}" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Edit Your Quest
          </a>
        </div>
      ` : ""}
      
      <p style="font-size: 14px; color: #666;">Once you've made the updates, you can resubmit for review.</p>
      <p style="font-size: 14px; color: #666;">— The OpenClique Team</p>
    </div>
  `,
  
  quest_rejected: (vars) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #6b7280; margin: 0;">Quest Update</h1>
      </div>
      <p style="font-size: 16px; color: #333;">Hey ${escapeHtml(vars.creator_name || "Creator")},</p>
      <p style="font-size: 16px; color: #333;">We've reviewed your quest <strong>"${escapeHtml(vars.quest_title || "your quest")}"</strong> and unfortunately, it wasn't approved at this time.</p>
      
      ${vars.admin_notes ? `
        <div style="background: #f3f4f6; border-left: 4px solid #6b7280; padding: 15px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-weight: bold;">Feedback:</p>
          <p style="margin: 0; font-size: 14px;">${escapeHtml(vars.admin_notes)}</p>
        </div>
      ` : ""}
      
      <p style="font-size: 14px; color: #666;">Don't be discouraged! We encourage you to create new quests that align with our community guidelines. We're here to help if you have questions.</p>
      <p style="font-size: 14px; color: #666;">— The OpenClique Team</p>
    </div>
  `,
  
  support_reply: (vars) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #14b8a6; margin: 0;">📬 Support Update</h1>
      </div>
      <p style="font-size: 16px; color: #333;">Hey ${escapeHtml(vars.display_name || "there")}!</p>
      <p style="font-size: 16px; color: #333;">We've responded to your support ticket: <strong>"${escapeHtml(vars.ticket_subject || "Your request")}"</strong></p>
      
      <div style="background: #f0fdfa; border-left: 4px solid #14b8a6; padding: 15px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-weight: bold;">Our Reply:</p>
        <p style="margin: 0; font-size: 14px; white-space: pre-wrap;">${escapeHtml(vars.message || "")}</p>
      </div>
      
      ${vars.ticket_url ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${escapeHtml(vars.ticket_url)}" style="background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            View Full Thread
          </a>
        </div>
      ` : ""}
      
      <p style="font-size: 14px; color: #666;">If you have more questions, just reply to this ticket in the app.</p>
      <p style="font-size: 14px; color: #666;">— The OpenClique Support Team</p>
    </div>
  `,
  
  admin_dm: (vars) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #8b5cf6; margin: 0;">💬 Message from OpenClique</h1>
      </div>
      <p style="font-size: 16px; color: #333;">Hey ${escapeHtml(vars.display_name || "there")}!</p>
      <p style="font-size: 16px; color: #333;">You have a new message from our team:</p>
      
      <div style="background: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 15px; margin: 20px 0;">
        ${vars.subject ? `<p style="margin: 0 0 10px 0; font-weight: bold;">${escapeHtml(vars.subject)}</p>` : ""}
        <p style="margin: 0; font-size: 14px; white-space: pre-wrap;">${escapeHtml(vars.message || "")}</p>
      </div>
      
      ${vars.app_url ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${escapeHtml(vars.app_url)}" style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            View in App
          </a>
        </div>
      ` : ""}
      
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
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Create client with user's token to check admin status
    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(supabaseUrl, supabaseAnon, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    // Verify user is admin
    const { data: isAdmin, error: adminError } = await supabaseClient.rpc("is_admin");
    if (adminError || !isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Use service role for operations
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { to, subject, template, variables = {}, customHtml }: SendEmailRequest = await req.json();

    // Get the HTML content
    let html: string;
    if (template === "custom" && customHtml) {
      // Replace variables in custom HTML - escape the replacement values
      html = customHtml.replace(/\{\{(\w+)\}\}/g, (_, key) => escapeHtml(variables[key] || ""));
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
      subject: escapeHtml(subject), // Escape subject as well
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    // Get current user for logging
    const { data: { user } } = await supabaseClient.auth.getUser();

    // Log the communication
    for (const recipient of toArray) {
      await supabase.from("comms_log").insert({
        user_id: user?.id, // Admin who sent it
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