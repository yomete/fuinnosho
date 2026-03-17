"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings } from "lucide-react";
import { logout } from "@/app/actions/films";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface NavUserIconProps {
  user: {
    email?: string;
    id: string;
  } | null;
  isDemo?: boolean;
}

// Darkroom-friendly muted colors
const COLORS = [
  "#d4a574", // warm amber
  "#8a8078", // muted zinc
  "#4ade80", // emerald
  "#FFD700", // kodak yellow
  "#00A550", // fuji green
  "#E63946", // ilford red
  "#a78bfa", // soft purple
  "#60a5fa", // soft blue
  "#f97316", // orange
  "#14b8a6", // teal
];

function getColorFromString(str: string): string {
  // Create a consistent hash from the string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Use the hash to pick a color
  return COLORS[Math.abs(hash) % COLORS.length];
}

const NavUserIcon = ({ user, isDemo = false }: NavUserIconProps) => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) return null;

  const backgroundColor = isDemo ? "#f97316" : getColorFromString(user.id);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // In demo mode, show a simpler menu without logout
  if (isDemo) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-amber-500 font-medium">Demo</span>
        <div
          className="size-10 rounded-full border border-[#2a2420] flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor }}
        >
          D
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isLoggingOut}>
        <button
          type="button"
          aria-label="User menu"
          className="size-10 rounded-full border border-[#2a2420] cursor-pointer transition-[ring-color,box-shadow,transform,opacity] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:ring-2 hover:ring-amber-600/50 hover:ring-offset-2 hover:ring-offset-[#0d0b0a] active:scale-[0.96] disabled:opacity-50"
          style={{ backgroundColor }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 mt-4">
        <DropdownMenuItem
          className="cursor-pointer flex items-center gap-2 py-3"
          onClick={() => router.push("/settings")}
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer flex items-center gap-2 py-3 text-destructive focus:text-destructive"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="h-4 w-4" />
          <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NavUserIcon;
