/**
 * Eventbrite Search Edge Function
 * 
 * Uses Eventbrite's Destination Search API to find public events.
 * Supports keyword search, location (defaults to Austin, TX), and pagination.
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
  page?: number;
  page_size?: number;
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
      location = "Austin, TX",
      page = 1,
      page_size = 20,
    } = params;

    console.log("Searching Eventbrite with params:", { query, location, page });

    // Use the destination search endpoint (publicly accessible)
    const searchParams = new URLSearchParams();
    if (query) searchParams.append("q", query);
    searchParams.append("place", location);
    searchParams.append("page", page.toString());
    searchParams.append("page_size", Math.min(page_size, 50).toString());
    searchParams.append("dates", "current_future");
    searchParams.append("expand", "venue,organizer");

    const searchUrl = `https://www.eventbriteapi.com/v3/destination/search/?${searchParams.toString()}`;
    console.log("Eventbrite search URL:", searchUrl);

    const response = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${eventbriteToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Eventbrite API error:", response.status, errorText);
      
      // If destination search fails, try events endpoint with organizer scope
      // This is a fallback that returns the user's own events
      if (response.status === 404 || response.status === 403) {
        console.log("Falling back to user's organization events...");
        
        // First get the user's organizations
        const meResponse = await fetch("https://www.eventbriteapi.com/v3/users/me/organizations/", {
          headers: { Authorization: `Bearer ${eventbriteToken}` },
        });
        
        if (!meResponse.ok) {
          const meError = await meResponse.text();
          console.error("Failed to get organizations:", meError);
          return new Response(
            JSON.stringify({ 
              events: [], 
              pagination: { page: 1, page_size: 20, total_count: 0, has_more: false },
              message: "Unable to search Eventbrite. Please paste an event URL instead."
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const orgsData = await meResponse.json();
        const organizations = orgsData.organizations || [];
        
        if (organizations.length === 0) {
          return new Response(
            JSON.stringify({ 
              events: [], 
              pagination: { page: 1, page_size: 20, total_count: 0, has_more: false },
              message: "No organizations found. Please paste an event URL instead."
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Get events from the first organization
        const orgId = organizations[0].id;
        const eventsUrl = `https://www.eventbriteapi.com/v3/organizations/${orgId}/events/?status=live&expand=venue,organizer&page=${page}&page_size=${page_size}`;
        
        const eventsResponse = await fetch(eventsUrl, {
          headers: { Authorization: `Bearer ${eventbriteToken}` },
        });
        
        if (!eventsResponse.ok) {
          const eventsError = await eventsResponse.text();
          console.error("Failed to get events:", eventsError);
          return new Response(
            JSON.stringify({ 
              events: [], 
              pagination: { page: 1, page_size: 20, total_count: 0, has_more: false },
              message: "Unable to fetch events. Please paste an event URL instead."
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const eventsData = await eventsResponse.json();
        const normalizedEvents = (eventsData.events || []).map((event: any) => ({
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
              page: eventsData.pagination?.page_number || 1,
              page_size: eventsData.pagination?.page_size || page_size,
              total_count: eventsData.pagination?.object_count || normalizedEvents.length,
              has_more: eventsData.pagination?.has_more_items || false,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to search Eventbrite events", details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log(`Found ${data.events?.length || 0} events`);

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
