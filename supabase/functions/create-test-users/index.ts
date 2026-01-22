import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestUser {
  email: string;
  displayName: string;
  password: string;
}

const TEST_USERS: TestUser[] = [
  { email: "tester1@openclique.test", displayName: "Maya Chen", password: "TestUser123!" },
  { email: "tester2@openclique.test", displayName: "Jordan Rivera", password: "TestUser123!" },
  { email: "tester3@openclique.test", displayName: "Sam Thompson", password: "TestUser123!" },
  { email: "tester4@openclique.test", displayName: "Alex Kim", password: "TestUser123!" },
  { email: "tester5@openclique.test", displayName: "Casey Morgan", password: "TestUser123!" },
  { email: "tester6@openclique.test", displayName: "Riley Johnson", password: "TestUser123!" },
];

// Signup status distribution for testing different admin workflows
const SIGNUP_STATUSES = ["confirmed", "confirmed", "pending", "pending", "standby", "completed"];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the authorization header to verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the caller is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: isAdmin } = await supabaseAdmin.rpc("is_admin", { _user_id: user.id });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the demo quest
    const { data: demoQuest, error: questError } = await supabaseAdmin
      .from("quests")
      .select("id")
      .eq("slug", "demo-sunset-kayak-adventure")
      .maybeSingle();

    if (questError) {
      console.error("Error fetching demo quest:", questError);
      return new Response(
        JSON.stringify({ error: "Failed to find demo quest" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!demoQuest) {
      return new Response(
        JSON.stringify({ error: "Demo quest not found. Please create it first." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const createdUsers: { email: string; userId: string; status: string }[] = [];
    const errors: { email: string; error: string }[] = [];

    for (let i = 0; i < TEST_USERS.length; i++) {
      const testUser = TEST_USERS[i];
      const signupStatus = SIGNUP_STATUSES[i];

      try {
        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === testUser.email);

        let userId: string;

        if (existingUser) {
          console.log(`User ${testUser.email} already exists, skipping creation`);
          userId = existingUser.id;
        } else {
          // Create auth user with auto-confirmed email
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: testUser.email,
            password: testUser.password,
            email_confirm: true,
            user_metadata: {
              display_name: testUser.displayName,
            },
          });

          if (createError) {
            console.error(`Error creating user ${testUser.email}:`, createError);
            errors.push({ email: testUser.email, error: createError.message });
            continue;
          }

          userId = newUser.user.id;
          console.log(`Created user ${testUser.email} with ID ${userId}`);
        }

        // Upsert profile
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .upsert({
            id: userId,
            email: testUser.email,
            display_name: testUser.displayName,
          }, { onConflict: "id" });

        if (profileError) {
          console.error(`Error creating profile for ${testUser.email}:`, profileError);
          errors.push({ email: testUser.email, error: `Profile error: ${profileError.message}` });
          continue;
        }

        // Check for existing signup
        const { data: existingSignup } = await supabaseAdmin
          .from("quest_signups")
          .select("id")
          .eq("user_id", userId)
          .eq("quest_id", demoQuest.id)
          .maybeSingle();

        if (!existingSignup) {
          // Create quest signup with varied status
          const { error: signupError } = await supabaseAdmin
            .from("quest_signups")
            .insert({
              user_id: userId,
              quest_id: demoQuest.id,
              status: signupStatus,
            });

          if (signupError) {
            console.error(`Error creating signup for ${testUser.email}:`, signupError);
            errors.push({ email: testUser.email, error: `Signup error: ${signupError.message}` });
            continue;
          }
        } else {
          console.log(`Signup already exists for ${testUser.email}, updating status`);
          await supabaseAdmin
            .from("quest_signups")
            .update({ status: signupStatus })
            .eq("id", existingSignup.id);
        }

        createdUsers.push({
          email: testUser.email,
          userId: userId,
          status: signupStatus,
        });

      } catch (err) {
        console.error(`Unexpected error for ${testUser.email}:`, err);
        errors.push({ email: testUser.email, error: String(err) });
      }
    }

    console.log(`Successfully processed ${createdUsers.length} test users`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created/updated ${createdUsers.length} test users`,
        users: createdUsers,
        errors: errors.length > 0 ? errors : undefined,
        questId: demoQuest.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
