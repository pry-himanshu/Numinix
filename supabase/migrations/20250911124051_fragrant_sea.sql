/*
# Personalized Learning Platform Tables

This migration creates tables for the AI-powered personalized learning system:

1. New Tables
   - `personalized_content` - Stores AI-generated personalized study content
   - `personalized_roadmaps` - User-specific learning roadmaps that update dynamically
   - `learning_sessions` - Tracks learning sessions without unnecessary refreshes
   - `personalized_practice_questions` - AI-generated questions based on user progress
   - `user_interactions` - Tracks all user interactions for AI analysis
   - `ai_improvements` - Stores AI-generated improvements for user notes

2. Security
   - RLS enabled on all tables
   - User-specific access policies

3. Features
   - Real-time roadmap updates
   - Personalized content generation
   - Session persistence without refreshes
   - AI-powered improvements
*/

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

-- Create learning_sessions table for session persistence
CREATE TABLE IF NOT EXISTS learning_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id text NOT NULL,
  session_start timestamptz DEFAULT now(),
  session_end timestamptz,
  topics_covered text[] DEFAULT '{}',
  questions_attempted integer DEFAULT 0,
  questions_correct integer DEFAULT 0,
  time_spent_minutes integer DEFAULT 0,
  roadmap_updates jsonb DEFAULT '{}',
  session_data jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create personalized_practice_questions table
CREATE TABLE IF NOT EXISTS personalized_practice_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id text NOT NULL,
  topic text NOT NULL,
  question_data jsonb NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium',
  times_attempted integer DEFAULT 0,
  times_correct integer DEFAULT 0,
  last_attempted timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create user_interactions table for AI analysis
CREATE TABLE IF NOT EXISTS user_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id text,
  interaction_type text NOT NULL,
  interaction_data jsonb DEFAULT '{}',
  timestamp timestamptz DEFAULT now(),
  session_id uuid
);

-- Create ai_improvements table for notes feedback
CREATE TABLE IF NOT EXISTS ai_improvements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  user_notes text NOT NULL,
  improvements text[] NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE personalized_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_improvements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for personalized_content
CREATE POLICY "Users can read own personalized content"
  ON personalized_content FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personalized content"
  ON personalized_content FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personalized content"
  ON personalized_content FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for personalized_roadmaps
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

-- RLS Policies for learning_sessions
CREATE POLICY "Users can read own learning sessions"
  ON learning_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning sessions"
  ON learning_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning sessions"
  ON learning_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for personalized_practice_questions
CREATE POLICY "Users can read own practice questions"
  ON personalized_practice_questions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own practice questions"
  ON personalized_practice_questions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own practice questions"
  ON personalized_practice_questions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_interactions
CREATE POLICY "Users can read own interactions"
  ON user_interactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions"
  ON user_interactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ai_improvements
CREATE POLICY "Users can read own improvements"
  ON ai_improvements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own improvements"
  ON ai_improvements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_personalized_content_user_chapter ON personalized_content(user_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_personalized_content_topic ON personalized_content(topic);

CREATE INDEX IF NOT EXISTS idx_personalized_roadmaps_user_id ON personalized_roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_personalized_roadmaps_chapter ON personalized_roadmaps(chapter_id);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_active ON learning_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_chapter ON learning_sessions(chapter_id);

CREATE INDEX IF NOT EXISTS idx_personalized_practice_questions_user_topic ON personalized_practice_questions(user_id, topic);
CREATE INDEX IF NOT EXISTS idx_personalized_practice_questions_chapter ON personalized_practice_questions(chapter_id);

CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_timestamp ON user_interactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type);

CREATE INDEX IF NOT EXISTS idx_ai_improvements_user_id ON ai_improvements(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_improvements_topic ON ai_improvements(topic);

-- Create function to update roadmap completion percentage
CREATE OR REPLACE FUNCTION update_roadmap_completion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.completion_percentage = CASE 
    WHEN NEW.total_steps > 0 THEN (NEW.current_step::decimal / NEW.total_steps) * 100
    ELSE 0
  END;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic completion percentage calculation
CREATE TRIGGER update_roadmap_completion_trigger
  BEFORE INSERT OR UPDATE ON personalized_roadmaps
  FOR EACH ROW EXECUTE FUNCTION update_roadmap_completion();