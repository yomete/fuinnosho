"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Film, MapPin, Camera, BarChart3, Target, Shield } from "lucide-react";

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
      href: "/gear",
      label: "Gear",
      icon: Camera,
      active: pathname.startsWith("/gear"),
    },
    {
      href: "/trips",
      label: "Trips",
      icon: MapPin,
      active: pathname.startsWith("/trips"),
    },
    {
      href: "/challenges",
      label: "Challenges",
      icon: Target,
      active: pathname.startsWith("/challenge"),
    },
    {
      href: "/usage",
      label: "Usage",
      icon: BarChart3,
      active: pathname.startsWith("/usage"),
    },
    {
      href: "/admin",
      label: "Admin",
      icon: Shield,
      active: pathname.startsWith("/admin"),
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
                "flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors",
                link.active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}