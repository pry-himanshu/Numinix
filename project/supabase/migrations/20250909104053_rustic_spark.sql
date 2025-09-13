/*
# Comprehensive Student Progress Tracking System

This migration creates a complete tracking system for student progress, including:

1. New Tables
   - `chapter_diagnostics` - Stores diagnostic test results for each chapter
   - `question_attempts` - Tracks every question attempt with detailed analytics
   - `study_sessions` - Records study sessions and time spent
   - `ai_recommendations` - Stores AI-generated recommendations and fixes
   - `concept_mastery` - Tracks mastery level of individual concepts
   - `learning_paths` - Stores personalized learning roadmaps
   - `progress_reports` - Comprehensive progress reports

2. Enhanced Tables
   - Updates to existing profiles table structure
   - New indexes for performance

3. Security
   - RLS policies for all new tables
   - Proper user access controls
*/

-- Create chapter_diagnostics table
CREATE TABLE IF NOT EXISTS chapter_diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id text NOT NULL,
  test_taken_at timestamptz DEFAULT now(),
  total_questions integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  score_percentage decimal(5,2) NOT NULL DEFAULT 0,
  time_taken_minutes integer DEFAULT 0,
  strengths text[] DEFAULT '{}',
  weaknesses text[] DEFAULT '{}',
  knowledge_gaps text[] DEFAULT '{}',
  prerequisite_concepts text[] DEFAULT '{}',
  difficulty_level text DEFAULT 'beginner',
  raw_responses jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create question_attempts table for detailed tracking
CREATE TABLE IF NOT EXISTS question_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'multiple_choice', -- diagnostic, quiz, practice
  chapter_id text,
  topic text,
  concept text,
  difficulty text DEFAULT 'medium',
  user_answer text,
  correct_answer text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  time_taken_seconds integer DEFAULT 0,
  hints_used integer DEFAULT 0,
  attempts_count integer DEFAULT 1,
  confidence_level integer DEFAULT 0, -- 1-5 scale
  session_id uuid,
  attempted_at timestamptz DEFAULT now()
);

-- Create study_sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type text NOT NULL DEFAULT 'study', -- study, quiz, diagnostic, practice
  chapter_id text,
  topic text,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration_minutes integer DEFAULT 0,
  questions_attempted integer DEFAULT 0,
  questions_correct integer DEFAULT 0,
  concepts_covered text[] DEFAULT '{}',
  session_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create ai_recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL, -- weakness_fix, concept_review, practice_suggestion
  chapter_id text,
  concept text,
  weakness_area text,
  recommendation_text text NOT NULL,
  study_materials jsonb DEFAULT '{}',
  practice_questions jsonb DEFAULT '{}',
  estimated_time_minutes integer DEFAULT 0,
  priority_level integer DEFAULT 1, -- 1-5, 5 being highest
  status text DEFAULT 'pending', -- pending, in_progress, completed, dismissed
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create concept_mastery table
CREATE TABLE IF NOT EXISTS concept_mastery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id text NOT NULL,
  concept text NOT NULL,
  mastery_level decimal(3,2) DEFAULT 0.0, -- 0.0 to 1.0
  attempts_count integer DEFAULT 0,
  correct_attempts integer DEFAULT 0,
  last_practiced_at timestamptz,
  time_to_master_minutes integer DEFAULT 0,
  difficulty_progression text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, chapter_id, concept)
);

-- Create learning_paths table
CREATE TABLE IF NOT EXISTS learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id text NOT NULL,
  path_data jsonb NOT NULL DEFAULT '{}',
  prerequisites text[] DEFAULT '{}',
  recommended_sequence text[] DEFAULT '{}',
  estimated_completion_days integer DEFAULT 0,
  current_step integer DEFAULT 0,
  completion_percentage decimal(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, chapter_id)
);

