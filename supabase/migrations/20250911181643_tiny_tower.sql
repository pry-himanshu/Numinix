/*
# Create missing tables and fix database schema

This migration creates missing tables that are referenced in the code but don't exist in the database.

1. New Tables
   - `chapters` - Store chapter information
   - `diagnostic_tests` - Store diagnostic test configurations
   - `diagnostic_results` - Store diagnostic test results
   - `learning_roadmaps` - Store personalized learning roadmaps
   - `study_content` - Store AI-generated study content
   - `practice_questions` - Store practice questions
   - `user_progress` - Store detailed user progress
   - `regular_assessments` - Store regular assessment results
   - `learning_analytics` - Store learning analytics data
   - `learning_sessions` - Store learning session data
   - `personalized_practice_questions` - Store personalized practice questions
   - `user_interactions` - Store user interaction data
   - `ai_improvements` - Store AI-generated improvements

2. Security
   - Enable RLS on all tables
   - Add appropriate policies for user access

3. Functions
   - Add trigger functions for automatic updates
*/

-- Create chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id text PRIMARY KEY,
  class_level integer NOT NULL CHECK (class_level >= 1 AND class_level <= 12),
  chapter_name text NOT NULL,
  chapter_number integer NOT NULL,
  description text,
  prerequisite_concepts text[] DEFAULT '{}',
  learning_objectives text[] DEFAULT '{}',
  estimated_duration_hours integer DEFAULT 10,
  unlock_requirements jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(class_level, chapter_number)
);

-- Create diagnostic_tests table
CREATE TABLE IF NOT EXISTS diagnostic_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id text NOT NULL REFERENCES chapters(id),
  test_name text NOT NULL,
  prerequisite_concepts text[] NOT NULL,
  total_questions integer DEFAULT 15,
  time_limit_minutes integer DEFAULT 30,
  difficulty_distribution jsonb DEFAULT '{"easy": 40, "medium": 40, "hard": 20}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create diagnostic_results table
CREATE TABLE IF NOT EXISTS diagnostic_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id text NOT NULL REFERENCES chapters(id),
  test_id uuid NOT NULL REFERENCES diagnostic_tests(id),
  total_questions integer NOT NULL,
  correct_answers integer NOT NULL,
  score_percentage decimal(5,2) NOT NULL,
  time_taken_minutes integer NOT NULL,
  strengths text[] DEFAULT '{}',
  weaknesses text[] DEFAULT '{}',
  knowledge_gaps text[] DEFAULT '{}',
  prerequisite_gaps text[] DEFAULT '{}',
  difficulty_analysis jsonb DEFAULT '{}',
  ai_analysis text,
  completed_at timestamptz DEFAULT now()
);

-- Create learning_roadmaps table
CREATE TABLE IF NOT EXISTS learning_roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id text NOT NULL REFERENCES chapters(id),
  diagnostic_result_id uuid REFERENCES diagnostic_results(id),
  roadmap_data jsonb NOT NULL,
  focus_areas text[] NOT NULL,
  improvement_plan text[] NOT NULL,
  estimated_completion_days integer DEFAULT 14,
  current_step integer DEFAULT 0,
  total_steps integer NOT NULL,
  completion_percentage decimal(5,2) DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, chapter_id)
);

-- Create study_content table
CREATE TABLE IF NOT EXISTS study_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id text NOT NULL REFERENCES chapters(id),
  roadmap_id uuid REFERENCES learning_roadmaps(id),
  content_type text NOT NULL,
  topic text NOT NULL,
  difficulty_level text NOT NULL,
  content_data jsonb NOT NULL,
  ai_generated_content text NOT NULL,
  personalization_factors jsonb DEFAULT '{}',
  usage_count integer DEFAULT 0,
  effectiveness_rating decimal(3,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create practice_questions table
CREATE TABLE IF NOT EXISTS practice_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id text NOT NULL REFERENCES chapters(id),
  roadmap_id uuid REFERENCES learning_roadmaps(id),
  question_text text NOT NULL,
  question_type text DEFAULT 'multiple_choice',
  options jsonb,
  correct_answer text NOT NULL,
  explanation text NOT NULL,
  difficulty text NOT NULL,
  concept text NOT NULL,
  personalization_level text DEFAULT 'standard',
  ai_generation_prompt text,
  times_attempted integer DEFAULT 0,
  success_rate decimal(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id text NOT NULL REFERENCES chapters(id),
  roadmap_id uuid REFERENCES learning_roadmaps(id),
  concept text NOT NULL,
  mastery_level decimal(3,2) DEFAULT 0,
  questions_attempted integer DEFAULT 0,
  questions_correct integer DEFAULT 0,
  time_spent_minutes integer DEFAULT 0,
  last_practiced_at timestamptz,
  improvement_trend text DEFAULT 'stable',
  next_review_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, chapter_id, concept)
);

