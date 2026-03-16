import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEMO_USER_ID, DEMO_MODE_COOKIE } from "@/lib/demo";
import {
  seedFilms,
  seedGear,
  seedTrips,
  seedTripFilms,
  seedTripGear,
  seedIds,
} from "@/lib/seed-data";

const isDemoEnv = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// Rate limiting: 1 reset per 60 seconds
let lastResetTime = 0;
const RATE_LIMIT_MS = 60_000;

export async function POST(request: NextRequest) {
  // Only allow reset in demo mode (global or route-based)
  const isDemoCookie = request.cookies.get(DEMO_MODE_COOKIE)?.value === "true";
  if (!isDemoEnv && !isDemoCookie) {
    return NextResponse.json(
      { error: "Reset is only available in demo mode" },
      { status: 403 }
    );
  }

  // Rate limiting check
  const now = Date.now();
  if (now - lastResetTime < RATE_LIMIT_MS) {
    const waitSeconds = Math.ceil(
      (RATE_LIMIT_MS - (now - lastResetTime)) / 1000
    );
    return NextResponse.json(
      { error: `Please wait ${waitSeconds}s before resetting again` },
      { status: 429 }
    );
  }
  lastResetTime = now;

  try {
    const supabase = createAdminClient();
    const timestamp = new Date().toISOString();

    // Delete existing demo data in correct order (respecting foreign keys)
    // Delete trip associations first
    await supabase.from("trip_gear").delete().in("trip_id", seedIds.trips);
    await supabase.from("trip_films").delete().in("trip_id", seedIds.trips);

    // Delete film usage
    await supabase.from("film_usage").delete().in("film_id", seedIds.films);

    // Delete main entities
    await supabase.from("trips").delete().eq("user_id", DEMO_USER_ID);
    await supabase.from("gear").delete().eq("user_id", DEMO_USER_ID);
    await supabase.from("films").delete().eq("user_id", DEMO_USER_ID);

    // Re-insert seed data

    // Films
    const { error: filmsError } = await supabase.from("films").insert(
      seedFilms.map((f) => ({
        ...f,
        created_at: timestamp,
        updated_at: timestamp,
      }))
    );
    if (filmsError) throw filmsError;

    // Gear - cameras first, then lenses (for camera_id FK)
    const cameras = seedGear.filter((g) => !g.camera_id);
    const lenses = seedGear.filter((g) => g.camera_id);

    const { error: camerasError } = await supabase.from("gear").insert(
      cameras.map((g) => ({
        ...g,
        created_at: timestamp,
        updated_at: timestamp,
      }))
    );
    if (camerasError) throw camerasError;

    const { error: lensesError } = await supabase.from("gear").insert(
      lenses.map((g) => ({
        ...g,
        created_at: timestamp,
        updated_at: timestamp,
      }))
    );
    if (lensesError) throw lensesError;

    // Trips
    const { error: tripsError } = await supabase.from("trips").insert(
      seedTrips.map((t) => ({
        ...t,
        created_at: timestamp,
        updated_at: timestamp,
      }))
    );
    if (tripsError) throw tripsError;

    // Trip-film reservations
    const { error: tripFilmsError } = await supabase
      .from("trip_films")
      .insert(seedTripFilms);
    if (tripFilmsError) throw tripFilmsError;

    // Trip-gear reservations
    const { error: tripGearError } = await supabase
      .from("trip_gear")
      .insert(seedTripGear);
    if (tripGearError) throw tripGearError;

    return NextResponse.json({
      success: true,
      message: "Demo data reset successfully",
      counts: {
        films: seedFilms.length,
        gear: seedGear.length,
        trips: seedTrips.length,
        tripFilms: seedTripFilms.length,
        tripGear: seedTripGear.length,
      },
    });
  } catch (error) {
    console.error("Reset demo error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reset failed" },
      { status: 500 }
    );
  }
}
