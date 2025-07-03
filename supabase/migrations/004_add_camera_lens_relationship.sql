-- Add camera_id field to gear table to allow lenses to be attached to cameras
ALTER TABLE gear ADD COLUMN camera_id UUID REFERENCES gear(id) ON DELETE SET NULL;

-- Create index for camera_id
CREATE INDEX IF NOT EXISTS idx_gear_camera_id ON gear(camera_id);

-- Add constraint to ensure only lenses can have a camera_id
ALTER TABLE gear ADD CONSTRAINT check_lens_camera_relationship 
    CHECK (
        (type = 'lens') OR 
        (type != 'lens' AND camera_id IS NULL)
    );

-- Update RLS policies to include camera relationship queries
-- No changes needed to existing policies as they handle user ownership correctly