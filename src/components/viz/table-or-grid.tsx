"use client";
import { useState } from "react";
import { Film } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TableIcon, GridIcon } from "lucide-react";
import DataTable from "@/components/table";
import FilmInventoryGrid from "@/components/viz/film-inventory-grid";

const TableOrGrid = ({ films }: { films: Film[] }) => {
  const [view, setView] = useState<"table" | "grid">("table");

  return (
    <div className="space-y-4 ">
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
          <FilmInventoryGrid films={films} />
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
          <DataTable films={films} />
        </div>
      )}
    </div>
  );
};

export default TableOrGrid;
