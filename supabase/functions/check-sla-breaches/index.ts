import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SLA thresholds in hours
const FIRST_RESPONSE_SLA_HOURS = 4;
const RESOLUTION_SLA_HOURS = 24;

interface BreachedTicket {
  id: string;
  description: string;
  urgency: string;
  created_at: string;
  first_response_at: string | null;
  status: string;
  user: { display_name: string; email: string } | null;
  category: { name: string } | null;
  breachType: 'first_response' | 'resolution';
  hoursElapsed: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting SLA breach check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const firstResponseThreshold = new Date(now.getTime() - FIRST_RESPONSE_SLA_HOURS * 60 * 60 * 1000);
    const resolutionThreshold = new Date(now.getTime() - RESOLUTION_SLA_HOURS * 60 * 60 * 1000);

    // Find tickets breaching first response SLA (no response after 4 hours)
    const { data: firstResponseBreaches, error: frError } = await supabase
      .from('support_tickets')
      .select(`
        id,
        description,
        urgency,
        created_at,
        first_response_at,
        status,
        first_response_sla_breached_at,
        user:profiles!support_tickets_user_id_fkey(display_name, email),
        category:issue_categories(name)
      `)
      .is('first_response_at', null)
      .is('first_response_sla_breached_at', null)
      .lt('created_at', firstResponseThreshold.toISOString())
      .not('status', 'in', '(resolved,closed)');

    if (frError) {
      console.error("Error fetching first response breaches:", frError);
      throw frError;
    }

    // Find tickets breaching resolution SLA (not resolved after 24 hours)
    const { data: resolutionBreaches, error: resError } = await supabase
      .from('support_tickets')
      .select(`
        id,
        description,
        urgency,
        created_at,
        first_response_at,
        status,
        resolution_sla_breached_at,
        user:profiles!support_tickets_user_id_fkey(display_name, email),
        category:issue_categories(name)
      `)
      .is('resolution_sla_breached_at', null)
      .lt('created_at', resolutionThreshold.toISOString())
      .not('status', 'in', '(resolved,closed)');

    if (resError) {
      console.error("Error fetching resolution breaches:", resError);
      throw resError;
    }

    console.log(`Found ${firstResponseBreaches?.length || 0} first response breaches`);
    console.log(`Found ${resolutionBreaches?.length || 0} resolution breaches`);

    const breachedTickets: BreachedTicket[] = [];

    // Process first response breaches
    for (const ticket of firstResponseBreaches || []) {
      const hoursElapsed = Math.round((now.getTime() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60));
      breachedTickets.push({
        ...ticket,
        user: ticket.user as any,
        category: ticket.category as any,
        breachType: 'first_response',
        hoursElapsed,
      });

      // Mark as breach notified
      await supabase
        .from('support_tickets')
        .update({ first_response_sla_breached_at: now.toISOString() } as any)
        .eq('id', ticket.id);
    }

    // Process resolution breaches (only if not already notified for first response)
    for (const ticket of resolutionBreaches || []) {
      const hoursElapsed = Math.round((now.getTime() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60));
      
      // Only add if not already in the list (avoid duplicate notifications)
      if (!breachedTickets.find(t => t.id === ticket.id)) {
        breachedTickets.push({
          ...ticket,
          user: ticket.user as any,
          category: ticket.category as any,
          breachType: 'resolution',
          hoursElapsed,
        });
      }

      // Mark as resolution breach notified
      await supabase
        .from('support_tickets')
        .update({ resolution_sla_breached_at: now.toISOString() } as any)
        .eq('id', ticket.id);
    }

    if (breachedTickets.length === 0) {
      console.log("No SLA breaches found");
      return new Response(
        JSON.stringify({ success: true, breachCount: 0, message: "No SLA breaches found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get admin emails to notify
    const { data: adminRoles, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminError) throw adminError;

    const adminIds = adminRoles?.map(r => r.user_id) || [];
    
    const { data: adminProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .in('id', adminIds)
      .not('email', 'is', null);

    if (profileError) throw profileError;

    const adminEmails = adminProfiles?.map(p => p.email).filter(Boolean) as string[];

    if (adminEmails.length === 0) {
      console.log("No admin emails found to notify");
      return new Response(
        JSON.stringify({ success: true, breachCount: breachedTickets.length, message: "No admin emails to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build email content
    const firstResponseList = breachedTickets
      .filter(t => t.breachType === 'first_response')
      .map(t => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${t.id.substring(0, 8)}...</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${t.category?.name || 'N/A'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${t.user?.display_name || 'Unknown'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${t.urgency}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: #ef4444;">${t.hoursElapsed}h (SLA: ${FIRST_RESPONSE_SLA_HOURS}h)</td>
        </tr>
      `).join('');

    const resolutionList = breachedTickets
      .filter(t => t.breachType === 'resolution')
      .map(t => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${t.id.substring(0, 8)}...</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${t.category?.name || 'N/A'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${t.user?.display_name || 'Unknown'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${t.urgency}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: #ef4444;">${t.hoursElapsed}h (SLA: ${RESOLUTION_SLA_HOURS}h)</td>
        </tr>
      `).join('');

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ef4444; margin: 0;">⚠️ SLA Breach Alert</h1>
        </div>
        
        <p style="font-size: 16px; color: #333;">
          The following support tickets have exceeded their SLA thresholds and require immediate attention.
        </p>
        
        ${firstResponseList ? `
          <div style="margin: 20px 0;">
            <h2 style="color: #f59e0b; font-size: 18px;">🕐 First Response Breaches (>${FIRST_RESPONSE_SLA_HOURS}h without response)</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 8px; text-align: left;">Ticket ID</th>
                  <th style="padding: 8px; text-align: left;">Category</th>
                  <th style="padding: 8px; text-align: left;">User</th>
                  <th style="padding: 8px; text-align: left;">Urgency</th>
                  <th style="padding: 8px; text-align: left;">Time Elapsed</th>
                </tr>
              </thead>
              <tbody>
                ${firstResponseList}
              </tbody>
            </table>
          </div>
        ` : ''}
        
        ${resolutionList ? `
          <div style="margin: 20px 0;">
            <h2 style="color: #ef4444; font-size: 18px;">❌ Resolution Breaches (>${RESOLUTION_SLA_HOURS}h unresolved)</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 8px; text-align: left;">Ticket ID</th>
                  <th style="padding: 8px; text-align: left;">Category</th>
                  <th style="padding: 8px; text-align: left;">User</th>
                  <th style="padding: 8px; text-align: left;">Urgency</th>
                  <th style="padding: 8px; text-align: left;">Time Elapsed</th>
                </tr>
              </thead>
              <tbody>
                ${resolutionList}
              </tbody>
            </table>
          </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/admin" 
             style="background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Open Admin Console
          </a>
        </div>
        
        <p style="font-size: 12px; color: #666; text-align: center;">
          This is an automated SLA monitoring alert from OpenClique Support System.
        </p>
      </div>
    `;

    // Send email to all admins
    const emailResponse = await resend.emails.send({
      from: "OpenClique <noreply@openclique.lovable.app>",
      to: adminEmails,
      subject: `⚠️ SLA Alert: ${breachedTickets.length} ticket(s) need attention`,
      html: emailHtml,
    });

    console.log("SLA breach notification sent:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        breachCount: breachedTickets.length,
        notifiedAdmins: adminEmails.length,
        firstResponseBreaches: breachedTickets.filter(t => t.breachType === 'first_response').length,
        resolutionBreaches: breachedTickets.filter(t => t.breachType === 'resolution').length,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error checking SLA breaches:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
