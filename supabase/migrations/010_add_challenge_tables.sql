-- Create challenge progress tracking tables

-- Main challenge table (can support multiple challenges)
CREATE TABLE challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Challenge prompts (daily prompts for a challenge)
CREATE TABLE challenge_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  day_number integer NOT NULL,
  title text NOT NULL,
  prompt_text text NOT NULL,
  film_suggestion text,
  frame_range text,
  location_context text, -- for travel days
  special_notes text,
  phase text, -- challenge phase name
  created_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, day_number)
);

-- User progress on challenge prompts
CREATE TABLE challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  prompt_id uuid REFERENCES challenge_prompts(id) ON DELETE CASCADE NOT NULL,
  completion_date date,
  completed boolean DEFAULT false,
  notes text,
  photos_taken integer DEFAULT 0,
  film_used_id uuid REFERENCES films(id),
  frames_used integer,
  reflection text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, prompt_id)
);

-- Challenge film rolls (track which rolls are used for the challenge)
CREATE TABLE challenge_film_rolls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  film_id uuid REFERENCES films(id) ON DELETE CASCADE NOT NULL,
  roll_number integer NOT NULL,
  start_date date,
  end_date date,
  frames_used integer DEFAULT 0,
  frames_total integer DEFAULT 36,
  status text DEFAULT 'loaded' CHECK (status IN ('loaded', 'active', 'completed', 'developed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, challenge_id, roll_number)
);

-- Enable RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_film_rolls ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own challenges" ON challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own challenges" ON challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own challenges" ON challenges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own challenges" ON challenges FOR DELETE USING (auth.uid() = user_id);

-- Challenge prompts are viewable by challenge owner
CREATE POLICY "Users can view prompts for their challenges" ON challenge_prompts FOR SELECT 
  USING (challenge_id IN (SELECT id FROM challenges WHERE user_id = auth.uid()));
CREATE POLICY "Users can create prompts for their challenges" ON challenge_prompts FOR INSERT 
  WITH CHECK (challenge_id IN (SELECT id FROM challenges WHERE user_id = auth.uid()));
CREATE POLICY "Users can update prompts for their challenges" ON challenge_prompts FOR UPDATE 
  USING (challenge_id IN (SELECT id FROM challenges WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete prompts for their challenges" ON challenge_prompts FOR DELETE 
  USING (challenge_id IN (SELECT id FROM challenges WHERE user_id = auth.uid()));

-- Progress tracking
CREATE POLICY "Users can view their own progress" ON challenge_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own progress" ON challenge_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON challenge_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own progress" ON challenge_progress FOR DELETE USING (auth.uid() = user_id);

-- Film rolls tracking
CREATE POLICY "Users can view their own challenge film rolls" ON challenge_film_rolls FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own challenge film rolls" ON challenge_film_rolls FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own challenge film rolls" ON challenge_film_rolls FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own challenge film rolls" ON challenge_film_rolls FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenge_progress_updated_at BEFORE UPDATE ON challenge_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenge_film_rolls_updated_at BEFORE UPDATE ON challenge_film_rolls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
