-- Retroactively consume films from already completed trips
-- This handles cases where trips were marked as completed before the consumption logic was added

DO $$
DECLARE
    trip_record RECORD;
    trip_film_record RECORD;
    existing_usage_count INTEGER;
BEGIN
    -- Process all completed trips
    FOR trip_record IN 
        SELECT id, title FROM trips WHERE status = 'completed'
    LOOP
        -- Process each film in the completed trip
        FOR trip_film_record IN 
            SELECT film_id, quantity FROM trip_films WHERE trip_id = trip_record.id
        LOOP
            -- Check if this film has already been consumed for this trip
            SELECT COUNT(*) INTO existing_usage_count 
            FROM film_usage 
            WHERE film_id = trip_film_record.film_id 
            AND usage_note LIKE '%Trip: ' || trip_record.title || '%';
            
            -- Only consume if not already consumed
            IF existing_usage_count = 0 THEN
                -- Reduce film count
                UPDATE films 
                SET count = GREATEST(0, COALESCE(count, 0) - trip_film_record.quantity)
                WHERE id = trip_film_record.film_id;
                
                -- Record the usage
                INSERT INTO film_usage (film_id, quantity, usage_note, usage_type, created_at)
                VALUES (
                    trip_film_record.film_id,
                    trip_film_record.quantity,
                    'Trip: ' || trip_record.title || ' (completed - retroactive)',
                    'shoot',
                    NOW()
                );
                
                RAISE NOTICE 'Consumed % units of film % for completed trip %', 
                    trip_film_record.quantity, trip_film_record.film_id, trip_record.title;
            END IF;
        END LOOP;
    END LOOP;
END $$;