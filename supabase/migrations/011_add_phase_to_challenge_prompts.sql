-- Add missing phase column to challenge_prompts table
ALTER TABLE challenge_prompts ADD COLUMN IF NOT EXISTS phase text;
