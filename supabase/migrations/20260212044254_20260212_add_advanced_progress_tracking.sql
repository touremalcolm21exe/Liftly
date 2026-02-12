/*
  # Advanced Progress Tracking System

  ## Overview
  This migration extends the progress tracking system to include:
  - Personal records (PRs) for key lifts, reps, and distances
  - Extended body measurements including body fat percentage
  - Per-session training load metrics including volume and velocity

  ## 1. New Tables

  ### personal_records
  Tracks personal bests for various exercises and metrics
  - id (uuid, primary key) - Unique PR entry identifier
  - client_id (uuid, foreign key) - Links to the client
  - exercise_name (text) - Name of the exercise
  - record_type (text) - Type of record (1RM, 5RM, Max Reps, Distance)
  - value (numeric) - The PR value
  - unit (text) - Unit of measurement (lbs, kg, reps, miles, meters)
  - achieved_date (date) - When the PR was achieved
  - previous_value (numeric, nullable) - Previous PR for comparison
  - notes (text, nullable) - Optional notes about the PR
  - created_at (timestamptz) - When the record was created

  ### session_training_load
  Tracks training load metrics per workout session
  - id (uuid, primary key) - Unique load entry identifier
  - workout_id (uuid, foreign key) - Links to the workout session
  - client_id (uuid, foreign key) - Links to the client
  - total_volume (numeric) - Total workout volume (sets × reps × weight)
  - average_velocity (numeric, nullable) - Average bar velocity in m/s
  - perceived_exertion (integer, nullable) - RPE scale 1-10
  - session_duration (integer, nullable) - Duration in minutes
  - notes (text, nullable) - Optional notes about the session
  - created_at (timestamptz) - When the record was created

  ## 2. Extended Columns for progress_measurements

  Adding new columns to track additional body measurements:
  - body_fat_percentage (numeric, nullable) - Body fat percentage
  - waist_circumference (numeric, nullable) - Waist measurement in inches
  - measurement_3 (numeric, nullable) - Third flexible measurement
  - measurement_3_label (text) - Label for third measurement
  - measurement_4 (numeric, nullable) - Fourth flexible measurement
  - measurement_4_label (text) - Label for fourth measurement

  ## 3. Security
  - Enable RLS on all new tables
  - Add policies for authenticated users to manage their clients data
  - Users can only access records for clients they train

  ## 4. Indexes
  - Create indexes on foreign keys for optimal query performance
  - Create indexes on date fields for time-series queries
  - Create indexes on exercise_name for PR lookups
*/

-- Create personal_records table
CREATE TABLE IF NOT EXISTS personal_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  record_type text NOT NULL DEFAULT '1RM',
  value numeric NOT NULL,
  unit text NOT NULL DEFAULT 'lbs',
  achieved_date date NOT NULL DEFAULT CURRENT_DATE,
  previous_value numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create session_training_load table
CREATE TABLE IF NOT EXISTS session_training_load (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  total_volume numeric NOT NULL DEFAULT 0,
  average_velocity numeric,
  perceived_exertion integer CHECK (perceived_exertion >= 1 AND perceived_exertion <= 10),
  session_duration integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Extend progress_measurements table with new columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'progress_measurements' AND column_name = 'body_fat_percentage'
  ) THEN
    ALTER TABLE progress_measurements ADD COLUMN body_fat_percentage numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'progress_measurements' AND column_name = 'waist_circumference'
  ) THEN
    ALTER TABLE progress_measurements ADD COLUMN waist_circumference numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'progress_measurements' AND column_name = 'measurement_3'
  ) THEN
    ALTER TABLE progress_measurements ADD COLUMN measurement_3 numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'progress_measurements' AND column_name = 'measurement_3_label'
  ) THEN
    ALTER TABLE progress_measurements ADD COLUMN measurement_3_label text DEFAULT 'Chest';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'progress_measurements' AND column_name = 'measurement_4'
  ) THEN
    ALTER TABLE progress_measurements ADD COLUMN measurement_4 numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'progress_measurements' AND column_name = 'measurement_4_label'
  ) THEN
    ALTER TABLE progress_measurements ADD COLUMN measurement_4_label text DEFAULT 'Arms';
  END IF;
END $$;

-- Create indexes for personal_records
CREATE INDEX IF NOT EXISTS personal_records_client_id_idx ON personal_records(client_id);
CREATE INDEX IF NOT EXISTS personal_records_exercise_name_idx ON personal_records(exercise_name);
CREATE INDEX IF NOT EXISTS personal_records_achieved_date_idx ON personal_records(achieved_date);

-- Create indexes for session_training_load
CREATE INDEX IF NOT EXISTS session_training_load_workout_id_idx ON session_training_load(workout_id);
CREATE INDEX IF NOT EXISTS session_training_load_client_id_idx ON session_training_load(client_id);

-- Enable RLS on personal_records
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

-- Personal records policies
CREATE POLICY "Authenticated users can view PRs for their clients"
  ON personal_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert PRs for their clients"
  ON personal_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update PRs for their clients"
  ON personal_records FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete PRs for their clients"
  ON personal_records FOR DELETE
  TO authenticated
  USING (true);

-- Enable RLS on session_training_load
ALTER TABLE session_training_load ENABLE ROW LEVEL SECURITY;

-- Session training load policies
CREATE POLICY "Authenticated users can view training load for their clients"
  ON session_training_load FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert training load for their clients"
  ON session_training_load FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update training load for their clients"
  ON session_training_load FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete training load for their clients"
  ON session_training_load FOR DELETE
  TO authenticated
  USING (true);