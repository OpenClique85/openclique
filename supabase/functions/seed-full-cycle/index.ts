import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_USERS = [
  { email: "cycle1@openclique.test", displayName: "Complete Clara", password: "TestUser123!" },
  { email: "cycle2@openclique.test", displayName: "Finished Frank", password: "TestUser123!" },
  { email: "cycle3@openclique.test", displayName: "Done Diana", password: "TestUser123!" },
  { email: "cycle4@openclique.test", displayName: "Success Sam", password: "TestUser123!" },
  { email: "cycle5@openclique.test", displayName: "Victory Val", password: "TestUser123!" },
  { email: "cycle6@openclique.test", displayName: "Winner Wade", password: "TestUser123!" },
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

    // Create a completed quest (happened yesterday)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    
    const { data: quest, error: questError } = await supabaseAdmin
      .from("quests")
      .insert({
        title: "Full Cycle: Completed Hiking Adventure",
        slug: `full-cycle-quest-${Date.now()}`,
        short_description: "Test scenario: Complete journey with squads, XP, and achievements",
        status: "published",
        published_at: new Date(pastDate.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        start_datetime: pastDate.toISOString(),
        end_datetime: new Date(pastDate.getTime() + 4 * 60 * 60 * 1000).toISOString(),
        capacity_total: 12,
        base_xp: 150,
        progression_tree: "connector",
        meeting_location_name: "Trailhead Park",
        meeting_address: "789 Nature Trail, Austin TX",
        tags: ["test", "full-cycle", "hiking"],
      })
      .select()
      .single();

    if (questError) {
      console.error("Quest creation error:", questError);
      return new Response(JSON.stringify({ error: questError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create two squads
    const { data: squad1 } = await supabaseAdmin
      .from("quest_squads")
      .insert({
        quest_id: quest.id,
        squad_name: "Trail Blazers",
        status: "active",
        confirmed_at: pastDate.toISOString(),
      })
      .select()
      .single();

    const { data: squad2 } = await supabaseAdmin
      .from("quest_squads")
      .insert({
        quest_id: quest.id,
        squad_name: "Summit Seekers",
        status: "active",
        confirmed_at: pastDate.toISOString(),
      })
      .select()
      .single();

    const results: { 
      email: string; 
      userId: string; 
      squad: string; 
      xpAwarded: number;
      treeXp: number;
    }[] = [];

    for (let i = 0; i < TEST_USERS.length; i++) {
      const testUser = TEST_USERS[i];
      const squad = i < 3 ? squad1 : squad2;

      try {
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

          if (createError) continue;
          userId = newUser.user.id;
        }

        await supabaseAdmin.from("profiles").upsert({
          id: userId,
          email: testUser.email,
          display_name: testUser.displayName,
        }, { onConflict: "id" });

        // Create completed signup
        const { data: signup } = await supabaseAdmin.from("quest_signups").insert({
          user_id: userId,
          quest_id: quest.id,
          status: "completed",
        }).select().single();

        // Add to squad
        if (signup && squad) {
          await supabaseAdmin.from("squad_members").insert({
            squad_id: squad.id,
            user_id: userId,
            signup_id: signup.id,
          });
        }

        // Award XP using the RPC function
        const { data: newXp } = await supabaseAdmin.rpc("award_quest_xp", {
          p_user_id: userId,
          p_quest_id: quest.id,
        });

        // Get tree XP
        const { data: treeXpData } = await supabaseAdmin
          .from("user_tree_xp")
          .select("tree_xp")
          .eq("user_id", userId)
          .eq("tree_id", "connector")
          .maybeSingle();

        results.push({
          email: testUser.email,
          userId,
          squad: squad?.squad_name || "none",
          xpAwarded: quest.base_xp,
          treeXp: treeXpData?.tree_xp || 0,
        });

        // Create feedback for some users
        if (i < 3) {
          await supabaseAdmin.from("feedback").insert({
            user_id: userId,
            quest_id: quest.id,
            rating_1_5: 5,
            would_do_again: true,
            feelings: ["excited", "connected", "energized"],
            best_part: "Meeting amazing people on the trail!",
          });
        }

      } catch (err) {
        console.error(`Error for ${testUser.email}:`, err);
      }
    }

    // Create a notification for each user
    for (const result of results) {
      await supabaseAdmin.from("notifications").insert({
        user_id: result.userId,
        type: "quest_reminder",
        title: "Quest Completed! 🎉",
        body: `You earned ${result.xpAwarded} XP from "${quest.title}"`,
        quest_id: quest.id,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      scenario: "full_cycle",
      quest: { id: quest.id, slug: quest.slug, title: quest.title, baseXp: quest.base_xp },
      squads: [
        { id: squad1?.id, name: squad1?.squad_name, members: 3 },
        { id: squad2?.id, name: squad2?.squad_name, members: 3 },
      ],
      results,
      feedbackCount: 3,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
