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

-- Update existing clients with sample data
UPDATE clients 
SET 
  phone = CASE 
    WHEN name = 'Sarah Johnson' THEN '(555) 123-4567'
    WHEN name = 'Mike Thompson' THEN '(555) 234-5678'
    WHEN name = 'Emily Davis' THEN '(555) 345-6789'
    WHEN name = 'James Wilson' THEN '(555) 456-7890'
    WHEN name = 'Lisa Anderson' THEN '(555) 567-8901'
    ELSE NULL
  END,
  timezone = 'America/New_York',
  goals_notes = CASE 
    WHEN name = 'Sarah Johnson' THEN 'Goal: Build strength for marathon training. Prefers morning sessions. Excellent form on squats.'
    WHEN name = 'Mike Thompson' THEN 'Weight loss goal: 20 lbs. Enjoys HIIT workouts. Works from home, flexible schedule.'
    WHEN name = 'Emily Davis' THEN 'Training for triathlon. Very disciplined. Needs help with nutrition plan.'
    WHEN name = 'James Wilson' THEN 'New to fitness. Focus on building healthy habits. Patient and motivated.'
    WHEN name = 'Lisa Anderson' THEN 'Recovering from knee injury. Building back strength gradually. Physical therapy cleared for training.'
    ELSE NULL
  END,
  limitations = CASE 
    WHEN name = 'Lisa Anderson' THEN '{"upper_body": false, "lower_body": true, "cardio": false, "mobility": true}'::jsonb
    ELSE '{"upper_body": false, "lower_body": false, "cardio": false, "mobility": false}'::jsonb
  END
WHERE phone IS NULL OR goals_notes IS NULL;
