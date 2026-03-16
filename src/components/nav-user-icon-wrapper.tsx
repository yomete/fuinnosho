"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import NavUserIcon from "./nav-user-icon";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { DEMO_USER_ID } from "@/lib/demo";

const isDemoEnv = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const NavUserIconWrapper = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const isDemo = isDemoEnv || pathname.startsWith("/demo");

  useEffect(() => {
    setMounted(true);

    // In demo mode, create a fake user object
    if (isDemo) {
      setUser({
        id: DEMO_USER_ID,
        email: "demo@fuinnosho.app",
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as User);
      return;
    }

    const supabase = createClient();

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isDemo]);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return <NavUserIcon user={user} isDemo={isDemo} />;
};

export default NavUserIconWrapper;
