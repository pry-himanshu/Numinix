/*
# Create chapters table

This migration creates the chapters table to store chapter information
and diagnostic tests configuration.

1. New Tables
   - `chapters` - Chapter information and metadata
   - `diagnostic_tests` - Diagnostic test configurations

2. Security
   - Enable RLS on all tables
   - Add appropriate policies

3. Indexes
   - Add performance indexes
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

-- Enable RLS
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_tests ENABLE ROW LEVEL SECURITY;

-- Create policies for chapters
CREATE POLICY "Anyone can read chapters"
  ON chapters
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for diagnostic_tests
CREATE POLICY "Anyone can read diagnostic tests"
  ON diagnostic_tests
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chapters_class_level ON chapters(class_level, chapter_number);