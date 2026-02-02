/**
 * =============================================================================
 * Delete Account Edge Function
 * Handles account deletion with feedback collection and confirmation email
 * =============================================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeletionFeedback {
  reasons: string[];
  other_reason?: string;
  feedback?: string;
  would_return?: 'yes' | 'maybe' | 'no';
  data_exported: boolean;
}

interface DeletionRequest {
  userId: string;
  userEmail: string;
  displayName?: string;
  feedback: DeletionFeedback;
}

// Import rate limiting
import { checkRateLimit, rateLimitResponse, RATE_LIMITS, sanitizeEmail, sanitizeString, sanitizeStringArray } from "../_shared/rate-limit.ts";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Rate limit account deletion attempts (prevent abuse)
    const rateCheck = checkRateLimit(user.id, RATE_LIMITS.ACCOUNT_OPS);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck, corsHeaders);
    }

    const body: DeletionRequest = await req.json();
    
    // Verify the request is for the authenticated user
    if (body.userId !== user.id) {
      throw new Error('Unauthorized: User ID mismatch');
    }

    // Sanitize feedback inputs
    if (body.feedback) {
      body.feedback.reasons = sanitizeStringArray(body.feedback.reasons, 10, 100);
      body.feedback.other_reason = sanitizeString(body.feedback.other_reason, 500) || undefined;
      body.feedback.feedback = sanitizeString(body.feedback.feedback, 2000) || undefined;
    }

    console.log(`Processing deletion request for user: ${user.id}`);

    // 1. Store feedback (anonymized)
    if (body.feedback) {
      const { error: feedbackError } = await supabase
        .from('account_deletion_feedback')
        .insert({
          user_email: body.userEmail,
          display_name: body.displayName,
          reasons: body.feedback.reasons || [],
          other_reason: body.feedback.other_reason,
          feedback: body.feedback.feedback,
          would_return: body.feedback.would_return === 'yes' ? true : 
                        body.feedback.would_return === 'no' ? false : null,
          data_exported: body.feedback.data_exported || false,
        });
      
      if (feedbackError) {
        console.error('Failed to store feedback:', feedbackError);
        // Continue with deletion even if feedback fails
      }
    }

    // 2. Create deletion request with 7-day grace period
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 7);

    const { error: requestError } = await supabase
      .from('account_deletion_requests')
      .insert({
        user_id: user.id,
        user_email: body.userEmail,
        status: 'pending',
        scheduled_at: scheduledAt.toISOString(),
      });

    if (requestError) {
      console.error('Failed to create deletion request:', requestError);
      throw new Error('Failed to schedule account deletion');
    }

    // 3. Send confirmation email
    try {
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'account_deleted',
          to: body.userEmail,
          variables: {
            display_name: body.displayName || 'there',
            data_exported: body.feedback?.data_exported ? 'true' : 'false',
            scheduled_date: scheduledAt.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
          },
        },
      });

      if (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the deletion if email fails
      }
    } catch (emailError) {
      console.error('Email service error:', emailError);
      // Continue without email
    }

    console.log(`Deletion scheduled for user: ${user.id} at ${scheduledAt.toISOString()}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        scheduled_at: scheduledAt.toISOString(),
        message: 'Account deletion scheduled. You have 7 days to cancel.' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Deletion error:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: message.includes('Unauthorized') ? 401 : 500,
      }
    );
  }
});
