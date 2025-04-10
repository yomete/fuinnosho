import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as z from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Film {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  iso: number;
  format: string;
  type: string;
  expiration_date: string;
  created_at: string;
  updated_at: string;
  price?: number;
  count?: number;
  notes?: string;
}

// Add format dimensions for storage calculations
export const formatDimensions = {
  "35mm": { width: 35, height: 24, unit: "mm", rollLength: 36 },
  "120": { width: 60, height: 60, unit: "mm", rollLength: 12 },
  "4x5": { width: 102, height: 127, unit: "mm", sheetsPerBox: 10 },
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
});

export type FilmSchema = z.infer<typeof filmSchema>;
