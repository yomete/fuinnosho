import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Every PostgREST request aborts after this long, so no tool can wait on
// Supabase forever. Override with MCP_QUERY_TIMEOUT_MS.
export const QUERY_TIMEOUT_MS = Number(process.env.MCP_QUERY_TIMEOUT_MS) || 10_000;

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, {
    ...init,
    signal: init?.signal
      ? AbortSignal.any([init.signal, AbortSignal.timeout(QUERY_TIMEOUT_MS)])
      : AbortSignal.timeout(QUERY_TIMEOUT_MS),
  });
}

export function createMcpSupabaseClient(): {
  supabase: SupabaseClient;
  userId: string;
} {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || (!serviceRoleKey && !supabaseKey)) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)"
    );
  }

  const supabase = createClient(
    supabaseUrl,
    serviceRoleKey || supabaseKey!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: { fetch: fetchWithTimeout },
    }
  );

  const userId = process.env.MCP_USER_ID || "";

  return { supabase, userId };
}
