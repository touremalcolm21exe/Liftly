/*
  # Add Weight Field to Template Exercises

  1. Changes
    - Add `weight` (numeric) column to template_exercises table
    - Default value is 0 to maintain consistency with workout_exercises

  2. Purpose
    - Allow trainers to set default weight values in workout templates
    - Provides starting weights that can be adjusted during actual workouts
*/

-- Add weight column to template_exercises table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'template_exercises' AND column_name = 'weight'
  ) THEN
    ALTER TABLE template_exercises ADD COLUMN weight numeric NOT NULL DEFAULT 0;
  END IF;
END $$;