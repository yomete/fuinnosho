-- Refresh the films_with_availability view to include new bulk film columns
-- The view needs to be recreated after adding new columns to the films table

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