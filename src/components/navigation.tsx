"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Film, MapPin, Camera, Target } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();
  const isDemo = pathname.startsWith("/demo");
  const prefix = isDemo ? "/demo" : "";

  const links = [
    {
      href: `${prefix}/films`,
      label: "Films",
      icon: Film,
      active: pathname.startsWith(`${prefix}/films`) || pathname.startsWith(`${prefix}/film`),
    },
    {
      href: `${prefix}/gear`,
      label: "Gear",
      icon: Camera,
      active: pathname.startsWith(`${prefix}/gear`),
    },
    {
      href: `${prefix}/trips`,
      label: "Trips",
      icon: MapPin,
      active: pathname.startsWith(`${prefix}/trips`),
    },
  ];

  return (
    <nav className="fixed top-6 left-6 z-50">
      <div className="flex items-center gap-1 bg-[#1a1614]/90 backdrop-blur-md border border-[#2a2420] rounded-full p-1.5 shadow-2xl shadow-black/50">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                link.active
                  ? "bg-gradient-to-r from-amber-600/90 to-orange-700/90 text-white shadow-lg shadow-amber-900/30"
                  : "text-[#8a8078] hover:text-[#e8e4e0] hover:bg-[#2a2420]/50"
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
