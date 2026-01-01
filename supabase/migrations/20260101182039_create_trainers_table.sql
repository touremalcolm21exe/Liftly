/*
  # Create Trainers Table with Unique Identifiers

  1. New Tables
    - `trainers`
      - `id` (uuid, primary key) - Links to auth.users
      - `account_id` (text, unique) - Internal unique identifier for the trainer
      - `sui` (text, unique) - Sign-Up ID for clients to join this trainer
      - `name` (text) - Trainer's full name
      - `email` (text) - Trainer's email
      - `created_at` (timestamptz) - Account creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Changes
    - Add `trainer_id` column to `clients` table to link clients to their trainer
    - Add foreign key constraint from clients to trainers

  3. Functions
    - `generate_unique_code()` - Generates random 8-character alphanumeric codes
    - `generate_account_id()` - Generates unique account_id with TRN prefix
    - `generate_sui()` - Generates unique SUI code with SUI prefix

  4. Triggers
    - Auto-generate account_id and sui on trainer insert

  5. Security
    - Enable RLS on trainers table
    - Add policies for trainers to read and update their own data
*/

-- Function to generate random alphanumeric code
CREATE OR REPLACE FUNCTION generate_unique_code(prefix text, length int)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  characters text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(characters, floor(random() * length(characters) + 1)::int, 1);
  END LOOP;
  RETURN prefix || '-' || result;
END;
$$;

-- Create trainers table
CREATE TABLE IF NOT EXISTS trainers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id text UNIQUE NOT NULL,
  sui text UNIQUE NOT NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Function to generate unique account_id
CREATE OR REPLACE FUNCTION generate_account_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_id text;
  collision_count int := 0;
BEGIN
  LOOP
    new_id := generate_unique_code('TRN', 8);
    
    -- Check if this ID already exists
    IF NOT EXISTS (SELECT 1 FROM trainers WHERE account_id = new_id) THEN
      RETURN new_id;
    END IF;
    
    collision_count := collision_count + 1;
    
    -- Safety check to prevent infinite loop (extremely unlikely)
    IF collision_count > 100 THEN
      RAISE EXCEPTION 'Unable to generate unique account_id after 100 attempts';
    END IF;
  END LOOP;
END;
$$;

-- Function to generate unique SUI
CREATE OR REPLACE FUNCTION generate_sui()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_sui text;
  collision_count int := 0;
BEGIN
  LOOP
    new_sui := generate_unique_code('SUI', 8);
    
    -- Check if this SUI already exists
    IF NOT EXISTS (SELECT 1 FROM trainers WHERE sui = new_sui) THEN
      RETURN new_sui;
    END IF;
    
    collision_count := collision_count + 1;
    
    -- Safety check to prevent infinite loop (extremely unlikely)
    IF collision_count > 100 THEN
      RAISE EXCEPTION 'Unable to generate unique SUI after 100 attempts';
    END IF;
  END LOOP;
END;
$$;

-- Trigger function to auto-generate account_id and sui
CREATE OR REPLACE FUNCTION auto_generate_trainer_ids()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.account_id IS NULL OR NEW.account_id = '' THEN
    NEW.account_id := generate_account_id();
  END IF;
  
  IF NEW.sui IS NULL OR NEW.sui = '' THEN
    NEW.sui := generate_sui();
  END IF;
  
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS auto_generate_trainer_ids_trigger ON trainers;
CREATE TRIGGER auto_generate_trainer_ids_trigger
  BEFORE INSERT ON trainers
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_trainer_ids();

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_trainers_updated_at ON trainers;
CREATE TRIGGER update_trainers_updated_at
  BEFORE UPDATE ON trainers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Add trainer_id to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'trainer_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN trainer_id uuid REFERENCES trainers(id);
  END IF;
END $$;

-- Create index on trainer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_trainer_id ON clients(trainer_id);

-- Enable RLS on trainers table
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;

-- Trainers can read their own data
CREATE POLICY "Trainers can view own profile"
  ON trainers FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Trainers can update their own data
CREATE POLICY "Trainers can update own profile"
  ON trainers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trainers can insert their own profile
CREATE POLICY "Trainers can create own profile"
  ON trainers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
