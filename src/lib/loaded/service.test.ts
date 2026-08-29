import { vi, describe, it, expect, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("@/lib/loaded/repository", () => ({
  insertLoadedFilm: vi.fn(),
  listActiveLoadedFilmsByUser: vi.fn(),
  listCamerasByUser: vi.fn(),
  listShotAtIsoHistoryByUser: vi.fn(),
  markLoadedFilmUnloaded: vi.fn(),
  revertLoadedFilmUnload: vi.fn(),
  selectActiveLoadForCamera: vi.fn(),
  selectCameraById: vi.fn(),
  selectLoadedFilmById: vi.fn(),
}));

vi.mock("@/lib/trips/repository", () => ({
  listFilmsWithAvailabilityByUser: vi.fn(),
}));

vi.mock("@/lib/films/service", () => ({
  reduceFilmCountForUser: vi.fn(),
}));

import {
  insertLoadedFilm,
  listActiveLoadedFilmsByUser,
  listCamerasByUser,
  listShotAtIsoHistoryByUser,
  markLoadedFilmUnloaded,
  revertLoadedFilmUnload,
  selectActiveLoadForCamera,
  selectCameraById,
  selectLoadedFilmById,
} from "@/lib/loaded/repository";
import { listFilmsWithAvailabilityByUser } from "@/lib/trips/repository";
import { reduceFilmCountForUser } from "@/lib/films/service";
import {
  getCameraLoadStatesForUser,
  getEiPrefillsForUser,
  getFilmsAvailableForLoadingForUser,
  loadFilmIntoCameraForUser,
  unloadFilmForUser,
} from "@/lib/loaded/service";

const supabase = {} as SupabaseClient;
const USER_ID = "user-1";

const portra = {
  id: "film-portra",
  name: "Portra 400",
  brand: "Kodak",
  iso: 400,
  format: "35mm",
  type: "color negative",
  expiration_date: "2027-01-01",
  is_bulk_film: false,
  deleted_at: null,
  available_count: 3,
};

const camera = {
  id: "camera-f3",
  name: "F3",
  brand: "Nikon",
  model: "HP",
  type: "camera",
};

function loadedEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: "loaded-1",
    camera_id: camera.id,
    film_id: portra.id,
    user_id: USER_ID,
    shot_at_iso: 800,
    notes: null,
    loaded_at: "2026-08-01T10:00:00.000Z",
    unloaded_at: null,
    outcome: null,
    created_at: "2026-08-01T10:00:00.000Z",
    updated_at: "2026-08-01T10:00:00.000Z",
    camera: { id: camera.id, name: camera.name, brand: camera.brand, model: camera.model },
    film: {
      id: portra.id,
      name: portra.name,
      brand: portra.brand,
      iso: portra.iso,
      format: portra.format,
      type: portra.type,
      expiration_date: portra.expiration_date,
      is_bulk_film: false,
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listFilmsWithAvailabilityByUser).mockResolvedValue({
    data: [portra],
    error: null,
  } as never);
  vi.mocked(selectCameraById).mockResolvedValue({
    data: camera,
    error: null,
  } as never);
  vi.mocked(selectActiveLoadForCamera).mockResolvedValue({
    data: null,
    error: null,
  } as never);
});

describe("getFilmsAvailableForLoadingForUser", () => {
  it("only offers film that still has rolls available", async () => {
    vi.mocked(listFilmsWithAvailabilityByUser).mockResolvedValue({
      data: [
        portra,
        { ...portra, id: "film-held", available_count: 0 },
        { ...portra, id: "film-deleted", deleted_at: "2026-01-01" },
      ],
      error: null,
    } as never);

    const films = await getFilmsAvailableForLoadingForUser(supabase, USER_ID);

    expect(films.map((film) => film.id)).toEqual([portra.id]);
  });

  it("offers spooled bulk cassettes, whose availability is cassette-based", async () => {
    vi.mocked(listFilmsWithAvailabilityByUser).mockResolvedValue({
      data: [{ ...portra, id: "film-bulk", is_bulk_film: true, available_count: 4 }],
      error: null,
    } as never);

    const films = await getFilmsAvailableForLoadingForUser(supabase, USER_ID);

    expect(films).toHaveLength(1);
    expect(films[0].is_bulk_film).toBe(true);
    expect(films[0].available_count).toBe(4);
  });
});

