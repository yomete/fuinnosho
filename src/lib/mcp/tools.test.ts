import { describe, it, expect, vi, afterEach } from "vitest";
import { createToolHandlers, runTool } from "@/lib/mcp/tools";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolHandlersByName } from "@/lib/mcp/tool-types";

type Response = { data?: unknown; error?: { message: string } | null; count?: number };

// A fake Supabase client. Each `from(table)` call takes the next queued
// response for that table; every builder method returns the same chain.
function fakeSupabase(queues: Record<string, Response[]>) {
  const calls: Array<{ table: string; method: string; args: unknown[] }> = [];

  function from(table: string) {
    const response = queues[table]?.shift() ?? { data: null, error: null };
    const chain: Record<string, unknown> = {
      then: (resolve: (value: Response) => unknown) =>
        Promise.resolve({ error: null, ...response }).then(resolve),
    };
    for (const method of [
      "select", "insert", "update", "delete", "eq", "neq", "in", "gte", "lt",
      "order", "limit", "single", "maybeSingle",
    ]) {
      chain[method] = (...args: unknown[]) => {
        calls.push({ table, method, args });
        return chain;
      };
    }
    return chain;
  }

  return { client: { from } as unknown as SupabaseClient, calls };
}

function parse(result: { content: Array<{ text: string }> }) {
  return JSON.parse(result.content[0].text);
}

function isoDaysFromToday(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const USER = "user-1";

describe("list_trips", () => {
  afterEach(() => vi.useRealTimers());
  it("returns a trip whose dates span today as ongoing", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-05T23:30:00-07:00"));
    const trips = [
      { id: "past", title: "Past", start_date: isoDaysFromToday(-10), end_date: isoDaysFromToday(-5), status: "past", trip_films: [] },
      { id: "now", title: "Now", start_date: isoDaysFromToday(-2), end_date: isoDaysFromToday(3), status: "ongoing", trip_films: [{ quantity: 2 }] },
      { id: "ends-today", title: "Ends today", start_date: isoDaysFromToday(-1), end_date: isoDaysFromToday(0), status: "ongoing", trip_films: [] },
      { id: "next", title: "Next", start_date: isoDaysFromToday(5), end_date: isoDaysFromToday(8), status: "upcoming", trip_films: [] },
    ];
    const { client } = fakeSupabase({ trips: [{ data: trips }, { data: trips }] });
    const handlers = createToolHandlers(client, USER);

    const withoutPast = parse(await handlers.list_trips({ include_past: false }));
    expect(withoutPast.ongoing_trips.map((t: { id: string }) => t.id).sort()).toEqual(["ends-today", "now"]);
    expect(withoutPast.upcoming_trips.map((t: { id: string }) => t.id)).toEqual(["next"]);
    expect(withoutPast.past_trips).toEqual([]);
    expect(withoutPast.summary).toEqual({ total_trips: 4, upcoming_trips: 1, ongoing_trips: 2, past_trips: 1 });

    const withPast = parse(await handlers.list_trips({ include_past: true }));
    expect(withPast.past_trips.map((t: { id: string }) => t.id)).toEqual(["past"]);
  });
});

describe("list_gear with include_trip_reservations", () => {
  it("fetches reservations for all gear in one query and attaches them", async () => {
    const gear = [
      { id: "g1", name: "CL", brand: "Leica", type: "camera", purchase_price: 100 },
      { id: "g2", name: "Nokton", brand: "Voigtländer", type: "lens", purchase_price: 50 },
      { id: "g3", name: "Meter", brand: "Revue", type: "accessory", purchase_price: 5 },
    ];
    const reservations = [
      { gear_id: "g1", trips: { id: "t1", title: "Dubrovnik", start_date: "2026-10-13", end_date: "2026-10-16" } },
      { gear_id: "g1", trips: { id: "t2", title: "Lisbon", start_date: "2026-09-22", end_date: "2026-09-26" } },
      { gear_id: "g2", trips: { id: "t1", title: "Dubrovnik", start_date: "2026-10-13", end_date: "2026-10-16" } },
    ];
    const { client, calls } = fakeSupabase({
      gear: [{ data: gear }],
      trip_gear: [{ data: reservations }],
    });
    const handlers = createToolHandlers(client, USER);

    const result = parse(await handlers.list_gear({ include_trip_reservations: true }));

    expect(calls.filter((c) => c.table === "trip_gear" && c.method === "select")).toHaveLength(1);
    expect(calls.find((c) => c.table === "trip_gear" && c.method === "in")?.args).toEqual(["gear_id", ["g1", "g2", "g3"]]);
    expect(result.summary.total_gear).toBe(3);
    const byId = Object.fromEntries(result.gear.map((g: { id: string; trip_reservations: unknown[] }) => [g.id, g.trip_reservations]));
    expect(byId.g1.map((r: { trips: { title: string } }) => r.trips.title)).toEqual(["Dubrovnik", "Lisbon"]);
    expect(byId.g2).toHaveLength(1);
    expect(byId.g3).toEqual([]);
  });

  it("surfaces a query error instead of returning partial data", async () => {
    const { client } = fakeSupabase({
      gear: [{ data: [{ id: "g1", name: "CL", brand: "Leica", type: "camera" }] }],
      trip_gear: [{ data: null, error: { message: "boom" } }],
    });
    const handlers = createToolHandlers(client, USER);
    await expect(handlers.list_gear({ include_trip_reservations: true })).rejects.toThrow("Failed to fetch gear reservations: boom");
  });
});

