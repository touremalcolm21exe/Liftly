/*
  # Fix Trainer Profile Creation - Bypass RLS in Trigger

  1. Updates
    - Recreate the `create_trainer_profile` function to bypass RLS
    - Uses SECURITY DEFINER with proper permissions to insert during user creation
    - The trigger now successfully creates trainer profiles without RLS blocking
  
  2. Security
    - Function runs with elevated privileges only during user creation
    - Existing RLS policies still protect trainers table for regular operations
    - Only affects automatic profile creation on signup
*/

-- Drop existing function
DROP FUNCTION IF EXISTS create_trainer_profile() CASCADE;

-- Recreate function with RLS bypass for the insert
CREATE OR REPLACE FUNCTION create_trainer_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create profile if user has trainer role in metadata
  IF NEW.raw_user_meta_data->>'role' = 'trainer' THEN
    -- Temporarily disable RLS for this insert
    SET LOCAL row_security = off;
    
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
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created_trainer ON auth.users;

CREATE TRIGGER on_auth_user_created_trainer
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_trainer_profile();
