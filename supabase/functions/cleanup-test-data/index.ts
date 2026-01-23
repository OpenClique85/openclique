import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const stats = {
      usersDeleted: 0,
      profilesDeleted: 0,
      questsDeleted: 0,
      signupsDeleted: 0,
      squadsDeleted: 0,
      squadMembersDeleted: 0,
      feedbackDeleted: 0,
      xpTransactionsDeleted: 0,
      userXpDeleted: 0,
      userTreeXpDeleted: 0,
      notificationsDeleted: 0,
    };

    // Get all test user emails
    const testEmailPattern = "%@openclique.test";
    
    // Get test profiles
    const { data: testProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .like("email", testEmailPattern);

    const testUserIds = testProfiles?.map(p => p.id) || [];

    if (testUserIds.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No test data found to clean up",
        stats,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Delete in order to respect foreign keys

    // 1. Delete notifications
    const { count: notifCount } = await supabaseAdmin
      .from("notifications")
      .delete({ count: "exact" })
      .in("user_id", testUserIds);
    stats.notificationsDeleted = notifCount || 0;

    // 2. Delete feedback
    const { count: feedbackCount } = await supabaseAdmin
      .from("feedback")
      .delete({ count: "exact" })
      .in("user_id", testUserIds);
    stats.feedbackDeleted = feedbackCount || 0;

    // 3. Delete user tree XP
    const { count: treeXpCount } = await supabaseAdmin
      .from("user_tree_xp")
      .delete({ count: "exact" })
      .in("user_id", testUserIds);
    stats.userTreeXpDeleted = treeXpCount || 0;

    // 4. Delete XP transactions
    const { count: xpTxCount } = await supabaseAdmin
      .from("xp_transactions")
      .delete({ count: "exact" })
      .in("user_id", testUserIds);
    stats.xpTransactionsDeleted = xpTxCount || 0;

    // 5. Delete user XP
    const { count: userXpCount } = await supabaseAdmin
      .from("user_xp")
      .delete({ count: "exact" })
      .in("user_id", testUserIds);
    stats.userXpDeleted = userXpCount || 0;

    // 6. Delete squad members
    const { count: squadMemberCount } = await supabaseAdmin
      .from("squad_members")
      .delete({ count: "exact" })
      .in("user_id", testUserIds);
    stats.squadMembersDeleted = squadMemberCount || 0;

    // 7. Get and delete signups (need quest IDs for later)
    const { data: testSignups } = await supabaseAdmin
      .from("quest_signups")
      .select("id, quest_id")
      .in("user_id", testUserIds);

    const testQuestIds = [...new Set(testSignups?.map(s => s.quest_id) || [])];

    const { count: signupCount } = await supabaseAdmin
      .from("quest_signups")
      .delete({ count: "exact" })
      .in("user_id", testUserIds);
    stats.signupsDeleted = signupCount || 0;

    // 8. Delete empty squads from test quests
    if (testQuestIds.length > 0) {
      // First check which squads are now empty
      const { data: testSquads } = await supabaseAdmin
        .from("quest_squads")
        .select("id")
        .in("quest_id", testQuestIds);

      for (const squad of testSquads || []) {
        const { count: memberCount } = await supabaseAdmin
          .from("squad_members")
          .select("*", { count: "exact", head: true })
          .eq("squad_id", squad.id);

        if (memberCount === 0) {
          await supabaseAdmin.from("quest_squads").delete().eq("id", squad.id);
          stats.squadsDeleted++;
        }
      }

      // 9. Delete test quests (only ones with test-related slugs or no remaining signups)
      const testQuestPatterns = ["happy-path-quest-%", "stuck-states-quest-%", "full-cycle-quest-%", "demo-sunset-kayak-%"];
      
      for (const pattern of testQuestPatterns) {
        const { count: questCount } = await supabaseAdmin
          .from("quests")
          .delete({ count: "exact" })
          .like("slug", pattern);
        stats.questsDeleted += questCount || 0;
      }
    }

    // 10. Delete profiles
    const { count: profileCount } = await supabaseAdmin
      .from("profiles")
      .delete({ count: "exact" })
      .in("id", testUserIds);
    stats.profilesDeleted = profileCount || 0;

    // 11. Delete auth users
    for (const userId of testUserIds) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        stats.usersDeleted++;
      } catch (err) {
        console.error(`Failed to delete auth user ${userId}:`, err);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Cleaned up ${stats.usersDeleted} test users and related data`,
      stats,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
