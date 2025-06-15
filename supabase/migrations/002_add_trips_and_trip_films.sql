-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    trip_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for trips table
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_trip_date ON trips(trip_date);

-- Create trip_films junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS trip_films (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(trip_id, film_id)
);

-- Create indexes for trip_films table
CREATE INDEX IF NOT EXISTS idx_trip_films_trip_id ON trip_films(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_films_film_id ON trip_films(film_id);

-- Enable Row Level Security on trips table
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trips table
CREATE POLICY "Users can view own trips" ON trips
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips" ON trips
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips" ON trips
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips" ON trips
    FOR DELETE
    USING (auth.uid() = user_id);

-- Enable Row Level Security on trip_films table
ALTER TABLE trip_films ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trip_films table
CREATE POLICY "Users can view trip_films for their own trips" ON trip_films
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = trip_films.trip_id 
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert trip_films for their own trips and films" ON trip_films
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = trip_films.trip_id 
            AND trips.user_id = auth.uid()
        )
        AND 
        EXISTS (
            SELECT 1 FROM films 
            WHERE films.id = trip_films.film_id 
            AND films.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update trip_films for their own trips" ON trip_films
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = trip_films.trip_id 
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete trip_films for their own trips" ON trip_films
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = trip_films.trip_id 
            AND trips.user_id = auth.uid()
        )
    );

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on trips table
CREATE TRIGGER update_trips_updated_at 
    BEFORE UPDATE ON trips 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create view to get films with available count (count minus reserved quantity)
CREATE OR REPLACE VIEW films_with_availability AS
SELECT 
    f.*,
    COALESCE(f.count, 0) as total_count,
    COALESCE(reserved.reserved_quantity, 0) as reserved_quantity,
    GREATEST(0, COALESCE(f.count, 0) - COALESCE(reserved.reserved_quantity, 0)) as available_count
FROM films f
LEFT JOIN (
    SELECT 
        film_id,
        SUM(quantity) as reserved_quantity
    FROM trip_films tf
    JOIN trips t ON tf.trip_id = t.id
    WHERE t.trip_date >= CURRENT_DATE
    GROUP BY film_id
) reserved ON f.id = reserved.film_id;

-- Grant permissions on the view
GRANT SELECT ON films_with_availability TO authenticated;