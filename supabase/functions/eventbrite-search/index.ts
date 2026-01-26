/**
 * Eventbrite Search Edge Function
 * 
 * Searches public Eventbrite events with support for:
 * - Keyword search
 * - Location (defaults to Austin, TX)
 * - Date range
 * - Category
 * - Pagination
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchParams {
  query?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  category_id?: string;
  page?: number;
  page_size?: number;
}

interface EventbriteEvent {
  id: string;
  name: { text: string };
  description?: { text: string };
  start: { utc: string; local: string };
  end: { utc: string; local: string };
  url: string;
  logo?: { original?: { url: string } };
  venue_id?: string;
  is_free: boolean;
  capacity?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const eventbriteToken = Deno.env.get("EVENTBRITE_PRIVATE_TOKEN");
    if (!eventbriteToken) {
      console.error("EVENTBRITE_PRIVATE_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "Eventbrite API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const params: SearchParams = await req.json();
    const {
      query = "",
      location = "Austin",
      start_date,
      end_date,
      category_id,
      page = 1,
      page_size = 20,
    } = params;

    console.log("Searching Eventbrite with params:", { query, location, start_date, end_date, page });

    // Build search URL
    const searchParams = new URLSearchParams();
    if (query) searchParams.append("q", query);
    searchParams.append("location.address", location);
    searchParams.append("location.within", "25mi");
    searchParams.append("page", page.toString());
    searchParams.append("page_size", Math.min(page_size, 50).toString());
    
    if (start_date) {
      searchParams.append("start_date.range_start", start_date);
    } else {
      // Default to events starting from now
      searchParams.append("start_date.range_start", new Date().toISOString().split('.')[0] + "Z");
    }
    
    if (end_date) {
      searchParams.append("start_date.range_end", end_date);
    }
    
    if (category_id) {
      searchParams.append("categories", category_id);
    }

    searchParams.append("expand", "venue,organizer");

    const searchUrl = `https://www.eventbriteapi.com/v3/events/search/?${searchParams.toString()}`;
    console.log("Eventbrite search URL:", searchUrl);

    const response = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${eventbriteToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Eventbrite API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to search Eventbrite events", details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log(`Found ${data.events?.length || 0} events, pagination:`, data.pagination);

    // Normalize events for frontend
    const normalizedEvents = (data.events || []).map((event: any) => ({
      eventbrite_event_id: event.id,
      name: event.name?.text || "Untitled Event",
      description: event.description?.text?.slice(0, 300) || "",
      start_datetime: event.start?.utc || null,
      end_datetime: event.end?.utc || null,
      venue_name: event.venue?.name || null,
      venue_address: event.venue?.address || null,
      image_url: event.logo?.original?.url || null,
      ticket_url: event.url,
      is_free: event.is_free || false,
      capacity: event.capacity || null,
      organizer_name: event.organizer?.name || null,
    }));

    return new Response(
      JSON.stringify({
        events: normalizedEvents,
        pagination: {
          page: data.pagination?.page_number || 1,
          page_size: data.pagination?.page_size || page_size,
          total_count: data.pagination?.object_count || 0,
          has_more: data.pagination?.has_more_items || false,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in eventbrite-search:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
