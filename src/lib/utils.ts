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
  editing_notes?: string;
  is_ecn?: boolean;
  deleted_at?: string;
  // Bulk film fields
  is_bulk_film?: boolean;
  bulk_length_meters?: number;
  bulk_quantity?: number;
  bulk_rolls_used?: number;
  calculated_rolls?: number;
  bulk_remaining_exposures?: number;
  spooled_cassettes?: number;
  // Optional availability fields for when using films_with_availability view
  total_count?: number;
  reserved_quantity?: number;
  available_count?: number;
  // Optional trip info for development workflow
  trips?: Array<{ id: string; title: string; quantity: number }>;
}

export interface FilmUsage {
  id: string;
  film_id: string;
  quantity: number;
  usage_note: string;
  created_at: string;
  usage_type?: 'spool' | 'shoot' | 'add';
  exposures_used?: number;
  trip_id?: string;
}

export interface Trip {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  reserved_film_count?: number;
  status: "upcoming" | "ongoing" | "past" | "completed";
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

// Get exposures per roll/sheet for a given format
export function getExposuresPerRoll(format: string): number {
  const formatInfo = formatDimensions[format as keyof typeof formatDimensions];
  if (!formatInfo) return 36; // default fallback for unknown formats
  if ('rollLength' in formatInfo) return formatInfo.rollLength;
  if ('sheetsPerBox' in formatInfo) return formatInfo.sheetsPerBox;
  return 36;
}

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
  editing_notes: z.string().optional(),
  is_ecn: z.boolean().optional(),
  is_bulk_film: z.boolean().optional(),
  bulk_length_meters: z.number().positive().optional(),
  bulk_quantity: z.number().positive().optional(),
  bulk_rolls_used: z.number().nonnegative().optional(),
  calculated_rolls: z.number().optional(),
  bulk_remaining_exposures: z.number().nonnegative().optional(),
  spooled_cassettes: z.number().nonnegative().optional(),
});

export type FilmSchema = z.infer<typeof filmSchema>;

