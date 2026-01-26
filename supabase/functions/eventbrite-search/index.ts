/**
 * Eventbrite Search Edge Function
 * 
 * NOTE: Eventbrite deprecated their public Event Search API in December 2019.
 * This function now returns an informative message directing users to import events by URL.
 * 
 * The function can still fetch events from the user's own organization if they have
 * connected their Eventbrite account.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchParams {
  query?: string;
  location?: string;
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
    const { page = 1, page_size = 25 } = params;

    console.log("Eventbrite search requested - falling back to organization events");

    // Eventbrite deprecated their public search API in December 2019
    // We can only fetch events from the user's own organization
    // First, get user's organizations
    const meResponse = await fetch("https://www.eventbriteapi.com/v3/users/me/organizations/", {
      method: "GET",
      headers: { 
        Authorization: `Bearer ${eventbriteToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!meResponse.ok) {
      const meError = await meResponse.text();
      console.error("Failed to get organizations:", meResponse.status, meError.slice(0, 200));
      
      return new Response(
        JSON.stringify({ 
          events: [], 
          pagination: { page: 1, page_size: 25, total_count: 0, has_more: false },
          message: "Eventbrite's public event search API was deprecated in 2019. Please paste an event URL directly to import it.",
          apiDeprecated: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orgsData = await meResponse.json();
    const organizations = orgsData.organizations || [];
    console.log(`Found ${organizations.length} organizations`);

    if (organizations.length === 0) {
      return new Response(
        JSON.stringify({ 
          events: [], 
          pagination: { page: 1, page_size: 25, total_count: 0, has_more: false },
          message: "Eventbrite's public event search is not available. Use the 'Import by URL' tab to import any Eventbrite event.",
          apiDeprecated: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get events from the first organization (user's own events)
    const orgId = organizations[0].id;
    const orgName = organizations[0].name || "Your Organization";
    console.log(`Fetching events from organization: ${orgId} (${orgName})`);

    const eventsUrl = `https://www.eventbriteapi.com/v3/organizations/${orgId}/events/?status=live,started&expand=venue,organizer&page=${page}&page_size=${Math.min(page_size, 50)}`;
    
    const eventsResponse = await fetch(eventsUrl, {
      method: "GET",
      headers: { 
        Authorization: `Bearer ${eventbriteToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!eventsResponse.ok) {
      const eventsError = await eventsResponse.text();
      console.error("Failed to get organization events:", eventsResponse.status, eventsError.slice(0, 200));
      
      return new Response(
        JSON.stringify({ 
          events: [], 
          pagination: { page: 1, page_size: 25, total_count: 0, has_more: false },
          message: "Unable to fetch your organization's events. Use 'Import by URL' to add events.",
          apiDeprecated: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const eventsData = await eventsResponse.json();
    const eventCount = eventsData.events?.length || 0;
    console.log(`Found ${eventCount} events from organization`);

    // Normalize events for frontend
    const normalizedEvents = (eventsData.events || []).map((event: any) => ({
      eventbrite_event_id: event.id,
      name: event.name?.text || event.name?.html || "Untitled Event",
      description: event.description?.text?.slice(0, 300) || event.summary || "",
      start_datetime: event.start?.utc || null,
      end_datetime: event.end?.utc || null,
      venue_name: event.venue?.name || null,
      venue_address: event.venue?.address || null,
      image_url: event.logo?.original?.url || event.logo?.url || null,
      ticket_url: event.url,
      is_free: event.is_free || false,
      capacity: event.capacity || null,
      organizer_name: event.organizer?.name || orgName,
    }));

    return new Response(
      JSON.stringify({
        events: normalizedEvents,
        pagination: {
          page: eventsData.pagination?.page_number || page,
          page_size: eventsData.pagination?.page_size || page_size,
          total_count: eventsData.pagination?.object_count || eventCount,
          has_more: eventsData.pagination?.has_more_items || false,
        },
        organizationName: orgName,
        message: eventCount > 0 
          ? `Showing events from "${orgName}". For other events, use 'Import by URL'.`
          : `No active events in "${orgName}". Use 'Import by URL' to add any Eventbrite event.`,
        apiDeprecated: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in eventbrite-search:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ 
        error: message,
        events: [],
        pagination: { page: 1, page_size: 25, total_count: 0, has_more: false },
        apiDeprecated: true,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
