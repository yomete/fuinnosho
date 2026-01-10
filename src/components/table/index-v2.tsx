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
import {
  groupFilms,
  applyExpansionState,
  type TableRow as FilmTableRow,
  isFilmGroup,
} from "@/lib/film-grouping";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

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

  // Consolidation state - always start with true for SSR, sync from localStorage after hydration
  const [enableConsolidation, setEnableConsolidation] = useState(true);

  const [expansionState, setExpansionState] = useState<Map<string, boolean>>(
    new Map()
  );

  // Save consolidation preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "filmTableConsolidation",
        JSON.stringify(enableConsolidation)
      );
    }
  }, [enableConsolidation]);

  // Sync localStorage preferences after hydration to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Sync hideZeroQuantity
      const savedHideZero = localStorage.getItem("hideZeroQuantityFilms");
      if (savedHideZero === "true") {
        dispatch({ type: "TOGGLE_HIDE_ZERO", value: true });
      }
      // Sync consolidation
      const savedConsolidation = localStorage.getItem("filmTableConsolidation");
      if (savedConsolidation !== null) {
        setEnableConsolidation(JSON.parse(savedConsolidation));
      }
    }
  }, []);

  // Sync URL params on column filter changes (existing functionality)
  useEffect(() => {
    const params = new URLSearchParams();

    columnFilters.forEach((filter) => {
      if (filter.value !== undefined && filter.value !== "") {
        if (Array.isArray(filter.value)) {
          params.set(filter.id, filter.value.join(","));
        } else {
          params.set(filter.id, String(filter.value));
        }
      }
    });

    const newQuery = params.toString();
    const currentQuery = searchParams.toString();

    // Only update URL if the query actually changed to avoid infinite loops
    if (newQuery !== currentQuery) {
      const timeoutId = setTimeout(() => {
        const query = newQuery ? `?${newQuery}` : pathname;
        router.replace(query, { scroll: false });
      }, 300);

      return () => clearTimeout(timeoutId);
    }
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

  // Group and expand films based on consolidation settings
  const tableData: FilmTableRow[] = useMemo(() => {
    // First group the films if consolidation is enabled
    const grouped = groupFilms(filteredFilms, {
      enableGrouping: enableConsolidation,
    });

    // Then apply expansion state
    return applyExpansionState(grouped, expansionState);
  }, [filteredFilms, enableConsolidation, expansionState]);

  // Toggle expansion for a group
  const toggleExpansion = useCallback((groupKey: string) => {
    setExpansionState((prev) => {
      const next = new Map(prev);
      next.set(groupKey, !prev.get(groupKey));
      return next;
    });
  }, []);

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
    data: tableData,
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
    meta: {
      toggleExpansion,
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
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <EnhancedFiltersV2
            films={films}
            filterState={filterState}
            onFilterAction={handleFilterAction}
            activeFilters={activeFilters}
            onRemoveFilter={handleRemoveFilter}
            onClearAllFilters={handleClearAllFilters}
          />
        </div>
      </div>
      <div className="rounded-xl border border-[#2a2420] bg-[#1a1614]/30">
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
                table.getRowModel().rows.map((row, index) => {
                  const rowData: FilmTableRow = row.original;
                  const isGroup = isFilmGroup(rowData);

                  // Check if this is a child row (previous row was a group that's expanded)
                  const prevRow = index > 0 ? table.getRowModel().rows[index - 1]?.original : null;
                  const isChildRow = !isGroup && prevRow && isFilmGroup(prevRow) && prevRow.isExpanded;

                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={cn(
                        isGroup && "bg-muted/30 hover:bg-muted/40 cursor-pointer",
                        isChildRow && "bg-background"
                      )}
                      onClick={
                        isGroup
                          ? () => toggleExpansion(rowData.groupKey)
                          : undefined
                      }
                    >
                      {row.getVisibleCells().map((cell, cellIndex) => {
                        // Add indentation to child rows, but not the first cell (expander)
                        const shouldIndent = isChildRow && cellIndex === 1;

                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(shouldIndent && "pl-12")}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
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