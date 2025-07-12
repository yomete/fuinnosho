"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Film } from "@/lib/utils";
import { EditFilm } from "@/components/film-form/edit-form";
import { ReduceCountDialog } from "@/components/films/reduce-count-dialog";
import { UsageHistoryDialog } from "@/components/films/usage-history-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Minus, History } from "lucide-react";
import { useState } from "react";

const ActionsCell = ({ row }: { row: { original: Film } }) => {
  const film = row.original;
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="flex items-center">
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem 
            onSelect={(event) => {
              event.preventDefault();
              setDropdownOpen(false);
              // Small delay to ensure dropdown closes before dialog opens
              setTimeout(() => {
                const editButton = document.querySelector(`[data-edit-film="${film.id}"] button`);
                if (editButton) {
                  (editButton as HTMLElement).click();
                }
              }, 100);
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          {film.count !== undefined && film.count > 0 && (
            <DropdownMenuItem 
              onSelect={(event) => {
                event.preventDefault();
                setDropdownOpen(false);
                setTimeout(() => {
                  const reduceButton = document.querySelector(`[data-reduce-film="${film.id}"] button`);
                  if (reduceButton) {
                    (reduceButton as HTMLElement).click();
                  }
                }, 100);
              }}
            >
              <Minus className="mr-2 h-4 w-4" />
              Use Film
            </DropdownMenuItem>
          )}
          <DropdownMenuItem 
            onSelect={(event) => {
              event.preventDefault();
              setDropdownOpen(false);
              setTimeout(() => {
                const historyButton = document.querySelector(`[data-history-film="${film.id}"] button`);
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
      <div style={{ position: 'absolute', left: '-9999px', opacity: 0 }}>
        <div data-edit-film={film.id}>
          <EditFilm film={film} />
        </div>
        {film.count !== undefined && film.count > 0 && (
          <div data-reduce-film={film.id}>
            <ReduceCountDialog
              filmId={film.id}
              filmName={film.name}
              currentCount={film.count}
            />
          </div>
        )}
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
      return Array.isArray(filterValue) ? filterValue.includes(row.getValue(columnId)) : true;
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
      return Array.isArray(filterValue) ? filterValue.includes(row.getValue(columnId)) : true;
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
      return Array.isArray(filterValue) ? filterValue.includes(row.getValue(columnId)) : true;
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
      return Array.isArray(filterValue) ? filterValue.includes(row.getValue(columnId)) : true;
    },
  },
  {
    accessorKey: "expiration_date",
    header: "Expiration Date",
    cell: ({ row }) =>
      new Date(row.original.expiration_date).toLocaleDateString(),
    sortingFn: (rowA, rowB) => {
      return (
        new Date(rowA.original.expiration_date).getTime() -
        new Date(rowB.original.expiration_date).getTime()
      );
    },
  },
  {
    accessorKey: "count",
    header: "Total Count",
    cell: ({ row }) => {
      const film = row.original;
      if (film.is_bulk_film) {
        return (
          <div className="space-y-1">
            <div className="font-medium text-blue-600">
              {film.bulk_quantity}× {film.bulk_length_meters}m bulk
            </div>
            <div className="text-sm text-muted-foreground">
              ≈ {film.calculated_rolls} total rolls
            </div>
          </div>
        );
      }
      return film.count || 0;
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
      const available = film.available_count ?? 0;
      const isLow = available <= 2 && available > 0;
      const isEmpty = available === 0;
      
      if (film.is_bulk_film) {
        return (
          <div className="space-y-1">
            <span className={`font-medium ${isEmpty ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-green-600'}`}>
              {available} rolls
            </span>
            <div className="text-xs text-muted-foreground">
              from bulk
            </div>
          </div>
        );
      }
      
      return (
        <span className={`font-medium ${isEmpty ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-green-600'}`}>
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
