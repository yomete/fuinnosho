"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useBrands } from "@/hooks/use-brands";

interface BrandAutocompleteProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function BrandAutocomplete({
  value,
  onValueChange,
  placeholder = "Enter brand name",
}: BrandAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value || "");
  const brands = useBrands();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Filter brands based on input
  const filteredBrands = !inputValue
    ? brands
    : brands.filter((brand) =>
        brand.toLowerCase().includes(inputValue.toLowerCase())
      );

  // Handle clicks outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onValueChange(newValue);
    setOpen(true);
  };

  const handleSelectBrand = (brand: string) => {
    setInputValue(brand);
    onValueChange(brand);
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="pr-8"
        />
        <ChevronDown
          className={cn(
            "absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </div>
      
      {open && filteredBrands.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-md"
        >
          {filteredBrands.map((brand) => (
            <button
              key={brand}
              className={cn(
                "flex w-full items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                inputValue === brand && "bg-accent text-accent-foreground"
              )}
              onClick={() => handleSelectBrand(brand)}
              type="button"
            >
              {brand}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
