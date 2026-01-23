import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_USERS = [
  { email: "happy1@openclique.test", displayName: "Olivia Martinez", password: "TestUser123!" },
  { email: "happy2@openclique.test", displayName: "Ethan Brooks", password: "TestUser123!" },
  { email: "happy3@openclique.test", displayName: "Sophia Chen", password: "TestUser123!" },
  { email: "happy4@openclique.test", displayName: "Liam Johnson", password: "TestUser123!" },
  { email: "happy5@openclique.test", displayName: "Ava Williams", password: "TestUser123!" },
  { email: "happy6@openclique.test", displayName: "Noah Davis", password: "TestUser123!" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: isAdmin } = await supabaseAdmin.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create happy path quest
    const questSlug = `happy-path-quest-${Date.now()}`;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    
    const { data: quest, error: questError } = await supabaseAdmin
      .from("quests")
      .insert({
        title: "Happy Path: Weekend Brunch & Museum",
        slug: questSlug,
        short_description: "Test scenario: A perfect journey from signup to completion",
        status: "published",
        published_at: new Date().toISOString(),
        start_datetime: startDate.toISOString(),
        end_datetime: new Date(startDate.getTime() + 4 * 60 * 60 * 1000).toISOString(),
        capacity_total: 12,
        base_xp: 100,
        progression_tree: "culture",
        meeting_location_name: "Test Café Downtown",
        meeting_address: "123 Test Street, Austin TX",
        tags: ["test", "happy-path", "brunch"],
      })
      .select()
      .single();

    if (questError) {
      console.error("Quest creation error:", questError);
      return new Response(JSON.stringify({ error: questError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Status distribution for happy path (all positive statuses)
    const statuses = ["confirmed", "confirmed", "confirmed", "confirmed", "pending", "pending"];
    const createdUsers: { email: string; userId: string; status: string }[] = [];

    for (let i = 0; i < TEST_USERS.length; i++) {
      const testUser = TEST_USERS[i];
      const status = statuses[i];

      try {
        // Check if user exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === testUser.email);
        
        let userId: string;

        if (existingUser) {
          userId = existingUser.id;
        } else {
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: testUser.email,
            password: testUser.password,
            email_confirm: true,
            user_metadata: { display_name: testUser.displayName },
          });

          if (createError) {
            console.error(`Error creating ${testUser.email}:`, createError);
            continue;
          }
          userId = newUser.user.id;
        }

        // Upsert profile
        await supabaseAdmin.from("profiles").upsert({
          id: userId,
          email: testUser.email,
          display_name: testUser.displayName,
        }, { onConflict: "id" });

        // Create signup
        const { data: existingSignup } = await supabaseAdmin
          .from("quest_signups")
          .select("id")
          .eq("user_id", userId)
          .eq("quest_id", quest.id)
          .maybeSingle();

        if (!existingSignup) {
          await supabaseAdmin.from("quest_signups").insert({
            user_id: userId,
            quest_id: quest.id,
            status: status,
          });
        }

        createdUsers.push({ email: testUser.email, userId, status });
      } catch (err) {
        console.error(`Error for ${testUser.email}:`, err);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      scenario: "happy_path",
      quest: { id: quest.id, slug: quest.slug, title: quest.title },
      users: createdUsers,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
