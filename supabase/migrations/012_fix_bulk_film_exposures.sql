-- Fix bulk film exposures migration
-- Add missing columns and initialize bulk_remaining_exposures for existing bulk films

-- Add the missing columns if they don't exist
ALTER TABLE films 
ADD COLUMN IF NOT EXISTS bulk_remaining_exposures INTEGER CHECK (bulk_remaining_exposures >= 0);

ALTER TABLE films 
ADD COLUMN IF NOT EXISTS spooled_cassettes INTEGER DEFAULT 0 CHECK (spooled_cassettes >= 0);

-- Add columns to film_usage table if they don't exist
ALTER TABLE film_usage 
ADD COLUMN IF NOT EXISTS usage_type VARCHAR(20) DEFAULT 'shoot' CHECK (usage_type IN ('spool', 'shoot'));

ALTER TABLE film_usage 
ADD COLUMN IF NOT EXISTS exposures_used INTEGER CHECK (exposures_used >= 0);

-- Initialize bulk_remaining_exposures for existing bulk films
-- For 35mm format (36 exposures per roll)
UPDATE films 
SET bulk_remaining_exposures = calculated_rolls * 36
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

-- For other formats, default to 36 exposures per roll
UPDATE films 
SET bulk_remaining_exposures = calculated_rolls * 36
WHERE is_bulk_film = TRUE 
  AND bulk_remaining_exposures IS NULL 
  AND calculated_rolls IS NOT NULL
  AND format NOT IN ('35mm', '120');

-- Initialize spooled_cassettes to 0 where it's null
UPDATE films 
SET spooled_cassettes = 0
WHERE is_bulk_film = TRUE 
  AND spooled_cassettes IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_film_usage_type ON film_usage(usage_type);
CREATE INDEX IF NOT EXISTS idx_films_bulk_remaining ON films(bulk_remaining_exposures) WHERE is_bulk_film = TRUE;