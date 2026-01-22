import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyUsersRequest {
  type: 'quest_recommendation' | 'quest_shared' | 'referral_accepted' | 'signup_confirmed';
  quest_id: string;
  user_ids?: string[]; // If empty, find matching users
  custom_message?: string;
  referrer_user_id?: string; // For referral notifications
}

async function sendEmail(to: string, subject: string, html: string, resendApiKey: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: "OpenClique <notifications@openclique.net>",
      to: [to],
      subject,
      html,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend error: ${error}`);
  }
  
  return response.json();
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { 
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } }
      }
    );

    // Verify user is admin
    const { data: isAdminData, error: adminError } = await supabaseClient.rpc("is_admin");
    
    if (adminError || !isAdminData) {
      console.error("Admin check failed:", adminError);
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: NotifyUsersRequest = await req.json();
    const { type, quest_id, user_ids, custom_message, referrer_user_id } = body;

    console.log("Notify users request:", { type, quest_id, user_ids_count: user_ids?.length });

    // Fetch quest details
    const { data: quest, error: questError } = await supabaseAdmin
      .from("quests")
      .select("title, slug, icon, theme, progression_tree")
      .eq("id", quest_id)
      .single();

    if (questError || !quest) {
      console.error("Quest not found:", questError);
      return new Response(JSON.stringify({ error: "Quest not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let targetUserIds: string[] = [];

    if (user_ids && user_ids.length > 0) {
      targetUserIds = user_ids;
    } else if (type === 'quest_recommendation') {
      // Find users with matching interests
      const { data: matchingUsers, error: usersError } = await supabaseAdmin
        .from("profiles")
        .select("id, preferences");
      
      if (usersError) {
        console.error("Failed to fetch users:", usersError);
        throw usersError;
      }

      // Filter users based on interest_tags matching quest's progression_tree
      const tree = quest.progression_tree?.toLowerCase();
      
      targetUserIds = (matchingUsers || [])
        .filter((user: any) => {
          if (!tree) return true; // No filter if quest has no tree
          const interests = user.preferences?.interest_tags || [];
          return interests.some((tag: string) => 
            tag.toLowerCase().includes(tree) || tree.includes(tag.toLowerCase())
          );
        })
        .map((user: any) => user.id);
    }

    if (targetUserIds.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No matching users found",
        notified_count: 0 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profiles with emails
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, email")
      .in("id", targetUserIds);

    if (profilesError) {
      console.error("Failed to fetch profiles:", profilesError);
      throw profilesError;
    }

    // Get referrer name if applicable
    let referrerName = "A friend";
    if (referrer_user_id) {
      const { data: referrer } = await supabaseAdmin
        .from("profiles")
        .select("display_name")
        .eq("id", referrer_user_id)
        .single();
      
      if (referrer?.display_name) {
        referrerName = referrer.display_name;
      }
    }

    // Generate notification content based on type
    let notificationTitle: string;
    let notificationBody: string;
    let emailSubject: string;
    let emailHtml: string;

    const baseUrl = "https://openclique.lovable.app";
    const questUrl = `${baseUrl}/quests/${quest.slug}`;

    switch (type) {
      case 'quest_recommendation':
        notificationTitle = `${quest.icon} Quest recommended for you!`;
        notificationBody = custom_message || `We think you'd love "${quest.title}" based on your interests.`;
        emailSubject = `🎯 ${quest.title} - Recommended Quest`;
        emailHtml = `
          <h1>We found a quest for you!</h1>
          <p>Based on your interests, we think you'd love:</p>
          <h2>${quest.icon} ${quest.title}</h2>
          <p>${custom_message || `This ${quest.theme || 'adventure'} quest is right up your alley!`}</p>
          <p><a href="${questUrl}" style="color: #7c3aed; font-weight: bold;">View Quest Details →</a></p>
          <p style="color: #6b7280; font-size: 12px;">You're receiving this because you're part of OpenClique. Manage your preferences in your profile.</p>
        `;
        break;
      
      case 'quest_shared':
        notificationTitle = `${referrerName} shared a quest with you!`;
        notificationBody = `Check out "${quest.title}" - your friend thinks you'd enjoy it.`;
        emailSubject = `👥 ${referrerName} invited you to a quest!`;
        emailHtml = `
          <h1>${referrerName} wants you to join!</h1>
          <p>Your friend thinks you'd love this quest:</p>
          <h2>${quest.icon} ${quest.title}</h2>
          <p><a href="${questUrl}" style="color: #7c3aed; font-weight: bold;">Join the Quest →</a></p>
          <p style="color: #6b7280; font-size: 12px;">This invitation was sent via OpenClique.</p>
        `;
        break;
      
      case 'referral_accepted':
        notificationTitle = `🎉 Your friend joined ${quest.title}!`;
        notificationBody = `Great news! Someone you invited signed up for the quest.`;
        emailSubject = `🎉 Your friend joined your quest!`;
        emailHtml = `
          <h1>Great news!</h1>
          <p>Someone you invited just joined:</p>
          <h2>${quest.icon} ${quest.title}</h2>
          <p>Thanks for spreading the word! The more the merrier.</p>
          <p><a href="${questUrl}" style="color: #7c3aed; font-weight: bold;">View Quest →</a></p>
        `;
        break;
      
      case 'signup_confirmed':
        notificationTitle = `✅ You're confirmed for ${quest.title}!`;
        notificationBody = custom_message || `Great news! Your spot is confirmed. Check your email for details.`;
        emailSubject = `✅ You're in! ${quest.title}`;
        emailHtml = `
          <h1>You're confirmed!</h1>
          <p>Great news - your spot for this quest is officially confirmed:</p>
          <h2>${quest.icon} ${quest.title}</h2>
          ${custom_message ? `<p>${custom_message}</p>` : ''}
          <p><a href="${questUrl}" style="color: #7c3aed; font-weight: bold;">View Quest Details →</a></p>
          <p style="color: #6b7280; font-size: 12px;">We'll send you more details as the event approaches. Get ready for an adventure!</p>
        `;
        break;
      
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    // Create notifications in database
    const notifications = targetUserIds.map((userId) => ({
      user_id: userId,
      type,
      title: notificationTitle,
      body: notificationBody,
      quest_id,
      referrer_user_id: referrer_user_id || null,
    }));

    const { error: insertError } = await supabaseAdmin
      .from("notifications")
      .insert(notifications);

    if (insertError) {
      console.error("Failed to create notifications:", insertError);
      throw insertError;
    }

    // Send emails to users with email addresses
    let successfulEmails = 0;
    
    for (const profile of (profiles || [])) {
      if (!profile.email) continue;
      
      try {
        await sendEmail(profile.email, emailSubject, emailHtml, resendApiKey);
        
        // Log to comms_log
        await supabaseAdmin.from("comms_log").insert({
          user_id: profile.id,
          quest_id,
          type: "email_invite",
          subject: emailSubject,
        });
        
        successfulEmails++;
      } catch (err) {
        console.error(`Failed to send email to ${profile.email}:`, err);
      }
    }

    console.log(`Notifications created: ${notifications.length}, Emails sent: ${successfulEmails}`);

    return new Response(
      JSON.stringify({
        success: true,
        notified_count: targetUserIds.length,
        emails_sent: successfulEmails,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-users function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
