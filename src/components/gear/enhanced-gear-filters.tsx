"use client";

import { useMemo, memo } from "react";
import type { Gear } from "@/lib/gear/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Eraser,
  Minus,
} from "lucide-react";

// Pure filter state interface
export interface GearFilterState {
  search: string;
  brands: string[];
  types: string[];
  conditions: string[];
  priceRange: [number, number];
  notBrands: string[];
  notTypes: string[];
  notConditions: string[];
  expandedSections: {
    brands: boolean;
    types: boolean;
    conditions: boolean;
    price: boolean;
  };
  notModes: {
    brands: boolean;
    types: boolean;
    conditions: boolean;
  };
}

// Action types for filter updates
export type GearFilterAction = 
  | { type: 'SET_SEARCH'; value: string }
  | { type: 'TOGGLE_BRAND'; brand: string; isNot: boolean }
  | { type: 'TOGGLE_TYPE'; gearType: string; isNot: boolean }
  | { type: 'TOGGLE_CONDITION'; condition: string; isNot: boolean }
  | { type: 'SET_PRICE_RANGE'; range: [number, number] }
  | { type: 'TOGGLE_SECTION'; section: keyof GearFilterState['expandedSections'] }
  | { type: 'TOGGLE_NOT_MODE'; section: keyof GearFilterState['notModes'] }
  | { type: 'CLEAR_ALL' };

interface EnhancedGearFiltersProps {
  gear: Gear[];
  filterState: GearFilterState;
  onFilterAction: (action: GearFilterAction) => void;
  activeFilters: { column: string; value: string; isNot: boolean }[];
  onRemoveFilter: (column: string, value: string) => void;
  onClearAllFilters: () => void;
  minPrice: number;
  maxPrice: number;
}

