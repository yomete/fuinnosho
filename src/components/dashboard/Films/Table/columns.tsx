"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Film } from "../utils";
import { Button } from "@/components/ui/button";

export const columns: ColumnDef<Film>[] = [
  {
    header: "Barcode",
    cell: ({ row }) => row.original.barcode,
  },
  {
    header: "Name",
    cell: ({ row }) => row.original.name,
  },
  {
    header: "Brand",
    cell: ({ row }) => row.original.brand,
  },
  {
    header: "ISO",
    cell: ({ row }) => row.original.iso,
  },
  {
    header: "Format",
    cell: ({ row }) => row.original.format,
  },
  {
    header: "Type",
    cell: ({ row }) => row.original.type,
  },
  {
    header: "Expiration Date",
    cell: ({ row }) => row.original.expiration_date,
  },
  {
    header: "Created At",
    cell: ({ row }) => row.original.created_at,
  },
  {
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button variant="outline">Edit</Button>
      </div>
    ),
  },
];
