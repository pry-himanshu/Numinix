/*
# Create user_profiles table

This migration creates the user_profiles table to replace the profiles table
and ensures proper structure for user data.

1. New Tables
   - `user_profiles` - Main user profile table with all necessary fields

2. Security
   - Enable RLS on user_profiles table
   - Add policies for authenticated users to manage their own data

3. Indexes
   - Add performance indexes for common queries
*/

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  phone text,
  full_name text,
  name text NOT NULL DEFAULT '',
  class_level integer NOT NULL DEFAULT 1 CHECK (class_level >= 1 AND class_level <= 12),
  current_chapter_id text,
  total_coins integer DEFAULT 0,
  money integer DEFAULT 1,
  total_questions_solved integer DEFAULT 0,
  total_correct_answers integer DEFAULT 0,
  total_correct integer DEFAULT 0,
  total_wrong integer DEFAULT 0,
  overall_accuracy decimal(5,2) DEFAULT 0,
  learning_preferences jsonb DEFAULT '{}',
  unlocked_chapters text[] DEFAULT '{}',
  completed_chapters text[] DEFAULT '{}',
  avatar_id integer DEFAULT 1,
  avatar_url text,
  diagnostic_completed boolean DEFAULT false,
  chapter_diagnostics_taken text[] DEFAULT '{}',
  current_learning_path jsonb DEFAULT '{}',
  chapter_stars jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO public
  USING (auth.uid() = id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_class_level ON user_profiles(class_level);

-- Create trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();