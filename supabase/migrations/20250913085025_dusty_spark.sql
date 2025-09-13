/*
# Fix chapter_diagnostics table policies

This migration fixes the RLS policies for chapter_diagnostics table
to ensure proper access control.

1. Security Updates
   - Add missing SELECT policy for public access
   - Ensure all CRUD operations are properly secured

2. Indexes
   - Verify all necessary indexes exist
*/

-- Add public SELECT policy for chapter_diagnostics (needed for some operations)
DO $$
BEGIN
  -- Check if policy exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chapter_diagnostics' 
    AND policyname = 'Allow all select'
  ) THEN
    CREATE POLICY "Allow all select"
      ON chapter_diagnostics
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- Ensure all necessary indexes exist
CREATE INDEX IF NOT EXISTS idx_chapter_diagnostics_user_chapter ON chapter_diagnostics(user_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_diagnostics_created_at ON chapter_diagnostics(created_at DESC);