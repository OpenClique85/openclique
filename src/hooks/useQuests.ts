import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type DbQuest = Tables<'quests'>;

// Transform database quest to match expected UI format
export interface Quest {
  id: string;
  slug: string;
  title: string;
  icon: string;
  theme: string;
  themeColor: 'pink' | 'green' | 'amber' | 'purple';
  status: 'open' | 'closed' | 'coming-soon' | 'completed';
  statusLabel?: string;
  image: string;
  imageAlt: string;
  shortDescription: string;
  fullDescription?: string;
  rewards: string;
  progressionTree?: string;
  creatorId?: string;
  creatorType?: 'openclique' | 'community' | 'partner';
  creatorName?: string;
  creatorSocialUrl?: string;
  startDatetime?: string;
  endDatetime?: string;
  isSponsored?: boolean;
  sponsorId?: string;
  sponsorName?: string;
  isRepeatable?: boolean;
  metadata: {
    date: string;
    cost: string;
    duration: string;
    durationNotes?: string;
    squadSize: string;
  };
  sections?: Array<{
    title: string;
    type?: 'timeline' | 'list' | 'text';
    content: string | string[];
  }>;
  meetingLocation?: {
    name: string;
    address: string;
  };
  // Rich content from creator
  highlights?: string[];
  whatToBring?: string;
  dressCode?: string;
  physicalRequirements?: string;
  ageRestriction?: string;
  safetyNotes?: string;
  objectives?: string;
  successCriteria?: string;
}

// Map database status to UI status
const mapStatus = (dbStatus: DbQuest['status']): Quest['status'] => {
  switch (dbStatus) {
    case 'open':
      return 'open';
    case 'closed':
      return 'closed';
    case 'completed':
      return 'completed';
    default:
      return 'coming-soon';
  }
};

// Format date range for display
const formatDateRange = (start: string | null, end: string | null): string => {
  if (!start) return 'Date TBD';
  
  const startDate = new Date(start);
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  };
  
  const startStr = startDate.toLocaleDateString('en-US', options);
  
  if (!end) return startStr;
  
  const endDate = new Date(end);
  
  // Timezone-safe local date comparison using en-CA format (YYYY-MM-DD)
  const startLocalDate = startDate.toLocaleDateString('en-CA');
  const endLocalDate = endDate.toLocaleDateString('en-CA');
  
  // Same day
  if (startLocalDate === endLocalDate) {
    return startStr;
  }
  
  const endStr = endDate.toLocaleDateString('en-US', options);
  return `${startStr} - ${endStr}`;
};

