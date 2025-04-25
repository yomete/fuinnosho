"use client";

import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { syncFilms } from "@/app/actions/films";
import { toast } from "sonner";
import { Film } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/use-local-storage";

function mergeFilms(localFilms: Film[], cloudFilms: Film[]): Film[] {
  const filmMap = new Map<string, Film>();

  // Add all local films to the map
  localFilms.forEach((film) => {
    filmMap.set(film.id, film);
  });

  // Merge cloud films, keeping the most recently updated version
  cloudFilms.forEach((cloudFilm) => {
    const localFilm = filmMap.get(cloudFilm.id);
    if (
      !localFilm ||
      new Date(cloudFilm.updated_at) > new Date(localFilm.updated_at)
    ) {
      filmMap.set(cloudFilm.id, cloudFilm);
    }
  });

  return Array.from(filmMap.values());
}

export function SyncButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { films: localFilms, saveFilms } = useLocalStorage();

  const handleSync = async () => {
    try {
      setIsLoading(true);

      // Get cloud films
      const result = await syncFilms();
      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Merge films
      const mergedFilms = mergeFilms(localFilms, result.films ?? []);

      // Update local storage
      await saveFilms(mergedFilms);

      toast.success("Films synced successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to sync films");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleSync}
      disabled={isLoading}
      className="relative"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
    </Button>
  );
}
