/*
  # Add Workout Template Link to Sessions

  1. Changes
    - Add `workout_template_id` column to sessions table
    - Add foreign key constraint to workout_templates
    - Create index for fast lookups

  2. Purpose
    - Allow trainers to associate workout templates with scheduled sessions
    - Track which workout plan is assigned to each client session
*/

-- Add workout_template_id column to sessions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'workout_template_id'
  ) THEN
    ALTER TABLE sessions ADD COLUMN workout_template_id uuid REFERENCES workout_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_sessions_workout_template ON sessions(workout_template_id);