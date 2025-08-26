-- Migration to convert bulk film tracking from meters to exposures
-- This migration changes the tracking from meters_used to exposures_used

DO $$ 
BEGIN
    -- Add bulk_remaining_exposures column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'films' AND column_name = 'bulk_remaining_exposures') THEN
        ALTER TABLE films ADD COLUMN bulk_remaining_exposures INTEGER CHECK (bulk_remaining_exposures >= 0);
    END IF;
    
    -- Add exposures_used to film_usage table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'film_usage' AND column_name = 'exposures_used') THEN
        ALTER TABLE film_usage ADD COLUMN exposures_used INTEGER CHECK (exposures_used >= 0);
    END IF;
END $$;

-- Convert existing bulk_remaining_meters to exposures for 35mm films
-- 35mm: 1.65m per roll = 36 exposures, so divide by 1.65 and multiply by 36
UPDATE films 
SET bulk_remaining_exposures = ROUND((bulk_remaining_meters / 1.65) * 36)
WHERE is_bulk_film = TRUE 
  AND bulk_remaining_meters IS NOT NULL
  AND bulk_remaining_exposures IS NULL
  AND format = '35mm';

-- Convert for 120 films 
-- 120: 0.8m per roll = 12 exposures, so divide by 0.8 and multiply by 12
UPDATE films 
SET bulk_remaining_exposures = ROUND((bulk_remaining_meters / 0.8) * 12)
WHERE is_bulk_film = TRUE 
  AND bulk_remaining_meters IS NOT NULL
  AND bulk_remaining_exposures IS NULL
  AND format = '120';

-- Convert existing film_usage meters_used to exposures_used
-- For spooling type usage, convert meters to exposures based on film format
UPDATE film_usage 
SET exposures_used = CASE 
    WHEN f.format = '35mm' THEN ROUND((film_usage.meters_used / 1.65) * 36)
    WHEN f.format = '120' THEN ROUND((film_usage.meters_used / 0.8) * 12)
    ELSE NULL
END
FROM films f
WHERE film_usage.film_id = f.id
  AND film_usage.usage_type = 'spool'
  AND film_usage.meters_used IS NOT NULL
  AND film_usage.exposures_used IS NULL;

-- Create index for bulk remaining exposures
CREATE INDEX IF NOT EXISTS idx_films_bulk_remaining_exposures ON films(bulk_remaining_exposures) WHERE is_bulk_film = TRUE;

-- Update constraint to include new field
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'bulk_film_consistency') THEN
        ALTER TABLE films DROP CONSTRAINT bulk_film_consistency;
    END IF;
    
    -- Add updated constraint
    ALTER TABLE films ADD CONSTRAINT bulk_film_consistency 
    CHECK (
        (is_bulk_film = FALSE) OR 
        (is_bulk_film = TRUE AND 
         bulk_length_meters IS NOT NULL AND 
         bulk_quantity IS NOT NULL AND 
         calculated_rolls IS NOT NULL AND
         (bulk_remaining_meters IS NOT NULL OR bulk_remaining_exposures IS NOT NULL) AND
         spooled_cassettes IS NOT NULL)
    );
END $$;

-- Comment for future cleanup: The old meters columns can be dropped in a future migration once verified
-- ALTER TABLE films DROP COLUMN bulk_remaining_meters;
-- ALTER TABLE film_usage DROP COLUMN meters_used;