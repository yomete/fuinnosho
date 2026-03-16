/**
 * Seed script for demo mode
 * Run with: pnpm seed
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local since tsx doesn't support --env-file
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

import { createClient } from "@supabase/supabase-js";
import {
  seedFilms,
  seedGear,
  seedTrips,
  seedTripFilms,
  seedTripGear,
  seedIds,
} from "../src/lib/seed-data";
import { DEMO_USER_ID } from "../src/lib/demo";

async function seed() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Starting seed process...\n");
  console.log(`Demo User ID: ${DEMO_USER_ID}\n`);

  try {
    const timestamp = new Date().toISOString();

    // Ensure demo user exists in auth.users
    console.log("Ensuring demo user exists...");
    const { data: existingUser } = await supabase.auth.admin.getUserById(DEMO_USER_ID);
    if (!existingUser?.user) {
      const { error: createUserError } = await supabase.auth.admin.createUser({
        id: DEMO_USER_ID,
        email: "demo@fuinnosho.app",
        email_confirm: true,
        user_metadata: { name: "Demo User" },
      });
      if (createUserError) throw createUserError;
      console.log("  Created demo user");
    } else {
      console.log("  Demo user already exists");
    }

    // Clear existing demo data
    console.log("Clearing existing demo data...");

    await supabase.from("trip_gear").delete().in("trip_id", seedIds.trips);
    await supabase.from("trip_films").delete().in("trip_id", seedIds.trips);
    await supabase.from("film_usage").delete().in("film_id", seedIds.films);
    await supabase.from("trips").delete().in("id", seedIds.trips);
    await supabase.from("gear").delete().in("id", seedIds.gear);
    await supabase.from("films").delete().in("id", seedIds.films);
    // Also clean up by user_id in case of stale data
    await supabase.from("trips").delete().eq("user_id", DEMO_USER_ID);
    await supabase.from("gear").delete().eq("user_id", DEMO_USER_ID);
    await supabase.from("films").delete().eq("user_id", DEMO_USER_ID);

    console.log("  Done\n");

    // Insert films
    console.log("Inserting films...");
    const { error: filmsError } = await supabase.from("films").insert(
      seedFilms.map((f) => ({
        ...f,
        created_at: timestamp,
        updated_at: timestamp,
      }))
    );
    if (filmsError) throw filmsError;
    console.log(`  Inserted ${seedFilms.length} films`);

    // Insert gear (cameras first, then lenses with camera_id)
    console.log("Inserting gear...");
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
    console.log(`  Inserted ${seedGear.length} gear items`);

    // Insert trips
    console.log("Inserting trips...");
    const { error: tripsError } = await supabase.from("trips").insert(
      seedTrips.map((t) => ({
        ...t,
        created_at: timestamp,
        updated_at: timestamp,
      }))
    );
    if (tripsError) throw tripsError;
    console.log(`  Inserted ${seedTrips.length} trips`);

    // Insert trip-film reservations
    console.log("Inserting trip-film reservations...");
    const { error: tripFilmsError } = await supabase
      .from("trip_films")
      .insert(seedTripFilms);
    if (tripFilmsError) throw tripFilmsError;
    console.log(`  Inserted ${seedTripFilms.length} trip-film reservations`);

    // Insert trip-gear reservations
    console.log("Inserting trip-gear reservations...");
    const { error: tripGearError } = await supabase
      .from("trip_gear")
      .insert(seedTripGear);
    if (tripGearError) throw tripGearError;
    console.log(`  Inserted ${seedTripGear.length} trip-gear reservations`);

    console.log("\nSeed completed successfully!");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
