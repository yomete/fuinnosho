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
  { params }: { params: Promise<{ resource: string }> }
) {
  const { resource } = await params;

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

    // Build query with optional filters
    let query = supabase.from(tableName).select("*");

    // For films, exclude deleted ones by default
    if (resource === "films") {
      const includeDeleted = request.nextUrl.searchParams.get("include_deleted");
      if (includeDeleted !== "true") {
        query = query.is("deleted_at", null);
      }
    }

    // Add ordering
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      resource,
      data,
      count: data?.length || 0,
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
