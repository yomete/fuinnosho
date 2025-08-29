-- Add soft delete functionality to films table
-- This prevents accidental data loss by marking records as deleted instead of removing them

ALTER TABLE films 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN films.deleted_at IS 'Timestamp when the film was soft deleted. NULL means not deleted.';

-- Add index for performance when filtering out deleted films
CREATE INDEX IF NOT EXISTS idx_films_deleted_at ON films(deleted_at);

-- Update the films_with_availability view to exclude soft deleted films
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
) reserved ON f.id = reserved.film_id
WHERE f.deleted_at IS NULL; -- Exclude soft deleted films

-- Grant permissions on the view
GRANT SELECT ON films_with_availability TO authenticated;