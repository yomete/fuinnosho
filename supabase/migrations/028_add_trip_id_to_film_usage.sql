-- Migration to add trip_id foreign key to film_usage table
-- This fixes the fragile string matching issue where trip title changes would break consumption tracking

-- Add trip_id column with foreign key reference
ALTER TABLE film_usage
ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES trips(id) ON DELETE SET NULL;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_film_usage_trip_id ON film_usage(trip_id);

-- Backfill existing records by parsing usage_note for trip titles
-- This attempts to match existing usage records to their trips based on the usage_note pattern
DO $$
DECLARE
    trip_record RECORD;
    usage_count INTEGER;
BEGIN
    -- Loop through all trips
    FOR trip_record IN SELECT id, title FROM trips LOOP
        -- Update film_usage records that have usage notes matching this trip
        UPDATE film_usage
        SET trip_id = trip_record.id
        WHERE usage_note LIKE '%Trip: ' || trip_record.title || '%'
          AND trip_id IS NULL;

        GET DIAGNOSTICS usage_count = ROW_COUNT;
        IF usage_count > 0 THEN
            RAISE NOTICE 'Linked % usage records to trip: %', usage_count, trip_record.title;
        END IF;
    END LOOP;
END $$;

-- Add a comment explaining the column purpose
COMMENT ON COLUMN film_usage.trip_id IS 'Foreign key to trips table for trip-related film consumption tracking';
