import Dashboard from "@/components/dashboard";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();

  return <p>Hello {user?.user?.email}</p>;
}
