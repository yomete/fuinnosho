/**
 * Authenticated read-only mobile smoke test.
 * Run with:
 *   MOBILE_SMOKE_EMAIL=user@example.com MOBILE_SMOKE_PASSWORD=... pnpm smoke:mobile:reads
 */

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

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    fail(`Missing ${name}`);
  }
  return value;
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

function assertIntegerLike(value: unknown, label: string) {
  if (value === null || value === undefined) return;
  if (typeof value === "number" && Number.isInteger(value)) return;
  fail(`${label} must be an integer when present`);
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return "(configured account)";
  return `${name.slice(0, 2)}***@${domain}`;
}

function checkFilm(row: Record<string, unknown>, index: number) {
  const prefix = `films_with_availability[${index}]`;
  assertString(row.id, `${prefix}.id`);
  assertString(row.name, `${prefix}.name`);
  assertString(row.brand, `${prefix}.brand`);
  assertIntegerLike(row.iso, `${prefix}.iso`);
  assertString(row.format, `${prefix}.format`);
  assertString(row.type, `${prefix}.type`);
  assertIntegerLike(row.available_count, `${prefix}.available_count`);
}

function checkGear(row: Record<string, unknown>, index: number) {
  const prefix = `gear[${index}]`;
  assertString(row.id, `${prefix}.id`);
  assertString(row.name, `${prefix}.name`);
  assertString(row.brand, `${prefix}.brand`);
  if (typeof row.type !== "string" || !gearTypes.has(row.type)) {
    fail(`${prefix}.type has unsupported value`);
  }
  if (typeof row.condition !== "string" || !gearConditions.has(row.condition)) {
    fail(`${prefix}.condition has unsupported value`);
  }
}

function checkTrip(row: Record<string, unknown>, index: number) {
  const prefix = `trips[${index}]`;
  assertString(row.id, `${prefix}.id`);
  assertString(row.title, `${prefix}.title`);
  assertOptionalString(row.description, `${prefix}.description`);
  assertString(row.start_date, `${prefix}.start_date`);
  assertString(row.end_date, `${prefix}.end_date`);
  if (row.status !== null && row.status !== undefined) {
    if (typeof row.status !== "string" || !tripStatuses.has(row.status)) {
      fail(`${prefix}.status has unsupported value`);
    }
  }

  if (!Array.isArray(row.trip_films)) {
    fail(`${prefix}.trip_films must be an array`);
  }
}

async function main() {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const email = requireEnv("MOBILE_SMOKE_EMAIL");
  const password = requireEnv("MOBILE_SMOKE_PASSWORD");

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (authError) throw authError;

  const userId = authData.user.id;
  const [filmsResult, gearResult, tripsResult] = await Promise.all([
    supabase
      .from("films_with_availability")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("gear")
      .select("*")
      .eq("user_id", userId)
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
      .eq("user_id", userId)
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

  console.log(`Authenticated mobile reads passed for ${maskEmail(email)}`);
  console.log(`films=${films.length} gear=${gear.length} trips=${trips.length}`);
}

main().catch((error) => {
  console.error("Authenticated mobile read smoke failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
