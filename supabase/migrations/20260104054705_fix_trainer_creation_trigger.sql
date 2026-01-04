/*
  # Fix Trainer Profile Creation Trigger

  1. Updates
    - Drop and recreate the `create_trainer_profile` function to include all required fields
    - Generates `account_id` using the user's ID
    - Generates unique `sui` trainer code in format SUI-XXXXXXXX
  
  2. Security
    - Maintains existing trigger behavior
    - Ensures all required fields are populated
*/

-- Drop existing function
DROP FUNCTION IF EXISTS create_trainer_profile() CASCADE;

-- Recreate function with all required fields
CREATE OR REPLACE FUNCTION create_trainer_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if user has trainer role in metadata
  IF NEW.raw_user_meta_data->>'role' = 'trainer' THEN
    INSERT INTO trainers (
      user_id,
      account_id,
      sui,
      name,
      email
    ) VALUES (
      NEW.id,
      'ACC-' || UPPER(SUBSTRING(NEW.id::text, 1, 8)),
      'SUI-' || UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text), 1, 8)),
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      NEW.email
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created_trainer ON auth.users;

CREATE TRIGGER on_auth_user_created_trainer
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_trainer_profile();
