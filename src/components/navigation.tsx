"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Film, MapPin } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();

  const links = [
    {
      href: "/films",
      label: "Films",
      icon: Film,
      active: pathname.startsWith("/films"),
    },
    {
      href: "/trips",
      label: "Trips",
      icon: MapPin,
      active: pathname.startsWith("/trips"),
    },
  ];

  return (
    <nav className="fixed top-4 left-4 z-50">
      <div className="flex items-center space-x-1 bg-background border rounded-lg p-1 shadow-sm">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                link.active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}