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
import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const DataTable = ({ films }: { films: Film[] }) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize filters from URL only once
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = [];
    
    // Name filter
    const name = searchParams.get("name");
    if (name) {
      filters.push({ id: "name", value: name });
    }
    
    // Brand filters
    const brands = searchParams.get("brands");
    if (brands) {
      filters.push({ id: "brand", value: brands.split(",") });
    }
    
    // Type filters
    const types = searchParams.get("types");
    if (types) {
      filters.push({ id: "type", value: types.split(",") });
    }
    
    // Format filters
    const formats = searchParams.get("formats");
    if (formats) {
      filters.push({ id: "format", value: formats.split(",") });
    }
    
    // ISO filters
    const isos = searchParams.get("isos");
    if (isos) {
      filters.push({ id: "iso", value: isos.split(",").map(Number) });
    }
    
    return filters;
  });

  // Get unique values for filter options
  const uniqueBrands = Array.from(new Set(films.map((film) => film.brand)));
  const uniqueTypes = Array.from(new Set(films.map((film) => film.type)));
  const uniqueFormats = Array.from(new Set(films.map((film) => film.format)));
  const uniqueIsos = Array.from(new Set(films.map((film) => film.iso))).sort(
    (a, b) => a - b
  );

  // Debounced URL update to prevent performance issues
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();
      
      columnFilters.forEach((filter) => {
        if (filter.id === "name" && filter.value) {
          params.set("name", filter.value as string);
        } else if (filter.id === "brand" && Array.isArray(filter.value) && filter.value.length > 0) {
          params.set("brands", filter.value.join(","));
        } else if (filter.id === "type" && Array.isArray(filter.value) && filter.value.length > 0) {
          params.set("types", filter.value.join(","));
        } else if (filter.id === "format" && Array.isArray(filter.value) && filter.value.length > 0) {
          params.set("formats", filter.value.join(","));
        } else if (filter.id === "iso" && Array.isArray(filter.value) && filter.value.length > 0) {
          params.set("isos", filter.value.join(","));
        }
      });
      
      const search = params.toString();
      const query = search ? `?${search}` : "";
      router.replace(`${pathname}${query}`, { scroll: false });
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [columnFilters, pathname, router]);

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

  const activeFilters = columnFilters.reduce((acc, filter) => {
    if (Array.isArray(filter.value)) {
      filter.value.forEach((value) => {
        acc.push({
          column: filter.id,
          value: value.toString(),
        });
      });
    } else if (filter.value) {
      acc.push({
        column: filter.id,
        value: filter.value.toString(),
      });
    }
    return acc;
  }, [] as { column: string; value: string }[]);

  const removeFilter = (column: string, value: string) => {
    const columnFilter = table.getColumn(column);
    if (!columnFilter) return;

    const currentFilters = columnFilter.getFilterValue();
    if (Array.isArray(currentFilters)) {
      columnFilter.setFilterValue(
        currentFilters.filter((v) => v.toString() !== value)
      );
    } else {
      columnFilter.setFilterValue("");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-4">
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
                      (table
                        .getColumn("brand")
                        ?.getFilterValue() as string[]) ?? [];
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
                      (table
                        .getColumn("format")
                        ?.getFilterValue() as string[]) ?? [];
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
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <Badge
                key={`${filter.column}-${filter.value}-${index}`}
                variant="outline"
                className="flex items-center gap-1"
              >
                <span className="font-medium">{filter.column}:</span>
                <span>{filter.value}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 hover:bg-transparent"
                  onClick={() => removeFilter(filter.column, filter.value)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
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
