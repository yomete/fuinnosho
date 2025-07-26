"use client";

import { useMemo, memo } from "react";
import { Film } from "@/lib/utils";
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

// Pure filter state interface - parent owns all of this
export interface FilterState {
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
  expandedSections: {
    brands: boolean;
    types: boolean;
    formats: boolean;
    isos: boolean;
  };
  notModes: {
    brands: boolean;
    types: boolean;
    formats: boolean;
    isos: boolean;
  };
}

// Action types for filter updates
export type FilterAction = 
  | { type: 'SET_NAME'; value: string }
  | { type: 'TOGGLE_BRAND'; brand: string; isNot: boolean }
  | { type: 'TOGGLE_TYPE'; filmType: string; isNot: boolean }
  | { type: 'TOGGLE_FORMAT'; format: string; isNot: boolean }
  | { type: 'TOGGLE_ISO'; iso: number; isNot: boolean }
  | { type: 'SET_ISO_RANGE'; range: [number, number] }
  | { type: 'TOGGLE_HIDE_ZERO'; value: boolean }
  | { type: 'TOGGLE_SECTION'; section: keyof FilterState['expandedSections'] }
  | { type: 'TOGGLE_NOT_MODE'; section: keyof FilterState['notModes'] }
  | { type: 'CLEAR_ALL' };

interface EnhancedFiltersV2Props {
  films: Film[];
  filterState: FilterState;
  onFilterAction: (action: FilterAction) => void;
  activeFilters: { column: string; value: string; isNot: boolean }[];
  onRemoveFilter: (column: string, value: string) => void;
  onClearAllFilters: () => void;
}

const EnhancedFiltersV2Component = function EnhancedFiltersV2({
  films,
  filterState,
  onFilterAction,
  activeFilters,
  onRemoveFilter,
  onClearAllFilters,
}: EnhancedFiltersV2Props) {
  // Get unique values for filter options (memoized)
  const uniqueBrands = useMemo(() => 
    Array.from(new Set(films.map((film) => film.brand))).sort(),
    [films]
  );
  const uniqueTypes = useMemo(() => 
    Array.from(new Set(films.map((film) => film.type))).sort(),
    [films]
  );
  const uniqueFormats = useMemo(() => 
    Array.from(new Set(films.map((film) => film.format))).sort(),
    [films]
  );
  const uniqueIsos = useMemo(() => 
    Array.from(new Set(films.map((film) => film.iso))).sort((a, b) => a - b),
    [films]
  );

  const { minIso, maxIso } = useMemo(() => ({
    minIso: Math.min(...uniqueIsos),
    maxIso: Math.max(...uniqueIsos)
  }), [uniqueIsos]);

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search films..."
            value={filterState.name}
            onChange={(e) => onFilterAction({ type: 'SET_NAME', value: e.target.value })}
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
              
              {/* Hide Zero Quantity Filter */}
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  checked={filterState.hideZeroQuantity}
                  onCheckedChange={(checked) => 
                    onFilterAction({ type: 'TOGGLE_HIDE_ZERO', value: !!checked })
                  }
                  id="hide-zero-quantity-checkbox"
                />
                <Label
                  htmlFor="hide-zero-quantity-checkbox"
                  className="text-sm"
                >
                  Hide zero-quantity films
                </Label>
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
                              filmType: type, 
                              isNot: filterState.notModes.types 
                            })
                          }
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Formats Filter */}
              <Collapsible
                open={filterState.expandedSections.formats}
                onOpenChange={() => onFilterAction({ type: 'TOGGLE_SECTION', section: 'formats' })}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
                  <Label className="font-medium">Formats</Label>
                  <div className="flex items-center gap-2">
                    {(filterState.formats.length > 0 || filterState.notFormats.length > 0) && (
                      <Badge variant="outline" className="h-5 px-2">
                        {filterState.notModes.formats
                          ? filterState.notFormats.length
                          : filterState.formats.length}
                      </Badge>
                    )}
                    {filterState.expandedSections.formats ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      variant={filterState.notModes.formats ? "default" : "outline"}
                      size="sm"
                      onClick={() => onFilterAction({ type: 'TOGGLE_NOT_MODE', section: 'formats' })}
                      className="h-7 px-2 gap-1"
                    >
                      <Minus className="h-3 w-3" />
                      NOT
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {filterState.notModes.formats
                        ? "Exclude selected formats"
                        : "Include selected formats"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {uniqueFormats.map((format) => (
                      <label
                        key={format}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <Checkbox
                          checked={
                            filterState.notModes.formats
                              ? filterState.notFormats.includes(format)
                              : filterState.formats.includes(format)
                          }
                          onCheckedChange={() => 
                            onFilterAction({ 
                              type: 'TOGGLE_FORMAT', 
                              format, 
                              isNot: filterState.notModes.formats 
                            })
                          }
                        />
                        <span>{format}</span>
                      </label>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* ISO Filter */}
              <Collapsible
                open={filterState.expandedSections.isos}
                onOpenChange={() => onFilterAction({ type: 'TOGGLE_SECTION', section: 'isos' })}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
                  <Label className="font-medium">ISO</Label>
                  <div className="flex items-center gap-2">
                    {(filterState.isos.length > 0 || filterState.notIsos.length > 0) && (
                      <Badge variant="outline" className="h-5 px-2">
                        {filterState.notModes.isos ? filterState.notIsos.length : filterState.isos.length}
                      </Badge>
                    )}
                    {filterState.expandedSections.isos ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Range: {filterState.isoRange[0]} - {filterState.isoRange[1]}
                    </Label>
                    <Slider
                      value={filterState.isoRange}
                      onValueChange={(range) => 
                        onFilterAction({ type: 'SET_ISO_RANGE', range: range as [number, number] })
                      }
                      max={maxIso}
                      min={minIso}
                      step={50}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      variant={filterState.notModes.isos ? "default" : "outline"}
                      size="sm"
                      onClick={() => onFilterAction({ type: 'TOGGLE_NOT_MODE', section: 'isos' })}
                      className="h-7 px-2 gap-1"
                    >
                      <Minus className="h-3 w-3" />
                      NOT
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {filterState.notModes.isos
                        ? "Exclude selected ISOs"
                        : "Include selected ISOs"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                    {uniqueIsos.map((iso) => (
                      <label
                        key={iso}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <Checkbox
                          checked={
                            filterState.notModes.isos
                              ? filterState.notIsos.includes(iso)
                              : filterState.isos.includes(iso)
                          }
                          onCheckedChange={() => 
                            onFilterAction({ 
                              type: 'TOGGLE_ISO', 
                              iso, 
                              isNot: filterState.notModes.isos 
                            })
                          }
                        />
                        <span>{iso}</span>
                      </label>
                    ))}
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
              <span className="font-medium">{filter.column}:</span>
              <span>{filter.value}</span>
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

export const EnhancedFiltersV2 = memo(EnhancedFiltersV2Component);