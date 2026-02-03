import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Bot response templates
const BOT_RESPONSES = {
  greeting: [
    "Hey! Excited to meet everyone! 👋",
    "Hello squad! Can't wait for this adventure!",
    "Hi all! First time doing something like this 😊",
    "Hey there! Super pumped to be here!",
  ],
  enthusiasm: [
    "This is going to be so much fun!",
    "I've been looking forward to this all week!",
    "Love the energy in this group already!",
    "So excited for this experience!",
  ],
  question: [
    "What should we bring?",
    "Anyone been to this location before?",
    "What time are we meeting exactly?",
    "Any tips for first-timers?",
  ],
  ready: [
    "I'm all set! See you there!",
    "Ready to go! 🎒",
    "Confirmed and excited!",
    "All prepared! Let's do this!",
  ],
  supportive: [
    "Great question! I was wondering the same.",
    "That's a good point!",
    "Sounds like a solid plan!",
    "I'm in! Whatever works for the group.",
  ],
  thoughtful: [
    "I think that could work well.",
    "Makes sense to me.",
    "Good idea, I'll keep that in mind.",
    "Agreed, let's go with that.",
  ],
  checkin: [
    "Just arrived! Looking around for the group.",
    "I'm here! Where is everyone?",
    "Made it! 🎉",
    "Checking in! See you all soon.",
  ],
  farewell: [
    "That was amazing! Thanks everyone!",
    "Had such a great time! Hope to see you all again!",
    "What a fun experience! 🙌",
    "Really enjoyed meeting everyone!",
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateReply(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  
  if (lower.includes('hi') || lower.includes('hey') || lower.includes('hello')) {
    return pickRandom(BOT_RESPONSES.greeting);
  }
  if (lower.includes('?')) {
    return pickRandom([...BOT_RESPONSES.supportive, ...BOT_RESPONSES.enthusiasm]);
  }
  if (lower.includes('ready') || lower.includes('confirm') || lower.includes('set')) {
    return pickRandom(BOT_RESPONSES.ready);
  }
  if (lower.includes('here') || lower.includes('arrived') || lower.includes('check')) {
    return pickRandom(BOT_RESPONSES.checkin);
  }
  if (lower.includes('bye') || lower.includes('thanks') || lower.includes('great')) {
    return pickRandom(BOT_RESPONSES.farewell);
  }
  
  // Default to enthusiasm or supportive
  return pickRandom([...BOT_RESPONSES.enthusiasm, ...BOT_RESPONSES.supportive, ...BOT_RESPONSES.thoughtful]);
}

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

    const { squadId, triggerMessage, botId } = await req.json();

    if (!squadId) {
      return new Response(
        JSON.stringify({ error: 'squadId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the squad is a simulation squad
    const { data: squad, error: squadError } = await supabase
      .from('quest_squads')
      .select('id, is_simulation')
      .eq('id', squadId)
      .single();

    if (squadError || !squad) {
      return new Response(
        JSON.stringify({ error: 'Squad not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!squad.is_simulation) {
      return new Response(
        JSON.stringify({ error: 'Not a simulation squad' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get bot members from the squad
    const { data: botMembers, error: membersError } = await supabase
      .from('squad_members')
      .select(`
        user_id,
        profiles!inner(id, display_name, is_synthetic)
      `)
      .eq('squad_id', squadId);

    if (membersError) {
      console.error('Failed to get members:', membersError);
      return new Response(
        JSON.stringify({ error: 'Failed to get squad members' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter to synthetic bots only
    const bots = botMembers?.filter(m => (m.profiles as any)?.is_synthetic === true) || [];

    if (bots.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No bots in this squad' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Select which bot(s) will reply
    const respondingBots = botId 
      ? bots.filter(b => b.user_id === botId)
      : [pickRandom(bots)]; // Random bot if not specified

    const replies: { botId: string; botName: string; message: string }[] = [];

    for (const bot of respondingBots) {
      const botProfile = bot.profiles as any;
      const message = generateReply(triggerMessage || '');

      // Insert the message
      const { error: insertError } = await supabase
        .from('squad_chat_messages')
        .insert({
          squad_id: squadId,
          sender_id: bot.user_id,
          content: message,
          sender_type: 'user',
        });

      if (insertError) {
        console.error(`Failed to insert message for bot ${botProfile?.display_name}:`, insertError);
        continue;
      }

      replies.push({
        botId: bot.user_id,
        botName: botProfile?.display_name || 'Bot',
        message,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        replies,
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
