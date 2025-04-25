"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { columns } from "./columns";
import { type Film } from "@/lib/utils";
import { useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

const DataTable = ({ films }: { films: Film[] }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Get unique values for filter options
  const uniqueBrands = Array.from(new Set(films.map((film) => film.brand)));
  const uniqueTypes = Array.from(new Set(films.map((film) => film.type)));
  const uniqueFormats = Array.from(new Set(films.map((film) => film.format)));
  const uniqueIsos = Array.from(new Set(films.map((film) => film.iso))).sort(
    (a, b) => a - b
  );

  const table = useReactTable({
    data: films,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Filter by name..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Filter className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Filters
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem className="font-semibold">
              Filter by Brand
            </DropdownMenuItem>
            {uniqueBrands.map((brand) => (
              <DropdownMenuItem
                key={brand}
                onClick={() => {
                  const currentFilters =
                    (table.getColumn("brand")?.getFilterValue() as string[]) ??
                    [];
                  const newFilters = currentFilters.includes(brand)
                    ? currentFilters.filter((b) => b !== brand)
                    : [...currentFilters, brand];
                  table.getColumn("brand")?.setFilterValue(newFilters);
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      (
                        (table
                          .getColumn("brand")
                          ?.getFilterValue() as string[]) ?? []
                      ).includes(brand)
                        ? "bg-primary"
                        : "bg-muted"
                    )}
                  />
                  {brand}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem className="font-semibold">
              Filter by Type
            </DropdownMenuItem>
            {uniqueTypes.map((type) => (
              <DropdownMenuItem
                key={type}
                onClick={() => {
                  const currentFilters =
                    (table.getColumn("type")?.getFilterValue() as string[]) ??
                    [];
                  const newFilters = currentFilters.includes(type)
                    ? currentFilters.filter((t) => t !== type)
                    : [...currentFilters, type];
                  table.getColumn("type")?.setFilterValue(newFilters);
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      (
                        (table
                          .getColumn("type")
                          ?.getFilterValue() as string[]) ?? []
                      ).includes(type)
                        ? "bg-primary"
                        : "bg-muted"
                    )}
                  />
                  {type}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem className="font-semibold">
              Filter by Format
            </DropdownMenuItem>
            {uniqueFormats.map((format) => (
              <DropdownMenuItem
                key={format}
                onClick={() => {
                  const currentFilters =
                    (table.getColumn("format")?.getFilterValue() as string[]) ??
                    [];
                  const newFilters = currentFilters.includes(format)
                    ? currentFilters.filter((f) => f !== format)
                    : [...currentFilters, format];
                  table.getColumn("format")?.setFilterValue(newFilters);
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      (
                        (table
                          .getColumn("format")
                          ?.getFilterValue() as string[]) ?? []
                      ).includes(format)
                        ? "bg-primary"
                        : "bg-muted"
                    )}
                  />
                  {format}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem className="font-semibold">
              Filter by ISO
            </DropdownMenuItem>
            {uniqueIsos.map((iso) => (
              <DropdownMenuItem
                key={iso}
                onClick={() => {
                  const currentFilters =
                    (table.getColumn("iso")?.getFilterValue() as number[]) ??
                    [];
                  const newFilters = currentFilters.includes(iso)
                    ? currentFilters.filter((i) => i !== iso)
                    : [...currentFilters, iso];
                  table.getColumn("iso")?.setFilterValue(newFilters);
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      (
                        (table
                          .getColumn("iso")
                          ?.getFilterValue() as number[]) ?? []
                      ).includes(iso)
                        ? "bg-primary"
                        : "bg-muted"
                    )}
                  />
                  {iso}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border p-2">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            "flex items-center gap-1",
                            header.column.getCanSort() &&
                              "cursor-pointer select-none"
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <ArrowUpDown className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DataTable;
