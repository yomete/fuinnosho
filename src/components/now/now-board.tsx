"use client";

import { Film } from "lucide-react";
import type { FilmAvailableForLoading } from "@/lib/loaded/service";
import type {
  CameraLoadState,
  EiPrefills,
  LoadedFilmEntry,
} from "@/lib/loaded/types";
import type { Trip } from "@/lib/trips/types";
import { EmptyState } from "@/components/empty-state";
import { LoadFilmForm } from "@/components/now/load-film-form";
import { LoadedRollCard } from "@/components/now/loaded-roll-card";

interface NowBoardProps {
  cameras: CameraLoadState[];
  loaded: LoadedFilmEntry[];
  availableFilms: FilmAvailableForLoading[];
  eiPrefills: EiPrefills;
  trips: Trip[];
}

export function NowBoard({
  cameras,
  loaded,
  availableFilms,
  eiPrefills,
  trips,
}: NowBoardProps) {
  const emptyCameras = cameras.filter((entry) => !entry.loaded);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="px-2 sm:px-0">
        <h1
          className="text-2xl font-bold text-[#e8e4e0] sm:text-3xl"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Now
        </h1>
        <p className="text-sm text-[#8a8078] sm:text-base">
          What’s loaded in your cameras right now.
        </p>
      </header>

      <LoadFilmForm
        cameras={cameras}
        availableFilms={availableFilms}
        eiPrefills={eiPrefills}
      />

      <section aria-labelledby="loaded-heading" className="space-y-4">
        <h2
          id="loaded-heading"
          className="px-2 text-sm font-medium uppercase tracking-wide text-[#8a8078] sm:px-0"
        >
          In your cameras{" "}
          <span className="tabular-nums">({loaded.length})</span>
        </h2>

        {loaded.length === 0 ? (
          <EmptyState
            icon={Film}
            title="Nothing loaded"
            description="When you put a roll in a camera, save it here and you’ll never have to guess what’s in there again."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {loaded.map((entry) => (
              <LoadedRollCard key={entry.id} entry={entry} trips={trips} />
            ))}
          </div>
        )}
      </section>

      {emptyCameras.length > 0 && loaded.length > 0 && (
        <section aria-labelledby="empty-cameras-heading" className="space-y-3">
          <h2
            id="empty-cameras-heading"
            className="px-2 text-sm font-medium uppercase tracking-wide text-[#8a8078] sm:px-0"
          >
            Empty{" "}
            <span className="tabular-nums">({emptyCameras.length})</span>
          </h2>
          <ul className="flex flex-wrap gap-2 px-2 sm:px-0">
            {emptyCameras.map(({ camera }) => (
              <li
                key={camera.id}
                className="rounded-full border border-[#2a2420] px-3 py-1.5 text-sm text-[#8a8078]"
              >
                {camera.brand} {camera.name}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
