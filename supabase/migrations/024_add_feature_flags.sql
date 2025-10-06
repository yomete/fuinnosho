-- Create feature_flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flag_name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, flag_name)
);

-- Add RLS policies
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feature flags"
  ON feature_flags
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feature flags"
  ON feature_flags
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feature flags"
  ON feature_flags
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add index
CREATE INDEX idx_feature_flags_user_id ON feature_flags(user_id);
CREATE INDEX idx_feature_flags_flag_name ON feature_flags(user_id, flag_name);
