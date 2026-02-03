/*
  # Fix Signup RLS and RPC Permissions

  1. Changes
    - Ensure link_client_to_trainer RPC function allows anonymous users to call it during signup
    - Update RLS policies to handle unauthenticated signup flow
    - Add public insert policy for clients during signup via RPC

  2. Security
    - RPC function uses SECURITY DEFINER to bypass RLS for controlled signup
    - Policies remain restrictive for authenticated users
*/

-- Drop and recreate the link_client_to_trainer function with proper permissions for public signup
DROP FUNCTION IF EXISTS link_client_to_trainer(uuid, text, text, text, text);

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
SET search_path = public
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

-- Grant execution permission to anon role for signup
GRANT EXECUTE ON FUNCTION link_client_to_trainer(uuid, text, text, text, text) TO anon;

-- Ensure clients table allows the signup operation via RPC
-- The RPC function uses SECURITY DEFINER so it bypasses RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Drop conflicting policies and recreate clean ones
DROP POLICY IF EXISTS "Allow public insert to clients" ON clients;

-- Recreate restrictive policies
DROP POLICY IF EXISTS "Clients can view own profile" ON clients;
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

DROP POLICY IF EXISTS "Clients can update own profile" ON clients;
CREATE POLICY "Clients can update own profile"
  ON clients FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
