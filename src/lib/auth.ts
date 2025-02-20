import { createClient } from "./supabase/server";

export async function getSession() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getUserProfile() {
  const supabase = await createClient();

  const session = await getSession();
  if (!session) return null;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .single();

  return user;
}
