import { createClient as createBrowserClient } from "./supabase/client";
import { createClient as createServerClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";
import { DEMO_USER_ID, isDemoModeAsync } from "./demo";

export async function getUserProfile() {
  const supabase = createBrowserClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * Get the effective user ID for the current request
 * In demo mode, returns the demo user ID
 * In normal mode, returns the authenticated user's ID
 */
export async function getEffectiveUser(): Promise<{
  userId: string | null;
  isDemo: boolean;
}> {
  if (await isDemoModeAsync()) {
    return { userId: DEMO_USER_ID, isDemo: true };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { userId: user?.id ?? null, isDemo: false };
}

/**
 * Get the appropriate Supabase client for data operations
 * In demo mode, uses admin client to bypass RLS (since demo user isn't in auth.users)
 * In normal mode, uses regular client with RLS
 */
export async function getDataClient() {
  if (await isDemoModeAsync()) {
    return createAdminClient();
  }
  return createServerClient();
}
