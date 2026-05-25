/**
 * Temporary Supabase account helper for manual iOS simulator UI acceptance.
 *
 * Run:
 *   pnpm fixture:mobile:ui create
 *   MOBILE_UI_EXPECT_FILM="UI Smoke Film" pnpm fixture:mobile:ui verify
 *   pnpm fixture:mobile:ui cleanup
 */

import { randomUUID } from "crypto";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const statePath = resolve(process.cwd(), process.env.MOBILE_UI_FIXTURE_FILE ?? ".mobile-ui-fixture.json");

try {
  const envContent = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
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

type FixtureState = {
  email: string;
  password: string;
  userId: string;
};

const seededFilmName = "Mobile UI Seed Film";
const seededGearName = "Mobile UI Seed Camera";
const seededTripTitle = "Mobile UI Seed Trip";

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

function adminClient() {
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function readState(): FixtureState {
  if (!existsSync(statePath)) {
    fail(`Missing ${statePath}. Run create first.`);
  }

  return JSON.parse(readFileSync(statePath, "utf-8")) as FixtureState;
}

async function createFixture() {
  if (existsSync(statePath)) {
    fail(`${statePath} already exists. Run cleanup before creating another fixture.`);
  }

  const suffix = randomUUID();
  const email = `mobile-ui-${suffix}@example.com`;
  const password = `MobileUi-${suffix}!`;
  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { source: "fuinnosho-mobile-ui-fixture" },
  });
  if (error) throw error;
  if (!data.user) fail("Supabase did not return a created fixture user");

  const admin = adminClient();
  const userId = data.user.id;

  const { error: filmError } = await admin.from("films").insert({
    name: seededFilmName,
    brand: "Fuinnosho",
    iso: 400,
    format: "35mm",
    type: "color",
    count: 1,
    user_id: userId,
  });
  if (filmError) throw filmError;

  const { error: gearError } = await admin.from("gear").insert({
    name: seededGearName,
    brand: "Fuinnosho",
    type: "camera",
    condition: "excellent",
    user_id: userId,
  });
  if (gearError) throw gearError;

  const { error: tripError } = await admin.from("trips").insert({
    title: seededTripTitle,
    description: "Temporary mobile UI fixture trip",
    start_date: "2026-06-01",
    end_date: "2026-06-03",
    status: "upcoming",
    user_id: userId,
  });
  if (tripError) throw tripError;

  const state = { email, password, userId };
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
  console.log("Mobile UI fixture created");
  console.log(`email=${email}`);
  console.log(`password=${password}`);
  console.log(`film=${seededFilmName}`);
  console.log(`gear=${seededGearName}`);
  console.log(`trip=${seededTripTitle}`);
  console.log(`state=${statePath}`);
}

async function verifyFixture() {
  const state = readState();
  const expectedFilm = process.env.MOBILE_UI_EXPECT_FILM ?? seededFilmName;
  const expectedGear = process.env.MOBILE_UI_EXPECT_GEAR ?? seededGearName;
  const expectedTrip = process.env.MOBILE_UI_EXPECT_TRIP ?? seededTripTitle;
  const admin = adminClient();

  if (expectedFilm) {
    const { data, error } = await admin
      .from("films")
      .select("id")
      .eq("user_id", state.userId)
      .eq("name", expectedFilm);
    if (error) throw error;
    if ((data?.length ?? 0) !== 1) fail(`Expected one UI-created film named ${expectedFilm}`);
  }

  if (expectedGear) {
    const { data, error } = await admin
      .from("gear")
      .select("id")
      .eq("user_id", state.userId)
      .eq("name", expectedGear);
    if (error) throw error;
    if ((data?.length ?? 0) !== 1) fail(`Expected one UI-created gear item named ${expectedGear}`);
  }

  if (expectedTrip) {
    const { data, error } = await admin
      .from("trips")
      .select("id")
      .eq("user_id", state.userId)
      .eq("title", expectedTrip);
    if (error) throw error;
    if ((data?.length ?? 0) !== 1) fail(`Expected one UI-created trip named ${expectedTrip}`);
  }

  console.log("Mobile UI fixture verification passed");
}

async function cleanupFixture() {
  const state = readState();
  const admin = adminClient();

  const [{ data: trips }, { data: films }] = await Promise.all([
    admin.from("trips").select("id").eq("user_id", state.userId),
    admin.from("films").select("id").eq("user_id", state.userId),
  ]);
  const tripIds = trips?.map((trip) => trip.id) ?? [];
  const filmIds = films?.map((film) => film.id) ?? [];

  for (const tripId of tripIds) {
    await admin.from("trip_gear").delete().eq("trip_id", tripId);
    await admin.from("trip_films").delete().eq("trip_id", tripId);
    await admin.from("film_usage").delete().eq("trip_id", tripId);
  }
  for (const filmId of filmIds) {
    await admin.from("film_usage").delete().eq("film_id", filmId);
  }

  await admin.from("trips").delete().eq("user_id", state.userId);
  await admin.from("gear").delete().eq("user_id", state.userId);
  await admin.from("films").delete().eq("user_id", state.userId);

  const [{ data: remainingFilms }, { data: remainingGear }, { data: remainingTrips }] = await Promise.all([
    admin.from("films").select("id").eq("user_id", state.userId),
    admin.from("gear").select("id").eq("user_id", state.userId),
    admin.from("trips").select("id").eq("user_id", state.userId),
  ]);
  const leftovers =
    (remainingFilms?.length ?? 0) + (remainingGear?.length ?? 0) + (remainingTrips?.length ?? 0);
  if (leftovers > 0) {
    fail(`Mobile UI fixture cleanup left ${leftovers} owned rows behind`);
  }

  const { error } = await admin.auth.admin.deleteUser(state.userId);
  if (error) throw error;

  unlinkSync(statePath);
  console.log("Mobile UI fixture cleaned");
}

async function main() {
  switch (process.argv[2]) {
    case "create":
      await createFixture();
      break;
    case "verify":
      await verifyFixture();
      break;
    case "cleanup":
      await cleanupFixture();
      break;
    default:
      fail("Usage: pnpm fixture:mobile:ui [create|verify|cleanup]");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
