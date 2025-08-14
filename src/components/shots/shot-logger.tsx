"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Shot,
  createOrUpdateShot,
  getShotsForTripFilm,
} from "@/app/actions/shots";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ShotLoggerProps {
  tripFilm: {
    id: string;
    film_id: string;
    // Assuming the film object with exposure count is available here
    films: {
      name: string;
      brand: string;
      exposures: number;
    } | null;
  };
  gear: Array<{ id: string; name: string }>;
}

export function ShotLogger({ tripFilm, gear }: ShotLoggerProps) {
  const [shots, setShots] = useState<Map<number, Partial<Shot>>>(new Map());
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const existingShots = await getShotsForTripFilm(tripFilm.id);
      const newShotsMap = new Map<number, Partial<Shot>>();
      existingShots.forEach((shot) => {
        newShotsMap.set(shot.frame_number, shot);
      });
      setShots(newShotsMap);
    });
  }, [tripFilm.id]);

  const handleBlur = (
    frame: number,
    field: keyof Shot,
    value: string | null
  ) => {
    const existingShot = shots.get(frame) || {};
    const updatedShot = { ...existingShot, [field]: value };
    setShots(new Map(shots.set(frame, updatedShot)));

    startTransition(async () => {
      try {
        await createOrUpdateShot({
          trip_film_id: tripFilm.id,
          frame_number: frame,
          ...updatedShot,
        });
        toast.success(`Frame ${frame} updated.`);
      } catch (error) {
        console.error("Error updating shot:", error);
        toast.error("Failed to update shot. Please try again.");
      }
    });
  };

  const exposureCount = tripFilm.films?.exposures || 36; // Default to 36 if not specified

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">
        {tripFilm.films?.brand} {tripFilm.films?.name}
      </div>
      <div className="max-h-[60vh] overflow-y-auto p-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: exposureCount }, (_, i) => i + 1).map(
            (frame) => {
              const shot = shots.get(frame) || {};
              return (
                <div
                  key={frame}
                  className="p-4 border rounded-lg space-y-2 bg-muted/50"
                >
                  <Label htmlFor={`frame-${frame}`} className="font-bold">
                    Frame {frame}
                  </Label>

                  <Input
                    id={`aperture-${frame}`}
                    placeholder="Aperture (e.g., f/8)"
                    defaultValue={shot.aperture || ""}
                    onBlur={(e) =>
                      handleBlur(frame, "aperture", e.target.value)
                    }
                  />
                  <Input
                    id={`shutter-${frame}`}
                    placeholder="Shutter (e.g., 1/125)"
                    defaultValue={shot.shutter_speed || ""}
                    onBlur={(e) =>
                      handleBlur(frame, "shutter_speed", e.target.value)
                    }
                  />
                  <Select
                    defaultValue={shot.gear_id || undefined}
                    onValueChange={(value) =>
                      handleBlur(frame, "gear_id", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Gear" />
                    </SelectTrigger>
                    <SelectContent>
                      {gear.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id={`notes-${frame}`}
                    placeholder="Notes..."
                    defaultValue={shot.notes || ""}
                    onBlur={(e) => handleBlur(frame, "notes", e.target.value)}
                  />
                </div>
              );
            }
          )}
        </div>
      </div>
      {isPending && <p className="text-sm text-muted-foreground">Saving...</p>}
    </div>
  );
}