export const tripSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
}).refine((data) => {
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  return endDate >= startDate;
}, {
  message: "End date must be on or after start date",
  path: ["end_date"],
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

export function getTripStatusColor(status: 'upcoming' | 'ongoing' | 'past' | 'completed'): string {
  switch (status) {
    case 'upcoming':
      return 'text-blue-600 bg-blue-50';
    case 'ongoing':
      return 'text-orange-600 bg-orange-50';
    case 'past':
      return 'text-gray-600 bg-gray-50';
    case 'completed':
      return 'text-green-600 bg-green-50';
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

// Date formatting utility
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

// Trip duration utilities
export function calculateTripDuration(startDate: string, endDate: string): number {
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

export function formatTripDateRange(startDate: string, endDate: string): string {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  
  if (startDate === endDate) {
    return start;
  }
  
  return `${start} - ${end}`;
}

// Chemistry and Development-related interfaces
export type ChemistryType = 'developer' | 'stop_bath' | 'fixer' | 'bleach' | 'hypo_clear' | 'wetting_agent' | 'pre_wash' | 'other';
export type ProcessType = 'black_white' | 'color';

export interface ChemistryInventory {
  id: string;
  user_id: string;
  name: string;
  brand?: string;
  chemistry_type: ChemistryType;
  process_type: ProcessType;
  volume_ml: number;
  original_volume_ml: number;
  purchase_date?: string;
  expiry_date?: string;
  opened_date?: string;
  cost?: number;
  storage_location?: string;
  notes?: string;
  max_reuses: number;
  times_used: number;
  total_volume_processed_ml: number;
  created_at: string;
  updated_at: string;
}

export interface DevelopmentRecipe {
  id: string;
  user_id: string;
  name: string;
  film_type?: string;
  developer_id: string;
  dilution_ratio?: string;
  temperature_celsius?: number;
  development_time_minutes?: number;
  agitation_pattern?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // For joins
  developer?: ChemistryInventory;
}

export interface DevelopmentSession {
  id: string;
  user_id: string;
  session_date: string;
  process_type: ProcessType;
  temperature_celsius?: number;
  notes?: string;
  total_cost: number;
  created_at: string;
  // For joins
  session_films?: SessionFilm[];
  session_chemistry_usage?: SessionChemistryUsage[];
}

export interface SessionFilm {
  id: string;
  session_id: string;
  film_id: string;
  quantity: number;
  created_at: string;
  // For joins
  film?: Film;
}

export interface SessionChemistryUsage {
  id: string;
  session_id: string;
  chemistry_id: string;
  volume_used_ml: number;
  dilution_ratio?: string;
  development_time_minutes?: number;
  notes?: string;
  created_at: string;
  // For joins
  chemistry?: ChemistryInventory;
}

// Chemistry schemas
export const chemistryInventorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().optional(),
  chemistry_type: z.enum(['developer', 'stop_bath', 'fixer', 'bleach', 'hypo_clear', 'wetting_agent', 'pre_wash', 'other']),
  process_type: z.enum(['black_white', 'color']),
  volume_ml: z.number().nonnegative("Volume must be positive"),
  original_volume_ml: z.number().positive("Original volume must be positive"),
  purchase_date: z.string().transform(val => val === "" ? undefined : val).optional(),
  expiry_date: z.string().transform(val => val === "" ? undefined : val).optional(),
  opened_date: z.string().transform(val => val === "" ? undefined : val).optional(),
  cost: z.number().nonnegative().optional(),
  storage_location: z.string().optional(),
  notes: z.string().optional(),
  max_reuses: z.number().positive().default(1),
  times_used: z.number().nonnegative().default(0),
  total_volume_processed_ml: z.number().nonnegative().default(0),
});

export const developmentRecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  film_type: z.string().optional(),
  developer_id: z.string().min(1, "Developer is required"),
  dilution_ratio: z.string().optional(),
  temperature_celsius: z.number().positive().optional(),
  development_time_minutes: z.number().positive().optional(),
  agitation_pattern: z.string().optional(),
  notes: z.string().optional(),
});

export const developmentSessionSchema = z.object({
  session_date: z.string().min(1, "Session date is required"),
  process_type: z.enum(['black_white', 'color']),
  temperature_celsius: z.number().positive().optional(),
  notes: z.string().optional(),
  film_ids: z.array(z.string()).min(1, "At least one film must be selected"),
  film_quantities: z.record(z.number().positive()).optional(),
  chemistry_usage: z.array(z.object({
    chemistry_id: z.string(),
    volume_used_ml: z.number().positive(),
    dilution_ratio: z.string().optional(),
    development_time_minutes: z.number().positive().optional(),
    notes: z.string().optional(),
  })).min(1, "At least one chemistry must be used"),
});

export type ChemistryInventorySchema = z.infer<typeof chemistryInventorySchema>;
export type DevelopmentRecipeSchema = z.infer<typeof developmentRecipeSchema>;
export type DevelopmentSessionSchema = z.infer<typeof developmentSessionSchema>;

// Chemistry type options for forms
export const chemistryTypes = [
  { value: 'developer', label: 'Developer' },
  { value: 'stop_bath', label: 'Stop Bath' },
  { value: 'fixer', label: 'Fixer' },
  { value: 'bleach', label: 'Bleach' },
  { value: 'hypo_clear', label: 'Hypo Clear' },
  { value: 'wetting_agent', label: 'Wetting Agent' },
  { value: 'pre_wash', label: 'Pre-Wash' },
  { value: 'other', label: 'Other' },
] as const;

export const processTypes = [
  { value: 'black_white', label: 'Black & White' },
  { value: 'color', label: 'Color' },
] as const;

// Chemistry utility functions
export function getChemistryTypeColor(type: ChemistryType): string {
  switch (type) {
    case 'developer':
      return 'text-purple-600 bg-purple-50';
    case 'stop_bath':
      return 'text-yellow-600 bg-yellow-50';
    case 'fixer':
      return 'text-blue-600 bg-blue-50';
    case 'bleach':
      return 'text-orange-600 bg-orange-50';
    case 'hypo_clear':
      return 'text-cyan-600 bg-cyan-50';
    case 'wetting_agent':
      return 'text-green-600 bg-green-50';
    case 'pre_wash':
      return 'text-teal-600 bg-teal-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getVolumePercentage(current: number, original: number): number {
  if (original === 0) return 0;
  return Math.round((current / original) * 100);
}

export function getVolumeStatusColor(percentage: number): string {
  if (percentage > 50) return 'bg-green-500';
  if (percentage > 20) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function isChemistryExpiringSoon(expiryDate?: string): 'expired' | 'warning' | 'ok' {
  if (!expiryDate) return 'ok';

  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 7) return 'warning';
  if (daysUntilExpiry <= 30) return 'warning';
  return 'ok';
}

export function canReuseChemistry(chemistry: ChemistryInventory): boolean {
  return chemistry.times_used < chemistry.max_reuses;
}