// Calculate duration from dates
const calculateDuration = (start: string | null, end: string | null): string => {
  if (!start) return 'TBD';
  if (!end) return '~3 hours'; // Default assumption for single events
  
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  }
  
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  }
  
  const diffWeeks = Math.round(diffDays / 7);
  return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''}`;
};

// Get temporal status of a quest (upcoming, today, live, past)
export function getQuestTemporalStatus(quest: Quest): 'upcoming' | 'today' | 'live' | 'past' {
  if (!quest.startDatetime) return 'upcoming';
  
  const now = new Date();
  const startDate = new Date(quest.startDatetime);
  const endDate = quest.metadata?.duration ? null : null; // We don't have endDatetime in Quest type directly
  
  // Use timezone-safe local date comparison
  const todayStr = now.toLocaleDateString('en-CA');
  const startStr = startDate.toLocaleDateString('en-CA');
  
  // If start is in the past and quest is completed, it's past
  if (quest.status === 'completed') return 'past';
  
  // Check if quest started today
  if (startStr === todayStr) {
    // If it's started already, it's live
    if (now >= startDate) return 'live';
    return 'today';
  }
  
  // If start is in the future
  if (startDate > now) return 'upcoming';
  
  // Start is in the past but quest is still open/closed (ongoing)
  return 'live';
}

// Transform database quest to UI quest format
export const transformQuest = (dbQuest: DbQuest & { sponsor_profiles?: { name: string } | null }): Quest => {
  // Parse highlights from JSONB - could be string[] or {items: string[]}
  let highlights: string[] | undefined;
  if (dbQuest.highlights) {
    if (Array.isArray(dbQuest.highlights)) {
      highlights = dbQuest.highlights as string[];
    } else if (typeof dbQuest.highlights === 'object' && 'items' in (dbQuest.highlights as object)) {
      highlights = (dbQuest.highlights as { items: string[] }).items;
    }
  }

  return {
    id: dbQuest.id,
    slug: dbQuest.slug,
    title: dbQuest.title,
    icon: dbQuest.icon || '🎯',
    theme: dbQuest.theme || 'Adventure',
    themeColor: (dbQuest.theme_color as Quest['themeColor']) || 'pink',
    status: mapStatus(dbQuest.status),
    image: dbQuest.image_url || '/placeholder.svg',
    imageAlt: `${dbQuest.title} quest image`,
    shortDescription: dbQuest.short_description || 'An exciting quest awaits!',
    fullDescription: dbQuest.full_description || undefined,
    rewards: dbQuest.rewards || 'Memories & new friends',
    progressionTree: dbQuest.progression_tree || undefined,
    creatorId: dbQuest.creator_id || undefined,
    creatorType: (dbQuest as DbQuest & { creator_type?: string }).creator_type as Quest['creatorType'] || 'openclique',
    creatorName: (dbQuest as DbQuest & { creator_name?: string }).creator_name || undefined,
    creatorSocialUrl: (dbQuest as DbQuest & { creator_social_url?: string }).creator_social_url || undefined,
    startDatetime: dbQuest.start_datetime || undefined,
    endDatetime: dbQuest.end_datetime || undefined,
    isSponsored: dbQuest.is_sponsored || false,
    sponsorId: dbQuest.sponsor_id || undefined,
    sponsorName: dbQuest.sponsor_profiles?.name || undefined,
    isRepeatable: dbQuest.is_repeatable || false,
    metadata: {
      date: formatDateRange(dbQuest.start_datetime, dbQuest.end_datetime),
      cost: dbQuest.cost_description || 'Free',
      duration: calculateDuration(dbQuest.start_datetime, dbQuest.end_datetime),
      durationNotes: dbQuest.duration_notes || undefined,
      squadSize: dbQuest.default_squad_size 
        ? `${dbQuest.default_squad_size} people per clique`
        : `${dbQuest.capacity_total || 6} people`,
    },
    sections: dbQuest.briefing_html ? [
      {
        title: 'About This Quest',
        type: 'text' as const,
        content: dbQuest.briefing_html,
      }
    ] : undefined,
    meetingLocation: dbQuest.meeting_location_name ? {
      name: dbQuest.meeting_location_name,
      address: dbQuest.meeting_address || '',
    } : undefined,
    // Rich creator content
    highlights,
    whatToBring: dbQuest.what_to_bring || undefined,
    dressCode: dbQuest.dress_code || undefined,
    physicalRequirements: dbQuest.physical_requirements || undefined,
    ageRestriction: dbQuest.age_restriction || undefined,
    safetyNotes: dbQuest.safety_notes || undefined,
    objectives: dbQuest.objectives || undefined,
    successCriteria: dbQuest.success_criteria || undefined,
  };
};

// Fetch quests from database
export function useQuests() {
  return useQuery({
    queryKey: ['quests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quests')
        .select(`
          *,
          sponsor_profiles(name)
        `)
        .in('status', ['open', 'closed', 'completed'])
        .order('start_datetime', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(transformQuest);
    },
  });
}

// Fetch a single quest by slug
export function useQuest(slug: string | undefined) {
  return useQuery({
    queryKey: ['quest', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const { data, error } = await supabase
        .from('quests')
        .select(`
          *,
          sponsor_profiles(name)
        `)
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      
      return transformQuest(data);
    },
    enabled: !!slug,
  });
}

export type { DbQuest };
