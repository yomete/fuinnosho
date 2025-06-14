-- Add updated_at column to films table
ALTER TABLE films ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row modification
DROP TRIGGER IF EXISTS update_films_updated_at ON films;
CREATE TRIGGER update_films_updated_at
    BEFORE UPDATE ON films
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Set updated_at for existing records to match their created_at
UPDATE films SET updated_at = created_at WHERE updated_at IS NULL;