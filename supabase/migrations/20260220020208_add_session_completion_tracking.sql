/*
  # Add Session Completion Tracking

  1. Changes
    - Add `completed_at` timestamp column to sessions table
    - Add `confirmed_by_trainer` boolean column to sessions table
    
  2. Purpose
    - Track when a session was marked as completed by the trainer
    - Store confirmation status for analytics and reporting
    - Enable post-workout confirmation workflow
*/

-- Add completion tracking columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE sessions ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'confirmed_by_trainer'
  ) THEN
    ALTER TABLE sessions ADD COLUMN confirmed_by_trainer boolean DEFAULT false;
  END IF;
END $$;

-- Add index for completed sessions queries
CREATE INDEX IF NOT EXISTS idx_sessions_completed_at ON sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_sessions_confirmed ON sessions(confirmed_by_trainer);