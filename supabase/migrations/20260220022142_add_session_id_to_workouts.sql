/*
  # Link Workouts to Sessions
  
  1. Schema Changes
    - Add `session_id` column to `workouts` table
    - Create foreign key relationship to sessions table
    - Add index for efficient querying
  
  2. Purpose
    - Enables direct linking of workout data to specific training sessions
    - Allows trainers to track exercises performed during each session
    - Supports real-time workout logging during active sessions
  
  3. Important Notes
    - session_id is optional (nullable) to support workouts created outside of sessions
    - Cascading delete ensures workout data is cleaned up when sessions are deleted
    - Index improves performance when querying workouts by session
*/

-- Add session_id column to workouts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workouts' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE workouts ADD COLUMN session_id uuid REFERENCES sessions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for efficient session-based queries
CREATE INDEX IF NOT EXISTS workouts_session_id_idx ON workouts(session_id);