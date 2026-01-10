-- Drop unused feature tables
-- This migration removes challenge and shots tables

-- Drop challenge triggers first
DROP TRIGGER IF EXISTS update_challenge_film_rolls_updated_at ON challenge_film_rolls;
DROP TRIGGER IF EXISTS update_challenge_progress_updated_at ON challenge_progress;
DROP TRIGGER IF EXISTS update_challenges_updated_at ON challenges;

-- Drop challenge tables in order (respecting foreign key constraints)
DROP TABLE IF EXISTS challenge_film_rolls CASCADE;
DROP TABLE IF EXISTS challenge_progress CASCADE;
DROP TABLE IF EXISTS challenge_prompts CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;

-- Drop shots table
DROP TABLE IF EXISTS shots CASCADE;
