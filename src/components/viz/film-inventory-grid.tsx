"use client";

import { type Film } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Camera, Package, Eye } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { EmptyState } from "@/components/empty-state";
import Link from "next/link";
import { Film as FilmIcon } from "lucide-react";

interface FilmInventoryGridProps {
  films: Film[];
}

// Sprocket holes component for 35mm films
const SprocketHoles = ({ side }: { side: "left" | "right" }) => (
  <div
    className={`absolute top-0 ${side === "left" ? "left-0" : "right-0"} h-full w-3 flex flex-col justify-around py-2`}
  >
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="w-2 h-3 rounded-sm bg-[#1a1614] border border-[#2a2420]"
      />
    ))}
  </div>
);

// Helper functions for colors
const getFilmTypeGradient = (type: string) => {
  switch (type) {
    case "Color":
      return "from-amber-500/20 to-orange-600/20";
    case "Black & White":
      return "from-zinc-400/20 to-zinc-600/20";
    case "Slide":
      return "from-emerald-500/20 to-teal-600/20";
    default:
      return "from-amber-500/20 to-orange-600/20";
  }
};

const getFilmTypeBadgeVariant = (type: string) => {
  switch (type) {
    case "Color":
      return "color" as const;
    case "Black & White":
      return "bw" as const;
    case "Slide":
      return "slide" as const;
    default:
      return "color" as const;
  }
};

const getBrandAccent = (brand: string) => {
  switch (brand.toLowerCase()) {
    case "kodak":
      return "#FFD700";
    case "fujifilm":
    case "fuji":
      return "#00A550";
    case "ilford":
      return "#E63946";
    default:
      return "#FFD700";
  }
};

function getAvailableCount(film: Film): number {
  if (typeof film.available_count === "number" && film.available_count >= 0) {
    return film.available_count;
  }
  if (typeof film.total_count === "number" && film.total_count >= 0) {
    return film.total_count;
  }
  return film.count || 1;
}

function isExpiringSoon(expirationDate: string): boolean {
  const daysUntilExpiration = differenceInDays(
    new Date(expirationDate),
    new Date()
  );
  return daysUntilExpiration <= 90;
}

function isLowStock(count: number): boolean {
  return count <= 2;
}

export default function FilmInventoryGrid({ films }: FilmInventoryGridProps) {
  if (!films.length) {
    return (
      <EmptyState
        icon={FilmIcon}
        title="No films found"
        description="Add films to your inventory or adjust your filters to see results."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 p-2 sm:p-0">
      {films.map((film) => {
        const is35mm = film.format === "35mm";
        const availableCount = getAvailableCount(film);
        const lowStock = isLowStock(availableCount);
        const expiringSoon = isExpiringSoon(film.expiration_date);

        return (
          <div
            key={film.id}
            className={`
              relative overflow-hidden rounded-xl
              bg-gradient-to-br ${getFilmTypeGradient(film.type)}
              border border-[#2a2420] hover:border-[#3a3430]
              transition-all duration-300
              hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20
              animate-in fade-in-50 slide-in-from-bottom-5
            `}
          >
            {/* Brand accent stripe at top */}
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: getBrandAccent(film.brand) }}
            />

            {/* Sprocket holes for 35mm films */}
            {is35mm && (
              <>
                <SprocketHoles side="left" />
                <SprocketHoles side="right" />
              </>
            )}

            {/* Card content with padding for sprocket holes */}
            <div className={`p-4 ${is35mm ? "px-6" : ""}`}>
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex flex-col min-w-0">
                  <h3
                    className="font-serif text-lg text-[#e8e4e0] truncate"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {film.name}
                  </h3>
                  <p className="text-sm text-[#8a8078]">{film.brand}</p>
                </div>
                <Badge variant={getFilmTypeBadgeVariant(film.type)}>
                  {film.type}
                </Badge>
              </div>

              {/* Details */}
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-[#6a6460] flex-shrink-0" />
                  <span className="text-sm text-[#c8c4c0]">
                    {film.format} · ISO {film.iso}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#6a6460] flex-shrink-0" />
                  <span
                    className={`text-sm ${expiringSoon ? "text-red-400" : "text-[#c8c4c0]"}`}
                  >
                    Expires:{" "}
                    {format(new Date(film.expiration_date), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-[#6a6460] flex-shrink-0" />
                  <span
                    className={`text-sm ${lowStock ? "text-amber-400" : "text-[#c8c4c0]"}`}
                  >
                    {lowStock ? "Low stock: " : "Count: "}
                    {availableCount}
                  </span>
                </div>

                {/* View Details Button */}
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full border-[#2a2420] bg-[#1a1614]/50 text-[#c8c4c0] hover:bg-[#2a2420] hover:text-[#e8e4e0] hover:border-[#3a3430]"
                  >
                    <Link
                      href={`/film/${film.id}`}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
