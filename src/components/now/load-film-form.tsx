"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Plus } from "lucide-react";
import { loadFilm } from "@/app/actions/loaded";
import type { FilmAvailableForLoading } from "@/lib/loaded/service";
import type { CameraLoadState, EiPrefills } from "@/lib/loaded/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LoadFilmFormProps {
  cameras: CameraLoadState[];
  availableFilms: FilmAvailableForLoading[];
  eiPrefills: EiPrefills;
}

export function LoadFilmForm({
  cameras,
  availableFilms,
  eiPrefills,
}: LoadFilmFormProps) {
  const router = useRouter();
  const [cameraId, setCameraId] = useState("");
  const [filmId, setFilmId] = useState("");
  const [shotAtIso, setShotAtIso] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const freeCameras = useMemo(
    () => cameras.filter((entry) => !entry.loaded),
    [cameras]
  );

  const selectedFilm = availableFilms.find((film) => film.id === filmId);

  // Prefill the EI this stock was last shot at, falling back to box speed.
  useEffect(() => {
    if (!selectedFilm) return;
    const remembered = eiPrefills[selectedFilm.id];
    setShotAtIso(String(remembered ?? selectedFilm.iso));
  }, [selectedFilm, eiPrefills]);

  const allCamerasLoaded = cameras.length > 0 && freeCameras.length === 0;
  const canSubmit = Boolean(cameraId && filmId) && !isSaving;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsedIso = shotAtIso.trim() === "" ? undefined : Number(shotAtIso);

    if (parsedIso !== undefined && (!Number.isFinite(parsedIso) || parsedIso <= 0)) {
      setError("Shot-at ISO must be a number greater than zero.");
      return;
    }

    setIsSaving(true);

    const result = await loadFilm({
      camera_id: cameraId,
      film_id: filmId,
      shot_at_iso: parsedIso,
      notes: notes.trim() === "" ? undefined : notes.trim(),
    });

    setIsSaving(false);

    if (!result.success) {
      setError(result.error ?? "Failed to load film.");
      return;
    }

    setCameraId("");
    setFilmId("");
    setShotAtIso("");
    setNotes("");
    router.refresh();
  }

  if (cameras.length === 0) {
    return (
      <div className="rounded-2xl border border-[#2a2420] bg-[#1a1614]/60 p-6 text-center">
        <Camera className="mx-auto h-8 w-8 text-[#3a3430]" aria-hidden="true" />
        <p className="mt-3 text-sm text-[#8a8078]">
          Add a camera to your gear first, then you can load a roll into it.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[#2a2420] bg-[#1a1614]/60 p-4 sm:p-6 shadow-[0_1px_0_rgba(255,255,255,0.02),0_18px_36px_rgba(0,0,0,0.35)]"
    >
      <h2 className="text-lg font-medium text-[#e8e4e0]">Load a roll</h2>
      <p className="mt-1 text-sm text-[#8a8078]">
        Pick a camera and the film you just put in it. It stays here until you
        come back and finish it.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="now-camera">Camera</Label>
          <Select
            value={cameraId}
            onValueChange={setCameraId}
            disabled={allCamerasLoaded}
          >
            <SelectTrigger id="now-camera" className="min-h-11">
              <SelectValue
                placeholder={
                  allCamerasLoaded
                    ? "Every camera already has a roll…"
                    : "Choose a camera…"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {freeCameras.map(({ camera }) => (
                <SelectItem key={camera.id} value={camera.id}>
                  {camera.brand} {camera.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="now-film">Film</Label>
          <Select
            value={filmId}
            onValueChange={setFilmId}
            disabled={availableFilms.length === 0}
          >
            <SelectTrigger id="now-film" className="min-h-11">
              <SelectValue
                placeholder={
                  availableFilms.length === 0
                    ? "No film available to load…"
                    : "Choose a film…"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableFilms.map((film) => (
                <SelectItem key={film.id} value={film.id}>
                  {film.brand} {film.name} · ISO {film.iso} · {film.format}
                  {film.is_bulk_film ? " · spooled" : ""} ({film.available_count}{" "}
                  available)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="now-ei">
            Shooting at{" "}
            <span className="text-[#6a6460]">(EI, defaults to box speed)</span>
          </Label>
          <Input
            id="now-ei"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={shotAtIso}
            onChange={(event) => setShotAtIso(event.target.value)}
            placeholder="800…"
            className="min-h-11 tabular-nums"
            spellCheck={false}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="now-notes">Note (optional)</Label>
          <Input
            id="now-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Loaded for the harbour walk…"
            className="min-h-11"
            maxLength={280}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-sm text-red-400" role="alert" aria-live="polite">
          {error}
        </p>
        <Button
          type="submit"
          disabled={!canSubmit}
          className="min-h-11 touch-manipulation"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          Save
        </Button>
      </div>
    </form>
  );
}
