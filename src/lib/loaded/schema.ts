import * as z from "zod";
import type { UnloadOutcome } from "@/lib/loaded/types";

export const unloadOutcomeValues = [
  "shot",
  "unused",
] as const satisfies readonly UnloadOutcome[];

export const loadFilmSchema = z.object({
  camera_id: z.string().min(1, "Camera is required"),
  film_id: z.string().min(1, "Film is required"),
  shot_at_iso: z
    .number()
    .int()
    .positive("Shot-at ISO must be greater than zero")
    .optional(),
  notes: z
    .string()
    .transform((val) => (val.trim() === "" ? undefined : val.trim()))
    .optional(),
});

export type LoadFilmSchema = z.infer<typeof loadFilmSchema>;

export const unloadFilmSchema = z.object({
  outcome: z.enum(unloadOutcomeValues, {
    required_error: "Outcome is required",
  }),
  trip_id: z
    .string()
    .transform((val) => (val === "" || val === "none" ? undefined : val))
    .optional(),
});

export type UnloadFilmSchema = z.infer<typeof unloadFilmSchema>;
