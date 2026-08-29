-- Loaded films ("Now" tab)
--
-- Tracks which roll is currently sitting in which camera. A loaded roll is a
-- HOLD, not a consumption: the film stays in `films.count` until you confirm
-- you shot it, but it is subtracted from `available_count` so it cannot also
-- be reserved for a trip.

-- ============================================================================
-- TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS loaded_films (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_id UUID NOT NULL REFERENCES gear(id) ON DELETE CASCADE,
    film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Exposure index the roll is actually being shot at (e.g. Ultra 400 @ 800).
    -- NULL means "shot at box speed".
    shot_at_iso INTEGER CHECK (shot_at_iso > 0),
    notes TEXT,

    loaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    unloaded_at TIMESTAMP WITH TIME ZONE,

    -- How the roll left the camera. NULL while still loaded.
    --   'shot'   -> stock was consumed and a film_usage row was written
    --   'unused' -> hold released, stock untouched
    outcome TEXT CHECK (outcome IN ('shot', 'unused')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    CONSTRAINT check_outcome_matches_unload CHECK (
        (unloaded_at IS NULL AND outcome IS NULL) OR
        (unloaded_at IS NOT NULL AND outcome IS NOT NULL)
    )
);

-- A camera physically holds one roll at a time.
CREATE UNIQUE INDEX IF NOT EXISTS idx_loaded_films_one_active_per_camera
    ON loaded_films(camera_id)
    WHERE unloaded_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_loaded_films_user_id ON loaded_films(user_id);
CREATE INDEX IF NOT EXISTS idx_loaded_films_film_id ON loaded_films(film_id);
CREATE INDEX IF NOT EXISTS idx_loaded_films_active ON loaded_films(user_id) WHERE unloaded_at IS NULL;

CREATE TRIGGER update_loaded_films_updated_at
    BEFORE UPDATE ON loaded_films
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE loaded_films ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own loaded films" ON loaded_films
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loaded films" ON loaded_films
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM gear
            WHERE gear.id = loaded_films.camera_id
            AND gear.user_id = auth.uid()
            AND gear.type = 'camera'
        )
        AND EXISTS (
            SELECT 1 FROM films
            WHERE films.id = loaded_films.film_id
            AND films.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own loaded films" ON loaded_films
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own loaded films" ON loaded_films
    FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON loaded_films TO authenticated;

-- ============================================================================
-- AVAILABILITY VIEW
-- ============================================================================
-- `reserved_quantity` now means "spoken for" from either source: reserved for
-- a trip, or physically loaded in a camera. Every availability consumer reads
-- available_count, so this single change keeps a loaded roll out of the trip
-- picker, the MCP reserve tool, and the inventory totals at once.

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
    COALESCE(reserved.trip_reserved_quantity, 0) as trip_reserved_quantity,
    COALESCE(reserved.loaded_quantity, 0) as loaded_quantity,
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
        SUM(quantity) as reserved_quantity,
        SUM(CASE WHEN source = 'trip' THEN quantity ELSE 0 END) as trip_reserved_quantity,
        SUM(CASE WHEN source = 'loaded' THEN quantity ELSE 0 END) as loaded_quantity
    FROM (
        SELECT tf.film_id, tf.quantity, 'trip' as source
        FROM trip_films tf
        JOIN trips t ON tf.trip_id = t.id
        WHERE t.status != 'completed'

        UNION ALL

        SELECT lf.film_id, 1 as quantity, 'loaded' as source
        FROM loaded_films lf
        WHERE lf.unloaded_at IS NULL
    ) holds
    GROUP BY film_id
) reserved ON f.id = reserved.film_id;

GRANT SELECT ON films_with_availability TO authenticated;
