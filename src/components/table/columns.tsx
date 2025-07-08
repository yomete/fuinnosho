"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Film } from "@/lib/utils";
import { EditFilm } from "@/components/film-form/edit-form";
import { ReduceCountDialog } from "@/components/films/reduce-count-dialog";
import { UsageHistoryDialog } from "@/components/films/usage-history-dialog";

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
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
    sortingFn: (rowA, rowB) => {
      return (
        new Date(rowA.original.created_at).getTime() -
        new Date(rowB.original.created_at).getTime()
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
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <EditFilm film={row.original} />
        {row.original.count !== undefined && row.original.count > 0 && (
          <ReduceCountDialog
            filmId={row.original.id}
            filmName={row.original.name}
            currentCount={row.original.count}
          />
        )}
        <UsageHistoryDialog
          filmId={row.original.id}
          filmName={row.original.name}
          currentCount={row.original.count}
        />
      </div>
    ),
  },
];
