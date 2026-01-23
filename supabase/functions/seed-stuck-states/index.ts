import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_USERS = [
  { email: "stuck1@openclique.test", displayName: "Stuck Pending Pat", password: "TestUser123!" },
  { email: "stuck2@openclique.test", displayName: "Orphan Owen", password: "TestUser123!" },
  { email: "stuck3@openclique.test", displayName: "Missing XP Max", password: "TestUser123!" },
  { email: "stuck4@openclique.test", displayName: "Standby Sally", password: "TestUser123!" },
  { email: "stuck5@openclique.test", displayName: "No Squad Nancy", password: "TestUser123!" },
  { email: "stuck6@openclique.test", displayName: "Expired Edgar", password: "TestUser123!" },
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

    // Create a quest that already ended (for stuck states)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3);
    
    const { data: pastQuest, error: pastQuestError } = await supabaseAdmin
      .from("quests")
      .insert({
        title: "Stuck States: Past Event for Testing",
        slug: `stuck-states-quest-${Date.now()}`,
        short_description: "Test scenario: Quest ended but signups still pending/confirmed",
        status: "published",
        published_at: new Date(pastDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        start_datetime: pastDate.toISOString(),
        end_datetime: new Date(pastDate.getTime() + 3 * 60 * 60 * 1000).toISOString(),
        capacity_total: 12,
        base_xp: 75,
        progression_tree: "wellness",
        meeting_location_name: "Stuck Test Location",
        meeting_address: "456 Stuck Street, Austin TX",
        tags: ["test", "stuck-states"],
      })
      .select()
      .single();

    if (pastQuestError) {
      console.error("Past quest creation error:", pastQuestError);
      return new Response(JSON.stringify({ error: pastQuestError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create an empty squad (orphan squad)
    const { data: emptySquad } = await supabaseAdmin
      .from("quest_squads")
      .insert({
        quest_id: pastQuest.id,
        squad_name: "Empty Ghost Squad",
        status: "forming",
      })
      .select()
      .single();

    const stuckStates: { email: string; userId: string; issue: string; details: string }[] = [];

    for (let i = 0; i < TEST_USERS.length; i++) {
      const testUser = TEST_USERS[i];

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

        let issue = "";
        let details = "";

        // Create different stuck states based on user index
        switch (i) {
          case 0: // Stuck in pending > 48h
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 5);
            await supabaseAdmin.from("quest_signups").insert({
              user_id: userId,
              quest_id: pastQuest.id,
              status: "pending",
              signed_up_at: oldDate.toISOString(),
            });
            issue = "pending_too_long";
            details = "Signup pending for 5+ days on ended quest";
            break;

          case 1: // Orphan - confirmed but quest ended, not completed
            await supabaseAdmin.from("quest_signups").insert({
              user_id: userId,
              quest_id: pastQuest.id,
              status: "confirmed",
            });
            issue = "confirmed_but_quest_ended";
            details = "Confirmed signup on quest that has already ended";
            break;

          case 2: // Completed but missing XP transaction
            await supabaseAdmin.from("quest_signups").insert({
              user_id: userId,
              quest_id: pastQuest.id,
              status: "completed",
            });
            // Intentionally NOT awarding XP
            issue = "completed_no_xp";
            details = "Status is completed but no xp_transaction exists";
            break;

          case 3: // Stuck on standby
            await supabaseAdmin.from("quest_signups").insert({
              user_id: userId,
              quest_id: pastQuest.id,
              status: "standby",
            });
            issue = "standby_quest_ended";
            details = "Still on standby after quest ended";
            break;

          case 4: // Confirmed but not in any squad
            await supabaseAdmin.from("quest_signups").insert({
              user_id: userId,
              quest_id: pastQuest.id,
              status: "confirmed",
            });
            // No squad_members entry
            issue = "confirmed_no_squad";
            details = "Confirmed but never assigned to a squad";
            break;

          case 5: // In a squad that's still "forming" after quest ended
            const { data: signup } = await supabaseAdmin.from("quest_signups").insert({
              user_id: userId,
              quest_id: pastQuest.id,
              status: "confirmed",
            }).select().single();
            
            if (signup && emptySquad) {
              await supabaseAdmin.from("squad_members").insert({
                squad_id: emptySquad.id,
                user_id: userId,
                signup_id: signup.id,
              });
            }
            issue = "squad_still_forming";
            details = "In a squad that never progressed past 'forming' status";
            break;
        }

        stuckStates.push({ email: testUser.email, userId, issue, details });
      } catch (err) {
        console.error(`Error for ${testUser.email}:`, err);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      scenario: "stuck_states",
      quest: { id: pastQuest.id, slug: pastQuest.slug, title: pastQuest.title },
      emptySquad: emptySquad ? { id: emptySquad.id, name: emptySquad.squad_name } : null,
      stuckStates,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
