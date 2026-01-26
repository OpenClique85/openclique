/**
 * Eventbrite Search Hook
 * 
 * Provides search functionality for browsing public Eventbrite events.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EventbriteEventPreview {
  eventbrite_event_id: string;
  name: string;
  description: string;
  start_datetime: string | null;
  end_datetime: string | null;
  venue_name: string | null;
  venue_address: any;
  image_url: string | null;
  ticket_url: string;
  is_free: boolean;
  capacity: number | null;
  organizer_name: string | null;
}

interface SearchParams {
  query?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
}

interface SearchResult {
  events: EventbriteEventPreview[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    has_more: boolean;
  };
  message?: string;
  apiDeprecated?: boolean;
  organizationName?: string;
}

export function useEventbriteSearch(params: SearchParams = {}) {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    location: 'Austin',
    page: 1,
    ...params,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['eventbrite-search', searchParams],
    queryFn: async (): Promise<SearchResult> => {
      const { data, error } = await supabase.functions.invoke('eventbrite-search', {
        body: searchParams,
      });

      if (error) {
        console.error('Eventbrite search error:', error);
        throw new Error(error.message || 'Failed to search events');
      }

      return data as SearchResult;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const search = (newParams: Partial<SearchParams>) => {
    setSearchParams(prev => ({
      ...prev,
      ...newParams,
      page: newParams.query !== prev.query ? 1 : (newParams.page || prev.page),
    }));
  };

  const nextPage = () => {
    if (data?.pagination.has_more) {
      setSearchParams(prev => ({ ...prev, page: (prev.page || 1) + 1 }));
    }
  };

  const prevPage = () => {
    if ((searchParams.page || 1) > 1) {
      setSearchParams(prev => ({ ...prev, page: (prev.page || 1) - 1 }));
    }
  };

  return {
    events: data?.events || [],
    pagination: data?.pagination,
    isLoading,
    error,
    search,
    nextPage,
    prevPage,
    refetch,
    currentParams: searchParams,
    message: data?.message,
    apiDeprecated: data?.apiDeprecated,
    organizationName: data?.organizationName,
  };
}
