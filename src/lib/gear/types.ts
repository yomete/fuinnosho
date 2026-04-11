export type GearType =
  | "camera"
  | "lens"
  | "flash"
  | "accessory"
  | "tripod"
  | "filter"
  | "bag";

export type GearCondition = "excellent" | "good" | "fair" | "poor";

export interface Gear {
  id: string;
  name: string;
  brand: string;
  type: GearType;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price?: number;
  condition: GearCondition;
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
