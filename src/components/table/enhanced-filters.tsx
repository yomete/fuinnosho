"use client";

import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
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

interface EnhancedFiltersProps {
  films: Film[];
  onFiltersChange: (filters: {
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
  }) => void;
  activeFilters: { column: string; value: string; isNot: boolean }[];
  onRemoveFilter: (column: string, value: string) => void;
  onClearAllFilters: () => void;
}

const EnhancedFiltersComponent = function EnhancedFilters({
  films,
  onFiltersChange,
  activeFilters,
  onRemoveFilter,
  onClearAllFilters,
}: EnhancedFiltersProps) {
  const [nameFilter, setNameFilter] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedIsos, setSelectedIsos] = useState<number[]>([]);
  const [notBrands, setNotBrands] = useState<string[]>([]);
  const [notTypes, setNotTypes] = useState<string[]>([]);
  const [notFormats, setNotFormats] = useState<string[]>([]);
  const [notIsos, setNotIsos] = useState<number[]>([]);
  const [isoRange, setIsoRange] = useState<[number, number]>([50, 3200]);
  const [hideZeroQuantity, setHideZeroQuantity] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hideZeroQuantityFilms");
      return saved === "true";
    }
    return false;
  });

  const [expandedSections, setExpandedSections] = useState({
    brands: false,
    types: false,
    formats: false,
    isos: false,
  });

  const [notModes, setNotModes] = useState({
    brands: false,
    types: false,
    formats: false,
    isos: false,
  });

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

  // Use ref to avoid including onFiltersChange in dependency array
  const onFiltersChangeRef = useRef(onFiltersChange);
  onFiltersChangeRef.current = onFiltersChange;
  
  // Track if this is the initial mount to prevent calling onFiltersChange on mount
  const isInitialMount = useRef(true);
  const prevFiltersRef = useRef({
    name: nameFilter,
    brands: selectedBrands,
    types: selectedTypes,
    formats: selectedFormats,
    isos: selectedIsos,
    isoRange,
    notBrands,
    notTypes,
    notFormats,
    notIsos,
    hideZeroQuantity,
  });

  // Debounced filter change notification
  useEffect(() => {
    // Skip calling onFiltersChange on initial mount to prevent loops
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevFiltersRef.current = {
        name: nameFilter,
        brands: selectedBrands,
        types: selectedTypes,
        formats: selectedFormats,
        isos: selectedIsos,
        isoRange,
        notBrands,
        notTypes,
        notFormats,
        notIsos,
        hideZeroQuantity,
      };
      return;
    }

    const currentFilters = {
      name: nameFilter,
      brands: selectedBrands,
      types: selectedTypes,
      formats: selectedFormats,
      isos: selectedIsos,
      isoRange,
      notBrands,
      notTypes,
      notFormats,
      notIsos,
      hideZeroQuantity,
    };

    // Only call onFiltersChange if filters actually changed
    const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(currentFilters);
    
    if (!filtersChanged) return;

    const timeoutId = setTimeout(() => {
      onFiltersChangeRef.current(currentFilters);
      prevFiltersRef.current = currentFilters;
    }, 150); // 150ms debounce

    return () => clearTimeout(timeoutId);
  }, [nameFilter, selectedBrands, selectedTypes, selectedFormats, selectedIsos, isoRange, notBrands, notTypes, notFormats, notIsos, hideZeroQuantity]);


  const handleNameChange = useCallback((value: string) => {
    setNameFilter(value);
  }, []);

  const handleBrandToggle = useCallback((brand: string) => {
    if (notModes.brands) {
      const newNotBrands = notBrands.includes(brand)
        ? notBrands.filter((b) => b !== brand)
        : [...notBrands, brand];
      setNotBrands(newNotBrands);
    } else {
      const newBrands = selectedBrands.includes(brand)
        ? selectedBrands.filter((b) => b !== brand)
        : [...selectedBrands, brand];
      setSelectedBrands(newBrands);
    }
  }, [notModes.brands, notBrands, selectedBrands]);

  const handleTypeToggle = useCallback((type: string) => {
    if (notModes.types) {
      const newNotTypes = notTypes.includes(type)
        ? notTypes.filter((t) => t !== type)
        : [...notTypes, type];
      setNotTypes(newNotTypes);
    } else {
      const newTypes = selectedTypes.includes(type)
        ? selectedTypes.filter((t) => t !== type)
        : [...selectedTypes, type];
      setSelectedTypes(newTypes);
    }
  }, [notModes.types, notTypes, selectedTypes]);

  const handleFormatToggle = useCallback((format: string) => {
    if (notModes.formats) {
      const newNotFormats = notFormats.includes(format)
        ? notFormats.filter((f) => f !== format)
        : [...notFormats, format];
      setNotFormats(newNotFormats);
    } else {
      const newFormats = selectedFormats.includes(format)
        ? selectedFormats.filter((f) => f !== format)
        : [...selectedFormats, format];
      setSelectedFormats(newFormats);
    }
  }, [notModes.formats, notFormats, selectedFormats]);

  const handleIsoToggle = useCallback((iso: number) => {
    if (notModes.isos) {
      const newNotIsos = notIsos.includes(iso)
        ? notIsos.filter((i) => i !== iso)
        : [...notIsos, iso];
      setNotIsos(newNotIsos);
    } else {
      const newIsos = selectedIsos.includes(iso)
        ? selectedIsos.filter((i) => i !== iso)
        : [...selectedIsos, iso];
      setSelectedIsos(newIsos);
    }
  }, [notModes.isos, notIsos, selectedIsos]);

  const handleIsoRangeChange = useCallback((range: [number, number]) => {
    setIsoRange(range);
  }, []);

  const handleHideZeroQuantityToggle = useCallback(() => {
    const newValue = !hideZeroQuantity;
    setHideZeroQuantity(newValue);
    // Persist to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("hideZeroQuantityFilms", newValue.toString());
    }
  }, [hideZeroQuantity]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const clearAllFilters = () => {
    setNameFilter("");
    setSelectedBrands([]);
    setSelectedTypes([]);
    setSelectedFormats([]);
    setSelectedIsos([]);
    setNotBrands([]);
    setNotTypes([]);
    setNotFormats([]);
    setNotIsos([]);
    setIsoRange([minIso, maxIso]);
    setNotModes({
      brands: false,
      types: false,
      formats: false,
      isos: false,
    });
    setHideZeroQuantity(false);
    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("hideZeroQuantityFilms", "false");
    }
    onClearAllFilters();
  };

  const toggleNotMode = (section: keyof typeof notModes) => {
    setNotModes((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
    // Clear selections when toggling mode
    if (section === "brands") {
      setSelectedBrands([]);
      setNotBrands([]);
    } else if (section === "types") {
      setSelectedTypes([]);
      setNotTypes([]);
    } else if (section === "formats") {
      setSelectedFormats([]);
      setNotFormats([]);
    } else if (section === "isos") {
      setSelectedIsos([]);
      setNotIsos([]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search films..."
            value={nameFilter}
            onChange={(e) => handleNameChange(e.target.value)}
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
                    onClick={clearAllFilters}
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
                  checked={hideZeroQuantity}
                  onCheckedChange={handleHideZeroQuantityToggle}
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
                open={expandedSections.brands}
                onOpenChange={() => toggleSection("brands")}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
                  <Label className="font-medium">Brands</Label>
                  <div className="flex items-center gap-2">
                    {(selectedBrands.length > 0 || notBrands.length > 0) && (
                      <Badge variant="outline" className="h-5 px-2">
                        {notModes.brands
                          ? notBrands.length
                          : selectedBrands.length}
                      </Badge>
                    )}
                    {expandedSections.brands ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      variant={notModes.brands ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleNotMode("brands")}
                      className="h-7 px-2 gap-1"
                    >
                      <Minus className="h-3 w-3" />
                      NOT
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {notModes.brands
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
                            notModes.brands
                              ? notBrands.includes(brand)
                              : selectedBrands.includes(brand)
                          }
                          onCheckedChange={() => handleBrandToggle(brand)}
                        />
                        <span className="truncate">{brand}</span>
                      </label>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Types Filter */}
              <Collapsible
                open={expandedSections.types}
                onOpenChange={() => toggleSection("types")}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
                  <Label className="font-medium">Types</Label>
                  <div className="flex items-center gap-2">
                    {(selectedTypes.length > 0 || notTypes.length > 0) && (
                      <Badge variant="outline" className="h-5 px-2">
                        {notModes.types
                          ? notTypes.length
                          : selectedTypes.length}
                      </Badge>
                    )}
                    {expandedSections.types ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      variant={notModes.types ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleNotMode("types")}
                      className="h-7 px-2 gap-1"
                    >
                      <Minus className="h-3 w-3" />
                      NOT
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {notModes.types
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
                            notModes.types
                              ? notTypes.includes(type)
                              : selectedTypes.includes(type)
                          }
                          onCheckedChange={() => handleTypeToggle(type)}
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Formats Filter */}
              <Collapsible
                open={expandedSections.formats}
                onOpenChange={() => toggleSection("formats")}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
                  <Label className="font-medium">Formats</Label>
                  <div className="flex items-center gap-2">
                    {(selectedFormats.length > 0 || notFormats.length > 0) && (
                      <Badge variant="outline" className="h-5 px-2">
                        {notModes.formats
                          ? notFormats.length
                          : selectedFormats.length}
                      </Badge>
                    )}
                    {expandedSections.formats ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      variant={notModes.formats ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleNotMode("formats")}
                      className="h-7 px-2 gap-1"
                    >
                      <Minus className="h-3 w-3" />
                      NOT
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {notModes.formats
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
                            notModes.formats
                              ? notFormats.includes(format)
                              : selectedFormats.includes(format)
                          }
                          onCheckedChange={() => handleFormatToggle(format)}
                        />
                        <span>{format}</span>
                      </label>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* ISO Filter */}
              <Collapsible
                open={expandedSections.isos}
                onOpenChange={() => toggleSection("isos")}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
                  <Label className="font-medium">ISO</Label>
                  <div className="flex items-center gap-2">
                    {(selectedIsos.length > 0 || notIsos.length > 0) && (
                      <Badge variant="outline" className="h-5 px-2">
                        {notModes.isos ? notIsos.length : selectedIsos.length}
                      </Badge>
                    )}
                    {expandedSections.isos ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Range: {isoRange[0]} - {isoRange[1]}
                    </Label>
                    <Slider
                      value={isoRange}
                      onValueChange={handleIsoRangeChange}
                      max={maxIso}
                      min={minIso}
                      step={50}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      variant={notModes.isos ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleNotMode("isos")}
                      className="h-7 px-2 gap-1"
                    >
                      <Minus className="h-3 w-3" />
                      NOT
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {notModes.isos
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
                            notModes.isos
                              ? notIsos.includes(iso)
                              : selectedIsos.includes(iso)
                          }
                          onCheckedChange={() => handleIsoToggle(iso)}
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

export const EnhancedFilters = memo(EnhancedFiltersComponent);
