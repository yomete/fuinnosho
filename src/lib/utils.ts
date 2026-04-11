import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export type { Film, FilmUsage } from "@/lib/films/types";
export {
  calculateRollsFromBulkFilm,
  filmSchema,
  formatDimensions,
  getBulkFilmInfo,
  getExposuresPerRoll,
} from "@/lib/films/schema";
export { tripSchema } from "@/lib/trips/schema";
export { gearSchema } from "@/lib/gear/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type { FilmSchema } from "@/lib/films/schema";

// Gear utility functions
export function getConditionColor(condition: string): string {
  switch (condition) {
    case "excellent":
      return "text-green-600 bg-green-50";
    case "good":
      return "text-blue-600 bg-blue-50";
    case "fair":
      return "text-yellow-600 bg-yellow-50";
    case "poor":
      return "text-red-600 bg-red-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

export function getTripStatusColor(
  status: "upcoming" | "ongoing" | "past" | "completed"
): string {
  switch (status) {
    case "upcoming":
      return "text-blue-600 bg-blue-50";
    case "ongoing":
      return "text-orange-600 bg-orange-50";
    case "past":
      return "text-gray-600 bg-gray-50";
    case "completed":
      return "text-green-600 bg-green-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

export function getGearTypeIcon(type: string): string {
  switch (type) {
    case "camera":
      return "📷";
    case "lens":
      return "🔍";
    case "flash":
      return "⚡";
    case "accessory":
      return "🔧";
    case "tripod":
      return "📐";
    case "filter":
      return "🌟";
    case "bag":
      return "👜";
    default:
      return "📦";
  }
}

// Date formatting utility
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

// Trip duration utilities
export function calculateTripDuration(
  startDate: string,
  endDate: string
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Include both start and end days
}

export function formatTripDuration(startDate: string, endDate: string): string {
  const duration = calculateTripDuration(startDate, endDate);

  if (duration === 1) {
    return "1 day";
  } else if (duration < 7) {
    return `${duration} days`;
  } else {
    const weeks = Math.floor(duration / 7);
    const remainingDays = duration % 7;

    if (remainingDays === 0) {
      return weeks === 1 ? "1 week" : `${weeks} weeks`;
    } else {
      const weekText = weeks === 1 ? "1 week" : `${weeks} weeks`;
      const dayText = remainingDays === 1 ? "1 day" : `${remainingDays} days`;
      return `${weekText}, ${dayText}`;
    }
  }
}

export function formatTripDateRange(
  startDate: string,
  endDate: string
): string {
  const start = formatDate(startDate);
  const end = formatDate(endDate);

  if (startDate === endDate) {
    return start;
  }

  return `${start} - ${end}`;
}
