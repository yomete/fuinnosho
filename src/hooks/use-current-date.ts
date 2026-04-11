"use client";

import { useEffect, useState } from "react";

export function useCurrentDate(refreshIntervalMs = 60 * 60 * 1000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, refreshIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [refreshIntervalMs]);

  return now;
}
