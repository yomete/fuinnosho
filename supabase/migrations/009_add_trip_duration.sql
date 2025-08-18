-- Add start_date and end_date columns to trips table
-- Rename trip_date to start_date for clarity, and add end_date
ALTER TABLE trips RENAME COLUMN trip_date TO start_date;
ALTER TABLE trips ADD COLUMN end_date DATE;

-- Set end_date to start_date for existing trips (assuming single-day trips)
UPDATE trips SET end_date = start_date WHERE end_date IS NULL;

-- Make end_date NOT NULL after setting default values
ALTER TABLE trips ALTER COLUMN end_date SET NOT NULL;

-- Add check constraint to ensure end_date >= start_date
ALTER TABLE trips ADD CONSTRAINT check_trip_dates CHECK (end_date >= start_date);

-- Update the existing index name and add new index for end_date
DROP INDEX IF EXISTS idx_trips_trip_date;
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON trips(start_date);
CREATE INDEX IF NOT EXISTS idx_trips_end_date ON trips(end_date);

-- Create a computed column function to get trip duration in days
CREATE OR REPLACE FUNCTION get_trip_duration(start_date DATE, end_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN end_date - start_date + 1; -- +1 to include both start and end days
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the films_with_availability view to use start_date instead of trip_date
DROP VIEW IF EXISTS films_with_availability;
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
    WHERE t.start_date >= CURRENT_DATE
    GROUP BY film_id
) reserved ON f.id = reserved.film_id;

-- Grant permissions on the view
GRANT SELECT ON films_with_availability TO authenticated;