"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Film } from "@/lib/utils";
import { EditFilm } from "@/components/film-form/edit-form";

export const columns: ColumnDef<Film>[] = [
  {
    accessorKey: "name",
    header: "Name",
    filterFn: "includesString",
  },
  {
    accessorKey: "brand",
    header: "Brand",
    filterFn: "arrIncludesSome",
    filterVariant: "select",
  },
  {
    accessorKey: "iso",
    header: "ISO",
    filterFn: "equals",
    filterVariant: "select",
  },
  {
    accessorKey: "format",
    header: "Format",
    filterFn: "arrIncludesSome",
    filterVariant: "select",
  },
  {
    accessorKey: "type",
    header: "Type",
    filterFn: "arrIncludesSome",
    filterVariant: "select",
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
    header: "Count",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <EditFilm film={row.original} />
      </div>
    ),
  },
];
