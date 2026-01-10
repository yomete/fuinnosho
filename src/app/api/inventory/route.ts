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

export async function GET(request: NextRequest) {
  try {
    // Authenticate
    if (!authenticate(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Fetch all data in parallel
    const [
      filmsResult,
      gearResult,
      tripsResult,
      chemistryResult,
      recipesResult,
      developmentSessionsResult,
    ] = await Promise.all([
      supabase.from("films").select("*").is("deleted_at", null).order("created_at", { ascending: false }),
      supabase.from("gear").select("*").order("created_at", { ascending: false }),
      supabase.from("trips").select("*").order("created_at", { ascending: false }),
      supabase.from("chemistry_inventory").select("*").order("created_at", { ascending: false }),
      supabase.from("development_recipes").select("*").order("created_at", { ascending: false }),
      supabase.from("development_sessions").select("*").order("created_at", { ascending: false }),
    ]);

    // Check for errors
    if (filmsResult.error) throw filmsResult.error;
    if (gearResult.error) throw gearResult.error;
    if (tripsResult.error) throw tripsResult.error;
    if (chemistryResult.error) throw chemistryResult.error;
    if (recipesResult.error) throw recipesResult.error;
    if (developmentSessionsResult.error) throw developmentSessionsResult.error;

    return NextResponse.json({
      films: filmsResult.data,
      gear: gearResult.data,
      trips: tripsResult.data,
      chemistry: chemistryResult.data,
      recipes: recipesResult.data,
      development_sessions: developmentSessionsResult.data,
      metadata: {
        timestamp: new Date().toISOString(),
        counts: {
          films: filmsResult.data?.length || 0,
          gear: gearResult.data?.length || 0,
          trips: tripsResult.data?.length || 0,
          chemistry: chemistryResult.data?.length || 0,
          recipes: recipesResult.data?.length || 0,
          development_sessions: developmentSessionsResult.data?.length || 0,
        },
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
