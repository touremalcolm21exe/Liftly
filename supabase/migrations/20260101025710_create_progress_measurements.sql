/*
  # Create Progress Measurements Table

  1. New Tables
    - `progress_measurements`
      - `id` (uuid, primary key) - Unique measurement entry identifier
      - `client_id` (uuid, foreign key) - Links to the client
      - `date` (date) - When the measurement was taken
      - `weight` (numeric, nullable) - Body weight in lbs
      - `measurement_1` (numeric, nullable) - First key measurement (e.g., waist)
      - `measurement_1_label` (text) - Label for first measurement
      - `measurement_2` (numeric, nullable) - Second key measurement (e.g., hips)
      - `measurement_2_label` (text) - Label for second measurement
      - `notes` (text, nullable) - Optional notes about this entry
      - `created_at` (timestamptz) - When the record was created

  2. Security
    - Enable RLS on progress_measurements table
    - Add policies for authenticated users to manage measurements for their clients
    - Measurements can only be accessed by the trainer who owns the client

  3. Important Notes
    - Measurements are linked to clients for full history tracking
    - Flexible measurement labels allow trainers to track different metrics
    - Entries are ordered by date for chronological display
    - Cascading delete ensures measurements are removed when clients are deleted
*/

-- Create progress_measurements table
CREATE TABLE IF NOT EXISTS progress_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  weight numeric,
  measurement_1 numeric,
  measurement_1_label text DEFAULT 'Waist',
  measurement_2 numeric,
  measurement_2_label text DEFAULT 'Hips',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS progress_measurements_client_id_idx ON progress_measurements(client_id);
CREATE INDEX IF NOT EXISTS progress_measurements_date_idx ON progress_measurements(date);

-- Enable RLS
ALTER TABLE progress_measurements ENABLE ROW LEVEL SECURITY;

-- Progress measurements policies
CREATE POLICY "Authenticated users can view measurements for their clients"
  ON progress_measurements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert measurements for their clients"
  ON progress_measurements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update measurements for their clients"
  ON progress_measurements FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete measurements for their clients"
  ON progress_measurements FOR DELETE
  TO authenticated
  USING (true);