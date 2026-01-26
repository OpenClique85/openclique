/**
 * Import Eventbrite Event Edge Function
 * 
 * Fetches event data from Eventbrite API and returns normalized data.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EventbriteEvent {
  id: string;
  name: { text: string };
  description?: { text: string };
  start: { utc: string; local: string };
  end: { utc: string; local: string };
  url: string;
  logo?: { original?: { url: string } };
  venue_id?: string;
  organizer_id?: string;
  is_free: boolean;
  capacity?: number;
}

interface EventbriteVenue {
  name: string;
  address: {
    address_1?: string;
    address_2?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
    localized_address_display?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventbrite_event_id } = await req.json();

    if (!eventbrite_event_id) {
      return new Response(
        JSON.stringify({ error: "eventbrite_event_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const eventbriteToken = Deno.env.get("EVENTBRITE_PRIVATE_TOKEN");
    if (!eventbriteToken) {
      return new Response(
        JSON.stringify({ error: "Eventbrite API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch event data
    const eventResponse = await fetch(
      `https://www.eventbriteapi.com/v3/events/${eventbrite_event_id}/`,
      {
        headers: {
          Authorization: `Bearer ${eventbriteToken}`,
        },
      }
    );

    if (!eventResponse.ok) {
      const errorText = await eventResponse.text();
      console.error("Eventbrite API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch event from Eventbrite" }),
        { status: eventResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const event: EventbriteEvent = await eventResponse.json();

    // Fetch venue if available
    let venue: EventbriteVenue | null = null;
    if (event.venue_id) {
      try {
        const venueResponse = await fetch(
          `https://www.eventbriteapi.com/v3/venues/${event.venue_id}/`,
          {
            headers: {
              Authorization: `Bearer ${eventbriteToken}`,
            },
          }
        );
        if (venueResponse.ok) {
          venue = await venueResponse.json();
        }
      } catch (e) {
        console.error("Failed to fetch venue:", e);
      }
    }

    // Fetch organizer name if available
    let organizerName: string | null = null;
    if (event.organizer_id) {
      try {
        const orgResponse = await fetch(
          `https://www.eventbriteapi.com/v3/organizers/${event.organizer_id}/`,
          {
            headers: {
              Authorization: `Bearer ${eventbriteToken}`,
            },
          }
        );
        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          organizerName = orgData.name;
        }
      } catch (e) {
        console.error("Failed to fetch organizer:", e);
      }
    }

    // Normalize response
    const normalizedEvent = {
      eventbrite_event_id: event.id,
      name: event.name?.text || "Untitled Event",
      description: event.description?.text || "",
      start_datetime: event.start?.utc || null,
      end_datetime: event.end?.utc || null,
      venue_name: venue?.name || null,
      venue_address: venue?.address || null,
      image_url: event.logo?.original?.url || null,
      ticket_url: event.url,
      is_free: event.is_free || false,
      capacity: event.capacity || null,
      organizer_name: organizerName,
    };

    return new Response(JSON.stringify(normalizedEvent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in import-eventbrite-event:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