describe("loadFilmIntoCameraForUser", () => {
  it("loads an available roll into a free camera", async () => {
    vi.mocked(insertLoadedFilm).mockResolvedValue({
      data: loadedEntry(),
      error: null,
    } as never);

    const entry = await loadFilmIntoCameraForUser(supabase, USER_ID, {
      camera_id: camera.id,
      film_id: portra.id,
      shot_at_iso: 800,
    });

    expect(entry.id).toBe("loaded-1");
    expect(insertLoadedFilm).toHaveBeenCalledWith(supabase, {
      camera_id: camera.id,
      film_id: portra.id,
      user_id: USER_ID,
      shot_at_iso: 800,
      notes: null,
    });
  });

  it("refuses a second roll in the same camera", async () => {
    vi.mocked(selectActiveLoadForCamera).mockResolvedValue({
      data: { id: "loaded-existing" },
      error: null,
    } as never);

    await expect(
      loadFilmIntoCameraForUser(supabase, USER_ID, {
        camera_id: camera.id,
        film_id: portra.id,
      })
    ).rejects.toThrow(/already has a roll loaded/);

    expect(insertLoadedFilm).not.toHaveBeenCalled();
  });

  it("refuses film that is fully reserved or already loaded elsewhere", async () => {
    vi.mocked(listFilmsWithAvailabilityByUser).mockResolvedValue({
      data: [{ ...portra, available_count: 0 }],
      error: null,
    } as never);

    await expect(
      loadFilmIntoCameraForUser(supabase, USER_ID, {
        camera_id: camera.id,
        film_id: portra.id,
      })
    ).rejects.toThrow(/no rolls available/);

    expect(insertLoadedFilm).not.toHaveBeenCalled();
  });

  it("refuses gear that is not a camera", async () => {
    vi.mocked(selectCameraById).mockResolvedValue({
      data: { ...camera, type: "lens" },
      error: null,
    } as never);

    await expect(
      loadFilmIntoCameraForUser(supabase, USER_ID, {
        camera_id: camera.id,
        film_id: portra.id,
      })
    ).rejects.toThrow(/only be loaded into a camera/);
  });
});

