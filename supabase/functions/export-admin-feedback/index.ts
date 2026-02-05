/**
 * =============================================================================
 * EXPORT ADMIN FEEDBACK - Edge Function
 * =============================================================================
 * 
 * Exports aggregated feedback and quest data for admin analysis.
 * Supports multiple scopes: per instance, per quest template, date range, per clique.
 * Formats: CSV (default), JSON
 * 
 * Requires admin role to access.
 * =============================================================================
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ExportRequest {
  scope: 'instance' | 'quest' | 'date_range' | 'clique' | 'all';
  instanceId?: string;
  questId?: string;
  squadId?: string;
  startDate?: string;
  endDate?: string;
  format?: 'csv' | 'json';
  includeTestimonials?: boolean;
  includePricing?: boolean;
}

interface FeedbackRow {
  id: string;
  quest_id: string;
  quest_title: string;
  instance_id: string | null;
  instance_title: string | null;
  user_id: string;
  display_name: string | null;
  rating_1_5: number | null;
  nps_score: number | null;
  belonging_delta: number | null;
  best_part: string | null;
  friction_point: string | null;
  would_do_again: boolean | null;
  would_invite_friend: boolean | null;
  testimonial_text: string | null;
  is_testimonial_approved: boolean | null;
  feelings: string[] | null;
  submitted_at: string;
  venue_interest_rating: number | null;
  venue_revisit_intent: string | null;
  interview_opt_in: boolean | null;
  squad_name: string | null;
}

interface QuestMetrics {
  total_signups: number;
  total_completed: number;
  total_feedback_submitted: number;
  avg_rating: number | null;
  avg_nps: number | null;
  avg_belonging_delta: number | null;
  would_do_again_pct: number | null;
  would_invite_friend_pct: number | null;
  completion_rate: number | null;
  feedback_rate: number | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid auth token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: ExportRequest = await req.json();
    const { 
      scope = 'all', 
      instanceId, 
      questId, 
      squadId,
      startDate, 
      endDate, 
      format = 'csv',
      includeTestimonials = true,
      includePricing = true,
    } = body;

    console.log(`Admin ${user.id} exporting feedback - scope: ${scope}, format: ${format}`);

    // Build the query based on scope
    let feedbackQuery = supabase
      .from('feedback')
      .select(`
        id,
        quest_id,
        user_id,
        rating_1_5,
        nps_score,
        belonging_delta,
        best_part,
        friction_point,
        would_do_again,
        would_invite_friend,
        testimonial_text,
        is_testimonial_approved,
        feelings,
        submitted_at,
        venue_interest_rating,
        venue_revisit_intent,
        interview_opt_in,
        quests!inner(title, slug)
      `);

    // Apply filters based on scope
    if (scope === 'instance' && instanceId) {
      // Get feedback for users who were in this instance
      const { data: instanceSignups } = await supabase
        .from('quest_signups')
        .select('user_id, quest_id')
        .eq('instance_id', instanceId);
      
      if (instanceSignups && instanceSignups.length > 0) {
        const userIds = instanceSignups.map(s => s.user_id);
        const questId = instanceSignups[0].quest_id;
        feedbackQuery = feedbackQuery
          .eq('quest_id', questId)
          .in('user_id', userIds);
      }
    } else if (scope === 'quest' && questId) {
      feedbackQuery = feedbackQuery.eq('quest_id', questId);
    } else if (scope === 'clique' && squadId) {
      // Get feedback for users in this squad
      const { data: squadMembers } = await supabase
        .from('squad_members')
        .select('user_id')
        .eq('squad_id', squadId);
      
      if (squadMembers && squadMembers.length > 0) {
        const userIds = squadMembers.map(s => s.user_id);
        feedbackQuery = feedbackQuery.in('user_id', userIds);
      }
    } else if (scope === 'date_range' && startDate && endDate) {
      feedbackQuery = feedbackQuery
        .gte('submitted_at', startDate)
        .lte('submitted_at', endDate);
    }

    // Execute query
    const { data: rawFeedback, error: feedbackError } = await feedbackQuery
      .order('submitted_at', { ascending: false });

    if (feedbackError) {
      console.error('Feedback query error:', feedbackError);
      throw new Error('Failed to fetch feedback data');
    }

    // Get user profiles for display names
    const userIds = [...new Set((rawFeedback || []).map((f: any) => f.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p.display_name]));

    // Get instance info if applicable
    let instanceMap = new Map<string, { title: string; squad_name: string | null }>();
    if (scope === 'instance' && instanceId) {
      const { data: instance } = await supabase
        .from('quest_instances')
        .select('id, scheduled_date')
        .eq('id', instanceId)
        .single();
      
      if (instance) {
        instanceMap.set(instanceId, { 
          title: `Instance ${instance.scheduled_date}`, 
          squad_name: null 
        });
      }
    }

    // Get pricing feedback if requested
    let pricingMap = new Map<string, any>();
    if (includePricing) {
      const feedbackIds = (rawFeedback || []).map((f: any) => f.id);
      if (feedbackIds.length > 0) {
        const { data: pricingData } = await supabase
          .from('feedback_pricing')
          .select('*')
          .in('feedback_id', feedbackIds);
        
        if (pricingData) {
          pricingData.forEach(p => pricingMap.set(p.feedback_id, p));
        }
      }
    }

    // Transform to export format
    const feedbackRows: FeedbackRow[] = (rawFeedback || []).map((f: any) => ({
      id: f.id,
      quest_id: f.quest_id,
      quest_title: f.quests?.title || 'Unknown Quest',
      instance_id: instanceId || null,
      instance_title: instanceMap.get(instanceId || '')?.title || null,
      user_id: f.user_id,
      display_name: profileMap.get(f.user_id) || 'Anonymous',
      rating_1_5: f.rating_1_5,
      nps_score: f.nps_score,
      belonging_delta: f.belonging_delta,
      best_part: f.best_part,
      friction_point: f.friction_point,
      would_do_again: f.would_do_again,
      would_invite_friend: f.would_invite_friend,
      testimonial_text: includeTestimonials ? f.testimonial_text : null,
      is_testimonial_approved: f.is_testimonial_approved,
      feelings: f.feelings,
      submitted_at: f.submitted_at,
      venue_interest_rating: f.venue_interest_rating,
      venue_revisit_intent: f.venue_revisit_intent,
      interview_opt_in: f.interview_opt_in,
      squad_name: instanceMap.get(instanceId || '')?.squad_name || null,
    }));

    // Calculate aggregate metrics
    const metrics: QuestMetrics = calculateMetrics(feedbackRows);

    // Get signup/completion stats
    let signupStats = { total_signups: 0, total_completed: 0 };
    if (scope === 'instance' && instanceId) {
      const { count: signupCount } = await supabase
        .from('quest_signups')
        .select('*', { count: 'exact', head: true })
        .eq('instance_id', instanceId);
      
      const { count: completedCount } = await supabase
        .from('quest_signups')
        .select('*', { count: 'exact', head: true })
        .eq('instance_id', instanceId)
        .eq('status', 'completed');
      
      signupStats = { 
        total_signups: signupCount || 0, 
        total_completed: completedCount || 0 
      };
    } else if (scope === 'quest' && questId) {
      const { count: signupCount } = await supabase
        .from('quest_signups')
        .select('*', { count: 'exact', head: true })
        .eq('quest_id', questId);
      
      const { count: completedCount } = await supabase
        .from('quest_signups')
        .select('*', { count: 'exact', head: true })
        .eq('quest_id', questId)
        .eq('status', 'completed');
      
      signupStats = { 
        total_signups: signupCount || 0, 
        total_completed: completedCount || 0 
      };
    }

    metrics.total_signups = signupStats.total_signups;
    metrics.total_completed = signupStats.total_completed;
    metrics.total_feedback_submitted = feedbackRows.length;
    metrics.completion_rate = signupStats.total_signups > 0 
      ? Math.round((signupStats.total_completed / signupStats.total_signups) * 100) 
      : null;
    metrics.feedback_rate = signupStats.total_completed > 0 
      ? Math.round((feedbackRows.length / signupStats.total_completed) * 100) 
      : null;

    // Log export for audit
    await supabase.from('admin_audit_log').insert({
      admin_user_id: user.id,
      action: 'export_feedback',
      target_table: 'feedback',
      target_id: instanceId || questId || squadId || null,
      new_values: {
        scope,
        format,
        row_count: feedbackRows.length,
        exported_at: new Date().toISOString(),
      },
    });

    if (format === 'json') {
      return new Response(JSON.stringify({
        metadata: {
          exported_at: new Date().toISOString(),
          scope,
          instance_id: instanceId,
          quest_id: questId,
          squad_id: squadId,
          row_count: feedbackRows.length,
        },
        metrics,
        feedback: feedbackRows,
        pricing: includePricing ? Object.fromEntries(pricingMap) : null,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate CSV
    const csv = generateCSV(feedbackRows, metrics, pricingMap, includePricing);
    
    return new Response(csv, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="feedback-export-${scope}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Export failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateMetrics(rows: FeedbackRow[]): QuestMetrics {
  if (rows.length === 0) {
    return {
      total_signups: 0,
      total_completed: 0,
      total_feedback_submitted: 0,
      avg_rating: null,
      avg_nps: null,
      avg_belonging_delta: null,
      would_do_again_pct: null,
      would_invite_friend_pct: null,
      completion_rate: null,
      feedback_rate: null,
    };
  }

  const ratings = rows.filter(r => r.rating_1_5 !== null).map(r => r.rating_1_5!);
  const npsScores = rows.filter(r => r.nps_score !== null).map(r => r.nps_score!);
  const belongingDeltas = rows.filter(r => r.belonging_delta !== null).map(r => r.belonging_delta!);
  const wouldDoAgain = rows.filter(r => r.would_do_again !== null);
  const wouldInvite = rows.filter(r => r.would_invite_friend !== null);

  return {
    total_signups: 0,
    total_completed: 0,
    total_feedback_submitted: rows.length,
    avg_rating: ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null,
    avg_nps: npsScores.length > 0 ? Math.round((npsScores.reduce((a, b) => a + b, 0) / npsScores.length) * 10) / 10 : null,
    avg_belonging_delta: belongingDeltas.length > 0 ? Math.round((belongingDeltas.reduce((a, b) => a + b, 0) / belongingDeltas.length) * 10) / 10 : null,
    would_do_again_pct: wouldDoAgain.length > 0 ? Math.round((wouldDoAgain.filter(r => r.would_do_again).length / wouldDoAgain.length) * 100) : null,
    would_invite_friend_pct: wouldInvite.length > 0 ? Math.round((wouldInvite.filter(r => r.would_invite_friend).length / wouldInvite.length) * 100) : null,
    completion_rate: null,
    feedback_rate: null,
  };
}

function generateCSV(
  rows: FeedbackRow[], 
  metrics: QuestMetrics, 
  pricingMap: Map<string, any>,
  includePricing: boolean
): string {
  const lines: string[] = [];

  // Summary section
  lines.push('FEEDBACK EXPORT SUMMARY');
  lines.push(`Generated,${new Date().toISOString()}`);
  lines.push(`Total Responses,${rows.length}`);
  lines.push(`Avg Rating (1-5),${metrics.avg_rating || 'N/A'}`);
  lines.push(`Avg NPS (0-10),${metrics.avg_nps || 'N/A'}`);
  lines.push(`Avg Belonging Delta,${metrics.avg_belonging_delta || 'N/A'}`);
  lines.push(`Would Do Again %,${metrics.would_do_again_pct || 'N/A'}%`);
  lines.push(`Would Invite Friend %,${metrics.would_invite_friend_pct || 'N/A'}%`);
  lines.push(`Completion Rate,${metrics.completion_rate || 'N/A'}%`);
  lines.push(`Feedback Rate,${metrics.feedback_rate || 'N/A'}%`);
  lines.push('');
  lines.push('');

  // Header row
  const headers = [
    'Submitted At',
    'Quest Title',
    'Display Name',
    'Rating (1-5)',
    'NPS (0-10)',
    'Belonging Delta',
    'Would Do Again',
    'Would Invite Friend',
    'Best Part',
    'Friction Point',
    'Feelings',
    'Venue Interest',
    'Venue Revisit Intent',
    'Interview Opt-In',
    'Testimonial',
    'Testimonial Approved',
  ];
  
  if (includePricing) {
    headers.push('Fair Price', 'Expensive Price', 'Pricing Model Preference', 'Value Drivers');
  }

  lines.push(headers.join(','));

  // Data rows
  for (const row of rows) {
    const pricing = pricingMap.get(row.id);
    const values = [
      row.submitted_at,
      escapeCSV(row.quest_title),
      escapeCSV(row.display_name || ''),
      row.rating_1_5 || '',
      row.nps_score || '',
      row.belonging_delta || '',
      row.would_do_again === null ? '' : row.would_do_again ? 'Yes' : 'No',
      row.would_invite_friend === null ? '' : row.would_invite_friend ? 'Yes' : 'No',
      escapeCSV(row.best_part || ''),
      escapeCSV(row.friction_point || ''),
      escapeCSV((row.feelings || []).join('; ')),
      row.venue_interest_rating || '',
      escapeCSV(row.venue_revisit_intent || ''),
      row.interview_opt_in === null ? '' : row.interview_opt_in ? 'Yes' : 'No',
      escapeCSV(row.testimonial_text || ''),
      row.is_testimonial_approved === null ? '' : row.is_testimonial_approved ? 'Yes' : 'No',
    ];

    if (includePricing && pricing) {
      values.push(
        escapeCSV(pricing.fair_price || ''),
        escapeCSV(pricing.expensive_price || ''),
        escapeCSV(pricing.pricing_model_preference || ''),
        escapeCSV((pricing.value_drivers || []).join('; '))
      );
    } else if (includePricing) {
      values.push('', '', '', '');
    }

    lines.push(values.join(','));
  }

  return lines.join('\n');
}

function escapeCSV(value: string): string {
  if (!value) return '';
  // Escape quotes and wrap in quotes if contains special characters
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
