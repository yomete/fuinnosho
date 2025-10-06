"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Film, formatDate } from "@/lib/utils";
import { EditFilm } from "@/components/film-form/edit-form";
import { ReduceCountDialog } from "@/components/films/reduce-count-dialog";
import { UsageHistoryDialog } from "@/components/films/usage-history-dialog";
import { SpoolBulkDialog } from "@/components/films/spool-bulk-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, History, Eye } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

const ActionsCell = ({ row }: { row: { original: Film } }) => {
  const film = row.original;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filmData, setFilmData] = useState(film);

  // Sync local state when film prop changes
  useEffect(() => {
    setFilmData(film);
  }, [film]);

  const handleSpoolingComplete = (
    remainingExposures: number,
    spooledCassettes: number
  ) => {
    setFilmData((prev) => ({
      ...prev,
      bulk_remaining_exposures: remainingExposures,
      spooled_cassettes: spooledCassettes,
      count: spooledCassettes,
    }));
  };

  const handleCountUpdated = (newCount: number) => {
    setFilmData((prev) => ({
      ...prev,
      count: newCount,
      spooled_cassettes: film.is_bulk_film ? newCount : prev.spooled_cassettes,
    }));
  };

  return (
    <div className="flex items-center gap-2">
      {film.is_bulk_film && (
        <SpoolBulkDialog
          filmId={filmData.id}
          filmName={filmData.name}
          format={filmData.format}
          remainingExposures={filmData.bulk_remaining_exposures || 0}
          spooledCassettes={filmData.spooled_cassettes || 0}
          onSpoolingComplete={handleSpoolingComplete}
        />
      )}
      <ReduceCountDialog
        filmId={filmData.id}
        filmName={filmData.name}
        currentCount={filmData.count || 0}
        onCountUpdated={handleCountUpdated}
      />
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/film/${film.id}`} className="flex items-center">
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setDropdownOpen(false);
              // Small delay to ensure dropdown closes before dialog opens
              setTimeout(() => {
                const editButton = document.querySelector(
                  `[data-edit-film="${film.id}"] button`
                );
                if (editButton) {
                  (editButton as HTMLElement).click();
                }
              }, 100);
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setDropdownOpen(false);
              setTimeout(() => {
                const historyButton = document.querySelector(
                  `[data-history-film="${film.id}"] button`
                );
                if (historyButton) {
                  (historyButton as HTMLElement).click();
                }
              }, 100);
            }}
          >
            <History className="mr-2 h-4 w-4" />
            History
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Hidden dialog triggers with data attributes */}
      <div style={{ position: "absolute", left: "-9999px", opacity: 0 }}>
        <div data-edit-film={film.id}>
          <EditFilm film={film} />
        </div>
        <div data-history-film={film.id}>
          <UsageHistoryDialog
            filmId={film.id}
            filmName={film.name}
            currentCount={film.count}
          />
        </div>
      </div>
    </div>
  );
};

export const columns: ColumnDef<Film>[] = [
  {
    accessorKey: "name",
    header: "Name",
    filterFn: "includesString",
  },
  {
    accessorKey: "brand",
    header: "Brand",
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;
      if (filterValue.not) {
        return !filterValue.not.includes(row.getValue(columnId));
      }
      if (Array.isArray(filterValue) && filterValue.length === 0) return true;
      return Array.isArray(filterValue)
        ? filterValue.includes(row.getValue(columnId))
        : true;
    },
  },
  {
    accessorKey: "iso",
    header: "ISO",
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;
      if (filterValue.not) {
        return !filterValue.not.includes(row.getValue(columnId));
      }
      if (Array.isArray(filterValue) && filterValue.length === 0) return true;
      return Array.isArray(filterValue)
        ? filterValue.includes(row.getValue(columnId))
        : true;
    },
  },
  {
    accessorKey: "format",
    header: "Format",
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;
      if (filterValue.not) {
        return !filterValue.not.includes(row.getValue(columnId));
      }
      if (Array.isArray(filterValue) && filterValue.length === 0) return true;
      return Array.isArray(filterValue)
        ? filterValue.includes(row.getValue(columnId))
        : true;
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;
      if (filterValue.not) {
        return !filterValue.not.includes(row.getValue(columnId));
      }
      if (Array.isArray(filterValue) && filterValue.length === 0) return true;
      return Array.isArray(filterValue)
        ? filterValue.includes(row.getValue(columnId))
        : true;
    },
  },
  {
    accessorKey: "is_ecn",
    header: "ECN",
    cell: ({ row }) => {
      const film = row.original;
      return film.is_ecn ? (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          ECN
        </span>
      ) : null;
    },
    filterFn: (row, columnId, filterValue) => {
      if (filterValue === undefined || filterValue === "") return true;
      const isEcn = Boolean(row.getValue(columnId));
      return Boolean(filterValue) ? isEcn : !isEcn;
    },
  },
  {
    accessorKey: "expiration_date",
    header: "Expiration Date",
    cell: ({ row }) => formatDate(row.original.expiration_date),
    sortingFn: (rowA, rowB) => {
      return (
        new Date(rowA.original.expiration_date).getTime() -
        new Date(rowB.original.expiration_date).getTime()
      );
    },
  },
  {
    accessorKey: "count",
    header: "Bulk Status / Count",
    cell: ({ row }) => {
      const film = row.original;
      if (film.is_bulk_film) {
        const remainingExposures = film.bulk_remaining_exposures || 0;
        const spooledCassettes = film.spooled_cassettes || 0;
        // const totalExposures =
        //   (film.calculated_rolls || 0) * (film.format === "120" ? 12 : 36);

        return (
          <div className="text-center space-y-0.5">
            <div className="text-sm">
              <span className="font-medium text-blue-600">
                {remainingExposures} exp
              </span>
              <div className="text-xs text-muted-foreground">remaining</div>
            </div>
            <div className="text-xs text-muted-foreground">
              {spooledCassettes} cassettes ready
            </div>
          </div>
        );
      }
      return (
        <div className="text-center">
          <span className="font-medium">{film.count || 0}</span>
          <div className="text-xs text-muted-foreground">rolls</div>
        </div>
      );
    },
  },
  {
    accessorKey: "reserved_quantity",
    header: "Reserved",
    cell: ({ row }) => row.original.reserved_quantity || 0,
  },
  {
    accessorKey: "available_count",
    header: "Available for Shooting",
    cell: ({ row }) => {
      const film = row.original;

      if (film.is_bulk_film) {
        // For bulk films, available = spooled cassettes - reserved
        const spooledCassettes = film.spooled_cassettes || 0;
        const reserved = film.reserved_quantity || 0;
        const available = Math.max(0, spooledCassettes - reserved);
        const isLow = available <= 2 && available > 0;
        const isEmpty = available === 0;

        return (
          <div className="text-center">
            <span
              className={`font-medium ${
                isEmpty
                  ? "text-red-600"
                  : isLow
                  ? "text-yellow-600"
                  : "text-green-600"
              }`}
            >
              {available}
            </span>
            <div className="text-xs text-muted-foreground">cassettes</div>
          </div>
        );
      }

      const available = film.available_count ?? 0;
      const isLow = available <= 2 && available > 0;
      const isEmpty = available === 0;

      return (
        <span
          className={`font-medium ${
            isEmpty
              ? "text-red-600"
              : isLow
              ? "text-yellow-600"
              : "text-green-600"
          }`}
        >
          {available}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell row={row} />,
  },
];
