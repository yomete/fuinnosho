-- Create base schema for the film inventory app
-- This must be run before all other migrations

-- Create base tables
CREATE TABLE IF NOT EXISTS films (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    brand VARCHAR,
    iso INTEGER,
    format VARCHAR,
    type VARCHAR, -- color_negative, black_white, slide, etc
    quantity INTEGER DEFAULT 0,
    cost_per_roll DECIMAL(10,2),
    purchased_from VARCHAR,
    expiry_date DATE,
    storage_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Bulk film specific fields
    is_bulk_film BOOLEAN DEFAULT FALSE,
    bulk_length_meters DECIMAL(10,2),
    bulk_quantity INTEGER,
    calculated_rolls INTEGER
);

-- Create film_usage table
CREATE TABLE IF NOT EXISTS film_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    film_id UUID REFERENCES films(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    development_type VARCHAR,
    development_cost DECIMAL(10,2) DEFAULT 0,
    camera VARCHAR,
    lens VARCHAR,
    lab VARCHAR,
    location VARCHAR,
    usage_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create gear table
CREATE TABLE IF NOT EXISTS gear (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    brand VARCHAR,
    type VARCHAR, -- camera, lens, flash, etc
    model VARCHAR,
    mount VARCHAR, -- for lenses
    focal_length INTEGER, -- for lenses
    max_aperture VARCHAR, -- for lenses
    purchase_price DECIMAL(10,2),
    purchase_date DATE,
    condition VARCHAR,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_films_brand ON films(brand);
CREATE INDEX IF NOT EXISTS idx_films_format ON films(format);
CREATE INDEX IF NOT EXISTS idx_films_type ON films(type);
CREATE INDEX IF NOT EXISTS idx_films_bulk ON films(is_bulk_film);
CREATE INDEX IF NOT EXISTS idx_film_usage_film_id ON film_usage(film_id);
CREATE INDEX IF NOT EXISTS idx_film_usage_date ON film_usage(usage_date);
CREATE INDEX IF NOT EXISTS idx_gear_type ON gear(type);