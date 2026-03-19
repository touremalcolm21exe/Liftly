/*
  # Create Test Client Accounts
  
  Creates test client accounts for testing the client login flow.
  
  ## Important Notes
  
  1. Client accounts DO NOT have account tiers (free/pro)
     - Account tiers only apply to trainer accounts
     - Clients have unlimited access to their own data
     - No subscription or plan restrictions for clients
  
  2. New Test Accounts Created
     - client1@test.com / password: testclient123
       - Name: John Smith
       - Independent client (no trainer assigned)
     
     - client2@test.com / password: testclient123
       - Name: Sarah Johnson
       - Assigned to test trainer (trainer@test.com)
  
  3. Security
     - All test accounts use proper password hashing via Supabase Auth
     - RLS policies enforce proper data access
     - Clients can only access their own data
*/

-- Create test client user 1 (independent client)
DO $$
DECLARE
  v_user_id uuid;
  v_client_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'client1@test.com';
  
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    
    -- Create auth user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'client1@test.com',
      crypt('testclient123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );

    -- Create identity record
    INSERT INTO auth.identities (
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      format('{"sub":"%s","email":"client1@test.com"}', v_user_id)::jsonb,
      'email',
      NOW(),
      NOW(),
      NOW()
    );

    -- Create client record (no account tier - clients don't have tiers)
    INSERT INTO clients (
      id,
      user_id,
      name,
      email,
      phone,
      total_sessions,
      timezone,
      goals_notes,
      trainer_id,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      'John Smith',
      'client1@test.com',
      '+1-555-0101',
      0,
      'America/New_York',
      'Goals: Build strength and improve overall fitness. Looking to work out 3-4 times per week.',
      NULL,
      NOW(),
      NOW()
    ) RETURNING id INTO v_client_id;

    RAISE NOTICE 'Created test client: client1@test.com (John Smith)';
  ELSE
    RAISE NOTICE 'Test client client1@test.com already exists';
  END IF;
END $$;

-- Create test client user 2 (client with trainer assignment)
DO $$
DECLARE
  v_user_id uuid;
  v_client_id uuid;
  v_trainer_id uuid;
BEGIN
  -- Get the test trainer ID
  SELECT id INTO v_trainer_id
  FROM trainers
  WHERE email = 'trainer@test.com';

  -- Check if user already exists
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'client2@test.com';
  
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    
    -- Create auth user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'client2@test.com',
      crypt('testclient123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );

    -- Create identity record
    INSERT INTO auth.identities (
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      format('{"sub":"%s","email":"client2@test.com"}', v_user_id)::jsonb,
      'email',
      NOW(),
      NOW(),
      NOW()
    );

    -- Create client record (no account tier - clients don't have tiers)
    INSERT INTO clients (
      id,
      user_id,
      name,
      email,
      phone,
      total_sessions,
      timezone,
      goals_notes,
      trainer_id,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      'Sarah Johnson',
      'client2@test.com',
      '+1-555-0102',
      5,
      'America/Los_Angeles',
      'Goals: Weight loss and cardio endurance. Training for a 5K race.',
      v_trainer_id,
      NOW(),
      NOW()
    ) RETURNING id INTO v_client_id;

    RAISE NOTICE 'Created test client: client2@test.com (Sarah Johnson) - assigned to trainer';
  ELSE
    RAISE NOTICE 'Test client client2@test.com already exists';
  END IF;
END $$;
