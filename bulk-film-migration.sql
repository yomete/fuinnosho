-- Migration to add bulk film support
-- Run this in Supabase SQL Editor

-- Add bulk film columns to the films table
DO $$ 
BEGIN
    -- Add is_bulk_film column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'films' AND column_name = 'is_bulk_film') THEN
        ALTER TABLE films ADD COLUMN is_bulk_film BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add bulk_length_meters column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'films' AND column_name = 'bulk_length_meters') THEN
        ALTER TABLE films ADD COLUMN bulk_length_meters DECIMAL(10,2) CHECK (bulk_length_meters > 0);
    END IF;
    
    -- Add bulk_quantity column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'films' AND column_name = 'bulk_quantity') THEN
        ALTER TABLE films ADD COLUMN bulk_quantity INTEGER CHECK (bulk_quantity > 0);
    END IF;
    
    -- Add calculated_rolls column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'films' AND column_name = 'calculated_rolls') THEN
        ALTER TABLE films ADD COLUMN calculated_rolls INTEGER;
    END IF;
END $$;

-- Create index for bulk film queries
CREATE INDEX IF NOT EXISTS idx_films_is_bulk_film ON films(is_bulk_film) WHERE is_bulk_film = TRUE;

-- Add constraint to ensure bulk film fields are consistent
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'bulk_film_consistency') THEN
        ALTER TABLE films ADD CONSTRAINT bulk_film_consistency 
        CHECK (
            (is_bulk_film = FALSE) OR 
            (is_bulk_film = TRUE AND bulk_length_meters IS NOT NULL AND bulk_quantity IS NOT NULL AND calculated_rolls IS NOT NULL)
        );
    END IF;
END $$;