import { createClient } from "./supabase/client";

export async function getUserProfile() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