describe("reservation messages name the film, gear, and trip", () => {
  it("remove_film_reservation reads the joined trip and film objects", async () => {
    const { client } = fakeSupabase({
      trip_films: [
        { data: { quantity: 1, trips: { title: "Dubrovnik" }, films: { name: "Portra 800", brand: "Kodak" } } },
      ],
      trips: [{ data: { id: "t1", title: "Dubrovnik" } }],
    });
    const handlers = createToolHandlers(client, USER);

    const result = parse(await handlers.remove_film_reservation({ trip_id: "t1", film_id: "f1" }));
    expect(result.message).toBe('Removed 1 roll(s) of Kodak Portra 800 from trip "Dubrovnik"');
    expect(result.removed_reservation).toEqual({ quantity: 1, film: "Kodak Portra 800", trip: "Dubrovnik" });
  });

  it("update_film_reservation_quantity reads the joined objects", async () => {
    const { client } = fakeSupabase({
      trip_films: [
        { data: { quantity: 1, trips: { title: "Dubrovnik" }, films: { name: "HP5", brand: "Ilford" } } },
      ],
      trips: [{ data: { id: "t1", title: "Dubrovnik" } }],
    });
    const handlers = createToolHandlers(client, USER);

    const result = parse(await handlers.update_film_reservation_quantity({ trip_id: "t1", film_id: "f1", quantity: 3 }));
    expect(result.message).toBe('Updated reservation for Ilford HP5 in trip "Dubrovnik" from 1 to 3 roll(s)');
  });

  it("remove_gear_reservation reads the joined objects", async () => {
    const { client } = fakeSupabase({
      trip_gear: [
        { data: { trips: { title: "Dubrovnik" }, gear: { name: "CL", brand: "Leica", type: "camera" } } },
      ],
      trips: [{ data: { id: "t1", title: "Dubrovnik" } }],
      gear: [{ data: { id: "g1", name: "CL", brand: "Leica", type: "camera" } }],
    });
    const handlers = createToolHandlers(client, USER);

    const result = parse(await handlers.remove_gear_reservation({ trip_id: "t1", gear_id: "g1" }));
    expect(result.message).toBe('Removed Leica CL (camera) from trip "Dubrovnik"');
  });


});

describe("runTool", () => {
  it("turns a thrown error into an MCP error result", async () => {
    const handlers = { list_gear: async () => { throw new Error("nope"); } } as unknown as ToolHandlersByName;
    const result = await runTool(handlers, "list_gear", {});
    expect(result).toEqual({ content: [{ type: "text", text: 'Error: Tool "list_gear" failed: nope' }], isError: true });
  });

  it.each(["nope", "toString", "constructor"])("reports unknown tool %s as an error", async (name) => {
    const result = await runTool({} as ToolHandlersByName, name, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe(`Error: Unknown tool: ${name}`);
  });

  it("ping answers with the server version", async () => {
    const { client } = fakeSupabase({});
    const handlers = createToolHandlers(client, USER);
    const result = parse(await runTool(handlers, "ping", {}));
    expect(result.ok).toBe(true);
    expect(typeof result.server_version).toBe("string");

  });
});
