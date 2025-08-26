"use client";

import { useEffect, useState } from "react";
import NavUserIcon from "./nav-user-icon";

const NavUserIconWrapper = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // For now, just return null to prevent hydration issues
  // You can add user fetching logic here later if needed
  return null;
};

export default NavUserIconWrapper;
