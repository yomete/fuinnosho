-- ============================================
-- Gear Management Migration for Fuinnosho
-- Run this in Supabase SQL Editor
-- ============================================

-- Create gear table
CREATE TABLE IF NOT EXISTS gear (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('camera', 'lens', 'flash', 'accessory', 'tripod', 'filter', 'bag')),
    model TEXT,
    serial_number TEXT,
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    condition TEXT NOT NULL DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for gear table
CREATE INDEX IF NOT EXISTS idx_gear_user_id ON gear(user_id);
CREATE INDEX IF NOT EXISTS idx_gear_type ON gear(type);
CREATE INDEX IF NOT EXISTS idx_gear_brand ON gear(brand);
CREATE INDEX IF NOT EXISTS idx_gear_condition ON gear(condition);

-- Create trip_gear junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS trip_gear (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    gear_id UUID NOT NULL REFERENCES gear(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(trip_id, gear_id)
);

-- Create indexes for trip_gear table
CREATE INDEX IF NOT EXISTS idx_trip_gear_trip_id ON trip_gear(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_gear_gear_id ON trip_gear(gear_id);

-- Enable Row Level Security on gear table
ALTER TABLE gear ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for gear table
CREATE POLICY "Users can view own gear" ON gear
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gear" ON gear
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gear" ON gear
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gear" ON gear
    FOR DELETE
    USING (auth.uid() = user_id);

-- Enable Row Level Security on trip_gear table
ALTER TABLE trip_gear ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trip_gear table
CREATE POLICY "Users can view trip_gear for their own trips" ON trip_gear
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = trip_gear.trip_id 
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert trip_gear for their own trips and gear" ON trip_gear
    FOR INSERT
    WITH CHECK (
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
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = trip_gear.trip_id 
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete trip_gear for their own trips" ON trip_gear
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = trip_gear.trip_id 
            AND trips.user_id = auth.uid()
        )
    );

-- Create trigger to automatically update updated_at on gear table
CREATE TRIGGER update_gear_updated_at 
    BEFORE UPDATE ON gear 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions on the tables
GRANT SELECT, INSERT, UPDATE, DELETE ON gear TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON trip_gear TO authenticated;

-- ============================================
-- Verification queries (optional - run these to check)
-- ============================================

-- Check that tables were created
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('gear', 'trip_gear');

-- Check RLS is enabled
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename IN ('gear', 'trip_gear');

-- Check policies were created
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('gear', 'trip_gear');