import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// In-memory store for verification codes (in production, use Redis or DB)
// Format: { email: { code: string, userId: string, expires: number } }
const verificationCodes = new Map<string, { code: string; userId: string; expires: number }>();

// Valid school domains for Austin-area schools
const VALID_SCHOOL_DOMAINS: Record<string, string> = {
  "utexas.edu": "ut_austin",
  "txstate.edu": "texas_state",
  "stedwards.edu": "st_edwards",
  "austincc.edu": "acc",
  "concordia.edu": "concordia",
  "htu.edu": "huston_tillotson",
  "southwestern.edu": "southwestern",
};

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getSchoolFromEmail(email: string): string | null {
  const domain = email.split("@")[1]?.toLowerCase();
  return VALID_SCHOOL_DOMAINS[domain] || null;
}

// Import rate limiting
import { checkRateLimit, rateLimitResponse, RATE_LIMITS, sanitizeEmail, sanitizeString } from "../_shared/rate-limit.ts";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(supabaseUrl, supabaseAnon, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Rate limit verification attempts per user
    const rateCheck = checkRateLimit(user.id, RATE_LIMITS.VERIFICATION);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck, corsHeaders);
    }

    const body = await req.json();
    const { action } = body;
    
    // Sanitize inputs
    const email = sanitizeEmail(body.email);
    const code = sanitizeString(body.code, 10);

    // Validate email is provided
    if (!email) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Valid email address is required." 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === "send") {
      // Validate email domain
      const schoolId = getSchoolFromEmail(email);
      if (!schoolId) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Invalid school email domain. Please use your official school email." 
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Generate verification code
      const verificationCode = generateCode();
      const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Store the code
      verificationCodes.set(email.toLowerCase(), {
        code: verificationCode,
        userId: user.id,
        expires,
      });

      // Get school name for email
      const schoolNames: Record<string, string> = {
        ut_austin: "UT Austin",
        texas_state: "Texas State",
        st_edwards: "St. Edward's University",
        acc: "Austin Community College",
        concordia: "Concordia University",
        huston_tillotson: "Huston-Tillotson",
        southwestern: "Southwestern University",
      };

      const schoolName = schoolNames[schoolId] || "your school";
      const isUT = schoolId === "ut_austin";

      // Send verification email
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: ${isUT ? '#BF5700' : '#14b8a6'}; margin: 0;">
              ${isUT ? '🤘 Hook \'em!' : '🎓'} Verify Your School Email
            </h1>
          </div>
          
          <p style="font-size: 16px; color: #333;">
            You're verifying your ${schoolName} email to get your ${isUT ? '⭐ verified star badge' : 'verified badge'} on OpenClique!
          </p>
          
          <div style="background: ${isUT ? '#FFF5EB' : '#f0fdfa'}; border-left: 4px solid ${isUT ? '#BF5700' : '#14b8a6'}; padding: 20px; margin: 25px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Your verification code is:</p>
            <p style="margin: 0; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #333;">
              ${verificationCode}
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
          </p>
          
          ${isUT ? `
            <p style="font-size: 14px; color: #BF5700; font-weight: bold; text-align: center; margin-top: 20px;">
              🤘🐂 What starts here changes the world!
            </p>
          ` : ''}
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">— The OpenClique Team</p>
        </div>
      `;

      const { error: emailError } = await resend.emails.send({
        from: "OpenClique <noreply@openclique.lovable.app>",
        to: [email],
        subject: isUT ? "🤘 Verify your UT Austin email" : `Verify your ${schoolName} email`,
        html: emailHtml,
      });

      if (emailError) {
        console.error("Failed to send verification email:", emailError);
        throw new Error("Failed to send verification email");
      }

      console.log(`Verification code sent to ${email} for user ${user.id}`);

      return new Response(
        JSON.stringify({ success: true, message: "Verification code sent" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    } else if (action === "verify") {
      // Verify the code
      const storedData = verificationCodes.get(email.toLowerCase());

      if (!storedData) {
        return new Response(
          JSON.stringify({ success: false, error: "No verification code found. Please request a new one." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (Date.now() > storedData.expires) {
        verificationCodes.delete(email.toLowerCase());
        return new Response(
          JSON.stringify({ success: false, error: "Verification code has expired. Please request a new one." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (storedData.userId !== user.id) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid verification attempt." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (storedData.code !== code) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid verification code. Please try again." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Code is valid - update user profile
      const schoolId = getSchoolFromEmail(email);

      // Get current profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw new Error("Failed to fetch profile");
      }

      // Update preferences with verified school
      const currentPrefs = profile?.preferences || {};
      const updatedPrefs = {
        ...currentPrefs,
        demographics: {
          ...(currentPrefs as any).demographics,
          school: {
            school_id: schoolId,
            school_name: email.split("@")[1],
            verification_tier: "email_verified",
            verified_at: new Date().toISOString(),
          },
          show_school_publicly: true,
        },
      };

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ preferences: updatedPrefs })
        .eq("id", user.id);

      if (updateError) {
        throw new Error("Failed to update profile");
      }

      // Clean up verification code
      verificationCodes.delete(email.toLowerCase());

      console.log(`School email verified for user ${user.id}: ${email}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: schoolId === "ut_austin" 
            ? "🤘 Hook 'em! You're now a verified Longhorn!" 
            : "Your school email has been verified!",
          schoolId,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid action" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

  } catch (error: any) {
    console.error("Error in verify-school-email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: error.message.includes("Unauthorized") ? 401 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
