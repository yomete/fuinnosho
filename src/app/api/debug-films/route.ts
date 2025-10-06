import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get all completed trips with their films
    const { data: trips, error } = await supabase
      .from("trips")
      .select(`
        id,
        title,
        status,
        trip_films (
          quantity,
          film_id,
          films (
            id,
            name,
            brand,
            type
          )
        )
      `)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate film counts
    const filmCounts = new Map<string, { film: any; totalQuantity: number; trips: string[] }>();

    trips?.forEach((trip) => {
      trip.trip_films?.forEach((tf: any) => {
        if (tf.films) {
          const filmId = tf.films.id;
          const quantity = tf.quantity || 1;

          if (filmCounts.has(filmId)) {
            const existing = filmCounts.get(filmId)!;
            existing.totalQuantity += quantity;
            existing.trips.push(trip.title);
          } else {
            filmCounts.set(filmId, {
              film: tf.films,
              totalQuantity: quantity,
              trips: [trip.title],
            });
          }
        }
      });
    });

    return NextResponse.json({
      completedTrips: trips,
      filmAggregation: Array.from(filmCounts.values()),
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
