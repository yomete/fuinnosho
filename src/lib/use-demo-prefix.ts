"use client";

import { usePathname } from "next/navigation";

export function useDemoPrefix(): string {
  const pathname = usePathname();
  return pathname.startsWith("/demo") ? "/demo" : "";
}
