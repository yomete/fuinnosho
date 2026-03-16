"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { X, RefreshCw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const isDemoEnv = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function DemoBanner() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const isDemoRoute = pathname.startsWith("/demo");

  if ((!isDemoEnv && !isDemoRoute) || !isVisible) {
    return null;
  }

  const handleReset = async () => {
    if (
      !confirm(
        "This will reset all demo data to its original state. Continue?"
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch("/api/reset-demo", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Reset failed");
      }

      toast.success("Demo data has been reset!");
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reset demo"
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Info className="h-4 w-4 flex-shrink-0" />
          <span>
            <strong>Demo Mode</strong> - Explore all features freely. Data is
            shared and not saved permanently.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isResetting}
            className="text-white hover:bg-white/20 text-xs h-7"
          >
            <RefreshCw
              className={`h-3 w-3 mr-1 ${isResetting ? "animate-spin" : ""}`}
            />
            {isResetting ? "Resetting..." : "Reset Demo"}
          </Button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white/80 hover:text-white p-1"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
