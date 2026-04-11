export interface FilmTripSummary {
  id: string;
  title: string;
  quantity: number;
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
  is_bulk_film?: boolean;
  bulk_length_meters?: number;
  bulk_quantity?: number;
  bulk_rolls_used?: number;
  calculated_rolls?: number;
  bulk_remaining_exposures?: number;
  spooled_cassettes?: number;
  total_count?: number;
  reserved_quantity?: number;
  available_count?: number;
  trips?: FilmTripSummary[];
}

export interface FilmUsage {
  id: string;
  film_id: string;
  quantity: number;
  usage_note: string;
  created_at: string;
  usage_type?: "spool" | "shoot" | "add";
  exposures_used?: number;
  trip_id?: string;
}
