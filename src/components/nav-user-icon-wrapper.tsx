"use client";

import { useEffect, useState } from "react";
import NavUserIcon from "./nav-user-icon";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

const NavUserIconWrapper = () => {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setMounted(true);

    const supabase = createClient();

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return <NavUserIcon user={user} />;
};

export default NavUserIconWrapper;
