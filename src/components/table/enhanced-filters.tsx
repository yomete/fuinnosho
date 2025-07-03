"use client";

import { useState } from "react";
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
  Eraser
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
  }) => void;
  activeFilters: { column: string; value: string }[];
  onRemoveFilter: (column: string, value: string) => void;
  onClearAllFilters: () => void;
}

export function EnhancedFilters({
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
  const [isoRange, setIsoRange] = useState<[number, number]>([50, 3200]);
  
  const [expandedSections, setExpandedSections] = useState({
    brands: false,
    types: false,
    formats: false,
    isos: false,
  });

  // Get unique values for filter options
  const uniqueBrands = Array.from(new Set(films.map((film) => film.brand))).sort();
  const uniqueTypes = Array.from(new Set(films.map((film) => film.type))).sort();
  const uniqueFormats = Array.from(new Set(films.map((film) => film.format))).sort();
  const uniqueIsos = Array.from(new Set(films.map((film) => film.iso))).sort((a, b) => a - b);
  
  const minIso = Math.min(...uniqueIsos);
  const maxIso = Math.max(...uniqueIsos);

  const handleNameChange = (value: string) => {
    setNameFilter(value);
    onFiltersChange({
      name: value,
      brands: selectedBrands,
      types: selectedTypes,
      formats: selectedFormats,
      isos: selectedIsos,
      isoRange,
    });
  };

  const handleBrandToggle = (brand: string) => {
    const newBrands = selectedBrands.includes(brand)
      ? selectedBrands.filter((b) => b !== brand)
      : [...selectedBrands, brand];
    setSelectedBrands(newBrands);
    onFiltersChange({
      name: nameFilter,
      brands: newBrands,
      types: selectedTypes,
      formats: selectedFormats,
      isos: selectedIsos,
      isoRange,
    });
  };

  const handleTypeToggle = (type: string) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];
    setSelectedTypes(newTypes);
    onFiltersChange({
      name: nameFilter,
      brands: selectedBrands,
      types: newTypes,
      formats: selectedFormats,
      isos: selectedIsos,
      isoRange,
    });
  };

  const handleFormatToggle = (format: string) => {
    const newFormats = selectedFormats.includes(format)
      ? selectedFormats.filter((f) => f !== format)
      : [...selectedFormats, format];
    setSelectedFormats(newFormats);
    onFiltersChange({
      name: nameFilter,
      brands: selectedBrands,
      types: selectedTypes,
      formats: newFormats,
      isos: selectedIsos,
      isoRange,
    });
  };

  const handleIsoToggle = (iso: number) => {
    const newIsos = selectedIsos.includes(iso)
      ? selectedIsos.filter((i) => i !== iso)
      : [...selectedIsos, iso];
    setSelectedIsos(newIsos);
    onFiltersChange({
      name: nameFilter,
      brands: selectedBrands,
      types: selectedTypes,
      formats: selectedFormats,
      isos: newIsos,
      isoRange,
    });
  };

  const handleIsoRangeChange = (range: [number, number]) => {
    setIsoRange(range);
    onFiltersChange({
      name: nameFilter,
      brands: selectedBrands,
      types: selectedTypes,
      formats: selectedFormats,
      isos: selectedIsos,
      isoRange: range,
    });
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const clearAllFilters = () => {
    setNameFilter("");
    setSelectedBrands([]);
    setSelectedTypes([]);
    setSelectedFormats([]);
    setSelectedIsos([]);
    setIsoRange([minIso, maxIso]);
    onClearAllFilters();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Filter Controls */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
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
            <Button variant="outline" size="sm" className="h-9 gap-1">
              <Filter className="h-3.5 w-3.5" />
              Advanced Filters
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
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

              {/* Brands Filter */}
              <Collapsible open={expandedSections.brands} onOpenChange={() => toggleSection('brands')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
                  <Label className="font-medium">Brands</Label>
                  <div className="flex items-center gap-2">
                    {selectedBrands.length > 0 && (
                      <Badge variant="outline" className="h-5 px-2">
                        {selectedBrands.length}
                      </Badge>
                    )}
                    {expandedSections.brands ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {uniqueBrands.map((brand) => (
                      <label key={brand} className="flex items-center space-x-2 text-sm">
                        <Checkbox
                          checked={selectedBrands.includes(brand)}
                          onCheckedChange={() => handleBrandToggle(brand)}
                        />
                        <span className="truncate">{brand}</span>
                      </label>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Types Filter */}
              <Collapsible open={expandedSections.types} onOpenChange={() => toggleSection('types')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
                  <Label className="font-medium">Types</Label>
                  <div className="flex items-center gap-2">
                    {selectedTypes.length > 0 && (
                      <Badge variant="outline" className="h-5 px-2">
                        {selectedTypes.length}
                      </Badge>
                    )}
                    {expandedSections.types ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <div className="space-y-2">
                    {uniqueTypes.map((type) => (
                      <label key={type} className="flex items-center space-x-2 text-sm">
                        <Checkbox
                          checked={selectedTypes.includes(type)}
                          onCheckedChange={() => handleTypeToggle(type)}
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Formats Filter */}
              <Collapsible open={expandedSections.formats} onOpenChange={() => toggleSection('formats')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
                  <Label className="font-medium">Formats</Label>
                  <div className="flex items-center gap-2">
                    {selectedFormats.length > 0 && (
                      <Badge variant="outline" className="h-5 px-2">
                        {selectedFormats.length}
                      </Badge>
                    )}
                    {expandedSections.formats ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <div className="space-y-2">
                    {uniqueFormats.map((format) => (
                      <label key={format} className="flex items-center space-x-2 text-sm">
                        <Checkbox
                          checked={selectedFormats.includes(format)}
                          onCheckedChange={() => handleFormatToggle(format)}
                        />
                        <span>{format}</span>
                      </label>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* ISO Filter */}
              <Collapsible open={expandedSections.isos} onOpenChange={() => toggleSection('isos')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded">
                  <Label className="font-medium">ISO</Label>
                  <div className="flex items-center gap-2">
                    {selectedIsos.length > 0 && (
                      <Badge variant="outline" className="h-5 px-2">
                        {selectedIsos.length}
                      </Badge>
                    )}
                    {expandedSections.isos ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Range: {isoRange[0]} - {isoRange[1]}</Label>
                    <Slider
                      value={isoRange}
                      onValueChange={handleIsoRangeChange}
                      max={maxIso}
                      min={minIso}
                      step={50}
                      className="w-full"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                    {uniqueIsos.map((iso) => (
                      <label key={iso} className="flex items-center space-x-2 text-sm">
                        <Checkbox
                          checked={selectedIsos.includes(iso)}
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
              variant="outline"
              className="flex items-center gap-1"
            >
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
}