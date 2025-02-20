export interface Film {
  Row: {
    id: string;
    barcode: string;
    name: string;
    brand: string;
    iso: number;
    format: string;
    type: string;
    expiration_date: string;
    created_at: string;
  };
}

export interface User {
  Row: {
    id: string;
    email: string;
    password: string;
    created_at: string;
  };
}

export interface Inventory {
  Row: {
    id: string;
    user_id: string;
    film_id: string;
    quantity: number;
    added_at: string;
    notes: string | null;
  };
}

export interface Recommendation {
  Row: {
    id: string;
    user_id: string;
    weather: string;
    scenario: string;
    recommended_film_id: string;
    created_at: string;
  };
}

export interface Database {
  public: {
    Tables: {
      films: {
        Row: Film["Row"];
        Insert: Omit<Film["Row"], "id" | "created_at">;
        Update: Partial<Film["Row"]>;
      };
      inventory: {
        Row: Inventory["Row"];
        Insert: Omit<Inventory["Row"], "id" | "added_at">;
        Update: Partial<Inventory["Row"]>;
      };
      recommendations: {
        Row: Recommendation["Row"];
        Insert: Omit<Recommendation["Row"], "id" | "created_at">;
        Update: Partial<Recommendation["Row"]>;
      };
      users: {
        Row: User["Row"];
        Insert: Omit<User["Row"], "id" | "created_at">;
        Update: Partial<User["Row"]>;
      };
    };
  };
}
