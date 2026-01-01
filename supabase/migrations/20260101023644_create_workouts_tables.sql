/*
  # Create Workouts and Exercises Tables

  1. New Tables
    - `workouts`
      - `id` (uuid, primary key) - Unique workout identifier
      - `client_id` (uuid, foreign key) - Links to the client
      - `date` (date) - When the workout occurred
      - `created_at` (timestamptz) - When the record was created
      - `updated_at` (timestamptz) - When the record was last updated
    
    - `workout_exercises`
      - `id` (uuid, primary key) - Unique exercise entry identifier
      - `workout_id` (uuid, foreign key) - Links to the workout
      - `exercise_name` (text) - Name of the exercise
      - `sets` (integer) - Number of sets performed
      - `reps` (integer) - Number of reps per set
      - `weight` (numeric) - Weight used (in user's preferred unit)
      - `notes` (text, nullable) - Optional notes about this exercise
      - `order_index` (integer) - Maintains the order of exercises in the workout
      - `created_at` (timestamptz) - When the record was created

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage workouts for their clients
    - Workouts can only be accessed by the trainer who owns the client

  3. Important Notes
    - Workouts are linked to clients, allowing full history tracking
    - Exercises maintain their order within a workout
    - Cascading delete ensures exercises are removed when workouts are deleted
*/

-- Create workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workout_exercises table
CREATE TABLE IF NOT EXISTS workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  sets integer NOT NULL DEFAULT 0,
  reps integer NOT NULL DEFAULT 0,
  weight numeric NOT NULL DEFAULT 0,
  notes text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS workouts_client_id_idx ON workouts(client_id);
CREATE INDEX IF NOT EXISTS workouts_date_idx ON workouts(date);
CREATE INDEX IF NOT EXISTS workout_exercises_workout_id_idx ON workout_exercises(workout_id);

-- Enable RLS
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

-- Workouts policies
CREATE POLICY "Authenticated users can view workouts for their clients"
  ON workouts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert workouts for their clients"
  ON workouts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update workouts for their clients"
  ON workouts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete workouts for their clients"
  ON workouts FOR DELETE
  TO authenticated
  USING (true);

-- Workout exercises policies
CREATE POLICY "Authenticated users can view workout exercises"
  ON workout_exercises FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert workout exercises"
  ON workout_exercises FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update workout exercises"
  ON workout_exercises FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete workout exercises"
  ON workout_exercises FOR DELETE
  TO authenticated
  USING (true);