/*
  # Add User Roles and Authentication Support

  1. Changes to Existing Tables
    - Update `clients` table to support authentication
      - Make `id` a foreign key to auth.users
      - Add `user_id` to link to auth.users
      - Keep existing fields for client profile data
    
    - Update `trainers` table
      - Add `user_id` to link to auth.users
  
  2. New Functions
    - `create_trainer_profile()` - Automatically creates trainer profile on signup
    - `link_client_to_trainer()` - Links client to trainer using SUI code
  
  3. Security Updates
    - Update RLS policies for multi-tenant access
    - Trainers can only see their own clients
    - Clients can only see their own data
*/

-- Add user_id to trainers table to link to auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trainers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE trainers ADD COLUMN user_id uuid REFERENCES auth.users(id) UNIQUE;
  END IF;
END $$;

-- Add user_id to clients table to link to auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN user_id uuid REFERENCES auth.users(id) UNIQUE;
  END IF;
END $$;

-- Function to automatically create trainer profile after signup
CREATE OR REPLACE FUNCTION create_trainer_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create profile if user has trainer role in metadata
  IF NEW.raw_user_meta_data->>'role' = 'trainer' THEN
    INSERT INTO trainers (
      user_id,
      name,
      email
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      NEW.email
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic trainer profile creation
DROP TRIGGER IF EXISTS on_auth_user_created_trainer ON auth.users;
CREATE TRIGGER on_auth_user_created_trainer
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_trainer_profile();

-- Function to link client to trainer by SUI code
CREATE OR REPLACE FUNCTION link_client_to_trainer(
  p_user_id uuid,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_sui_code text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trainer_id uuid;
  v_client_id uuid;
BEGIN
  -- Find trainer by SUI code
  SELECT id INTO v_trainer_id
  FROM trainers
  WHERE sui = p_sui_code;
  
  IF v_trainer_id IS NULL THEN
    RAISE EXCEPTION 'Invalid trainer code';
  END IF;
  
  -- Create client profile
  INSERT INTO clients (
    user_id,
    name,
    phone,
    trainer_id,
    email
  ) VALUES (
    p_user_id,
    p_first_name || ' ' || p_last_name,
    p_phone,
    v_trainer_id,
    (SELECT email FROM auth.users WHERE id = p_user_id)
  )
  RETURNING id INTO v_client_id;
  
  RETURN v_client_id;
END;
$$;

-- Update RLS policies for trainers
DROP POLICY IF EXISTS "Trainers can view own profile" ON trainers;
CREATE POLICY "Trainers can view own profile"
  ON trainers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Trainers can update own profile" ON trainers;
CREATE POLICY "Trainers can update own profile"
  ON trainers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Trainers can create own profile" ON trainers;
CREATE POLICY "Trainers can insert own profile"
  ON trainers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Update RLS policies for clients
DROP POLICY IF EXISTS "Users can read own data" ON clients;
CREATE POLICY "Clients can view own profile"
  ON clients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Trainers can view their clients" ON clients;
CREATE POLICY "Trainers can view their clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    trainer_id IN (
      SELECT id FROM trainers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Trainers can update their clients" ON clients;
CREATE POLICY "Trainers can update their clients"
  ON clients FOR UPDATE
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

DROP POLICY IF EXISTS "Trainers can insert clients" ON clients;
CREATE POLICY "Trainers can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    trainer_id IN (
      SELECT id FROM trainers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Clients can update own profile" ON clients;
CREATE POLICY "Clients can update own profile"
  ON clients FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Update sessions policies to allow trainers to manage their clients' sessions
DROP POLICY IF EXISTS "Trainers can manage sessions" ON sessions;
CREATE POLICY "Trainers can view sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE trainer_id IN (
        SELECT id FROM trainers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Trainers can insert sessions"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE trainer_id IN (
        SELECT id FROM trainers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Trainers can update sessions"
  ON sessions FOR UPDATE
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE trainer_id IN (
        SELECT id FROM trainers WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE trainer_id IN (
        SELECT id FROM trainers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Trainers can delete sessions"
  ON sessions FOR DELETE
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE trainer_id IN (
        SELECT id FROM trainers WHERE user_id = auth.uid()
      )
    )
  );
