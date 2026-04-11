export type MCPToolResult = {
  content: Array<{ type: "text"; text: string }>;
};

export type ToolArgumentsByName = {
  get_film_inventory: { include_availability?: boolean };
  filter_films: {
    type?: string;
    iso_min?: number;
    iso_max?: number;
    format?: string;
    brand?: string;
    in_stock_only?: boolean;
  };
  update_film_quantity: {
    film_id?: string;
    quantity?: number;
    usage_note?: string;
  };
  spool_bulk_film: {
    film_id?: string;
    exposures_to_spool?: number;
    cassettes_created?: number;
    spool_note?: string;
  };
  check_low_stock: {
    threshold?: number;
    include_out_of_stock?: boolean;
  };
  get_film_usage_history: { film_id?: string };
  get_film_stats: { group_by?: "type" | "brand" | "format" | "iso" };
  create_film: {
    name?: string;
    brand?: string;
    iso?: number;
    format?: string;
    type?: string;
    expiration_date?: string;
    count?: number;
    price?: number;
    notes?: string;
    editing_notes?: string;
    is_ecn?: boolean;
    is_bulk_film?: boolean;
    bulk_length_meters?: number;
  };
  edit_film: {
    film_id?: string;
    name?: string;
    brand?: string;
    iso?: number;
    format?: string;
    type?: string;
    expiration_date?: string;
    price?: number;
    count?: number;
    notes?: string;
    editing_notes?: string;
    is_ecn?: boolean;
    is_bulk_film?: boolean;
    bulk_length_meters?: number;
    bulk_quantity?: number;
    bulk_rolls_used?: number;
    calculated_rolls?: number;
    bulk_remaining_exposures?: number;
    spooled_cassettes?: number;
  };
  delete_film: { film_id?: string };
  create_trip: {
    title?: string;
    description?: string;
    start_date?: string;
    end_date?: string;
  };
  list_trips: { include_past?: boolean; include_films?: boolean };
  get_trip_details: { trip_id?: string };
  edit_trip: {
    trip_id?: string;
    title?: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
  };
  delete_trip: { trip_id?: string };
  reserve_film_for_trip: {
    trip_id?: string;
    film_id?: string;
    quantity?: number;
  };
  remove_film_reservation: { trip_id?: string; film_id?: string };
  update_film_reservation_quantity: {
    trip_id?: string;
    film_id?: string;
    quantity?: number;
  };
  get_films_with_availability: {
    available_only?: boolean;
    min_available?: number;
  };
  create_gear: {
    name?: string;
    brand?: string;
    type?: string;
    model?: string;
    serial_number?: string;
    purchase_date?: string;
    purchase_price?: number;
    condition?: string;
    notes?: string;
  };
  list_gear: {
    type?: string;
    brand?: string;
    condition?: string;
    include_trip_reservations?: boolean;
  };
  edit_gear: {
    gear_id?: string;
    name?: string;
    brand?: string;
    type?: string;
    model?: string;
    serial_number?: string;
    purchase_date?: string;
    purchase_price?: number;
    condition?: string;
    notes?: string;
  };
  delete_gear: { gear_id?: string };
  get_gear_stats: { group_by?: string };
  reserve_gear_for_trip: { trip_id?: string; gear_id?: string };
  remove_gear_reservation: { trip_id?: string; gear_id?: string };
};

export type ToolName = keyof ToolArgumentsByName;

export type ToolHandler<TName extends ToolName> = (
  args: ToolArgumentsByName[TName]
) => Promise<MCPToolResult>;

export type ToolHandlersByName = {
  [K in ToolName]: ToolHandler<K>;
};

export interface FilmToolHandlers {
  getFilmInventory: ToolHandler<"get_film_inventory">;
  filterFilms: ToolHandler<"filter_films">;
  updateFilmQuantity: ToolHandler<"update_film_quantity">;
  spoolBulkFilm: ToolHandler<"spool_bulk_film">;
  checkLowStock: ToolHandler<"check_low_stock">;
  getFilmUsageHistory: ToolHandler<"get_film_usage_history">;
  getFilmStats: ToolHandler<"get_film_stats">;
  createFilm: ToolHandler<"create_film">;
  editFilm: ToolHandler<"edit_film">;
  deleteFilm: ToolHandler<"delete_film">;
}

export interface TripToolHandlers {
  createTrip: ToolHandler<"create_trip">;
  listTrips: ToolHandler<"list_trips">;
  getTripDetails: ToolHandler<"get_trip_details">;
  editTrip: ToolHandler<"edit_trip">;
  deleteTrip: ToolHandler<"delete_trip">;
  reserveFilmForTrip: ToolHandler<"reserve_film_for_trip">;
  removeFilmReservation: ToolHandler<"remove_film_reservation">;
  updateFilmReservationQuantity: ToolHandler<"update_film_reservation_quantity">;
  getFilmsWithAvailability: ToolHandler<"get_films_with_availability">;
}

export interface GearToolHandlers {
  createGear: ToolHandler<"create_gear">;
  listGear: ToolHandler<"list_gear">;
  editGear: ToolHandler<"edit_gear">;
  deleteGear: ToolHandler<"delete_gear">;
  getGearStats: ToolHandler<"get_gear_stats">;
  reserveGearForTrip: ToolHandler<"reserve_gear_for_trip">;
  removeGearReservation: ToolHandler<"remove_gear_reservation">;
}
