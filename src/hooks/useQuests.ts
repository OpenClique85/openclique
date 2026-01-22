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
  rewards: string;
  progressionTree?: string;
  metadata: {
    date: string;
    cost: string;
    duration: string;
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
  const endStr = endDate.toLocaleDateString('en-US', options);
  
  // Same day
  if (startDate.toDateString() === endDate.toDateString()) {
    return startStr;
  }
  
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

// Transform database quest to UI quest format
const transformQuest = (dbQuest: DbQuest): Quest => {
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
    rewards: dbQuest.rewards || 'Memories & new friends',
    progressionTree: dbQuest.progression_tree || undefined,
    metadata: {
      date: formatDateRange(dbQuest.start_datetime, dbQuest.end_datetime),
      cost: dbQuest.cost_description || 'Free',
      duration: calculateDuration(dbQuest.start_datetime, dbQuest.end_datetime),
      squadSize: `${dbQuest.capacity_total || 6} people`,
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
  };
};

// Fetch quests from database
export function useQuests() {
  return useQuery({
    queryKey: ['quests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quests')
        .select('*')
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
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      
      return transformQuest(data);
    },
    enabled: !!slug,
  });
}

export type { DbQuest };
