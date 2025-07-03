"use client";
import { useState } from "react";
import { Gear } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TableIcon, GridIcon } from "lucide-react";
import { GearTable } from "./gear-table";
import { GearGrid } from "./gear-grid";

interface GearTableOrGridProps {
  gear: Gear[];
}

export function GearTableOrGrid({ gear }: GearTableOrGridProps) {
  const [view, setView] = useState<"table" | "grid">("table");

  return (
    <div className="space-y-4">
      <div className="flex justify-end px-4">
        <div className="inline-flex rounded-lg border bg-background p-1">
          <Button
            variant="ghost"
            size="sm"
            className={`px-3 ${view === "table" ? "bg-muted" : ""}`}
            onClick={() => setView("table")}
          >
            <TableIcon className="h-4 w-4" />
            <span className="sr-only">Table view</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`px-3 ${view === "grid" ? "bg-muted" : ""}`}
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
            transition-all duration-300 ease-in-out
            ${
              view === "grid"
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }
          `}
        >
          <GearGrid gear={gear} />
        </div>
      )}
      {view === "table" && (
        <div
          className={`
            transition-all duration-300 ease-in-out
            ${
              view === "table"
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }
          `}
        >
          <GearTable gear={gear} />
        </div>
      )}
    </div>
  );
}