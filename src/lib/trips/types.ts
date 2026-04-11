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
