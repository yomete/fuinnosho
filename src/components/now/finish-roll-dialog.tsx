"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { unloadFilm } from "@/app/actions/loaded";
import type { LoadedFilmEntry, UnloadOutcome } from "@/lib/loaded/types";
import type { Trip } from "@/lib/trips/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FinishRollDialogProps {
  entry: LoadedFilmEntry;
  trips: Trip[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FinishRollDialog({
  entry,
  trips,
  open,
  onOpenChange,
}: FinishRollDialogProps) {
  const router = useRouter();
  const [outcome, setOutcome] = useState<UnloadOutcome>("shot");
  const [tripId, setTripId] = useState("none");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filmLabel = entry.film
    ? `${entry.film.brand} ${entry.film.name}`
    : "This roll";
  const cameraLabel = entry.camera
    ? `${entry.camera.brand} ${entry.camera.name}`
    : "the camera";

  async function handleConfirm() {
    setError(null);
    setIsSaving(true);

    const result = await unloadFilm(entry.id, {
      outcome,
      trip_id: outcome === "shot" ? tripId : undefined,
    });

    setIsSaving(false);

    if (!result.success) {
      setError(result.error ?? "Failed to finish this roll.");
      return;
    }

    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Finish this roll</DialogTitle>
          <DialogDescription>
            {filmLabel} in {cameraLabel}. What happened to it?
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={outcome}
          onValueChange={(value) => setOutcome(value as UnloadOutcome)}
          className="gap-3"
        >
          <Label
            htmlFor="outcome-shot"
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#2a2420] p-4 font-normal hover:border-[#3a3430] has-[[data-state=checked]]:border-amber-700/60 has-[[data-state=checked]]:bg-amber-950/20"
          >
            <RadioGroupItem value="shot" id="outcome-shot" className="mt-0.5" />
            <span>
              <span className="block font-medium text-[#e8e4e0]">
                I shot it
              </span>
              <span className="block text-sm text-[#8a8078]">
                Removes one roll from your inventory and logs it in your usage
                history.
              </span>
            </span>
          </Label>

          <Label
            htmlFor="outcome-unused"
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#2a2420] p-4 font-normal hover:border-[#3a3430] has-[[data-state=checked]]:border-amber-700/60 has-[[data-state=checked]]:bg-amber-950/20"
          >
            <RadioGroupItem
              value="unused"
              id="outcome-unused"
              className="mt-0.5"
            />
            <span>
              <span className="block font-medium text-[#e8e4e0]">
                I took it out unused
              </span>
              <span className="block text-sm text-[#8a8078]">
                Puts the roll back on the shelf. Your count doesn’t change.
              </span>
            </span>
          </Label>
        </RadioGroup>

        {outcome === "shot" && trips.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="finish-trip">Shot on a trip? (optional)</Label>
            <Select value={tripId} onValueChange={setTripId}>
              <SelectTrigger id="finish-trip" className="min-h-11">
                <SelectValue placeholder="No trip…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No trip</SelectItem>
                {trips.map((trip) => (
                  <SelectItem key={trip.id} value={trip.id}>
                    {trip.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <p className="text-sm text-red-400" role="alert" aria-live="polite">
          {error}
        </p>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-h-11"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isSaving}
            className="min-h-11 touch-manipulation"
          >
            {isSaving && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {outcome === "shot" ? "Mark as shot" : "Put it back"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