const EnhancedGearFiltersComponent = function EnhancedGearFilters({
  gear,
  filterState,
  onFilterAction,
  activeFilters,
  onRemoveFilter,
  onClearAllFilters,
  minPrice,
  maxPrice,
}: EnhancedGearFiltersProps) {
  // Get unique values for filter options (memoized)
  const uniqueBrands = useMemo(() => 
    Array.from(new Set(gear.map((item) => item.brand))).sort(),
    [gear]
  );
  const uniqueTypes = useMemo(() => 
    Array.from(new Set(gear.map((item) => item.type))).sort(),
    [gear]
  );
  const uniqueConditions = useMemo(() => 
    Array.from(new Set(gear.map((item) => item.condition))).sort(),
    [gear]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search gear..."
            value={filterState.search}
            onChange={(e) => onFilterAction({ type: 'SET_SEARCH', value: e.target.value })}
            className="pl-10"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1 whitespace-nowrap"
            >
              <Filter className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Advanced Filters</span>
              <span className="sm:hidden">Filters</span>
              {activeFilters.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 w-5 p-0 flex items-center justify-center"
                >
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-0"
            align="end"
            side="bottom"
            sideOffset={5}
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filter Options</h4>
                {activeFilters.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearAllFilters}
                    className="h-8 px-2"
                  >
                    <Eraser className="h-3.5 w-3.5 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
              
              {/* Brands Filter */}
              <Collapsible
                open={filterState.expandedSections.brands}
                onOpenChange={() => onFilterAction({ type: 'TOGGLE_SECTION', section: 'brands' })}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
                  <Label className="font-medium">Brands</Label>
                  <div className="flex items-center gap-2">
                    {(filterState.brands.length > 0 || filterState.notBrands.length > 0) && (
                      <Badge variant="outline" className="h-5 px-2">
                        {filterState.notModes.brands
                          ? filterState.notBrands.length
                          : filterState.brands.length}
                      </Badge>
                    )}
                    {filterState.expandedSections.brands ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      variant={filterState.notModes.brands ? "default" : "outline"}
                      size="sm"
                      onClick={() => onFilterAction({ type: 'TOGGLE_NOT_MODE', section: 'brands' })}
                      className="h-7 px-2 gap-1"
                    >
                      <Minus className="h-3 w-3" />
                      NOT
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {filterState.notModes.brands
                        ? "Exclude selected brands"
                        : "Include selected brands"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {uniqueBrands.map((brand) => (
                      <label
                        key={brand}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <Checkbox
                          checked={
                            filterState.notModes.brands
                              ? filterState.notBrands.includes(brand)
                              : filterState.brands.includes(brand)
                          }
                          onCheckedChange={() => 
                            onFilterAction({ 
                              type: 'TOGGLE_BRAND', 
                              brand, 
                              isNot: filterState.notModes.brands 
                            })
                          }
                        />
                        <span className="truncate">{brand}</span>
                      </label>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Types Filter */}
              <Collapsible
                open={filterState.expandedSections.types}
                onOpenChange={() => onFilterAction({ type: 'TOGGLE_SECTION', section: 'types' })}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
                  <Label className="font-medium">Types</Label>
                  <div className="flex items-center gap-2">
                    {(filterState.types.length > 0 || filterState.notTypes.length > 0) && (
                      <Badge variant="outline" className="h-5 px-2">
                        {filterState.notModes.types
                          ? filterState.notTypes.length
                          : filterState.types.length}
                      </Badge>
                    )}
                    {filterState.expandedSections.types ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      variant={filterState.notModes.types ? "default" : "outline"}
                      size="sm"
                      onClick={() => onFilterAction({ type: 'TOGGLE_NOT_MODE', section: 'types' })}
                      className="h-7 px-2 gap-1"
                    >
                      <Minus className="h-3 w-3" />
                      NOT
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {filterState.notModes.types
                        ? "Exclude selected types"
                        : "Include selected types"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {uniqueTypes.map((type) => (
                      <label
                        key={type}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <Checkbox
                          checked={
                            filterState.notModes.types
                              ? filterState.notTypes.includes(type)
                              : filterState.types.includes(type)
                          }
                          onCheckedChange={() => 
                            onFilterAction({ 
                              type: 'TOGGLE_TYPE', 
                              gearType: type, 
                              isNot: filterState.notModes.types 
                            })
                          }
                        />
                        <span className="capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Conditions Filter */}
              <Collapsible
                open={filterState.expandedSections.conditions}
                onOpenChange={() => onFilterAction({ type: 'TOGGLE_SECTION', section: 'conditions' })}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
                  <Label className="font-medium">Conditions</Label>
                  <div className="flex items-center gap-2">
                    {(filterState.conditions.length > 0 || filterState.notConditions.length > 0) && (
                      <Badge variant="outline" className="h-5 px-2">
                        {filterState.notModes.conditions
                          ? filterState.notConditions.length
                          : filterState.conditions.length}
                      </Badge>
                    )}
                    {filterState.expandedSections.conditions ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      variant={filterState.notModes.conditions ? "default" : "outline"}
                      size="sm"
                      onClick={() => onFilterAction({ type: 'TOGGLE_NOT_MODE', section: 'conditions' })}
                      className="h-7 px-2 gap-1"
                    >
                      <Minus className="h-3 w-3" />
                      NOT
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {filterState.notModes.conditions
                        ? "Exclude selected conditions"
                        : "Include selected conditions"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {uniqueConditions.map((condition) => (
                      <label
                        key={condition}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <Checkbox
                          checked={
                            filterState.notModes.conditions
                              ? filterState.notConditions.includes(condition)
                              : filterState.conditions.includes(condition)
                          }
                          onCheckedChange={() => 
                            onFilterAction({ 
                              type: 'TOGGLE_CONDITION', 
                              condition, 
                              isNot: filterState.notModes.conditions 
                            })
                          }
                        />
                        <span className="capitalize">{condition}</span>
                      </label>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Price Range Filter */}
              <Collapsible
                open={filterState.expandedSections.price}
                onOpenChange={() => onFilterAction({ type: 'TOGGLE_SECTION', section: 'price' })}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
                  <Label className="font-medium">Price Range</Label>
                  <div className="flex items-center gap-2">
                    {(filterState.priceRange[0] > minPrice || filterState.priceRange[1] < maxPrice) && (
                      <Badge variant="outline" className="h-5 px-2">
                        Active
                      </Badge>
                    )}
                    {filterState.expandedSections.price ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Range: €{filterState.priceRange[0]} - €{filterState.priceRange[1]}
                    </Label>
                    <Slider
                      value={filterState.priceRange}
                      onValueChange={(range) => 
                        onFilterAction({ type: 'SET_PRICE_RANGE', range: range as [number, number] })
                      }
                      max={maxPrice}
                      min={minPrice}
                      step={10}
                      className="w-full"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter, index) => (
            <Badge
              key={`${filter.column}-${filter.value}-${index}`}
              variant={filter.isNot ? "destructive" : "outline"}
              className="flex items-center gap-1"
            >
              {filter.isNot && <Minus className="h-3 w-3" />}
              <span className="font-medium capitalize">{filter.column}:</span>
              <span className="capitalize">{filter.value}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 hover:bg-transparent"
                onClick={() => onRemoveFilter(filter.column, filter.value)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export const EnhancedGearFilters = memo(EnhancedGearFiltersComponent);
