-- Add bulk_rolls_used field to track completed bulk rolls
ALTER TABLE films
ADD COLUMN IF NOT EXISTS bulk_rolls_used INTEGER DEFAULT 0;

-- Add comment explaining the field
COMMENT ON COLUMN films.bulk_rolls_used IS 'Number of bulk rolls that have been fully used (for multi-roll bulk film packages)';
