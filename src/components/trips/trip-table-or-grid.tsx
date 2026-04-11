"use client";
import { useState } from "react";
import type { Trip } from "@/lib/trips/types";
import { Button } from "@/components/ui/button";
import { TableIcon, GridIcon } from "lucide-react";
import { TripTable } from "./trip-table";
import { TripGrid } from "./trip-grid";

interface TripTableOrGridProps {
  trips: Trip[];
  onTripEdit: (trip: Trip) => void;
  onTripComplete: (trip: Trip) => void;
}

export function TripTableOrGrid({ trips, onTripEdit, onTripComplete }: TripTableOrGridProps) {
  const [view, setView] = useState<"table" | "grid">("table");

  return (
    <div className="space-y-4">
      <div className="flex justify-end px-4">
        <div className="inline-flex rounded-xl border border-[#2f2925] bg-[#1a1614]/70 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_10px_24px_rgba(0,0,0,0.12)]">
          <Button
            variant="ghost"
            size="sm"
            className={`px-3 rounded-lg ${view === "table" ? "bg-[#2a2420] text-[#e8e4e0]" : "text-[#8a8078] hover:text-[#e8e4e0]"}`}
            onClick={() => setView("table")}
          >
            <TableIcon className="h-4 w-4" />
            <span className="sr-only">Table view</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`px-3 rounded-lg ${view === "grid" ? "bg-[#2a2420] text-[#e8e4e0]" : "text-[#8a8078] hover:text-[#e8e4e0]"}`}
            onClick={() => setView("grid")}
          >
            <GridIcon className="h-4 w-4" />
            <span className="sr-only">Grid view</span>
          </Button>
        </div>
      </div>

      {view === "grid" && (
        <div
          className={`
            transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)]
            ${
              view === "grid"
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }
          `}
        >
          <TripGrid trips={trips} onTripEdit={onTripEdit} onTripComplete={onTripComplete} />
        </div>
      )}
      {view === "table" && (
        <div
          className={`
            transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)]
            ${
              view === "table"
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }
          `}
        >
          <TripTable trips={trips} onTripEdit={onTripEdit} onTripComplete={onTripComplete} />
        </div>
      )}
    </div>
  );
}
