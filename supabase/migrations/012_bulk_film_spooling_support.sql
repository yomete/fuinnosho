-- Migration to add bulk film spooling support
-- This extends the existing bulk film functionality to track spooling vs shooting separately
-- Run this in Supabase SQL Editor

DO $$ 
BEGIN
    -- Add bulk_remaining_exposures to track what's left after spooling
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'films' AND column_name = 'bulk_remaining_exposures') THEN
        ALTER TABLE films ADD COLUMN bulk_remaining_exposures INTEGER CHECK (bulk_remaining_exposures >= 0);
    END IF;
    
    -- Add spooled_cassettes to track how many cassettes have been created from bulk
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'films' AND column_name = 'spooled_cassettes') THEN
        ALTER TABLE films ADD COLUMN spooled_cassettes INTEGER DEFAULT 0 CHECK (spooled_cassettes >= 0);
    END IF;
    
    -- Add usage_type to film_usage table to distinguish between spooling and shooting
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'film_usage' AND column_name = 'usage_type') THEN
        ALTER TABLE film_usage ADD COLUMN usage_type VARCHAR(20) DEFAULT 'shoot' CHECK (usage_type IN ('spool', 'shoot'));
    END IF;
    
    -- Add exposures_used for tracking bulk film consumption during spooling
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'film_usage' AND column_name = 'exposures_used') THEN
        ALTER TABLE film_usage ADD COLUMN exposures_used INTEGER CHECK (exposures_used >= 0);
    END IF;
END $$;

-- Initialize bulk_remaining_exposures for existing bulk films
-- Calculate total exposures from bulk length and format
UPDATE films 
SET bulk_remaining_exposures = calculated_rolls * 36  -- 36 exposures per roll for 35mm
WHERE is_bulk_film = TRUE 
  AND bulk_remaining_exposures IS NULL 
  AND calculated_rolls IS NOT NULL
  AND format = '35mm';

-- For 120 format (12 exposures per roll)
UPDATE films 
SET bulk_remaining_exposures = calculated_rolls * 12
WHERE is_bulk_film = TRUE 
  AND bulk_remaining_exposures IS NULL 
  AND calculated_rolls IS NOT NULL
  AND format = '120';

-- Create index for usage type queries
CREATE INDEX IF NOT EXISTS idx_film_usage_type ON film_usage(usage_type);

-- Create index for bulk remaining exposures
CREATE INDEX IF NOT EXISTS idx_films_bulk_remaining ON films(bulk_remaining_exposures) WHERE is_bulk_film = TRUE;

-- Update the bulk film consistency constraint to include new fields
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
         bulk_remaining_exposures IS NOT NULL AND
         spooled_cassettes IS NOT NULL)
    );
END $$;