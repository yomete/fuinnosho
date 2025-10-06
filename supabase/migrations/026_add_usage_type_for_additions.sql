-- Update film_usage usage_type to support 'add' for tracking inventory additions
ALTER TABLE film_usage
DROP CONSTRAINT IF EXISTS film_usage_usage_type_check;

ALTER TABLE film_usage
ADD CONSTRAINT film_usage_usage_type_check
CHECK (usage_type IN ('spool', 'shoot', 'add'));
