/**
 * Opt-in mobile write smoke test.
 * Run with:
 *   MOBILE_WRITE_SMOKE=1 MOBILE_SMOKE_EMAIL=user@example.com MOBILE_SMOKE_PASSWORD=... pnpm smoke:mobile:writes
 */

import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = resolve(process.cwd(), ".env.local");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex);
    const value = trimmed.slice(eqIndex + 1);
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
} catch {
  // .env.local not found — rely on environment variables
}

type FilmRow = {
  id: string;
  count: number | null;
  is_bulk_film: boolean | null;
  spooled_cassettes: number | null;
};

type TripFilmRow = {
  id: string;
  film_id: string;
  quantity: number;
};

type SmokeAccount = {
  email: string;
  password: string;
  createdUserId?: string;
};

type SmokeIds = {
  filmId?: string;
  gearId?: string;
  tripId?: string;
};

function fail(message: string): never {
  throw new Error(message);
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    fail(`Missing ${name}`);
  }
  return value;
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    fail(`${message}: expected ${expected}, got ${actual}`);
  }
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return "(configured account)";
  return `${name.slice(0, 2)}***@${domain}`;
}

async function resolveSmokeAccount(supabaseUrl: string): Promise<SmokeAccount> {
  const configuredEmail = process.env.MOBILE_SMOKE_EMAIL;
  const configuredPassword = process.env.MOBILE_SMOKE_PASSWORD;
  if (configuredEmail && configuredPassword) {
    return { email: configuredEmail, password: configuredPassword };
  }

  if (process.env.MOBILE_SMOKE_CREATE_USER !== "1") {
    fail("Missing MOBILE_SMOKE_EMAIL/MOBILE_SMOKE_PASSWORD");
  }

  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const suffix = randomUUID();
  const email = `mobile-smoke-${suffix}@example.com`;
  const password = `MobileSmoke-${suffix}!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { source: "fuinnosho-mobile-smoke" },
  });
  if (error) throw error;
  if (!data.user) fail("Supabase did not return a created smoke user");

  return { email, password, createdUserId: data.user.id };
}

async function cleanupSmokeRows(
  supabase: ReturnType<typeof createClient>,
  ids: SmokeIds,
  userId: string
) {
  if (ids.tripId) {
    await supabase.from("trip_gear").delete().eq("trip_id", ids.tripId);
    await supabase.from("trip_films").delete().eq("trip_id", ids.tripId);
    await supabase.from("film_usage").delete().eq("trip_id", ids.tripId);
    await supabase.from("trips").delete().eq("id", ids.tripId).eq("user_id", userId);
  }
  if (ids.gearId) {
    await supabase.from("gear").delete().eq("id", ids.gearId).eq("user_id", userId);
  }
  if (ids.filmId) {
    await supabase.from("film_usage").delete().eq("film_id", ids.filmId);
    await supabase.from("films").delete().eq("id", ids.filmId).eq("user_id", userId);
  }
}

async function assertSmokeRowsCleaned(
  supabase: ReturnType<typeof createClient>,
  ids: Required<SmokeIds>
) {
  const [film, gear, trip, tripFilms, tripGear, filmUsage] = await Promise.all([
    supabase.from("films").select("id").eq("id", ids.filmId),
    supabase.from("gear").select("id").eq("id", ids.gearId),
    supabase.from("trips").select("id").eq("id", ids.tripId),
    supabase.from("trip_films").select("id").eq("trip_id", ids.tripId),
    supabase.from("trip_gear").select("id").eq("trip_id", ids.tripId),
    supabase
      .from("film_usage")
      .select("id")
      .or(`film_id.eq.${ids.filmId},trip_id.eq.${ids.tripId}`),
  ]);

  for (const result of [film, gear, trip, tripFilms, tripGear, filmUsage]) {
    if (result.error) throw result.error;
  }

  const leftovers = {
    films: film.data?.length ?? 0,
    gear: gear.data?.length ?? 0,
    trips: trip.data?.length ?? 0,
    trip_films: tripFilms.data?.length ?? 0,
    trip_gear: tripGear.data?.length ?? 0,
    film_usage: filmUsage.data?.length ?? 0,
  };
  const total = Object.values(leftovers).reduce((sum, value) => sum + value, 0);
  if (total > 0) {
    fail(`mobile write smoke cleanup left rows behind: ${JSON.stringify(leftovers)}`);
  }

  console.log("Mobile write smoke cleanup verified");
}

async function main() {
  if (process.env.MOBILE_WRITE_SMOKE !== "1") {
    fail("Set MOBILE_WRITE_SMOKE=1 to run the write smoke test");
  }

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const smokeAccount = await resolveSmokeAccount(supabaseUrl);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: smokeAccount.email,
    password: smokeAccount.password,
  });
  if (authError) throw authError;
  const userId = authData.user.id;
  const suffix = randomUUID().slice(0, 8);
  const label = `iOS Smoke ${suffix}`;
  const filmName = `${label} Film`;
  const gearName = `${label} Gear`;
  const tripTitle = `${label} Trip`;

  let filmId: string | undefined;
  let gearId: string | undefined;
  let tripId: string | undefined;

  try {
    const { data: createdFilm, error: createFilmError } = await supabase
      .from("films")
      .insert({
        name: filmName,
        brand: "Mobile Smoke",
        iso: 400,
        format: "35mm",
        type: "Color Negative",
        expiration_date: "2030-01-01",
        price: 12.5,
        count: 3,
        notes: "created by mobile write smoke",
        editing_notes: "initial",
        is_ecn: false,
        is_bulk_film: false,
        user_id: userId,
      })
      .select("id, count, is_bulk_film, spooled_cassettes")
      .single<FilmRow>();
    if (createFilmError) throw createFilmError;
    filmId = createdFilm.id;

    const { data: listedFilm, error: listFilmError } = await supabase
      .from("films_with_availability")
      .select("id, name, available_count")
      .eq("id", filmId)
      .eq("user_id", userId)
      .single<{ id: string; name: string; available_count: number }>();
    if (listFilmError) throw listFilmError;
    assertEqual(listedFilm.name, filmName, "film list reflected create");
    assertEqual(listedFilm.available_count, 3, "film available count reflected create");

    const { error: updateFilmError } = await supabase
      .from("films")
      .update({ notes: "updated by mobile write smoke", editing_notes: "updated" })
      .eq("id", filmId)
      .eq("user_id", userId);
    if (updateFilmError) throw updateFilmError;

    const { data: createdGear, error: createGearError } = await supabase
      .from("gear")
      .insert({
        name: gearName,
        brand: "Mobile Smoke",
        type: "camera",
        model: "Smoke Body",
        condition: "good",
        notes: "created by mobile write smoke",
        user_id: userId,
      })
      .select("id, name")
      .single<{ id: string; name: string }>();
    if (createGearError) throw createGearError;
    gearId = createdGear.id;

    const { error: updateGearError } = await supabase
      .from("gear")
      .update({ notes: "updated by mobile write smoke" })
      .eq("id", gearId)
      .eq("user_id", userId);
    if (updateGearError) throw updateGearError;

    const { data: createdTrip, error: createTripError } = await supabase
      .from("trips")
      .insert({
        title: tripTitle,
        description: "created by mobile write smoke",
        start_date: "2030-02-01",
        end_date: "2030-02-03",
        status: "upcoming",
        user_id: userId,
      })
      .select("id, title")
      .single<{ id: string; title: string }>();
    if (createTripError) throw createTripError;
    tripId = createdTrip.id;

    const { error: updateTripError } = await supabase
      .from("trips")
      .update({ description: "updated by mobile write smoke" })
      .eq("id", tripId)
      .eq("user_id", userId);
    if (updateTripError) throw updateTripError;

    const { data: tripFilm, error: reserveFilmError } = await supabase
      .from("trip_films")
      .insert({ trip_id: tripId, film_id: filmId, quantity: 1 })
      .select("id, film_id, quantity")
      .single<TripFilmRow>();
    if (reserveFilmError) throw reserveFilmError;
    assertEqual(tripFilm.quantity, 1, "film reservation reflected create");

    const { error: updateReservationError } = await supabase
      .from("trip_films")
      .update({ quantity: 2 })
      .eq("trip_id", tripId)
      .eq("film_id", filmId);
    if (updateReservationError) throw updateReservationError;

    const { error: removeReservationError } = await supabase
      .from("trip_films")
      .delete()
      .eq("trip_id", tripId)
      .eq("film_id", filmId);
    if (removeReservationError) throw removeReservationError;

    const { error: reserveFilmAgainError } = await supabase
      .from("trip_films")
      .insert({ trip_id: tripId, film_id: filmId, quantity: 1 });
    if (reserveFilmAgainError) throw reserveFilmAgainError;

    const { error: reserveGearError } = await supabase
      .from("trip_gear")
      .insert({ trip_id: tripId, gear_id: gearId });
    if (reserveGearError) throw reserveGearError;

    const { error: removeGearError } = await supabase
      .from("trip_gear")
      .delete()
      .eq("trip_id", tripId)
      .eq("gear_id", gearId);
    if (removeGearError) throw removeGearError;

    const { error: reserveGearAgainError } = await supabase
      .from("trip_gear")
      .insert({ trip_id: tripId, gear_id: gearId });
    if (reserveGearAgainError) throw reserveGearAgainError;

    const [filmsListResult, gearListResult, tripsListResult] = await Promise.all([
      supabase
        .from("films_with_availability")
        .select("id, name, available_count")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("gear")
        .select("id, name, brand, type, condition")
        .eq("user_id", userId)
        .order("type", { ascending: true })
        .order("brand", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("trips")
        .select(
          `
          id,
          title,
          start_date,
          end_date,
          status,
          trip_films (
            quantity
          )
        `
        )
        .eq("user_id", userId)
        .order("start_date", { ascending: true }),
    ]);
    if (filmsListResult.error) throw filmsListResult.error;
    if (gearListResult.error) throw gearListResult.error;
    if (tripsListResult.error) throw tripsListResult.error;

    if (!filmsListResult.data?.some((film) => film.id === filmId)) {
      fail("mobile film list did not include created film");
    }
    if (!gearListResult.data?.some((gear) => gear.id === gearId)) {
      fail("mobile gear list did not include created gear");
    }
    if (!tripsListResult.data?.some((trip) => trip.id === tripId)) {
      fail("mobile trips list did not include created trip");
    }

    const { data: reservations, error: reservationsError } = await supabase
      .from("trip_films")
      .select("id, film_id, quantity")
      .eq("trip_id", tripId)
      .returns<TripFilmRow[]>();
    if (reservationsError) throw reservationsError;

    for (const reservation of reservations) {
      const { data: filmState, error: filmStateError } = await supabase
        .from("films")
        .select("id, count, is_bulk_film, spooled_cassettes")
        .eq("id", reservation.film_id)
        .eq("user_id", userId)
        .single<FilmRow>();
      if (filmStateError) throw filmStateError;

      const nextCount = Math.max(0, (filmState.count ?? 0) - reservation.quantity);
      const filmUpdate: { count: number; spooled_cassettes?: number } = {
        count: nextCount,
      };
      if (filmState.is_bulk_film === true) {
        filmUpdate.spooled_cassettes = Math.max(
          0,
          (filmState.spooled_cassettes ?? 0) - reservation.quantity
        );
      }

      const { error: reduceFilmError } = await supabase
        .from("films")
        .update(filmUpdate)
        .eq("id", reservation.film_id)
        .eq("user_id", userId);
      if (reduceFilmError) throw reduceFilmError;

      const { error: usageError } = await supabase.from("film_usage").insert({
        film_id: reservation.film_id,
        quantity: reservation.quantity,
        usage_note: `Trip: ${tripTitle} (completed)`,
        usage_type: "shoot",
        trip_id: tripId,
      });
      if (usageError) throw usageError;
    }

    const { error: completeTripError } = await supabase
      .from("trips")
      .update({ status: "completed" })
      .eq("id", tripId)
      .eq("user_id", userId);
    if (completeTripError) throw completeTripError;

    const { data: completedTrip, error: completedTripError } = await supabase
      .from("trips")
      .select("status")
      .eq("id", tripId)
      .eq("user_id", userId)
      .single<{ status: string }>();
    if (completedTripError) throw completedTripError;
    assertEqual(completedTrip.status, "completed", "trip status reflected completion");

    const { data: completedFilm, error: completedFilmError } = await supabase
      .from("films_with_availability")
      .select("count")
      .eq("id", filmId)
      .eq("user_id", userId)
      .single<{ count: number }>();
    if (completedFilmError) throw completedFilmError;
    assertEqual(completedFilm.count, 2, "film stock reflected trip completion");

    const { error: softDeleteFilmError } = await supabase
      .from("films")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", filmId)
      .eq("user_id", userId);
    if (softDeleteFilmError) throw softDeleteFilmError;

    console.log(`Mobile write smoke passed for ${maskEmail(smokeAccount.email)}`);
    console.log(`created film=${filmId} gear=${gearId} trip=${tripId}`);
  } finally {
    await cleanupSmokeRows(supabase, { filmId, gearId, tripId }, userId);
    if (filmId && gearId && tripId) {
      await assertSmokeRowsCleaned(supabase, { filmId, gearId, tripId });
    }
    await supabase.auth.signOut();
    if (smokeAccount.createdUserId) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey) {
        const admin = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        await admin.auth.admin.deleteUser(smokeAccount.createdUserId);
      }
    }
  }
}

main().catch((error) => {
  console.error("Mobile write smoke failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
