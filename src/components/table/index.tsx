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
import { useState, useEffect, useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, Film as FilmIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { EnhancedFilters } from "./enhanced-filters";

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

  const [hideZeroQuantity, setHideZeroQuantity] = useState(false);

  // Debounced URL update to prevent performance issues
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();

      columnFilters.forEach((filter) => {
        if (filter.id === "name" && filter.value) {
          params.set("name", filter.value as string);
        } else if (
          filter.id === "brand" &&
          Array.isArray(filter.value) &&
          filter.value.length > 0
        ) {
          params.set("brands", filter.value.join(","));
        } else if (
          filter.id === "type" &&
          Array.isArray(filter.value) &&
          filter.value.length > 0
        ) {
          params.set("types", filter.value.join(","));
        } else if (
          filter.id === "format" &&
          Array.isArray(filter.value) &&
          filter.value.length > 0
        ) {
          params.set("formats", filter.value.join(","));
        } else if (
          filter.id === "iso" &&
          Array.isArray(filter.value) &&
          filter.value.length > 0
        ) {
          params.set("isos", filter.value.join(","));
        }
      });

      const search = params.toString();
      const query = search ? `?${search}` : "";
      router.replace(`${pathname}${query}`, { scroll: false });
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [columnFilters, pathname, router]);

  // Filter films to hide zero quantity if enabled
  const filteredFilms = hideZeroQuantity
    ? films.filter(
        (film) =>
          (typeof film.available_count === "number"
            ? film.available_count
            : film.count || 0) > 0
      )
    : films;

  const table = useReactTable({
    data: filteredFilms,
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
    if (
      filter.value &&
      typeof filter.value === "object" &&
      "not" in filter.value &&
      filter.value.not
    ) {
      (filter.value.not as (string | number)[]).forEach(
        (value: string | number) => {
          acc.push({
            column: filter.id,
            value: value.toString(),
            isNot: true,
          });
        }
      );
    } else if (Array.isArray(filter.value)) {
      filter.value.forEach((value) => {
        acc.push({
          column: filter.id,
          value: value.toString(),
          isNot: false,
        });
      });
    } else if (filter.value) {
      acc.push({
        column: filter.id,
        value: filter.value.toString(),
        isNot: false,
      });
    }
    return acc;
  }, [] as { column: string; value: string; isNot: boolean }[]);

  const removeFilter = useCallback((column: string, value: string) => {
    const columnFilter = table.getColumn(column);
    if (!columnFilter) return;

    const currentFilters = columnFilter.getFilterValue();
    if (
      currentFilters &&
      typeof currentFilters === "object" &&
      "not" in currentFilters &&
      currentFilters.not
    ) {
      const newNotFilters = (currentFilters.not as (string | number)[]).filter(
        (v: string | number) => v.toString() !== value
      );
      columnFilter.setFilterValue(
        newNotFilters.length > 0 ? { not: newNotFilters } : undefined
      );
    } else if (Array.isArray(currentFilters)) {
      const newFilters = currentFilters.filter((v) => v.toString() !== value);
      columnFilter.setFilterValue(
        newFilters.length > 0 ? newFilters : undefined
      );
    } else {
      columnFilter.setFilterValue("");
    }
  }, [table]);

  const handleFiltersChange = useCallback((filters: {
    name: string;
    brands: string[];
    types: string[];
    formats: string[];
    isos: number[];
    isoRange: [number, number];
    notBrands: string[];
    notTypes: string[];
    notFormats: string[];
    notIsos: number[];
    hideZeroQuantity: boolean;
  }) => {
    // Only update hideZeroQuantity if it actually changed to prevent loops
    setHideZeroQuantity(prev => prev !== filters.hideZeroQuantity ? filters.hideZeroQuantity : prev);
    table.getColumn("name")?.setFilterValue(filters.name);

    // Handle regular and NOT filters
    const brandFilter =
      filters.brands.length > 0
        ? filters.brands
        : filters.notBrands.length > 0
        ? { not: filters.notBrands }
        : undefined;
    const typeFilter =
      filters.types.length > 0
        ? filters.types
        : filters.notTypes.length > 0
        ? { not: filters.notTypes }
        : undefined;
    const formatFilter =
      filters.formats.length > 0
        ? filters.formats
        : filters.notFormats.length > 0
        ? { not: filters.notFormats }
        : undefined;
    const isoFilter =
      filters.isos.length > 0
        ? filters.isos
        : filters.notIsos.length > 0
        ? { not: filters.notIsos }
        : undefined;

    table.getColumn("brand")?.setFilterValue(brandFilter);
    table.getColumn("type")?.setFilterValue(typeFilter);
    table.getColumn("format")?.setFilterValue(formatFilter);
    table.getColumn("iso")?.setFilterValue(isoFilter);
  }, [table, setHideZeroQuantity]);

  const clearAllFilters = useCallback(() => {
    table.resetColumnFilters();
  }, [table]);

  const handleRemoveFilter = useCallback((column: string, value: string) => {
    if (column === "quantity" && value === "hide-zero")
      setHideZeroQuantity(false);
    else removeFilter(column, value);
  }, [removeFilter, setHideZeroQuantity]);

  const memoizedActiveFilters = useMemo(() => 
    activeFilters.concat(
      hideZeroQuantity
        ? [{ column: "quantity", value: "hide-zero", isNot: false }]
        : []
    ),
    [activeFilters, hideZeroQuantity]
  );

  return (
    <div className="flex flex-col gap-4 p-2 sm:p-4">
      <EnhancedFilters
        films={films}
        onFiltersChange={handleFiltersChange}
        activeFilters={memoizedActiveFilters}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={clearAllFilters}
      />
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
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
                table
                  .getRowModel()
                  .rows.filter(
                    (row) =>
                      !hideZeroQuantity ||
                      (typeof row.original.available_count === "number"
                        ? row.original.available_count
                        : row.original.count || 0) > 0
                  )
                  .map((row) => (
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
                  <TableCell colSpan={columns.length} className="p-0">
                    <EmptyState
                      icon={FilmIcon}
                      title="No films found"
                      description="Add films to your inventory or adjust your filters to see results."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
