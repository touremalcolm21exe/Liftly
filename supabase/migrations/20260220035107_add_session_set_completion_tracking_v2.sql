/*
  # Add Set Completion Tracking for Sessions

  1. New Tables
    - `session_exercise_sets`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references sessions)
      - `exercise_name` (text)
      - `set_number` (integer) - which set this is (1, 2, 3, etc.)
      - `reps_completed` (integer) - actual reps completed
      - `weight_used` (numeric) - actual weight used for this set
      - `completed` (boolean) - whether this set is marked complete
      - `order_index` (integer) - exercise order in the workout
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Purpose
    - Track individual set completion for each exercise during a session
    - Store actual weight and reps for each set separately
    - Allow trainers to check off sets as they complete them
    - Persist checklist state so trainers can resume sessions

  3. Security
    - Enable RLS on session_exercise_sets table
    - Trainers can access sets for their clients' sessions
*/

-- Create session_exercise_sets table
CREATE TABLE IF NOT EXISTS session_exercise_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  set_number integer NOT NULL,
  reps_completed integer NOT NULL DEFAULT 0,
  weight_used numeric NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_session_exercise_sets_session ON session_exercise_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_session_exercise_sets_order ON session_exercise_sets(session_id, order_index, set_number);

-- Enable RLS
ALTER TABLE session_exercise_sets ENABLE ROW LEVEL SECURITY;

-- Trainers can view sets for their clients' sessions
CREATE POLICY "Trainers can view session sets for their clients"
  ON session_exercise_sets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      JOIN clients ON sessions.client_id = clients.id
      WHERE sessions.id = session_exercise_sets.session_id
      AND clients.trainer_id = auth.uid()
    )
  );

-- Trainers can insert sets for their clients' sessions
CREATE POLICY "Trainers can insert session sets for their clients"
  ON session_exercise_sets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      JOIN clients ON sessions.client_id = clients.id
      WHERE sessions.id = session_exercise_sets.session_id
      AND clients.trainer_id = auth.uid()
    )
  );

-- Trainers can update sets for their clients' sessions
CREATE POLICY "Trainers can update session sets for their clients"
  ON session_exercise_sets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      JOIN clients ON sessions.client_id = clients.id
      WHERE sessions.id = session_exercise_sets.session_id
      AND clients.trainer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      JOIN clients ON sessions.client_id = clients.id
      WHERE sessions.id = session_exercise_sets.session_id
      AND clients.trainer_id = auth.uid()
    )
  );

-- Trainers can delete sets for their clients' sessions
CREATE POLICY "Trainers can delete session sets for their clients"
  ON session_exercise_sets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      JOIN clients ON sessions.client_id = clients.id
      WHERE sessions.id = session_exercise_sets.session_id
      AND clients.trainer_id = auth.uid()
    )
  );