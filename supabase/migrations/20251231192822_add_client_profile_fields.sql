/*
  # Add client profile fields

  1. Changes to clients table
    - Add `phone` field (text, optional contact phone)
    - Add `timezone` field (text, client timezone)
    - Add `goals_notes` field (text, large text area for goals and notes)
    - Add `limitations` field (jsonb, array of limitation flags)
    - Update existing records with default values

  2. Notes
    - Uses DO block to safely add columns if they don't exist
    - Sets reasonable defaults for existing data
*/

-- Add phone column if it doesn't exist (already exists from previous migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'phone'
  ) THEN
    ALTER TABLE clients ADD COLUMN phone text;
  END IF;
END $$;

-- Add timezone column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE clients ADD COLUMN timezone text DEFAULT 'America/New_York';
  END IF;
END $$;

-- Add goals_notes column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'goals_notes'
  ) THEN
    ALTER TABLE clients ADD COLUMN goals_notes text;
  END IF;
END $$;

-- Add limitations column as JSONB
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'limitations'
  ) THEN
    ALTER TABLE clients ADD COLUMN limitations jsonb DEFAULT '{"upper_body": false, "lower_body": false, "cardio": false, "mobility": false}'::jsonb;
  END IF;
END $$;
