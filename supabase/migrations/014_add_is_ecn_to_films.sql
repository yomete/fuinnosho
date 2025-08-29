-- Add is_ecn column to films table
-- This allows users to explicitly mark films as ECN (Eastman Color Negative) motion picture films
-- instead of relying on hardcoded brand name detection

ALTER TABLE films 
ADD COLUMN is_ecn BOOLEAN DEFAULT false;

-- Add comment to document the column purpose
COMMENT ON COLUMN films.is_ecn IS 'Indicates whether this film is an ECN (Eastman Color Negative) motion picture film requiring ECN-2 processing';