describe("unloadFilmForUser", () => {
  beforeEach(() => {
    vi.mocked(selectLoadedFilmById).mockResolvedValue({
      data: loadedEntry(),
      error: null,
    } as never);
    vi.mocked(markLoadedFilmUnloaded).mockResolvedValue({
      data: { id: "loaded-1" },
      error: null,
    } as never);
    vi.mocked(reduceFilmCountForUser).mockResolvedValue({
      success: true,
      newCount: 2,
    } as never);
  });

  it("consumes one roll and logs the camera and EI when the roll was shot", async () => {
    await unloadFilmForUser(supabase, USER_ID, "loaded-1", { outcome: "shot" });

    expect(reduceFilmCountForUser).toHaveBeenCalledWith(
      supabase,
      USER_ID,
      portra.id,
      1,
      "Shot in Nikon F3 @ EI 800",
      undefined
    );
  });

  it("attributes the roll to a trip when one is given", async () => {
    await unloadFilmForUser(supabase, USER_ID, "loaded-1", {
      outcome: "shot",
      trip_id: "trip-9",
    });

    expect(reduceFilmCountForUser).toHaveBeenCalledWith(
      supabase,
      USER_ID,
      portra.id,
      1,
      expect.any(String),
      "trip-9"
    );
  });

  it("omits the EI from the note when the roll was shot at box speed", async () => {
    vi.mocked(selectLoadedFilmById).mockResolvedValue({
      data: loadedEntry({ shot_at_iso: 400, notes: "harbour walk" }),
      error: null,
    } as never);

    await unloadFilmForUser(supabase, USER_ID, "loaded-1", { outcome: "shot" });

    expect(reduceFilmCountForUser).toHaveBeenCalledWith(
      supabase,
      USER_ID,
      portra.id,
      1,
      "Shot in Nikon F3 — harbour walk",
      undefined
    );
  });

  it("leaves the count untouched when the roll comes out unused", async () => {
    await unloadFilmForUser(supabase, USER_ID, "loaded-1", {
      outcome: "unused",
    });

    expect(markLoadedFilmUnloaded).toHaveBeenCalled();
    expect(reduceFilmCountForUser).not.toHaveBeenCalled();
  });

  it("puts the roll back in the camera if consuming the stock fails", async () => {
    vi.mocked(reduceFilmCountForUser).mockResolvedValue({
      error: "Film not found",
    } as never);

    await expect(
      unloadFilmForUser(supabase, USER_ID, "loaded-1", { outcome: "shot" })
    ).rejects.toThrow("Film not found");

    expect(revertLoadedFilmUnload).toHaveBeenCalledWith(
      supabase,
      "loaded-1",
      USER_ID
    );
  });

  it("refuses to unload a roll twice", async () => {
    vi.mocked(selectLoadedFilmById).mockResolvedValue({
      data: loadedEntry({ unloaded_at: "2026-08-20T09:00:00.000Z", outcome: "shot" }),
      error: null,
    } as never);

    await expect(
      unloadFilmForUser(supabase, USER_ID, "loaded-1", { outcome: "shot" })
    ).rejects.toThrow(/already been unloaded/);

    expect(reduceFilmCountForUser).not.toHaveBeenCalled();
  });

  it("refuses when another writer unloaded the roll first", async () => {
    vi.mocked(markLoadedFilmUnloaded).mockResolvedValue({
      data: null,
      error: null,
    } as never);

    await expect(
      unloadFilmForUser(supabase, USER_ID, "loaded-1", { outcome: "shot" })
    ).rejects.toThrow(/already been unloaded/);

    expect(reduceFilmCountForUser).not.toHaveBeenCalled();
  });
});

describe("getEiPrefillsForUser", () => {
  it("remembers the EI each stock was most recently shot at", async () => {
    vi.mocked(listShotAtIsoHistoryByUser).mockResolvedValue({
      data: [
        { film_id: "film-a", shot_at_iso: 800, loaded_at: "2026-08-01" },
        { film_id: "film-a", shot_at_iso: 400, loaded_at: "2026-06-01" },
        { film_id: "film-b", shot_at_iso: 1600, loaded_at: "2026-05-01" },
      ],
      error: null,
    } as never);

    const prefills = await getEiPrefillsForUser(supabase, USER_ID);

    expect(prefills).toEqual({ "film-a": 800, "film-b": 1600 });
  });
});

describe("getCameraLoadStatesForUser", () => {
  it("pairs each camera with the roll inside it", async () => {
    vi.mocked(listCamerasByUser).mockResolvedValue({
      data: [
        { id: camera.id, name: "F3", brand: "Nikon", model: "HP" },
        { id: "camera-mju", name: "mju-II", brand: "Olympus", model: null },
      ],
      error: null,
    } as never);
    vi.mocked(listActiveLoadedFilmsByUser).mockResolvedValue({
      data: [loadedEntry()],
      error: null,
    } as never);

    const states = await getCameraLoadStatesForUser(supabase, USER_ID);

    expect(states).toHaveLength(2);
    expect(states[0].loaded?.id).toBe("loaded-1");
    expect(states[1].loaded).toBeNull();
  });
});
