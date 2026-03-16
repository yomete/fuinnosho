import { createClient, SupabaseClient } from "@supabase/supabase-js";

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
    }
  );

  const userId = process.env.MCP_USER_ID || "";

  return { supabase, userId };
}
