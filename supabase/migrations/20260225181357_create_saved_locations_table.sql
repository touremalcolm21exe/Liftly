/*
  # Create saved_locations table

  1. New Tables
    - `saved_locations`
      - `id` (uuid, primary key)
      - `trainer_id` (uuid, foreign key to trainers)
      - `location_name` (text, not null)
      - `use_count` (integer, default 0) - tracks how often the location is used
      - `last_used_at` (timestamptz, nullable) - last time the location was used
      - `created_at` (timestamptz, default now())

  2. Indexes
    - Index on trainer_id for fast lookups
    - Index on use_count for sorting by popularity

  3. Security
    - Enable RLS on `saved_locations` table
    - Add policy for trainers to read their own locations
    - Add policy for trainers to insert their own locations
    - Add policy for trainers to update their own locations
    - Add policy for trainers to delete their own locations

  4. Notes
    - Locations are automatically saved when used in a session
    - Use_count helps surface frequently used locations first
    - Each trainer has their own set of saved locations
*/

CREATE TABLE IF NOT EXISTS saved_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  location_name text NOT NULL,
  use_count integer DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_saved_locations_trainer_id ON saved_locations(trainer_id);
CREATE INDEX IF NOT EXISTS idx_saved_locations_use_count ON saved_locations(trainer_id, use_count DESC);

-- Enable RLS
ALTER TABLE saved_locations ENABLE ROW LEVEL SECURITY;

-- Trainers can view their own saved locations
CREATE POLICY "Trainers can view own saved locations"
  ON saved_locations FOR SELECT
  TO authenticated
  USING (
    trainer_id IN (
      SELECT id FROM trainers WHERE user_id = auth.uid()
    )
  );

-- Trainers can insert their own saved locations
CREATE POLICY "Trainers can insert own saved locations"
  ON saved_locations FOR INSERT
  TO authenticated
  WITH CHECK (
    trainer_id IN (
      SELECT id FROM trainers WHERE user_id = auth.uid()
    )
  );

-- Trainers can update their own saved locations
CREATE POLICY "Trainers can update own saved locations"
  ON saved_locations FOR UPDATE
  TO authenticated
  USING (
    trainer_id IN (
      SELECT id FROM trainers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    trainer_id IN (
      SELECT id FROM trainers WHERE user_id = auth.uid()
    )
  );

-- Trainers can delete their own saved locations
CREATE POLICY "Trainers can delete own saved locations"
  ON saved_locations FOR DELETE
  TO authenticated
  USING (
    trainer_id IN (
      SELECT id FROM trainers WHERE user_id = auth.uid()
    )
  );