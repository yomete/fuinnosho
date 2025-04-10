"use client";

import { useState, useEffect } from "react";
import { Film } from "@/lib/utils";
import { storageFactory } from "@/lib/storage/storage-factory";

export function useLocalStorage() {
  const [films, setFilms] = useState<Film[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadFilms();
  }, []);

  async function loadFilms() {
    try {
      setIsLoading(true);
      const localStorage = storageFactory.getLocalStorage();
      const loadedFilms = await localStorage.getAllFilms();
      setFilms(loadedFilms);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load films"));
    } finally {
      setIsLoading(false);
    }
  }

  async function saveFilms(newFilms: Film[]) {
    try {
      setIsLoading(true);
      const localStorage = storageFactory.getLocalStorage();
      await localStorage.setAllFilms(newFilms);
      setFilms(newFilms);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to save films"));
    } finally {
      setIsLoading(false);
    }
  }

  return {
    films,
    isLoading,
    error,
    loadFilms,
    saveFilms,
  };
}
