-- Create the shots table
CREATE TABLE IF NOT EXISTS shots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trip_film_id UUID NOT NULL REFERENCES trip_films(id) ON DELETE CASCADE,
    gear_id UUID REFERENCES gear(id) ON DELETE SET NULL,
    frame_number INTEGER NOT NULL,
    aperture TEXT,
    shutter_speed TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_shot_frame UNIQUE (trip_film_id, frame_number)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_shots_user_id ON shots(user_id);
CREATE INDEX IF NOT EXISTS idx_shots_trip_film_id ON shots(trip_film_id);
CREATE INDEX IF NOT EXISTS idx_shots_gear_id ON shots(gear_id);

-- Enable Row Level Security
ALTER TABLE shots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shots table
CREATE POLICY "Users can view their own shots"
    ON shots FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shots"
    ON shots FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shots"
    ON shots FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shots"
    ON shots FOR DELETE
    USING (auth.uid() = user_id);
