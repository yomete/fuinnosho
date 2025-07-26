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
import { useState, useEffect, useCallback, useMemo, useReducer } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { EnhancedFiltersV2, FilterAction } from "./enhanced-filters-v2";
import { filterReducer, createInitialFilterState } from "./filter-reducer";

interface FilmsTableV2Props {
  films: Film[];
}

export default function FilmsTableV2({ films }: FilmsTableV2Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Extract unique ISOs for initial state
  const uniqueIsos = useMemo(() => 
    Array.from(new Set(films.map((film) => film.iso))).sort((a, b) => a - b),
    [films]
  );

  // All filter state managed by reducer - single source of truth
  const [filterState, dispatch] = useReducer(
    filterReducer, 
    uniqueIsos, 
    createInitialFilterState
  );

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Sync URL params on column filter changes (existing functionality)
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    
    columnFilters.forEach((filter) => {
      if (filter.value !== undefined && filter.value !== "") {
        if (Array.isArray(filter.value)) {
          params.set(filter.id, filter.value.join(","));
        } else {
          params.set(filter.id, String(filter.value));
        }
      } else {
        params.delete(filter.id);
      }
    });

    const timeoutId = setTimeout(() => {
      const search = params.toString();
      const query = search ? `?${search}` : "";
      router.replace(`${pathname}${query}`, { scroll: false });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [columnFilters, pathname, router, searchParams]);

  // Apply filters to data based on current filter state
  const filteredFilms = useMemo(() => {
    let result = films;

    // Hide zero quantity filter
    if (filterState.hideZeroQuantity) {
      result = result.filter(
        (film) =>
          (typeof film.available_count === "number"
            ? film.available_count
            : film.count || 0) > 0
      );
    }

    return result;
  }, [films, filterState.hideZeroQuantity]);

  // Update table column filters when filter state changes
  useEffect(() => {
    const newColumnFilters: ColumnFiltersState = [];

    // Name filter
    if (filterState.name) {
      newColumnFilters.push({ id: "name", value: filterState.name });
    }

    // Brand filters
    if (filterState.brands.length > 0) {
      newColumnFilters.push({ id: "brand", value: filterState.brands });
    } else if (filterState.notBrands.length > 0) {
      newColumnFilters.push({ id: "brand", value: { not: filterState.notBrands } });
    }

    // Type filters
    if (filterState.types.length > 0) {
      newColumnFilters.push({ id: "type", value: filterState.types });
    } else if (filterState.notTypes.length > 0) {
      newColumnFilters.push({ id: "type", value: { not: filterState.notTypes } });
    }

    // Format filters
    if (filterState.formats.length > 0) {
      newColumnFilters.push({ id: "format", value: filterState.formats });
    } else if (filterState.notFormats.length > 0) {
      newColumnFilters.push({ id: "format", value: { not: filterState.notFormats } });
    }

    // ISO filters
    if (filterState.isos.length > 0) {
      newColumnFilters.push({ id: "iso", value: filterState.isos });
    } else if (filterState.notIsos.length > 0) {
      newColumnFilters.push({ id: "iso", value: { not: filterState.notIsos } });
    }

    setColumnFilters(newColumnFilters);
  }, [filterState]);

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

  // Generate active filters display
  const activeFilters = useMemo(() => {
    const filters: { column: string; value: string; isNot: boolean }[] = [];

    // Add regular filters
    filterState.brands.forEach(brand => 
      filters.push({ column: "brand", value: brand, isNot: false })
    );
    filterState.types.forEach(type => 
      filters.push({ column: "type", value: type, isNot: false })
    );
    filterState.formats.forEach(format => 
      filters.push({ column: "format", value: format, isNot: false })
    );
    filterState.isos.forEach(iso => 
      filters.push({ column: "iso", value: iso.toString(), isNot: false })
    );

    // Add NOT filters
    filterState.notBrands.forEach(brand => 
      filters.push({ column: "brand", value: brand, isNot: true })
    );
    filterState.notTypes.forEach(type => 
      filters.push({ column: "type", value: type, isNot: true })
    );
    filterState.notFormats.forEach(format => 
      filters.push({ column: "format", value: format, isNot: true })
    );
    filterState.notIsos.forEach(iso => 
      filters.push({ column: "iso", value: iso.toString(), isNot: true })
    );

    // Add hide zero quantity filter
    if (filterState.hideZeroQuantity) {
      filters.push({ column: "quantity", value: "hide-zero", isNot: false });
    }

    return filters;
  }, [filterState]);

  // Handle filter actions from child component
  const handleFilterAction = useCallback((action: FilterAction) => {
    dispatch(action);
  }, []);

  // Handle removing individual filters
  const handleRemoveFilter = useCallback((column: string, value: string) => {
    if (column === "quantity" && value === "hide-zero") {
      dispatch({ type: 'TOGGLE_HIDE_ZERO', value: false });
      return;
    }

    // Remove from appropriate filter array
    if (column === "brand") {
      const brandInRegular = filterState.brands.includes(value);
      const brandInNot = filterState.notBrands.includes(value);
      if (brandInRegular) {
        dispatch({ type: 'TOGGLE_BRAND', brand: value, isNot: false });
      } else if (brandInNot) {
        dispatch({ type: 'TOGGLE_BRAND', brand: value, isNot: true });
      }
    } else if (column === "type") {
      const typeInRegular = filterState.types.includes(value);
      const typeInNot = filterState.notTypes.includes(value);
      if (typeInRegular) {
        dispatch({ type: 'TOGGLE_TYPE', filmType: value, isNot: false });
      } else if (typeInNot) {
        dispatch({ type: 'TOGGLE_TYPE', filmType: value, isNot: true });
      }
    } else if (column === "format") {
      const formatInRegular = filterState.formats.includes(value);
      const formatInNot = filterState.notFormats.includes(value);
      if (formatInRegular) {
        dispatch({ type: 'TOGGLE_FORMAT', format: value, isNot: false });
      } else if (formatInNot) {
        dispatch({ type: 'TOGGLE_FORMAT', format: value, isNot: true });
      }
    } else if (column === "iso") {
      const iso = parseInt(value);
      const isoInRegular = filterState.isos.includes(iso);
      const isoInNot = filterState.notIsos.includes(iso);
      if (isoInRegular) {
        dispatch({ type: 'TOGGLE_ISO', iso, isNot: false });
      } else if (isoInNot) {
        dispatch({ type: 'TOGGLE_ISO', iso, isNot: true });
      }
    }
  }, [filterState]);

  // Handle clearing all filters
  const handleClearAllFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
    table.resetColumnFilters();
  }, [table]);

  return (
    <div className="flex flex-col gap-4 p-2 sm:p-4">
      <EnhancedFiltersV2
        films={films}
        filterState={filterState}
        onFilterAction={handleFilterAction}
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={handleClearAllFilters}
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
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
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
    </div>
  );
}