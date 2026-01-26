import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting - 5 requests per hour per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 5;

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }
  
  userLimit.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - userLimit.count };
}

// Input types
interface QuestBasics {
  title: string;
  short_description?: string;
  theme?: string;
  progression_tree?: string;
  tags?: string[];
  meeting_location_name?: string;
  city?: string;
  start_datetime?: string;
  duration_minutes?: number;
}

interface QuestConstraints {
  alcohol?: 'none' | 'optional' | 'primary';
  age_requirement?: 'all_ages' | '18_plus' | '21_plus';
  physical_intensity?: 'low' | 'medium' | 'high';
  social_intensity?: 'chill' | 'moderate' | 'high';
  noise_level?: 'quiet' | 'moderate' | 'loud';
  indoor_outdoor?: 'indoor' | 'outdoor' | 'mixed';
  budget_level?: 'free' | 'low' | 'medium' | 'high' | 'mixed';
}

interface GenerateRequest {
  quest_basics: QuestBasics;
  quest_constraints?: QuestConstraints;
}

// Build the AI prompt
function buildPrompt(basics: QuestBasics, constraints: QuestConstraints, existingTags: string[]): string {
  return `You are an AI assistant helping to generate quest draft content for OpenClique, a social adventure platform that brings strangers together for real-world experiences.

Your task is to generate engaging, welcoming content for a quest based on the provided basics and constraints. All outputs are DRAFT suggestions that the creator will review and can edit.

## Quest Basics
${JSON.stringify(basics, null, 2)}

## Quest Constraints (Hard Filters)
${JSON.stringify(constraints, null, 2)}

## Available Tags for Categorization
${JSON.stringify(existingTags, null, 2)}

## Instructions
Generate the following content:

1. **short_teaser** (2-3 sentences): A punchy hook that captures why this quest is exciting. Make people want to join.

2. **full_description** (3-5 paragraphs): Paint the full picture of the experience. What happens? What's the vibe? Why is it special? Use sensory details and emotional hooks.

3. **objectives** (4-8 items): Structured quest objectives with:
   - objective_text: What participants will do
   - objective_type: One of 'checkin', 'photo', 'qr', 'task', 'discussion', 'purchase_optional', 'travel'
   - proof_type: One of 'none', 'photo', 'qr', 'geo', 'text_confirmation'
   - completion_rule: One of 'all_members', 'majority', 'any_member', 'per_member'
   - is_required: boolean

4. **roles** (2-4 items): Suggested squad roles to help the group click:
   - role_name: One of 'Navigator', 'Timekeeper', 'Vibe Curator', 'Photographer', 'Connector', 'Wildcard'
   - role_description: Brief explanation of what this role does for this specific quest

5. **suggested_tags** (3-6): Tags from the available list that match this quest

6. **personality_affinities** (3-5 items): Personality traits that match well with this quest:
   - trait_key: A descriptive trait like 'novelty_seeker', 'social_butterfly', 'early_riser', 'creative_spirit'
   - trait_weight: 50-100 (how well this trait fits)
   - explanation: One sentence like "Works best for people who..." (user-facing)

## Rules
- Use warm, welcoming language that reduces social anxiety
- Never assume participant skill levels or backgrounds
- Objectives should be achievable but meaningful
- Match the tone to the quest type (chill for relaxed events, energetic for adventures)
- Consider the constraints when suggesting content
- For alcohol='none' quests, never mention drinking
- Be inclusive and accessible in language

## Output Format
Return a JSON object with this exact structure:
{
  "short_teaser": "string",
  "full_description": "string",
  "objectives": [
    {
      "objective_text": "string",
      "objective_type": "task",
      "proof_type": "none",
      "completion_rule": "all_members",
      "is_required": true
    }
  ],
  "roles": [
    {
      "role_name": "Navigator",
      "role_description": "string"
    }
  ],
  "suggested_tags": ["tag1", "tag2"],
  "personality_affinities": [
    {
      "trait_key": "string",
      "trait_weight": 75,
      "explanation": "Works best for people who..."
    }
  ],
  "summary": "Brief summary of the AI's approach to this quest"
}

Respond ONLY with valid JSON, no additional text.`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting
    const rateCheck = checkRateLimit(user.id);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded. Maximum 5 AI drafts per hour.",
          retry_after: RATE_LIMIT_WINDOW_MS / 1000
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": "0",
            "Retry-After": String(RATE_LIMIT_WINDOW_MS / 1000)
          } 
        }
      );
    }

    // Parse request
    const body: GenerateRequest = await req.json();
    const { quest_basics, quest_constraints = {} } = body;

    if (!quest_basics?.title) {
      return new Response(
        JSON.stringify({ error: "Quest title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch existing tags for suggestions
    const { data: existingTags } = await supabase
      .from("quest_tags")
      .select("slug")
      .eq("is_active", true);
    
    const tagSlugs = existingTags?.map(t => t.slug) || [];

    // Build prompt and call AI
    const prompt = buildPrompt(quest_basics, quest_constraints, tagSlugs);
    const modelUsed = "google/gemini-3-flash-preview";

    console.log(`[generate-quest-draft] Starting generation for user ${user.id}, title: ${quest_basics.title}`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelUsed,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily busy. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await aiResponse.json();
    const rawContent = aiResult.choices?.[0]?.message?.content;
    
    if (!rawContent) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "AI returned empty response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse AI output
    let parsedOutput;
    try {
      // Clean potential markdown code blocks
      const cleanedContent = rawContent
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      parsedOutput = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI output:", rawContent);
      return new Response(
        JSON.stringify({ error: "AI returned invalid format. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the inference
    const tokensUsed = aiResult.usage?.total_tokens || null;
    await supabase.from("ai_inference_log").insert({
      user_id: user.id,
      run_type: "quest_draft",
      source_id: null,
      input_snapshot: { quest_basics, quest_constraints },
      prompt_version: "v1.0.0",
      model_used: modelUsed,
      raw_output: parsedOutput,
      traits_suggested: parsedOutput.personality_affinities?.map((a: any) => a.trait_key) || [],
      decision_traces: { summary: parsedOutput.summary },
      tokens_used: tokensUsed,
    });

    console.log(`[generate-quest-draft] Successfully generated draft for user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        draft: {
          short_teaser: parsedOutput.short_teaser || "",
          full_description: parsedOutput.full_description || "",
          objectives: (parsedOutput.objectives || []).map((o: any, i: number) => ({
            ...o,
            objective_order: i + 1,
            ai_generated: true,
          })),
          roles: (parsedOutput.roles || []).map((r: any) => ({
            ...r,
            ai_generated: true,
          })),
          suggested_tags: parsedOutput.suggested_tags || [],
          personality_affinities: (parsedOutput.personality_affinities || []).map((a: any) => ({
            ...a,
            ai_generated: true,
          })),
        },
        rate_limit_remaining: rateCheck.remaining,
        ai_version: "v1.0.0",
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": String(rateCheck.remaining),
        } 
      }
    );

  } catch (error) {
    console.error("[generate-quest-draft] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
