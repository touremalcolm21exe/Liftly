/*
  # Create Test Accounts for Development

  1. Test Trainer Account
    - Email: trainer@test.com
    - Password: 123456
    - Name: Test Trainer
  
  2. Prototype Client Account  
    - Email: pc@test.com
    - Password: 123456
    - Name: Prototype Client
    - Linked to Test Trainer
  
  Note: These are development accounts for testing purposes.
*/

DO $$
DECLARE
  v_trainer_user_id uuid;
  v_trainer_id uuid;
  v_trainer_sui text;
  v_client_user_id uuid;
  v_existing_trainer uuid;
  v_existing_client uuid;
BEGIN
  -- Check if trainer already exists
  SELECT id INTO v_existing_trainer FROM auth.users WHERE email = 'trainer@test.com';
  
  IF v_existing_trainer IS NULL THEN
    -- Create trainer auth user
    v_trainer_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_trainer_user_id,
      'authenticated',
      'authenticated',
      'trainer@test.com',
      crypt('123456', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"trainer","name":"Test Trainer"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );

    -- Wait a moment for trigger to fire
    PERFORM pg_sleep(0.1);

    -- Get the trainer profile that was auto-created by trigger
    SELECT id, sui INTO v_trainer_id, v_trainer_sui
    FROM trainers 
    WHERE user_id = v_trainer_user_id;

    RAISE NOTICE 'Created trainer: email=trainer@test.com, SUI=%', v_trainer_sui;
  ELSE
    -- Get existing trainer info
    SELECT id, sui INTO v_trainer_id, v_trainer_sui
    FROM trainers 
    WHERE user_id = v_existing_trainer;
    
    RAISE NOTICE 'Trainer already exists: email=trainer@test.com, SUI=%', v_trainer_sui;
  END IF;

  -- Check if client already exists
  SELECT id INTO v_existing_client FROM auth.users WHERE email = 'pc@test.com';
  
  IF v_existing_client IS NULL THEN
    -- Create client auth user
    v_client_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_client_user_id,
      'authenticated',
      'authenticated',
      'pc@test.com',
      crypt('123456', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"client","first_name":"Prototype","last_name":"Client"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );

    -- Create client profile linked to trainer
    INSERT INTO clients (
      user_id,
      name,
      phone,
      email,
      trainer_id
    ) VALUES (
      v_client_user_id,
      'Prototype Client',
      '555-0000',
      'pc@test.com',
      v_trainer_id
    );

    RAISE NOTICE 'Created client: email=pc@test.com';
  ELSE
    RAISE NOTICE 'Client already exists: email=pc@test.com';
  END IF;

  RAISE NOTICE '=== Test Account Credentials ===';
  RAISE NOTICE 'Trainer: trainer@test.com / 123456';
  RAISE NOTICE 'Client (PC): pc@test.com / 123456';
  RAISE NOTICE 'Trainer SUI Code: %', v_trainer_sui;
END $$;