-- Create progress_reports table
CREATE TABLE IF NOT EXISTS progress_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type text NOT NULL DEFAULT 'weekly', -- daily, weekly, monthly, chapter
  report_period_start timestamptz NOT NULL,
  report_period_end timestamptz NOT NULL,
  chapter_id text,
  overall_progress decimal(5,2) DEFAULT 0,
  strengths_identified text[] DEFAULT '{}',
  areas_for_improvement text[] DEFAULT '{}',
  time_spent_minutes integer DEFAULT 0,
  questions_attempted integer DEFAULT 0,
  accuracy_percentage decimal(5,2) DEFAULT 0,
  concepts_mastered text[] DEFAULT '{}',
  ai_insights text,
  recommendations text[] DEFAULT '{}',
  report_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Add new columns to existing profiles table (if not exists)
DO $$
BEGIN
  -- Add diagnostic_completed column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'diagnostic_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN diagnostic_completed boolean DEFAULT false;
  END IF;

  -- Add chapter_diagnostics_taken column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'chapter_diagnostics_taken'
  ) THEN
    ALTER TABLE profiles ADD COLUMN chapter_diagnostics_taken text[] DEFAULT '{}';
  END IF;

  -- Add learning_preferences column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'learning_preferences'
  ) THEN
    ALTER TABLE profiles ADD COLUMN learning_preferences jsonb DEFAULT '{}';
  END IF;

  -- Add current_learning_path column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'current_learning_path'
  ) THEN
    ALTER TABLE profiles ADD COLUMN current_learning_path jsonb DEFAULT '{}';
  END IF;
END $$;

-- Enable RLS on all new tables
ALTER TABLE chapter_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chapter_diagnostics
CREATE POLICY "Users can read own diagnostics"
  ON chapter_diagnostics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diagnostics"
  ON chapter_diagnostics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diagnostics"
  ON chapter_diagnostics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for question_attempts
CREATE POLICY "Users can read own question attempts"
  ON question_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own question attempts"
  ON question_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for study_sessions
CREATE POLICY "Users can read own study sessions"
  ON study_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions"
  ON study_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions"
  ON study_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for ai_recommendations
CREATE POLICY "Users can read own recommendations"
  ON ai_recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations"
  ON ai_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON ai_recommendations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for concept_mastery
CREATE POLICY "Users can read own concept mastery"
  ON concept_mastery FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own concept mastery"
  ON concept_mastery FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own concept mastery"
  ON concept_mastery FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for learning_paths
CREATE POLICY "Users can read own learning paths"
  ON learning_paths FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning paths"
  ON learning_paths FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning paths"
  ON learning_paths FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for progress_reports
CREATE POLICY "Users can read own progress reports"
  ON progress_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress reports"
  ON progress_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chapter_diagnostics_user_chapter ON chapter_diagnostics(user_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_diagnostics_created_at ON chapter_diagnostics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_question_attempts_user_id ON question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_chapter_topic ON question_attempts(chapter_id, topic);
CREATE INDEX IF NOT EXISTS idx_question_attempts_attempted_at ON question_attempts(attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_started_at ON study_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id ON ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_status ON ai_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_priority ON ai_recommendations(priority_level DESC);

CREATE INDEX IF NOT EXISTS idx_concept_mastery_user_chapter ON concept_mastery(user_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_concept_mastery_level ON concept_mastery(mastery_level DESC);

CREATE INDEX IF NOT EXISTS idx_learning_paths_user_id ON learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_chapter ON learning_paths(chapter_id);

CREATE INDEX IF NOT EXISTS idx_progress_reports_user_id ON progress_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_reports_period ON progress_reports(report_period_start DESC);

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_chapter_diagnostics_updated_at 
  BEFORE UPDATE ON chapter_diagnostics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_recommendations_updated_at 
  BEFORE UPDATE ON ai_recommendations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_concept_mastery_updated_at 
  BEFORE UPDATE ON concept_mastery 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_paths_updated_at 
  BEFORE UPDATE ON learning_paths 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();