-- Create regular_assessments table
CREATE TABLE IF NOT EXISTS regular_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id text NOT NULL REFERENCES chapters(id),
  assessment_type text NOT NULL,
  questions_data jsonb NOT NULL,
  total_questions integer NOT NULL,
  correct_answers integer NOT NULL,
  score_percentage decimal(5,2) NOT NULL,
  time_taken_minutes integer NOT NULL,
  concepts_tested text[] NOT NULL,
  performance_analysis jsonb DEFAULT '{}',
  ai_feedback text,
  roadmap_updates jsonb DEFAULT '{}',
  completed_at timestamptz DEFAULT now()
);

-- Create learning_analytics table
CREATE TABLE IF NOT EXISTS learning_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id text,
  analytics_type text NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  metrics jsonb NOT NULL,
  insights text,
  recommendations text[] DEFAULT '{}',
  trend_analysis jsonb DEFAULT '{}',
  ai_insights text,
  created_at timestamptz DEFAULT now()
);

-- Create learning_sessions table
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

-- Create ai_improvements table
CREATE TABLE IF NOT EXISTS ai_improvements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  user_notes text NOT NULL,
  improvements text[] NOT NULL,
  created_at timestamptz DEFAULT now()
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

-- Enable RLS on all new tables
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE regular_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_content ENABLE ROW LEVEL SECURITY;

-- Create policies for chapters (public read access)
CREATE POLICY "Anyone can read chapters"
  ON chapters FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for diagnostic_tests (public read access)
CREATE POLICY "Anyone can read diagnostic tests"
  ON diagnostic_tests FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for diagnostic_results
CREATE POLICY "Users can read own diagnostic results"
  ON diagnostic_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diagnostic results"
  ON diagnostic_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for learning_roadmaps
CREATE POLICY "Users can read own roadmaps"
  ON learning_roadmaps FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roadmaps"
  ON learning_roadmaps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own roadmaps"
  ON learning_roadmaps FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for study_content
CREATE POLICY "Users can read own study content"
  ON study_content FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study content"
  ON study_content FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for practice_questions
CREATE POLICY "Users can read own practice questions"
  ON practice_questions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own practice questions"
  ON practice_questions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for user_progress
CREATE POLICY "Users can read own progress"
  ON user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for regular_assessments
CREATE POLICY "Users can read own assessments"
  ON regular_assessments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments"
  ON regular_assessments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for learning_analytics
CREATE POLICY "Users can read own analytics"
  ON learning_analytics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics"
  ON learning_analytics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for learning_sessions
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

-- Create policies for personalized_practice_questions
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

-- Create policies for user_interactions
CREATE POLICY "Users can read own interactions"
  ON user_interactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions"
  ON user_interactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for ai_improvements
CREATE POLICY "Users can read own improvements"
  ON ai_improvements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own improvements"
  ON ai_improvements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for personalized_roadmaps
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

-- Create policies for personalized_content
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chapters_class_level ON chapters(class_level, chapter_number);
CREATE INDEX IF NOT EXISTS idx_diagnostic_results_user_chapter ON diagnostic_results(user_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_learning_roadmaps_user_id ON learning_roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_chapter ON user_progress(user_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_regular_assessments_user_id ON regular_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_chapter ON learning_sessions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_active ON learning_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_personalized_practice_questions_user_topic ON personalized_practice_questions(user_id, topic);
CREATE INDEX IF NOT EXISTS idx_personalized_practice_questions_chapter ON personalized_practice_questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_timestamp ON user_interactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_improvements_user_id ON ai_improvements(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_improvements_topic ON ai_improvements(topic);
CREATE INDEX IF NOT EXISTS idx_personalized_roadmaps_user_id ON personalized_roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_personalized_roadmaps_chapter ON personalized_roadmaps(chapter_id);
CREATE INDEX IF NOT EXISTS idx_personalized_content_user_chapter ON personalized_content(user_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_personalized_content_topic ON personalized_content(topic);

-- Create trigger function for updating roadmap completion
CREATE OR REPLACE FUNCTION update_roadmap_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate completion percentage based on current_step and total_steps
    IF NEW.total_steps > 0 THEN
        NEW.completion_percentage = (NEW.current_step::decimal / NEW.total_steps::decimal) * 100;
    ELSE
        NEW.completion_percentage = 0;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for personalized_roadmaps
CREATE TRIGGER update_roadmap_completion_trigger
  BEFORE INSERT OR UPDATE ON personalized_roadmaps
  FOR EACH ROW EXECUTE FUNCTION update_roadmap_completion();

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_progress_updated_at 
  BEFORE UPDATE ON user_progress 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add missing policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO public
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO public
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add missing policy for chapter_diagnostics
CREATE POLICY "Allow all select"
  ON chapter_diagnostics FOR SELECT
  TO public
  USING (true);