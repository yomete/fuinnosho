-- Fix the films_with_availability view to include recent past trips
-- This allows editing film usage after trips are completed
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
    -- Include trips from the past 30 days and all future trips
    -- This allows post-trip editing of film usage
    WHERE t.trip_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY film_id
) reserved ON f.id = reserved.film_id;

-- Grant permissions on the view
GRANT SELECT ON films_with_availability TO authenticated;