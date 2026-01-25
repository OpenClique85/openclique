import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: Track requests per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 5; // Max 5 inferences per hour per user

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

// Prompt version for reproducibility
const PROMPT_VERSION = "v1.0.0";

// Build the AI prompt
function buildPrompt(traitLibrary: any[], preferences: any): string {
  const traitCatalog = traitLibrary.map(t => ({
    slug: t.slug,
    category: t.category,
    display_name: t.display_name,
    description: t.description,
  }));

  return `You are an AI assistant helping to generate personality trait suggestions for a social adventure platform called OpenClique.

Your task is to analyze the user's structured preferences and suggest traits that match their personality and social style. These are DRAFT suggestions that the user will review and accept or reject.

## Available Traits Catalog
${JSON.stringify(traitCatalog, null, 2)}

## User's Preferences
${JSON.stringify(preferences, null, 2)}

## Instructions
1. Analyze the user's preferences carefully
2. Select 5-8 traits from the catalog that best match their answers
3. For each trait, provide:
   - The exact slug from the catalog
   - A confidence score (0.0 to 1.0) based on how strongly the preference data supports this trait
   - A user-friendly explanation using tentative language ("Based on your preference for...")
   - A decision trace explaining your reasoning (for admin audit)

## Rules
- ONLY suggest traits that exist in the catalog above
- Use tentative, respectful language (never state identity as fact)
- Every suggestion MUST reference specific data from the user's preferences
- Do NOT suggest negative traits or make assumptions beyond the data
- Focus on social style, energy, and preferences - not personality judgments
- If a preference is missing or unclear, do not guess

## Output Format
Return a JSON object with this exact structure:
{
  "traits": [
    {
      "slug": "trait_slug_from_catalog",
      "confidence": 0.85,
      "explanation": "User-friendly explanation of why this trait fits.",
      "decision_trace": "Technical reasoning: User selected X which maps to Y..."
    }
  ],
  "summary": "Brief overall summary of the analysis approach"
}

Respond ONLY with valid JSON, no additional text.`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Parse request body
    const { user_id, run_type, source_id, admin_triggered_by } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!run_type || !['intake', 'post_quest', 'admin_rerun'].includes(run_type)) {
      return new Response(
        JSON.stringify({ error: 'run_type must be one of: intake, post_quest, admin_rerun' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting (bypass for admin reruns)
    if (run_type !== 'admin_rerun') {
      const rateCheck = checkRateLimit(user_id);
      if (!rateCheck.allowed) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Maximum 5 trait inferences per hour.',
            retry_after: RATE_LIMIT_WINDOW_MS / 1000
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'X-RateLimit-Remaining': '0',
              'Retry-After': String(RATE_LIMIT_WINDOW_MS / 1000)
            } 
          }
        );
      }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Fetch user's preferences from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, preferences')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const preferences = profile.preferences || {};
    
    // Check if there's enough preference data to analyze
    const hasPreferenceData = Object.keys(preferences).some(key => 
      key !== 'interest_tags' && preferences[key] && Object.keys(preferences[key]).length > 0
    );

    if (!hasPreferenceData) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient preference data',
          message: 'Please complete your profile preferences before generating trait suggestions.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Fetch active trait library
    const { data: traitLibrary, error: traitError } = await supabase
      .from('trait_library')
      .select('slug, category, display_name, description, emoji')
      .eq('is_active', true);

    if (traitError || !traitLibrary || traitLibrary.length === 0) {
      console.error('Trait library fetch error:', traitError);
      return new Response(
        JSON.stringify({ error: 'Trait library not available' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Build prompt and call Lovable AI
    const prompt = buildPrompt(traitLibrary, preferences);
    const modelUsed = "google/gemini-3-flash-preview";

    console.log(`[infer-traits] Starting inference for user ${user_id}, run_type: ${run_type}`);

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
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI service rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service credits exhausted.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content;
    const tokensUsed = aiData.usage?.total_tokens || null;

    if (!rawContent) {
      throw new Error('No content in AI response');
    }

    console.log(`[infer-traits] AI response received, tokens used: ${tokensUsed}`);

    // 4. Parse AI response
    let parsedOutput;
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = rawContent;
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      parsedOutput = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', rawContent);
      throw new Error('Failed to parse AI response as JSON');
    }

    // 5. Validate traits against library
    const validTraitSlugs = new Set(traitLibrary.map(t => t.slug));
    const validatedTraits = (parsedOutput.traits || []).filter((trait: any) => {
      if (!validTraitSlugs.has(trait.slug)) {
        console.warn(`[infer-traits] Ignoring unknown trait: ${trait.slug}`);
        return false;
      }
      return true;
    });

    console.log(`[infer-traits] Validated ${validatedTraits.length} traits`);

    // 6. Check for existing pending drafts and expire them
    await supabase
      .from('draft_traits')
      .update({ status: 'expired' })
      .eq('user_id', user_id)
      .eq('status', 'pending');

    // 7. Insert new draft traits
    const draftInserts = validatedTraits.map((trait: any) => ({
      user_id,
      trait_slug: trait.slug,
      source: run_type,
      source_id: source_id || null,
      confidence: Math.min(1, Math.max(0, parseFloat(trait.confidence) || 0.5)),
      explanation: trait.explanation || null,
      decision_trace: { 
        reasoning: trait.decision_trace,
        model: modelUsed,
        prompt_version: PROMPT_VERSION
      },
      status: 'pending',
      ai_model: modelUsed,
      ai_prompt_version: PROMPT_VERSION,
    }));

    if (draftInserts.length > 0) {
      const { error: insertError } = await supabase
        .from('draft_traits')
        .insert(draftInserts);

      if (insertError) {
        console.error('Draft traits insert error:', insertError);
        throw new Error('Failed to save draft traits');
      }
    }

    // 8. Log to ai_inference_log for audit
    const { error: logError } = await supabase
      .from('ai_inference_log')
      .insert({
        user_id,
        run_type,
        source_id: source_id || null,
        input_snapshot: {
          preferences,
          trait_library_count: traitLibrary.length,
        },
        prompt_version: PROMPT_VERSION,
        model_used: modelUsed,
        raw_output: parsedOutput,
        traits_suggested: validatedTraits.map((t: any) => t.slug),
        decision_traces: validatedTraits.reduce((acc: any, t: any) => {
          acc[t.slug] = t.decision_trace;
          return acc;
        }, {}),
        tokens_used: tokensUsed,
        admin_triggered_by: admin_triggered_by || null,
      });

    if (logError) {
      console.error('Audit log insert error:', logError);
      // Don't fail the request for logging errors
    }

    const duration = Date.now() - startTime;
    console.log(`[infer-traits] Completed in ${duration}ms, generated ${validatedTraits.length} drafts`);

    // 9. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        drafts_created: validatedTraits.length,
        traits: validatedTraits.map((t: any) => ({
          slug: t.slug,
          explanation: t.explanation,
          confidence: t.confidence,
        })),
        summary: parsedOutput.summary || null,
        tokens_used: tokensUsed,
        duration_ms: duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[infer-traits] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
