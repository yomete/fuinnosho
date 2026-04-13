DROP VIEW IF EXISTS films_with_availability;

CREATE VIEW films_with_availability AS
SELECT
    f.id,
    f.name,
    f.brand,
    f.iso,
    f.format,
    f.type,
    f.expiration_date,
    f.price,
    f.count,
    f.notes,
    f.editing_notes,
    f.is_ecn,
    f.deleted_at,
    f.is_bulk_film,
    f.bulk_length_meters,
    f.bulk_quantity,
    f.calculated_rolls,
    f.bulk_remaining_exposures,
    f.spooled_cassettes,
    f.bulk_rolls_used,
    f.created_at,
    f.updated_at,
    f.user_id,
    COALESCE(
        CASE
            WHEN f.is_bulk_film THEN f.spooled_cassettes
            ELSE f.count
        END,
        0
    ) as total_count,
    COALESCE(reserved.reserved_quantity, 0) as reserved_quantity,
    GREATEST(
        0,
        COALESCE(
            CASE
                WHEN f.is_bulk_film THEN f.spooled_cassettes
                ELSE f.count
            END,
            0
        ) - COALESCE(reserved.reserved_quantity, 0)
    ) as available_count
FROM films f
LEFT JOIN (
    SELECT
        film_id,
        SUM(quantity) as reserved_quantity
    FROM trip_films tf
    JOIN trips t ON tf.trip_id = t.id
    WHERE t.status != 'completed'
    GROUP BY film_id
) reserved ON f.id = reserved.film_id;

GRANT SELECT ON films_with_availability TO authenticated;
