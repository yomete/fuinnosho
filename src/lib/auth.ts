import { createClient } from "./supabase/client";

export async function getUserProfile() {
  // const session = await getSession();
  // console.log("🚀 ~ getUserProfile ~ session:", session);
  // if (!session) return null;

  // const { data: user } = await supabase
  //   .from("users")
  //   .select("*")
  //   .eq("id", session.user.id)
  //   .single();

  // return user;
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("🚀 ~ getUserProfile ~ user:", user);

  return user;
}
