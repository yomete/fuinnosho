"use client";
import { useState, useReducer, useMemo, useCallback } from "react";
import { Gear } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TableIcon, GridIcon } from "lucide-react";
import { GearTable } from "./gear-table";
import { GearGrid } from "./gear-grid";
import { EnhancedGearFilters, GearFilterAction } from "./enhanced-gear-filters";
import { gearFilterReducer, createInitialGearFilterState } from "./gear-filter-reducer";

interface GearTableOrGridProps {
  gear: Gear[];
}

export function GearTableOrGrid({ gear }: GearTableOrGridProps) {
  const [view, setView] = useState<"table" | "grid">("table");

  // Extract unique prices for initial state
  const uniquePrices = useMemo(() => 
    gear
      .map((item) => item.purchase_price)
      .filter((price): price is number => price !== undefined),
    [gear]
  );

  const { minPrice, maxPrice } = useMemo(() => ({
    minPrice: uniquePrices.length > 0 ? Math.floor(Math.min(...uniquePrices)) : 0,
    maxPrice: uniquePrices.length > 0 ? Math.ceil(Math.max(...uniquePrices)) : 1000
  }), [uniquePrices]);

  // Reducer for filter state
  const [filterState, dispatch] = useReducer(
    gearFilterReducer,
    uniquePrices,
    createInitialGearFilterState
  );

  // Apply filters
  const filteredGear = useMemo(() => {
    return gear.filter((item) => {
      // Search
      if (filterState.search) {
        const searchLower = filterState.search.toLowerCase();
        const matchesSearch = 
          item.name.toLowerCase().includes(searchLower) ||
          item.brand.toLowerCase().includes(searchLower) ||
          item.type.toLowerCase().includes(searchLower) ||
          (item.model && item.model.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Brands
      if (filterState.brands.length > 0) {
        if (!filterState.brands.includes(item.brand)) return false;
      }
      if (filterState.notBrands.length > 0) {
        if (filterState.notBrands.includes(item.brand)) return false;
      }

      // Types
      if (filterState.types.length > 0) {
        if (!filterState.types.includes(item.type)) return false;
      }
      if (filterState.notTypes.length > 0) {
        if (filterState.notTypes.includes(item.type)) return false;
      }

      // Conditions
      if (filterState.conditions.length > 0) {
        if (!filterState.conditions.includes(item.condition)) return false;
      }
      if (filterState.notConditions.length > 0) {
        if (filterState.notConditions.includes(item.condition)) return false;
      }

      // Price Range
      if (item.purchase_price !== undefined) {
        if (item.purchase_price < filterState.priceRange[0] || item.purchase_price > filterState.priceRange[1]) {
          return false;
        }
      }

      return true;
    });
  }, [gear, filterState]);

  // Generate active filters display
  const activeFilters = useMemo(() => {
    const filters: { column: string; value: string; isNot: boolean }[] = [];

    // Add regular filters
    filterState.brands.forEach((brand: string) => 
      filters.push({ column: "brand", value: brand, isNot: false })
    );
    filterState.types.forEach((type: string) => 
      filters.push({ column: "type", value: type, isNot: false })
    );
    filterState.conditions.forEach((condition: string) => 
      filters.push({ column: "condition", value: condition, isNot: false })
    );

    // Add NOT filters
    filterState.notBrands.forEach((brand: string) => 
      filters.push({ column: "brand", value: brand, isNot: true })
    );
    filterState.notTypes.forEach((type: string) => 
      filters.push({ column: "type", value: type, isNot: true })
    );
    filterState.notConditions.forEach((condition: string) => 
      filters.push({ column: "condition", value: condition, isNot: true })
    );

    // Add price range filter if active
    if (filterState.priceRange[0] > minPrice || filterState.priceRange[1] < maxPrice) {
      filters.push({ 
        column: "price", 
        value: `€${filterState.priceRange[0]} - €${filterState.priceRange[1]}`, 
        isNot: false 
      });
    }

    return filters;
  }, [filterState, minPrice, maxPrice]);

  // Handle filter actions
  const handleFilterAction = useCallback((action: GearFilterAction) => {
    dispatch(action);
  }, []);

  // Handle removing individual filters
  const handleRemoveFilter = useCallback((column: string, value: string) => {
    if (column === "price") {
      dispatch({ type: 'SET_PRICE_RANGE', range: [minPrice, maxPrice] });
      return;
    }

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
        dispatch({ type: 'TOGGLE_TYPE', gearType: value, isNot: false });
      } else if (typeInNot) {
        dispatch({ type: 'TOGGLE_TYPE', gearType: value, isNot: true });
      }
    } else if (column === "condition") {
      const conditionInRegular = filterState.conditions.includes(value);
      const conditionInNot = filterState.notConditions.includes(value);
      if (conditionInRegular) {
        dispatch({ type: 'TOGGLE_CONDITION', condition: value, isNot: false });
      } else if (conditionInNot) {
        dispatch({ type: 'TOGGLE_CONDITION', condition: value, isNot: true });
      }
    }
  }, [filterState, minPrice, maxPrice]);

  // Handle clearing all filters
  const handleClearAllFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
    // We also need to reset price range to bounds which the reducer might not know perfectly
    // without extra logic, but let's see if we can just dispatch a separate price reset if needed
    // or if the reducer handles it well enough.
    // Actually, the reducer's CLEAR_ALL doesn't reset price range to dynamic bounds.
    // Let's explicitly reset price range here to be safe.
    dispatch({ type: 'SET_PRICE_RANGE', range: [minPrice, maxPrice] });
  }, [minPrice, maxPrice]);

  return (
    <div className="space-y-4">
      <EnhancedGearFilters
        gear={gear}
        filterState={filterState}
        onFilterAction={handleFilterAction}
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={handleClearAllFilters}
        minPrice={minPrice}
        maxPrice={maxPrice}
      />

      <div className="flex justify-end px-4">
        <div className="inline-flex rounded-lg border bg-background p-1">
          <Button
            variant="ghost"
            size="sm"
            className={`px-3 ${view === "table" ? "bg-muted" : ""}`}
            onClick={() => setView("table")}
          >
            <TableIcon className="h-4 w-4" />
            <span className="sr-only">Table view</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`px-3 ${view === "grid" ? "bg-muted" : ""}`}
            onClick={() => setView("grid")}
          >
            <GridIcon className="h-4 w-4" />
            <span className="sr-only">Grid view</span>
          </Button>
        </div>
      </div>

      {view === "grid" && (
        <div
          className={`
            transition-all duration-300 ease-in-out
            ${
              view === "grid"
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }
          `}
        >
          <GearGrid gear={filteredGear} />
        </div>
      )}
      {view === "table" && (
        <div
          className={`
            transition-all duration-300 ease-in-out
            ${
              view === "table"
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }
          `}
        >
          <GearTable gear={filteredGear} />
        </div>
      )}
    </div>
  );
}