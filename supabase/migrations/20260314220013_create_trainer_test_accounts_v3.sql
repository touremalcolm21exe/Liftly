/*
  # Create Two Trainer Test Accounts (Using UPSERT)

  1. Pro Trainer Account
    - Email: trainer@test.com
    - Password: 123456
    - Name: Trainer
    - Plan: pro
    - Status: active
  
  2. Free Trainer Account
    - Email: freetier@test.com
    - Password: password123
    - Name: Trainer Free
    - Plan: free
    - Status: active
  
  Note: This migration uses INSERT ... ON CONFLICT to safely handle existing records.
*/

DO $$
DECLARE
  v_pro_trainer_user_id uuid;
  v_free_trainer_user_id uuid;
  v_pro_auth_exists boolean;
  v_free_auth_exists boolean;
BEGIN
  -- ==================================================
  -- PRO TRAINER ACCOUNT (trainer@test.com)
  -- ==================================================
  
  -- Check if auth user exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'trainer@test.com') INTO v_pro_auth_exists;
  
  IF NOT v_pro_auth_exists THEN
    -- Create new auth user
    v_pro_trainer_user_id := gen_random_uuid();
    
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
      v_pro_trainer_user_id,
      'authenticated',
      'authenticated',
      'trainer@test.com',
      crypt('123456', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"trainer","name":"Trainer"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
    
    -- Create trainer profile with UPSERT
    INSERT INTO trainers (
      user_id,
      account_id,
      sui,
      name,
      email,
      plan,
      status
    ) VALUES (
      v_pro_trainer_user_id,
      'TRN-PROTEST',
      'SUI-PROTEST',
      'Trainer',
      'trainer@test.com',
      'pro',
      'active'
    )
    ON CONFLICT (email) 
    DO UPDATE SET 
      plan = 'pro',
      status = 'active',
      name = 'Trainer',
      updated_at = NOW();
    
    RAISE NOTICE 'Created PRO trainer: trainer@test.com / 123456';
  ELSE
    -- Just update the existing trainer profile
    UPDATE trainers 
    SET plan = 'pro', status = 'active', name = 'Trainer', updated_at = NOW()
    WHERE email = 'trainer@test.com';
    
    RAISE NOTICE 'Updated PRO trainer: trainer@test.com / 123456';
  END IF;

  -- ==================================================
  -- FREE TRAINER ACCOUNT (freetier@test.com)
  -- ==================================================
  
  -- Check if auth user exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'freetier@test.com') INTO v_free_auth_exists;
  
  IF NOT v_free_auth_exists THEN
    -- Create new auth user
    v_free_trainer_user_id := gen_random_uuid();
    
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
      v_free_trainer_user_id,
      'authenticated',
      'authenticated',
      'freetier@test.com',
      crypt('password123', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"trainer","name":"Trainer Free"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
    
    -- Create trainer profile with UPSERT
    INSERT INTO trainers (
      user_id,
      account_id,
      sui,
      name,
      email,
      plan,
      status
    ) VALUES (
      v_free_trainer_user_id,
      'TRN-FREETEST',
      'SUI-FREETEST',
      'Trainer Free',
      'freetier@test.com',
      'free',
      'active'
    )
    ON CONFLICT (email) 
    DO UPDATE SET 
      plan = 'free',
      status = 'active',
      name = 'Trainer Free',
      updated_at = NOW();
    
    RAISE NOTICE 'Created FREE trainer: freetier@test.com / password123';
  ELSE
    -- Just update the existing trainer profile
    UPDATE trainers 
    SET plan = 'free', status = 'active', name = 'Trainer Free', updated_at = NOW()
    WHERE email = 'freetier@test.com';
    
    RAISE NOTICE 'Updated FREE trainer: freetier@test.com / password123';
  END IF;

  -- ==================================================
  -- SUMMARY
  -- ==================================================
  
  RAISE NOTICE '=== Trainer Test Accounts Created ===';
  RAISE NOTICE 'PRO Trainer: trainer@test.com / 123456 (plan: pro)';
  RAISE NOTICE 'FREE Trainer: freetier@test.com / password123 (plan: free)';
END $$;
