import * as z from "zod";
import type { GearCondition, GearType } from "./types.js";

export const gearTypeValues = [
  "camera",
  "lens",
  "flash",
  "accessory",
  "tripod",
  "filter",
  "bag",
] as const satisfies readonly GearType[];

export const gearConditionValues = [
  "excellent",
  "good",
  "fair",
  "poor",
] as const satisfies readonly GearCondition[];

export const gearSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().min(1, "Brand is required"),
  type: z.enum(gearTypeValues, {
    required_error: "Type is required",
  }),
  model: z
    .string()
    .transform((val) => (val === "" ? undefined : val))
    .optional(),
  serial_number: z
    .string()
    .transform((val) => (val === "" ? undefined : val))
    .optional(),
  purchase_date: z
    .string()
    .transform((val) => (val === "" ? undefined : val))
    .optional(),
  purchase_price: z.number().positive().optional(),
  condition: z.enum(gearConditionValues, {
    required_error: "Condition is required",
  }),
  notes: z
    .string()
    .transform((val) => (val === "" ? undefined : val))
    .optional(),
  camera_id: z
    .string()
    .transform((val) => (val === "" || val === "none" ? undefined : val))
    .optional(),
});

export type GearSchema = z.infer<typeof gearSchema>;

export const gearTypes = [
  { value: "camera", label: "Camera" },
  { value: "lens", label: "Lens" },
  { value: "flash", label: "Flash" },
  { value: "accessory", label: "Accessory" },
  { value: "tripod", label: "Tripod" },
  { value: "filter", label: "Filter" },
  { value: "bag", label: "Bag" },
] as const;

export const gearConditions = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
] as const;
