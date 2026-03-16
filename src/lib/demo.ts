/**
 * Demo mode constants and utilities
 * Used to allow guest access without authentication
 */

// Fixed UUID for demo user - all demo data belongs to this user
export const DEMO_USER_ID = "00000000-0000-4000-a000-000000000000";

// Cookie name set by middleware for /demo/* routes
export const DEMO_MODE_COOKIE = "__demo_mode";

// Request header set by middleware to signal demo mode for the current request
// Unlike cookies, headers don't persist across requests
export const DEMO_MODE_HEADER = "x-demo-mode";

/**
 * Sync check — only detects global demo mode via env var.
 * Use in middleware and other sync contexts.
 */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

/**
 * Async check — detects both global demo mode (env var) and
 * route-based demo mode (header set by middleware for /demo/* paths).
 * Uses a request header instead of cookies to avoid stale cookie issues
 * when navigating from demo to non-demo routes.
 */
export async function isDemoModeAsync(): Promise<boolean> {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true;
  try {
    const { headers } = await import("next/headers");
    const headerStore = await headers();
    return headerStore.get(DEMO_MODE_HEADER) === "true";
  } catch {
    return false;
  }
}
