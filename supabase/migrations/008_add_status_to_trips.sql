ALTER TABLE trips ADD COLUMN status TEXT DEFAULT 'upcoming' NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
