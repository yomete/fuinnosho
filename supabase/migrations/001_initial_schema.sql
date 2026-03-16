-- Fuinnosho Initial Schema
-- Film Inventory Management Application
--
-- This consolidated migration creates the complete database schema.
-- Run this on a fresh Supabase database.

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Films table - stores film inventory
CREATE TABLE IF NOT EXISTS films (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    iso INTEGER NOT NULL,
    format TEXT NOT NULL,
    type TEXT NOT NULL,
    expiration_date DATE,
    price DECIMAL(10,2),
    count INTEGER DEFAULT 0,
    notes TEXT,
    editing_notes TEXT,
    is_ecn BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Bulk film fields
    is_bulk_film BOOLEAN DEFAULT false,
    bulk_length_meters DECIMAL(10,2),
    bulk_quantity INTEGER,
    calculated_rolls INTEGER,
    bulk_remaining_exposures INTEGER CHECK (bulk_remaining_exposures >= 0),
    spooled_cassettes INTEGER DEFAULT 0 CHECK (spooled_cassettes >= 0),
    bulk_rolls_used INTEGER DEFAULT 0,

    -- Timestamps and ownership
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Film usage table - tracks film consumption/additions
CREATE TABLE IF NOT EXISTS film_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    film_id UUID REFERENCES films(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    usage_note TEXT,
    usage_type TEXT DEFAULT 'shoot' CHECK (usage_type IN ('spool', 'shoot', 'add')),
    exposures_used INTEGER CHECK (exposures_used >= 0),
    trip_id UUID,  -- Foreign key added after trips table creation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trips table - stores photography trip plans
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'upcoming' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT check_trip_dates CHECK (end_date >= start_date)
);

-- Trip films junction table - films reserved for trips
CREATE TABLE IF NOT EXISTS trip_films (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(trip_id, film_id)
);

-- Add trip_id foreign key to film_usage now that trips table exists
ALTER TABLE film_usage
ADD CONSTRAINT film_usage_trip_id_fkey
FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL;

-- Gear table - stores camera equipment inventory
CREATE TABLE IF NOT EXISTS gear (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('camera', 'lens', 'flash', 'accessory', 'tripod', 'filter', 'bag')),
    model TEXT,
    serial_number TEXT,
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    condition TEXT NOT NULL DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
    notes TEXT DEFAULT '',
    camera_id UUID REFERENCES gear(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT check_lens_camera_relationship CHECK (
        (type = 'lens') OR
        (type != 'lens' AND camera_id IS NULL)
    )
);

-- Trip gear junction table - gear reserved for trips
CREATE TABLE IF NOT EXISTS trip_gear (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    gear_id UUID NOT NULL REFERENCES gear(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(trip_id, gear_id)
);

-- Feature flags table - per-user feature toggles
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flag_name TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, flag_name)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Films indexes
CREATE INDEX IF NOT EXISTS idx_films_brand ON films(brand);
CREATE INDEX IF NOT EXISTS idx_films_format ON films(format);
CREATE INDEX IF NOT EXISTS idx_films_type ON films(type);
CREATE INDEX IF NOT EXISTS idx_films_bulk ON films(is_bulk_film);
CREATE INDEX IF NOT EXISTS idx_films_deleted_at ON films(deleted_at);
CREATE INDEX IF NOT EXISTS idx_films_user_id ON films(user_id);
CREATE INDEX IF NOT EXISTS idx_films_bulk_remaining ON films(bulk_remaining_exposures) WHERE is_bulk_film = TRUE;

-- Film usage indexes
CREATE INDEX IF NOT EXISTS idx_film_usage_film_id ON film_usage(film_id);
CREATE INDEX IF NOT EXISTS idx_film_usage_type ON film_usage(usage_type);
CREATE INDEX IF NOT EXISTS idx_film_usage_trip_id ON film_usage(trip_id);

-- Trips indexes
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON trips(start_date);
CREATE INDEX IF NOT EXISTS idx_trips_end_date ON trips(end_date);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);

