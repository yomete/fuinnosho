"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function useAuth() {
  const router = useRouter();
  const supabase = createClient();

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.refresh();
      router.push("/login");
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Error signing out", error);
      toast.error("Error signing out");
    }
  };

  return {
    signOut,
  };
}
