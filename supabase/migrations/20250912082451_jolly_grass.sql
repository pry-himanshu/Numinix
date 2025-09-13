/*
# Enhanced Personalization System

This migration creates tables for dynamic AI-powered personalization:

1. New Tables
   - `personalized_roadmaps` - AI-generated learning roadmaps that update based on performance
   - `personalized_content` - Dynamic study content that adapts to user understanding
   - `ai_improvements` - AI insights and improvement suggestions
   - `user_interactions` - Track all user interactions for better personalization

2. Enhanced Features
   - Real-time personalization updates
   - Dynamic content generation
   - Performance-based roadmap adjustments
   - AI insights that refresh with new data

3. Security
   - RLS policies for all new tables
   - User-specific access controls
*/

-- Create personalized_roadmaps table
CREATE TABLE IF NOT EXISTS personalized_roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id text NOT NULL,
  roadmap_data jsonb NOT NULL DEFAULT '{}',
  current_step integer DEFAULT 0,
  total_steps integer DEFAULT 0,
  completion_percentage decimal(5,2) DEFAULT 0,
  focus_areas text[] DEFAULT '{}',
  priority_concepts text[] DEFAULT '{}',
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, chapter_id)
);

-- Create personalized_content table
CREATE TABLE IF NOT EXISTS personalized_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id text NOT NULL,
  topic text NOT NULL,
  content_type text NOT NULL DEFAULT 'explanation',
  personalized_content text NOT NULL,
  difficulty_level text NOT NULL DEFAULT 'intermediate',
  user_weaknesses text[] DEFAULT '{}',
  user_strengths text[] DEFAULT '{}',
  last_updated timestamptz DEFAULT now(),
  effectiveness_score decimal(3,2) DEFAULT 0,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, chapter_id, topic)
);

-- Create ai_improvements table
CREATE TABLE IF NOT EXISTS ai_improvements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  user_notes text NOT NULL,
  improvements text[] NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_interactions table
CREATE TABLE IF NOT EXISTS user_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id text,
  interaction_type text NOT NULL,
  interaction_data jsonb DEFAULT '{}',
  timestamp timestamptz DEFAULT now(),
  session_id uuid
);

-- Enable RLS on all new tables
ALTER TABLE personalized_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for personalized_roadmaps
CREATE POLICY "Users can read own roadmaps"
  ON personalized_roadmaps FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roadmaps"
  ON personalized_roadmaps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own roadmaps"
  ON personalized_roadmaps FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for personalized_content
CREATE POLICY "Users can read own personalized content"
  ON personalized_content FOR SELECT
  TO public
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own personalized content"
  ON personalized_content FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personalized content"
  ON personalized_content FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for ai_improvements
CREATE POLICY "Users can read own improvements"
  ON ai_improvements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own improvements"
  ON ai_improvements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_interactions
CREATE POLICY "Users can read own interactions"
  ON user_interactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions"
  ON user_interactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_personalized_roadmaps_user_id ON personalized_roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_personalized_roadmaps_chapter ON personalized_roadmaps(chapter_id);

CREATE INDEX IF NOT EXISTS idx_personalized_content_user_chapter ON personalized_content(user_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_personalized_content_topic ON personalized_content(topic);

CREATE INDEX IF NOT EXISTS idx_ai_improvements_user_id ON ai_improvements(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_improvements_topic ON ai_improvements(topic);

CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_timestamp ON user_interactions(timestamp DESC);

-- Create function to update roadmap completion
CREATE OR REPLACE FUNCTION update_roadmap_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate completion percentage based on current step
    IF NEW.total_steps > 0 THEN
        NEW.completion_percentage = (NEW.current_step::decimal / NEW.total_steps::decimal) * 100;
    END IF;
    
    NEW.last_updated = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for roadmap completion updates
CREATE TRIGGER update_roadmap_completion_trigger
  BEFORE INSERT OR UPDATE ON personalized_roadmaps
  FOR EACH ROW EXECUTE FUNCTION update_roadmap_completion();