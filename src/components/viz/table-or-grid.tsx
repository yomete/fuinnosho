"use client";
import { useState } from "react";
import { Film } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TableIcon, GridIcon } from "lucide-react";
import FilmsTableV2 from "@/components/table";
import FilmInventoryGrid from "@/components/viz/film-inventory-grid";

const TableOrGrid = ({ films }: { films: Film[] }) => {
  const [view, setView] = useState<"table" | "grid">("table");

  return (
    <div className="space-y-4">
      <div className="flex justify-end px-2 sm:px-4">
        <div className="inline-flex rounded-xl border border-[#2f2925] bg-[#1a1614]/80 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_10px_24px_rgba(0,0,0,0.12)]">
          <Button
            variant="ghost"
            size="sm"
            className={`px-2 sm:px-3 rounded-lg transition-[background-color,color] duration-200 ease-[cubic-bezier(0.2,0,0,1)] ${
              view === "table"
                ? "bg-[#2a2420] text-[#e8e4e0]"
                : "text-[#6a6460] hover:text-[#8a8078] hover:bg-transparent"
            }`}
            onClick={() => setView("table")}
          >
            <TableIcon className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-2 text-xs">
              Table
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`px-2 sm:px-3 rounded-lg transition-[background-color,color] duration-200 ease-[cubic-bezier(0.2,0,0,1)] ${
              view === "grid"
                ? "bg-[#2a2420] text-[#e8e4e0]"
                : "text-[#6a6460] hover:text-[#8a8078] hover:bg-transparent"
            }`}
            onClick={() => setView("grid")}
          >
            <GridIcon className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-2 text-xs">Grid</span>
          </Button>
        </div>
      </div>

      {/* Use ternary for conditional rendering - avoids rendering both components (rendering-conditional-render) */}
      {view === "grid" ? (
        <FilmInventoryGrid films={films} />
      ) : (
        <FilmsTableV2 films={films} />
      )}
    </div>
  );
};

export default TableOrGrid;
