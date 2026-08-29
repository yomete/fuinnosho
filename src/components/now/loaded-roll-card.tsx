"use client";

import { useState } from "react";
import { formatDistance } from "date-fns";
import { Camera } from "lucide-react";
import { useCurrentDate } from "@/hooks/use-current-date";
import type { LoadedFilmEntry } from "@/lib/loaded/types";
import type { Trip } from "@/lib/trips/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FinishRollDialog } from "@/components/now/finish-roll-dialog";

interface LoadedRollCardProps {
  entry: LoadedFilmEntry;
  trips: Trip[];
}

export function LoadedRollCard({ entry, trips }: LoadedRollCardProps) {
  const [isFinishing, setIsFinishing] = useState(false);
  const now = useCurrentDate();

  const cameraLabel = entry.camera
    ? `${entry.camera.brand} ${entry.camera.name}`
    : "Unknown camera";
  const filmLabel = entry.film
    ? `${entry.film.brand} ${entry.film.name}`
    : "Unknown film";

  const boxSpeed = entry.film?.iso;
  const pushedOrPulled =
    entry.shot_at_iso && boxSpeed && entry.shot_at_iso !== boxSpeed;

  return (
    <article className="rounded-2xl border border-[#2a2420] bg-[#1a1614]/60 p-5 shadow-[0_1px_0_rgba(255,255,255,0.02),0_18px_36px_rgba(0,0,0,0.35)]">
      <div className="flex items-start gap-3">
        <Camera
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-medium text-[#e8e4e0]">
            {cameraLabel}
          </h3>
          <p className="mt-0.5 truncate text-sm text-[#c8c0b8]">{filmLabel}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {boxSpeed !== undefined && (
              <Badge variant="secondary" className="tabular-nums">
                ISO&nbsp;{boxSpeed}
              </Badge>
            )}
            {pushedOrPulled && (
              <Badge variant="color" className="tabular-nums">
                Shooting at EI&nbsp;{entry.shot_at_iso}
              </Badge>
            )}
            {entry.film?.format && (
              <Badge variant="secondary">{entry.film.format}</Badge>
            )}
            {entry.film?.is_bulk_film && (
              <Badge variant="secondary">Spooled cassette</Badge>
            )}
          </div>

          <p className="mt-3 text-sm text-[#8a8078] tabular-nums">
            Loaded {formatDistance(new Date(entry.loaded_at), now)} ago
          </p>

          {entry.notes && (
            <p className="mt-2 text-sm italic text-[#8a8078]">
              “{entry.notes}”
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsFinishing(true)}
          className="min-h-11 touch-manipulation"
        >
          Finish roll…
        </Button>
      </div>

      <FinishRollDialog
        entry={entry}
        trips={trips}
        open={isFinishing}
        onOpenChange={setIsFinishing}
      />
    </article>
  );
}
