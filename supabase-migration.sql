-- First, ensure the films table has a user_id column if it doesn't already
-- This assumes the films table already exists. If not, you'll need to create it first.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'films' AND column_name = 'user_id') THEN
        ALTER TABLE films ADD COLUMN user_id UUID REFERENCES auth.users(id);
        
        -- Set existing films to the first user (you may want to handle this differently)
        -- UPDATE films SET user_id = (SELECT id FROM auth.users LIMIT 1);
        
        -- Make user_id NOT NULL after setting values
        -- ALTER TABLE films ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

-- Enable RLS on films table if not already enabled
ALTER TABLE films ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for films table
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view own films" ON films;
    DROP POLICY IF EXISTS "Users can insert own films" ON films;
    DROP POLICY IF EXISTS "Users can update own films" ON films;
    DROP POLICY IF EXISTS "Users can delete own films" ON films;
END $$;

-- Users can only see their own films
CREATE POLICY "Users can view own films" ON films
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert films for themselves
CREATE POLICY "Users can insert own films" ON films
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own films
CREATE POLICY "Users can update own films" ON films
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can only delete their own films
CREATE POLICY "Users can delete own films" ON films
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create film_usage table to track when and how films are used
CREATE TABLE IF NOT EXISTS film_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    usage_note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries by film_id
CREATE INDEX IF NOT EXISTS idx_film_usage_film_id ON film_usage(film_id);

-- Create index for chronological queries
CREATE INDEX IF NOT EXISTS idx_film_usage_created_at ON film_usage(created_at DESC);

-- Enable Row Level Security
ALTER TABLE film_usage ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies for film_usage
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view usage of their own films" ON film_usage;
    DROP POLICY IF EXISTS "Users can record usage of their own films" ON film_usage;
END $$;

-- Create RLS policy: users can only see usage for their own films
CREATE POLICY "Users can view usage of their own films" ON film_usage
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM films 
            WHERE films.id = film_usage.film_id 
            AND films.user_id = auth.uid()
        )
    );

-- Create RLS policy: users can only insert usage for their own films
CREATE POLICY "Users can record usage of their own films" ON film_usage
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM films 
            WHERE films.id = film_usage.film_id 
            AND films.user_id = auth.uid()
        )
    );

-- Optional: View to get film usage history with film details
CREATE OR REPLACE VIEW film_usage_history AS
SELECT 
    fu.id,
    fu.quantity,
    fu.usage_note,
    fu.created_at,
    f.id as film_id,
    f.name as film_name,
    f.brand as film_brand,
    f.iso,
    f.format,
    f.type
FROM film_usage fu
JOIN films f ON fu.film_id = f.id;

-- Grant permissions on the view
GRANT SELECT ON film_usage_history TO authenticated;