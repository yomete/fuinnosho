import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as z from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
});

export type FilmSchema = z.infer<typeof filmSchema>;
