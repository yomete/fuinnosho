-- Add film chemistry development inventory and session tracking
-- This migration creates tables for chemistry inventory management and development session logging

-- Create chemistry_inventory table
CREATE TABLE IF NOT EXISTS chemistry_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    brand TEXT,
    chemistry_type TEXT NOT NULL CHECK (chemistry_type IN ('developer', 'stop_bath', 'fixer', 'bleach', 'hypo_clear', 'wetting_agent', 'pre_wash', 'other')),
    process_type TEXT NOT NULL CHECK (process_type IN ('black_white', 'color')),
    volume_ml DECIMAL(10,2) NOT NULL CHECK (volume_ml >= 0),
    original_volume_ml DECIMAL(10,2) NOT NULL CHECK (original_volume_ml > 0),
    purchase_date DATE,
    expiry_date DATE,
    opened_date DATE,
    cost DECIMAL(10,2),
    storage_location TEXT,
    notes TEXT,
    max_reuses INTEGER DEFAULT 1 CHECK (max_reuses > 0),
    times_used INTEGER DEFAULT 0 CHECK (times_used >= 0),
    total_volume_processed_ml DECIMAL(10,2) DEFAULT 0 CHECK (total_volume_processed_ml >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create development_recipes table
CREATE TABLE IF NOT EXISTS development_recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    film_type TEXT, -- Can be specific like "HP5+" or general like "B&W"
    developer_id UUID NOT NULL REFERENCES chemistry_inventory(id) ON DELETE CASCADE,
    dilution_ratio TEXT, -- e.g., "1+50", "1:1", "stock"
    temperature_celsius DECIMAL(5,2),
    development_time_minutes DECIMAL(6,2),
    agitation_pattern TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create development_sessions table
CREATE TABLE IF NOT EXISTS development_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    process_type TEXT NOT NULL CHECK (process_type IN ('black_white', 'color')),
    temperature_celsius DECIMAL(5,2),
    notes TEXT,
    total_cost DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create session_films junction table (many-to-many: sessions <-> films)
CREATE TABLE IF NOT EXISTS session_films (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES development_sessions(id) ON DELETE CASCADE,
    film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(session_id, film_id)
);

-- Create session_chemistry_usage table
CREATE TABLE IF NOT EXISTS session_chemistry_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES development_sessions(id) ON DELETE CASCADE,
    chemistry_id UUID NOT NULL REFERENCES chemistry_inventory(id) ON DELETE CASCADE,
    volume_used_ml DECIMAL(10,2) NOT NULL CHECK (volume_used_ml > 0),
    dilution_ratio TEXT,
    development_time_minutes DECIMAL(6,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for chemistry_inventory
CREATE INDEX IF NOT EXISTS idx_chemistry_inventory_user_id ON chemistry_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_chemistry_inventory_chemistry_type ON chemistry_inventory(chemistry_type);
CREATE INDEX IF NOT EXISTS idx_chemistry_inventory_process_type ON chemistry_inventory(process_type);
CREATE INDEX IF NOT EXISTS idx_chemistry_inventory_expiry_date ON chemistry_inventory(expiry_date);

-- Create indexes for development_recipes
CREATE INDEX IF NOT EXISTS idx_development_recipes_user_id ON development_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_development_recipes_developer_id ON development_recipes(developer_id);

-- Create indexes for development_sessions
CREATE INDEX IF NOT EXISTS idx_development_sessions_user_id ON development_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_development_sessions_session_date ON development_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_development_sessions_process_type ON development_sessions(process_type);

-- Create indexes for session_films
CREATE INDEX IF NOT EXISTS idx_session_films_session_id ON session_films(session_id);
CREATE INDEX IF NOT EXISTS idx_session_films_film_id ON session_films(film_id);

-- Create indexes for session_chemistry_usage
CREATE INDEX IF NOT EXISTS idx_session_chemistry_usage_session_id ON session_chemistry_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_session_chemistry_usage_chemistry_id ON session_chemistry_usage(chemistry_id);

-- Enable Row Level Security on all tables
ALTER TABLE chemistry_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_films ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_chemistry_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chemistry_inventory
CREATE POLICY "Users can view their own chemistry inventory" ON chemistry_inventory
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chemistry inventory" ON chemistry_inventory
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chemistry inventory" ON chemistry_inventory
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chemistry inventory" ON chemistry_inventory
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for development_recipes
CREATE POLICY "Users can view their own recipes" ON development_recipes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipes" ON development_recipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes" ON development_recipes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes" ON development_recipes
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for development_sessions
CREATE POLICY "Users can view their own development sessions" ON development_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own development sessions" ON development_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own development sessions" ON development_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own development sessions" ON development_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for session_films
CREATE POLICY "Users can view session_films for their own sessions" ON session_films
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM development_sessions
            WHERE development_sessions.id = session_films.session_id
            AND development_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert session_films for their own sessions" ON session_films
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM development_sessions
            WHERE development_sessions.id = session_films.session_id
            AND development_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete session_films for their own sessions" ON session_films
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM development_sessions
            WHERE development_sessions.id = session_films.session_id
            AND development_sessions.user_id = auth.uid()
        )
    );

-- RLS Policies for session_chemistry_usage
CREATE POLICY "Users can view session_chemistry_usage for their own sessions" ON session_chemistry_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM development_sessions
            WHERE development_sessions.id = session_chemistry_usage.session_id
            AND development_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert session_chemistry_usage for their own sessions" ON session_chemistry_usage
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM development_sessions
            WHERE development_sessions.id = session_chemistry_usage.session_id
            AND development_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete session_chemistry_usage for their own sessions" ON session_chemistry_usage
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM development_sessions
            WHERE development_sessions.id = session_chemistry_usage.session_id
            AND development_sessions.user_id = auth.uid()
        )
    );
