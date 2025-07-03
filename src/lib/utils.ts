import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as z from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Film {
  id: string;
  name: string;
  brand: string;
  iso: number;
  format: string;
  type: string;
  expiration_date: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  price?: number;
  count?: number;
  notes?: string;
  // Bulk film fields
  is_bulk_film?: boolean;
  bulk_length_meters?: number;
  bulk_quantity?: number;
  calculated_rolls?: number;
  // Optional availability fields for when using films_with_availability view
  total_count?: number;
  reserved_quantity?: number;
  available_count?: number;
}

export interface FilmUsage {
  id: string;
  film_id: string;
  quantity: number;
  usage_note: string;
  created_at: string;
}

export interface Trip {
  id: string;
  title: string;
  description: string;
  trip_date: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface TripFilm {
  id: string;
  trip_id: string;
  film_id: string;
  quantity: number;
  created_at: string;
}

export interface Gear {
  id: string;
  name: string;
  brand: string;
  type: 'camera' | 'lens' | 'flash' | 'accessory' | 'tripod' | 'filter' | 'bag';
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price?: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
  camera_id?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface TripGear {
  id: string;
  trip_id: string;
  gear_id: string;
  created_at: string;
}

// Add format dimensions for storage calculations
export const formatDimensions = {
  "35mm": { width: 35, height: 24, unit: "mm", rollLength: 36, bulkLengthPerRoll: 1.65 },
  "120": { width: 60, height: 60, unit: "mm", rollLength: 12, bulkLengthPerRoll: 0.8 },
  "4x5": { width: 102, height: 127, unit: "mm", sheetsPerBox: 10, bulkLengthPerRoll: 0 },
};

export const filmSchema = z.object({
  name: z.string().min(1),
  brand: z.string().min(1),
  iso: z.number().min(1),
  format: z.string().min(1),
  type: z.string().min(1),
  expiration_date: z.string().min(1),
  price: z.number().nullable().optional(),
  count: z.number().nullable().optional(),
  notes: z.string().optional(),
  is_bulk_film: z.boolean().optional(),
  bulk_length_meters: z.number().positive().optional(),
  bulk_quantity: z.number().positive().optional(),
  calculated_rolls: z.number().optional(),
});

export type FilmSchema = z.infer<typeof filmSchema>;

export const tripSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  trip_date: z.string().min(1),
});

export type TripSchema = z.infer<typeof tripSchema>;

export const gearSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().min(1, "Brand is required"),
  type: z.enum(['camera', 'lens', 'flash', 'accessory', 'tripod', 'filter', 'bag'], {
    required_error: "Type is required",
  }),
  model: z.string().transform(val => val === '' ? undefined : val).optional(),
  serial_number: z.string().transform(val => val === '' ? undefined : val).optional(),
  purchase_date: z.string().transform(val => val === '' ? undefined : val).optional(),
  purchase_price: z.number().positive().optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor'], {
    required_error: "Condition is required",
  }),
  notes: z.string().transform(val => val === '' ? undefined : val).optional(),
  camera_id: z.string().transform(val => val === '' || val === 'none' ? undefined : val).optional(),
});

export type GearSchema = z.infer<typeof gearSchema>;

// Gear type options for forms and filters
export const gearTypes = [
  { value: 'camera', label: 'Camera' },
  { value: 'lens', label: 'Lens' },
  { value: 'flash', label: 'Flash' },
  { value: 'accessory', label: 'Accessory' },
  { value: 'tripod', label: 'Tripod' },
  { value: 'filter', label: 'Filter' },
  { value: 'bag', label: 'Bag' },
] as const;

export const gearConditions = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
] as const;

// Gear utility functions
export function getConditionColor(condition: string): string {
  switch (condition) {
    case 'excellent':
      return 'text-green-600 bg-green-50';
    case 'good':
      return 'text-blue-600 bg-blue-50';
    case 'fair':
      return 'text-yellow-600 bg-yellow-50';
    case 'poor':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getGearTypeIcon(type: string): string {
  switch (type) {
    case 'camera':
      return '📷';
    case 'lens':
      return '🔍';
    case 'flash':
      return '⚡';
    case 'accessory':
      return '🔧';
    case 'tripod':
      return '📐';
    case 'filter':
      return '🌟';
    case 'bag':
      return '👜';
    default:
      return '📦';
  }
}

// Bulk film calculation utilities
export function calculateRollsFromBulkFilm(
  bulkLengthMeters: number, 
  format: string,
  bulkQuantity: number = 1
): number {
  const formatInfo = formatDimensions[format as keyof typeof formatDimensions];
  
  if (!formatInfo || formatInfo.bulkLengthPerRoll === 0) {
    return 0;
  }
  
  // Add 10% waste factor and round down to whole rolls
  const wasteFactor = 0.9;
  const rollsPerBulk = (bulkLengthMeters * wasteFactor) / formatInfo.bulkLengthPerRoll;
  const totalRolls = Math.floor(rollsPerBulk) * bulkQuantity;
  
  return totalRolls;
}

export function getBulkFilmInfo(format: string) {
  const formatInfo = formatDimensions[format as keyof typeof formatDimensions];
  return formatInfo ? {
    supportsBulk: formatInfo.bulkLengthPerRoll > 0,
    lengthPerRoll: formatInfo.bulkLengthPerRoll,
    format: format
  } : null;
}
