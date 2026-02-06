/**
 * =============================================================================
 * EXPORT WAITLIST - CSV export for admin email campaigns
 * =============================================================================
 * 
 * Returns waitlist entries as CSV for import to Mailchimp, Gmail, etc.
 * Only accessible to authenticated admins.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("[export-waitlist] Starting export request");

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the user's JWT from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("[export-waitlist] No authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.log("[export-waitlist] Invalid token:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[export-waitlist] User authenticated: ${user.id}`);

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      console.log("[export-waitlist] User is not admin");
      return new Response(
        JSON.stringify({ error: "Unauthorized - admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[export-waitlist] Admin verified, fetching waitlist");

    // Fetch all waitlist entries
    const { data: entries, error: fetchError } = await supabase
      .from("waitlist")
      .select("email, name, interest, referral_source, created_at, converted_at")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("[export-waitlist] Fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch waitlist" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[export-waitlist] Found ${entries?.length || 0} entries`);

    // Build CSV
    const headers = ["email", "name", "interest", "referral_source", "joined_at", "converted"];
    const rows = (entries || []).map((entry) => [
      entry.email,
      entry.name || "",
      entry.interest || "",
      entry.referral_source || "",
      entry.created_at,
      entry.converted_at ? "yes" : "no",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    console.log("[export-waitlist] CSV generated successfully");

    // Return CSV file
    const filename = `openclique-waitlist-${new Date().toISOString().split("T")[0]}.csv`;

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[export-waitlist] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
