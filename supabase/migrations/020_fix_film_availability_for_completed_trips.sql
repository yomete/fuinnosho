-- Fix film availability calculation to properly handle trip film consumption
-- The system should now:
-- 1. Reserve films for non-completed trips (upcoming, ongoing, past)
-- 2. Films are consumed (count reduced) when trips are completed
-- 3. Only non-completed trips affect availability

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
    WHERE t.status != 'completed'
    GROUP BY film_id
) reserved ON f.id = reserved.film_id
WHERE f.deleted_at IS NULL; -- Exclude soft-deleted films

-- Grant permissions on the view
GRANT SELECT ON films_with_availability TO authenticated;