/**
 * Generate Field Suggestion Edge Function
 * 
 * Uses Lovable AI to generate contextual suggestions for individual quest fields.
 * Supports: objectives, success_criteria, what_to_bring, dress_code, 
 * physical_requirements, safety_notes
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FieldSuggestionRequest {
  field_name: string;
  field_label: string;
  quest_context: {
    title: string;
    theme?: string;
    progression_tree?: string;
    short_description?: string;
    constraints_physical_intensity?: string;
    constraints_social_intensity?: string;
    constraints_indoor_outdoor?: string;
    constraints_age_requirement?: string;
  };
  current_value?: string;
}

// Field-specific prompts
const FIELD_PROMPTS: Record<string, string> = {
  objectives: `Generate 3-5 internal objectives for this quest. These are admin-only goals that help measure success.
Format as bullet points. Focus on:
- Connection goals (e.g., "Help participants make 2-3 genuine connections")
- Experience goals (e.g., "Create memorable, shareable moments")
- Learning goals (e.g., "Introduce people to local culture")`,

  success_criteria: `Generate 3-4 measurable success criteria for this quest. These help evaluate if the quest achieved its goals.
Format as bullet points. Examples:
- "80%+ of participants exchange contact info"
- "Average rating of 4.5+ stars"
- "At least 50% return for another quest within 30 days"`,

  what_to_bring: `Generate a practical packing list for participants. Consider the activity type, duration, and setting.
Format as bullet points. Include essentials like:
- Weather-appropriate items
- Activity-specific gear
- Comfort items
- Optional but recommended items`,

  dress_code: `Suggest an appropriate dress code. Be specific but friendly.
Examples: "Casual and comfortable", "Active wear for yoga", "Smart casual for rooftop event"
Keep it to 1-2 sentences.`,

  physical_requirements: `Describe the physical demands honestly so participants can self-select.
Include:
- Activity level (light walking, moderate hiking, etc.)
- Duration of physical activity
- Any accessibility considerations
Keep it to 2-3 sentences.`,

  safety_notes: `Generate relevant safety notes for this quest type. Consider:
- Environmental factors (weather, terrain)
- Health considerations (allergies, conditions)
- Accessibility information
- Any required waivers or acknowledgments
Format as bullet points.`,

  emergency_contact: `This field should be filled by the creator with their personal contact info.
Suggest a format like: "Your phone number (e.g., 512-555-0123) for day-of emergencies"`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { field_name, field_label, quest_context, current_value } = await req.json() as FieldSuggestionRequest;

    if (!field_name || !quest_context?.title) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: field_name and quest_context.title' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build the prompt
    const fieldPrompt = FIELD_PROMPTS[field_name] || `Generate appropriate content for the "${field_label}" field.`;
    
    const systemPrompt = `You are an assistant helping create social quests for OpenClique, a platform that helps people make real-world connections through structured group activities.

Your suggestions should be:
- Warm and inviting, not corporate
- Practical and actionable
- Appropriate for the quest type and audience
- Focused on safety and inclusion

Keep responses concise and formatted as requested.`;

    const userPrompt = `Quest Details:
- Title: ${quest_context.title}
- Theme: ${quest_context.theme || 'General social activity'}
- Category: ${quest_context.progression_tree || 'Social'}
- Description: ${quest_context.short_description || 'Not provided'}
- Physical Intensity: ${quest_context.constraints_physical_intensity || 'Medium'}
- Social Intensity: ${quest_context.constraints_social_intensity || 'Moderate'}
- Setting: ${quest_context.constraints_indoor_outdoor || 'Mixed'}
- Age Requirement: ${quest_context.constraints_age_requirement || 'All ages'}

${current_value ? `Current value (improve upon this):\n${current_value}\n\n` : ''}

Task: ${fieldPrompt}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content?.trim();

    if (!suggestion) {
      throw new Error('No suggestion generated');
    }

    return new Response(
      JSON.stringify({ 
        suggestion,
        field_name,
        generated_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Field suggestion error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
