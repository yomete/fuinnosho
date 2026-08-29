import * as z from "zod";
export const unloadOutcomeValues = [
    "shot",
    "unused",
];
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
export const unloadFilmSchema = z.object({
    outcome: z.enum(unloadOutcomeValues, {
        required_error: "Outcome is required",
    }),
    trip_id: z
        .string()
        .transform((val) => (val === "" || val === "none" ? undefined : val))
        .optional(),
});
