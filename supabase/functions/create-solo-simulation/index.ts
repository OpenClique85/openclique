import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BotPersona {
  id: string;
  name: string;
  email: string;
  emoji: string;
  personality: string;
}

const BOT_PERSONAS: BotPersona[] = [
  {
    id: 'bot-luna',
    name: 'Luna Martinez',
    email: 'luna.bot@openclique.test',
    emoji: '🌙',
    personality: 'Enthusiastic first-timer',
  },
  {
    id: 'bot-max',
    name: 'Max Chen',
    email: 'max.bot@openclique.test',
    emoji: '⛰️',
    personality: 'Experienced adventurer',
  },
  {
    id: 'bot-riley',
    name: 'Riley Kim',
    email: 'riley.bot@openclique.test',
    emoji: '📚',
    personality: 'Quiet observer',
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin via user_roles table
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { botCount = 2 } = await req.json().catch(() => ({}));
    const selectedBots = BOT_PERSONAS.slice(0, Math.min(botCount, 3));

    console.log(`Creating solo simulation with ${selectedBots.length} bots for admin ${user.id}`);

    // Step 1: Ensure bot profiles exist
    const botProfiles: { id: string; name: string; isBot: true }[] = [];
    
    for (const bot of selectedBots) {
      // Check if bot profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('email', bot.email)
        .eq('is_synthetic', true)
        .single();

      if (existingProfile) {
        botProfiles.push({
          id: existingProfile.id,
          name: existingProfile.display_name || bot.name,
          isBot: true,
        });
        console.log(`Bot ${bot.name} already exists with id ${existingProfile.id}`);
      } else {
        // Create synthetic bot user in auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: bot.email,
          password: 'BotUser123!',
          email_confirm: true,
          user_metadata: {
            display_name: bot.name,
            is_synthetic: true,
          },
        });

        if (authError) {
          console.error(`Failed to create auth user for ${bot.name}:`, authError);
          continue;
        }

        // Update the profile to mark as synthetic
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            display_name: bot.name,
            email: bot.email,
            is_synthetic: true,
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error(`Failed to update profile for ${bot.name}:`, profileError);
        }

        botProfiles.push({
          id: authData.user.id,
          name: bot.name,
          isBot: true,
        });
        console.log(`Created bot ${bot.name} with id ${authData.user.id}`);
      }
    }

    // Step 2: Find or create a test quest
    let questId: string;
    let instanceId: string;

    // Look for an existing simulation test quest that's still active
    const { data: existingQuest } = await supabase
      .from('quests')
      .select('id')
      .eq('status', 'open')
      .ilike('slug', 'sim-test-%')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingQuest) {
      questId = existingQuest.id;
      console.log(`Using existing quest ${questId}`);
    } else {
      // Create a test quest with actual schema columns
      const { data: newQuest, error: questError } = await supabase
        .from('quests')
        .insert({
          title: '🧪 Solo Simulation Test Quest',
          slug: `sim-test-${Date.now()}`,
          short_description: 'A test quest for solo squad simulation',
          full_description: 'This is a simulation quest created for admin testing purposes.',
          status: 'open',
          start_datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          end_datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
          default_squad_size: 4,
          default_capacity: 10,
          meeting_location_name: 'Test Location',
          visibility: 'unlisted',
        })
        .select('id')
        .single();

      if (questError) {
        console.error('Failed to create quest:', questError);
        return new Response(
          JSON.stringify({ error: 'Failed to create test quest', details: questError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      questId = newQuest.id;
      console.log(`Created new quest ${questId}`);
    }

    // Step 3: Create quest instance
    const { data: instance, error: instanceError } = await supabase
      .from('quest_instances')
      .insert({
        quest_id: questId,
        instance_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'open',
        override_capacity: 10,
      })
      .select('id')
      .single();

    if (instanceError) {
      console.error('Failed to create instance:', instanceError);
      return new Response(
        JSON.stringify({ error: 'Failed to create quest instance', details: instanceError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    instanceId = instance.id;
    console.log(`Created instance ${instanceId}`);

    // Step 4: Create simulation squad
    const squadName = `Simulation Squad ${new Date().toLocaleDateString()}`;
    
    const { data: squad, error: squadError } = await supabase
      .from('quest_squads')
      .insert({
        quest_id: questId,
        instance_id: instanceId,
        name: squadName,
        status: 'forming',
        is_simulation: true,
      })
      .select('id, name')
      .single();

    if (squadError) {
      console.error('Failed to create squad:', squadError);
      return new Response(
        JSON.stringify({ error: 'Failed to create squad', details: squadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Created squad ${squad.id}: ${squad.name}`);

    // Step 5: Sign up all members (admin + bots) to the quest
    const allMembers = [
      { id: user.id, name: 'You', isBot: false },
      ...botProfiles,
    ];

    for (const member of allMembers) {
      // Create signup
      const { error: signupError } = await supabase
        .from('quest_signups')
        .upsert({
          quest_id: questId,
          instance_id: instanceId,
          user_id: member.id,
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,quest_id,instance_id',
        });

      if (signupError) {
        console.error(`Failed to create signup for ${member.name}:`, signupError);
      }

      // Add to squad
      const { error: memberError } = await supabase
        .from('squad_members')
        .upsert({
          squad_id: squad.id,
          user_id: member.id,
          role: member.id === user.id ? 'leader' : 'member',
          joined_at: new Date().toISOString(),
        }, {
          onConflict: 'squad_id,user_id',
        });

      if (memberError) {
        console.error(`Failed to add ${member.name} to squad:`, memberError);
      }
    }

    // Step 6: Send initial bot greeting messages
    for (const bot of botProfiles) {
      const greetings = [
        "Hey! Excited to meet everyone! 👋",
        "Hello squad! Can't wait for this adventure!",
        "Hi all! Looking forward to this! 😊",
      ];
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];

      await supabase
        .from('squad_chat_messages')
        .insert({
          squad_id: squad.id,
          sender_id: bot.id,
          content: greeting,
          sender_type: 'user',
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        squadId: squad.id,
        squadName: squad.name,
        instanceId,
        questId,
        members: allMembers.map(m => ({
          userId: m.id,
          name: m.name,
          isBot: m.isBot,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
