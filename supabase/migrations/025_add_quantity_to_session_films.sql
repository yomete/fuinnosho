-- Add quantity field to session_films table
ALTER TABLE session_films
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;
