/**
 * Read-only mobile contract probe.
 * Run with:
 *   MOBILE_PROBE_EMAIL=user@example.com pnpm probe:mobile
 *   MOBILE_PROBE_USER_ID=<auth-user-id> pnpm probe:mobile
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const gearTypes = new Set([
  "camera",
  "lens",
  "flash",
  "accessory",
  "tripod",
  "filter",
  "bag",
]);
const gearConditions = new Set(["excellent", "good", "fair", "poor"]);
const tripStatuses = new Set(["upcoming", "ongoing", "past", "completed"]);

function fail(message: string): never {
  throw new Error(message);
}

function assertString(value: unknown, label: string) {
  if (typeof value !== "string" || value.length === 0) {
    fail(`${label} must be a non-empty string`);
  }
}

function assertOptionalString(value: unknown, label: string) {
  if (value !== null && value !== undefined && typeof value !== "string") {
    fail(`${label} must be a string when present`);
  }
}

function assertUuid(value: unknown, label: string) {
  if (typeof value !== "string" || !uuidPattern.test(value)) {
    fail(`${label} must be a UUID`);
  }
}

function assertOptionalUuid(value: unknown, label: string) {
  if (value !== null && value !== undefined) {
    assertUuid(value, label);
  }
}

function assertNumberLike(value: unknown, label: string) {
  if (value === null || value === undefined) return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (typeof value === "string" && value.length > 0 && Number.isFinite(Number(value))) return;
  fail(`${label} must be numeric when present`);
}

function assertIntegerLike(value: unknown, label: string) {
  if (value === null || value === undefined) return;
  if (typeof value === "number" && Number.isInteger(value)) return;
  fail(`${label} must be an integer when present`);
}

function assertDateString(value: unknown, label: string) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(value)) {
    fail(`${label} must be a date-like string`);
  }
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return "(unknown)";
  return `${name.slice(0, 2)}***@${domain}`;
}

async function resolveUserId(
  supabase: SupabaseClient,
  userId: string | undefined,
  email: string | undefined
) {
  if (userId) {
    assertUuid(userId, "MOBILE_PROBE_USER_ID");
    return { id: userId, label: userId };
  }

  if (!email) {
    fail("Set MOBILE_PROBE_USER_ID or MOBILE_PROBE_EMAIL before running this probe");
  }

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;

    const user = data.users.find((candidate) => candidate.email === email);
    if (user) {
      return { id: user.id, label: maskEmail(email) };
    }

    if (data.users.length < 100) break;
  }

  fail(`No Supabase auth user found for ${maskEmail(email)}`);
}

function checkFilm(row: Record<string, unknown>, index: number) {
  const prefix = `films_with_availability[${index}]`;
  assertUuid(row.id, `${prefix}.id`);
  assertString(row.name, `${prefix}.name`);
  assertString(row.brand, `${prefix}.brand`);
  assertIntegerLike(row.iso, `${prefix}.iso`);
  assertString(row.format, `${prefix}.format`);
  assertString(row.type, `${prefix}.type`);
  assertOptionalString(row.expiration_date, `${prefix}.expiration_date`);
  assertOptionalString(row.created_at, `${prefix}.created_at`);
  assertOptionalString(row.updated_at, `${prefix}.updated_at`);
  assertOptionalUuid(row.user_id, `${prefix}.user_id`);
  assertNumberLike(row.price, `${prefix}.price`);
  assertIntegerLike(row.count, `${prefix}.count`);
  assertOptionalString(row.notes, `${prefix}.notes`);
  assertOptionalString(row.editing_notes, `${prefix}.editing_notes`);
  assertNumberLike(row.bulk_length_meters, `${prefix}.bulk_length_meters`);
  assertIntegerLike(row.bulk_quantity, `${prefix}.bulk_quantity`);
  assertIntegerLike(row.bulk_rolls_used, `${prefix}.bulk_rolls_used`);
  assertIntegerLike(row.calculated_rolls, `${prefix}.calculated_rolls`);
  assertIntegerLike(row.bulk_remaining_exposures, `${prefix}.bulk_remaining_exposures`);
  assertIntegerLike(row.spooled_cassettes, `${prefix}.spooled_cassettes`);
  assertIntegerLike(row.total_count, `${prefix}.total_count`);
  assertIntegerLike(row.reserved_quantity, `${prefix}.reserved_quantity`);
  assertIntegerLike(row.available_count, `${prefix}.available_count`);
}

function checkGear(row: Record<string, unknown>, index: number) {
  const prefix = `gear[${index}]`;
  assertUuid(row.id, `${prefix}.id`);
  assertString(row.name, `${prefix}.name`);
  assertString(row.brand, `${prefix}.brand`);
  if (typeof row.type !== "string" || !gearTypes.has(row.type)) {
    fail(`${prefix}.type has unsupported value`);
  }
  if (typeof row.condition !== "string" || !gearConditions.has(row.condition)) {
    fail(`${prefix}.condition has unsupported value`);
  }
  assertOptionalString(row.model, `${prefix}.model`);
  assertOptionalString(row.serial_number, `${prefix}.serial_number`);
  assertOptionalString(row.purchase_date, `${prefix}.purchase_date`);
  assertNumberLike(row.purchase_price, `${prefix}.purchase_price`);
  assertOptionalString(row.notes, `${prefix}.notes`);
  assertOptionalUuid(row.camera_id, `${prefix}.camera_id`);
  assertOptionalString(row.created_at, `${prefix}.created_at`);
  assertOptionalString(row.updated_at, `${prefix}.updated_at`);
  assertOptionalUuid(row.user_id, `${prefix}.user_id`);

  if (row.camera_id && row.type !== "lens") {
    fail(`${prefix}.camera_id is only valid for lenses`);
  }
}

function checkTrip(row: Record<string, unknown>, index: number) {
  const prefix = `trips[${index}]`;
  assertUuid(row.id, `${prefix}.id`);
  assertString(row.title, `${prefix}.title`);
  assertOptionalString(row.description, `${prefix}.description`);
  assertDateString(row.start_date, `${prefix}.start_date`);
  assertDateString(row.end_date, `${prefix}.end_date`);
  if (row.status !== null && row.status !== undefined) {
    if (typeof row.status !== "string" || !tripStatuses.has(row.status)) {
      fail(`${prefix}.status has unsupported value`);
    }
  }
  assertOptionalString(row.created_at, `${prefix}.created_at`);
  assertOptionalString(row.updated_at, `${prefix}.updated_at`);
  assertUuid(row.user_id, `${prefix}.user_id`);

  if (!Array.isArray(row.trip_films)) {
    fail(`${prefix}.trip_films must be an array`);
  }

  row.trip_films.forEach((reservation, reservationIndex) => {
    if (!reservation || typeof reservation !== "object") {
      fail(`${prefix}.trip_films[${reservationIndex}] must be an object`);
    }
    assertIntegerLike(
      (reservation as Record<string, unknown>).quantity,
      `${prefix}.trip_films[${reservationIndex}].quantity`
    );
  });
}

function checkReservedFilm(row: Record<string, unknown>, label: string) {
  assertUuid(row.id, `${label}.id`);
  assertString(row.name, `${label}.name`);
  assertString(row.brand, `${label}.brand`);
  assertIntegerLike(row.iso, `${label}.iso`);
  assertString(row.format, `${label}.format`);
  assertString(row.type, `${label}.type`);
}

function checkTripFilmReservation(row: Record<string, unknown>, index: number) {
  const prefix = `trip_films[${index}]`;
  assertUuid(row.id, `${prefix}.id`);
  assertUuid(row.trip_id, `${prefix}.trip_id`);
  assertUuid(row.film_id, `${prefix}.film_id`);
  assertIntegerLike(row.quantity, `${prefix}.quantity`);
  assertOptionalString(row.created_at, `${prefix}.created_at`);

  if (row.films !== null && row.films !== undefined) {
    if (typeof row.films !== "object" || Array.isArray(row.films)) {
      fail(`${prefix}.films must be an object when present`);
    }
    checkReservedFilm(row.films as Record<string, unknown>, `${prefix}.films`);
  }
}

function checkTripGearReservation(row: Record<string, unknown>, index: number) {
  const prefix = `trip_gear[${index}]`;
  assertUuid(row.id, `${prefix}.id`);
  assertUuid(row.trip_id, `${prefix}.trip_id`);
  assertUuid(row.gear_id, `${prefix}.gear_id`);
  assertOptionalString(row.created_at, `${prefix}.created_at`);

  if (row.gear !== null && row.gear !== undefined) {
    if (typeof row.gear !== "object" || Array.isArray(row.gear)) {
      fail(`${prefix}.gear must be an object when present`);
    }
    checkGear(row.gear as Record<string, unknown>, index);
  }
}

function checkFilmUsage(row: Record<string, unknown>, index: number) {
  const prefix = `film_usage[${index}]`;
  assertUuid(row.id, `${prefix}.id`);
  assertOptionalUuid(row.film_id, `${prefix}.film_id`);
  assertIntegerLike(row.quantity, `${prefix}.quantity`);
  assertOptionalString(row.usage_note, `${prefix}.usage_note`);
  assertOptionalString(row.usage_type, `${prefix}.usage_type`);
  assertOptionalUuid(row.trip_id, `${prefix}.trip_id`);
  assertOptionalString(row.created_at, `${prefix}.created_at`);
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    fail("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const user = await resolveUserId(
    supabase,
    process.env.MOBILE_PROBE_USER_ID,
    process.env.MOBILE_PROBE_EMAIL
  );

  const [filmsResult, gearResult, tripsResult] = await Promise.all([
    supabase
      .from("films_with_availability")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("gear")
      .select("*")
      .eq("user_id", user.id)
      .order("type", { ascending: true })
      .order("brand", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("trips")
      .select(
        `
        *,
        trip_films (
          quantity
        )
      `
      )
      .eq("user_id", user.id)
      .order("start_date", { ascending: true }),
  ]);

  if (filmsResult.error) throw filmsResult.error;
  if (gearResult.error) throw gearResult.error;
  if (tripsResult.error) throw tripsResult.error;

  const films = filmsResult.data ?? [];
  const gear = gearResult.data ?? [];
  const trips = tripsResult.data ?? [];

  films.forEach(checkFilm);
  gear.forEach(checkGear);
  trips.forEach(checkTrip);

  const tripIds = trips.map((trip) => trip.id);
  if (tripIds.length > 0) {
    const [tripFilmsResult, tripGearResult, filmUsageResult] = await Promise.all([
      supabase
        .from("trip_films")
        .select(
          `
          id,
          trip_id,
          film_id,
          quantity,
          created_at,
          films (
            id,
            name,
            brand,
            iso,
            format,
            type
          )
        `
        )
        .in("trip_id", tripIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("trip_gear")
        .select(
          `
          id,
          trip_id,
          gear_id,
          created_at,
          gear (*)
        `
        )
        .in("trip_id", tripIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("film_usage")
        .select("*")
        .in("trip_id", tripIds),
    ]);

    if (tripFilmsResult.error) throw tripFilmsResult.error;
    if (tripGearResult.error) throw tripGearResult.error;
    if (filmUsageResult.error) throw filmUsageResult.error;

    const tripFilms = tripFilmsResult.data ?? [];
    const tripGear = tripGearResult.data ?? [];
    const filmUsage = filmUsageResult.data ?? [];

    tripFilms.forEach(checkTripFilmReservation);
    tripGear.forEach(checkTripGearReservation);
    filmUsage.forEach(checkFilmUsage);

    console.log(
      `trip_films=${tripFilms.length} trip_gear=${tripGear.length} film_usage=${filmUsage.length}`
    );
  }

  console.log(`Mobile contract probe passed for ${user.label}`);
  console.log(`films=${films.length} gear=${gear.length} trips=${trips.length}`);
}

main().catch((error) => {
  console.error("Mobile contract probe failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