-- Trip films indexes
CREATE INDEX IF NOT EXISTS idx_trip_films_trip_id ON trip_films(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_films_film_id ON trip_films(film_id);

-- Gear indexes
CREATE INDEX IF NOT EXISTS idx_gear_user_id ON gear(user_id);
CREATE INDEX IF NOT EXISTS idx_gear_type ON gear(type);
CREATE INDEX IF NOT EXISTS idx_gear_brand ON gear(brand);
CREATE INDEX IF NOT EXISTS idx_gear_condition ON gear(condition);
CREATE INDEX IF NOT EXISTS idx_gear_camera_id ON gear(camera_id);

-- Trip gear indexes
CREATE INDEX IF NOT EXISTS idx_trip_gear_trip_id ON trip_gear(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_gear_gear_id ON trip_gear(gear_id);

-- Feature flags indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_user_id ON feature_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_flag_name ON feature_flags(user_id, flag_name);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate trip duration in days
CREATE OR REPLACE FUNCTION get_trip_duration(start_date DATE, end_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN end_date - start_date + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at on films
CREATE TRIGGER update_films_updated_at
    BEFORE UPDATE ON films
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at on trips
CREATE TRIGGER update_trips_updated_at
    BEFORE UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at on gear
CREATE TRIGGER update_gear_updated_at
    BEFORE UPDATE ON gear
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE films ENABLE ROW LEVEL SECURITY;
ALTER TABLE film_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_films ENABLE ROW LEVEL SECURITY;
ALTER TABLE gear ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_gear ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Films policies
CREATE POLICY "Users can view own films" ON films
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own films" ON films
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own films" ON films
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own films" ON films
    FOR DELETE USING (auth.uid() = user_id);

-- Film usage policies (based on film ownership)
CREATE POLICY "Users can view film_usage for their own films" ON film_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM films
            WHERE films.id = film_usage.film_id
            AND films.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert film_usage for their own films" ON film_usage
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM films
            WHERE films.id = film_usage.film_id
            AND films.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update film_usage for their own films" ON film_usage
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM films
            WHERE films.id = film_usage.film_id
            AND films.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete film_usage for their own films" ON film_usage
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM films
            WHERE films.id = film_usage.film_id
            AND films.user_id = auth.uid()
        )
    );

-- Trips policies
CREATE POLICY "Users can view own trips" ON trips
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips" ON trips
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips" ON trips
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips" ON trips
    FOR DELETE USING (auth.uid() = user_id);

-- Trip films policies
CREATE POLICY "Users can view trip_films for their own trips" ON trip_films
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = trip_films.trip_id
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert trip_films for their own trips and films" ON trip_films
    FOR INSERT WITH CHECK (
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
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = trip_films.trip_id
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete trip_films for their own trips" ON trip_films
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = trip_films.trip_id
            AND trips.user_id = auth.uid()
        )
    );

-- Gear policies
CREATE POLICY "Users can view own gear" ON gear
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gear" ON gear
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gear" ON gear
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gear" ON gear
    FOR DELETE USING (auth.uid() = user_id);

-- Trip gear policies
CREATE POLICY "Users can view trip_gear for their own trips" ON trip_gear
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = trip_gear.trip_id
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert trip_gear for their own trips and gear" ON trip_gear
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = trip_gear.trip_id
            AND trips.user_id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM gear
            WHERE gear.id = trip_gear.gear_id
            AND gear.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update trip_gear for their own trips" ON trip_gear
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = trip_gear.trip_id
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete trip_gear for their own trips" ON trip_gear
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = trip_gear.trip_id
            AND trips.user_id = auth.uid()
        )
    );

-- Feature flags policies
CREATE POLICY "Users can view their own feature flags" ON feature_flags
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feature flags" ON feature_flags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feature flags" ON feature_flags
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View to get films with availability (accounting for trip reservations)
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
    WHERE t.status != 'completed'
    GROUP BY film_id
) reserved ON f.id = reserved.film_id
WHERE f.deleted_at IS NULL;

-- Grant permissions on the view
GRANT SELECT ON films_with_availability TO authenticated;

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON films TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON film_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON trips TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON trip_films TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON gear TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON trip_gear TO authenticated;
GRANT SELECT, INSERT, UPDATE ON feature_flags TO authenticated;
