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
    user: {
      email: string;
      id: string;
    } | null;
  };
}

const COLORS = [
  "#FF6B6B", // red
  "#4ECDC4", // teal
  "#45B7D1", // blue
  "#96CEB4", // green
  "#FFEEAD", // yellow
  "#D4A5A5", // pink
  "#9B59B6", // purple
  "#3498DB", // bright blue
  "#E67E22", // orange
  "#1ABC9C", // turquoise
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

const NavUserIcon = ({ user }: NavUserIconProps) => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user?.user) return null;

  const backgroundColor = getColorFromString(user.user.id);

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isLoggingOut}>
        <div
          className="w-6 h-6 bg-gray-200 rounded-full cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-offset-background hover:ring-muted-foreground transition-all disabled:opacity-50"
          style={{ backgroundColor }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 mt-4">
        <DropdownMenuItem className="cursor-pointer flex items-center gap-2 py-3">
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
