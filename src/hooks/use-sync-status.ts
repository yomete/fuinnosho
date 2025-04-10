"use client";

import { useState, useEffect } from "react";
import { syncService } from "@/lib/storage/sync-service";
import { storageFactory } from "@/lib/storage/storage-factory";
import { useOnlineStatus } from "./use-online-status";

export function useSyncStatus() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const isOnline = useOnlineStatus();

  // Function to check for unsynced films
  const checkUnsyncedFilms = async () => {
    try {
      const localStorage = storageFactory.getLocalStorage();
      const unsyncedFilms = await localStorage.getUnsyncedFilms();
      setUnsyncedCount(unsyncedFilms.length);
    } catch (error) {
      console.error("Error checking unsynced films:", error);
    }
  };

  // Check for unsynced films on mount and when online status changes
  useEffect(() => {
    checkUnsyncedFilms();
  }, [isOnline]);

  // Function to sync to cloud
  const syncToCloud = async () => {
    if (!isOnline) {
      return { success: false, error: "You are offline" };
    }

    setIsSyncing(true);
    try {
      const result = await syncService.syncToCloud();
      if (result.success) {
        setLastSynced(new Date());
        await checkUnsyncedFilms();
      }
      return result;
    } catch (error) {
      console.error("Error syncing to cloud:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sync",
      };
    } finally {
      setIsSyncing(false);
    }
  };

  // Function to sync from cloud
  const syncFromCloud = async () => {
    if (!isOnline) {
      return { success: false, error: "You are offline" };
    }

    setIsSyncing(true);
    try {
      const result = await syncService.syncFromCloud();
      if (result.success) {
        setLastSynced(new Date());
        await checkUnsyncedFilms();
      }
      return result;
    } catch (error) {
      console.error("Error syncing from cloud:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sync",
      };
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    lastSynced,
    unsyncedCount,
    isOnline,
    syncToCloud,
    syncFromCloud,
    checkUnsyncedFilms,
  };
}
