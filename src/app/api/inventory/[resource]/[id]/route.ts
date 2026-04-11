import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// Authenticate request via query parameter
function authenticate(request: NextRequest): boolean {
  const apiKey = request.nextUrl.searchParams.get("key");
  const expectedKey = process.env.FILM_API_SECRET;

  if (!expectedKey) {
    console.error("FILM_API_SECRET not configured");
    return false;
  }

  return apiKey === expectedKey;
}

// Map resource names to database tables
const RESOURCE_MAP: Record<string, string> = {
  films: "films",
  gear: "gear",
  trips: "trips",
  "film-usage": "film_usage",
  "trip-films": "trip_films",
  "trip-gear": "trip_gear",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string; id: string }> }
) {
  const { resource, id } = await params;

  try {
    // Authenticate
    if (!authenticate(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const tableName = RESOURCE_MAP[resource];

    if (!tableName) {
      return NextResponse.json(
        {
          error: "Resource not found",
          available_resources: Object.keys(RESOURCE_MAP)
        },
        { status: 404 }
      );
    }

    const supabase = createAdminClient();

    // For films, get with related data
    if (resource === "films") {
      const includeRelated = request.nextUrl.searchParams.get("include_related");

      if (includeRelated === "true") {
        // Get film with usage history and trip reservations
        const [filmResult, usageResult, tripsResult] = await Promise.all([
          supabase.from("films").select("*").eq("id", id).is("deleted_at", null).single(),
          supabase.from("film_usage").select("*").eq("film_id", id).order("created_at", { ascending: false }),
          supabase.from("trip_films").select(`
            quantity,
            created_at,
            trips (
              id,
              title,
              description,
              start_date,
              end_date,
              status
            )
          `).eq("film_id", id),
        ]);

        if (filmResult.error) {
          if (filmResult.error.code === "PGRST116") {
            return NextResponse.json(
              { error: "Film not found" },
              { status: 404 }
            );
          }
          throw filmResult.error;
        }

        return NextResponse.json({
          resource,
          id,
          data: filmResult.data,
          usage_history: usageResult.data || [],
          trip_reservations: tripsResult.data || [],
          timestamp: new Date().toISOString(),
        });
      }
    }

    // For trips, get with reserved films and gear
    if (resource === "trips" && request.nextUrl.searchParams.get("include_related") === "true") {
      const [tripResult, filmsResult, gearResult] = await Promise.all([
        supabase.from("trips").select("*").eq("id", id).single(),
        supabase.from("trip_films").select(`
          quantity,
          created_at,
          films (*)
        `).eq("trip_id", id),
        supabase.from("trip_gear").select(`
          created_at,
          gear (*)
        `).eq("trip_id", id),
      ]);

      if (tripResult.error) {
        if (tripResult.error.code === "PGRST116") {
          return NextResponse.json(
            { error: "Trip not found" },
            { status: 404 }
          );
        }
        throw tripResult.error;
      }

      return NextResponse.json({
        resource,
        id,
        data: tripResult.data,
        reserved_films: filmsResult.data || [],
        reserved_gear: gearResult.data || [],
        timestamp: new Date().toISOString(),
      });
    }

    // Standard single item fetch
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: `${resource} not found` },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      resource,
      id,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
