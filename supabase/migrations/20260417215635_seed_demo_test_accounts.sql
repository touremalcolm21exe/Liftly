/*
  # Seed demo test accounts

  Creates three demo accounts for easy testing:

  1. Personal trainer (free tier)
     - Email: trainer.free@testapp.com
     - Password: Test1234!
     - Plan: free

  2. Personal trainer (pro tier)
     - Email: trainer.pro@testapp.com
     - Password: Test1234!
     - Plan: pro
     - Preloaded with 2 sample clients

  3. Client (standard)
     - Email: client@testapp.com
     - Password: Test1234!
     - Role: client
     - Preloaded with sample profile data

  All accounts use pre-confirmed email addresses so they can log in immediately
  without email verification.

  Notes:
  - Uses ON CONFLICT DO NOTHING to be idempotent
  - Safe to re-run
  - Does not alter existing data
*/

DO $$
DECLARE
  trainer_free_uid uuid := 'a1111111-1111-1111-1111-111111111111';
  trainer_pro_uid  uuid := 'a2222222-2222-2222-2222-222222222222';
  client_uid       uuid := 'a3333333-3333-3333-3333-333333333333';
  trainer_pro_id   uuid;
  pro_client1_id   uuid;
  pro_client2_id   uuid;
BEGIN
  -- Trainer (free)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000', trainer_free_uid, 'authenticated', 'authenticated',
    'trainer.free@testapp.com', crypt('Test1234!', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"trainer","name":"Alex Rivera","tier":"free"}'::jsonb,
    now(), now(), '', '', '', ''
  )
  ON CONFLICT (id) DO NOTHING;

  -- Trainer (pro)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000', trainer_pro_uid, 'authenticated', 'authenticated',
    'trainer.pro@testapp.com', crypt('Test1234!', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"trainer","name":"Jordan Blake","tier":"pro"}'::jsonb,
    now(), now(), '', '', '', ''
  )
  ON CONFLICT (id) DO NOTHING;

  -- Client
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000', client_uid, 'authenticated', 'authenticated',
    'client@testapp.com', crypt('Test1234!', gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"client","tier":"standard","first_name":"Sam","last_name":"Taylor"}'::jsonb,
    now(), now(), '', '', '', ''
  )
  ON CONFLICT (id) DO NOTHING;

  -- Identities (required for Supabase login to work reliably)
  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), trainer_free_uid,
          jsonb_build_object('sub', trainer_free_uid::text, 'email', 'trainer.free@testapp.com'),
          'email', trainer_free_uid::text, now(), now(), now())
  ON CONFLICT (provider, provider_id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), trainer_pro_uid,
          jsonb_build_object('sub', trainer_pro_uid::text, 'email', 'trainer.pro@testapp.com'),
          'email', trainer_pro_uid::text, now(), now(), now())
  ON CONFLICT (provider, provider_id) DO NOTHING;

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), client_uid,
          jsonb_build_object('sub', client_uid::text, 'email', 'client@testapp.com'),
          'email', client_uid::text, now(), now(), now())
  ON CONFLICT (provider, provider_id) DO NOTHING;

  -- Trainer profiles (the auto-trigger may or may not populate; ensure both exist and have correct plan)
  INSERT INTO public.trainers (user_id, account_id, sui, name, email, plan, status)
  VALUES (trainer_free_uid, 'TRN-FREE001', 'SUI-FREE001', 'Alex Rivera', 'trainer.free@testapp.com', 'free', 'active')
  ON CONFLICT (user_id) DO UPDATE SET plan = EXCLUDED.plan, status = EXCLUDED.status, name = EXCLUDED.name, email = EXCLUDED.email;

  INSERT INTO public.trainers (user_id, account_id, sui, name, email, plan, status)
  VALUES (trainer_pro_uid, 'TRN-PRO001', 'SUI-PRO001', 'Jordan Blake', 'trainer.pro@testapp.com', 'pro', 'active')
  ON CONFLICT (user_id) DO UPDATE SET plan = EXCLUDED.plan, status = EXCLUDED.status, name = EXCLUDED.name, email = EXCLUDED.email;

  SELECT id INTO trainer_pro_id FROM public.trainers WHERE user_id = trainer_pro_uid;

  -- Subscriptions
  INSERT INTO public.subscriptions (user_id, plan_tier, status)
  VALUES (trainer_free_uid, 'free', 'active')
  ON CONFLICT (user_id) DO UPDATE SET plan_tier = EXCLUDED.plan_tier, status = EXCLUDED.status;

  INSERT INTO public.subscriptions (user_id, plan_tier, status)
  VALUES (trainer_pro_uid, 'pro', 'active')
  ON CONFLICT (user_id) DO UPDATE SET plan_tier = EXCLUDED.plan_tier, status = EXCLUDED.status;

  -- Client profile (self-managed, linked to pro trainer for sample data)
  INSERT INTO public.clients (user_id, trainer_id, name, email, phone, total_sessions, goals_notes)
  VALUES (client_uid, trainer_pro_id, 'Sam Taylor', 'client@testapp.com', '555-0100', 4,
          'Build strength and improve endurance. Training 3x per week.')
  ON CONFLICT (user_id) DO UPDATE SET
    trainer_id = EXCLUDED.trainer_id,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    total_sessions = EXCLUDED.total_sessions,
    goals_notes = EXCLUDED.goals_notes;

  -- Sample clients for the PRO trainer (so their dashboard has data)
  INSERT INTO public.clients (trainer_id, name, email, phone, total_sessions, goals_notes)
  SELECT trainer_pro_id, 'Morgan Lee', 'morgan.lee@example.com', '555-0111', 12,
         'Marathon prep. Focus on lower body strength.'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.clients
    WHERE trainer_id = trainer_pro_id AND email = 'morgan.lee@example.com'
  );

  INSERT INTO public.clients (trainer_id, name, email, phone, total_sessions, goals_notes)
  SELECT trainer_pro_id, 'Priya Patel', 'priya.patel@example.com', '555-0122', 8,
         'Post-rehab strength training. Watch lower back.'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.clients
    WHERE trainer_id = trainer_pro_id AND email = 'priya.patel@example.com'
  );

  SELECT id INTO pro_client1_id FROM public.clients WHERE trainer_id = trainer_pro_id AND email = 'morgan.lee@example.com';
  SELECT id INTO pro_client2_id FROM public.clients WHERE trainer_id = trainer_pro_id AND email = 'priya.patel@example.com';

  -- Sample sessions for the pro trainer
  INSERT INTO public.sessions (client_id, client_name, date, start_time, end_time, duration_minutes, location, status)
  SELECT pro_client1_id, 'Morgan Lee', CURRENT_DATE + 1, '09:00', '10:00', 60, 'Studio A', 'scheduled'
  WHERE pro_client1_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.sessions WHERE client_id = pro_client1_id AND date = CURRENT_DATE + 1);

  INSERT INTO public.sessions (client_id, client_name, date, start_time, end_time, duration_minutes, location, status)
  SELECT pro_client2_id, 'Priya Patel', CURRENT_DATE + 2, '14:00', '15:00', 60, 'Studio B', 'scheduled'
  WHERE pro_client2_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.sessions WHERE client_id = pro_client2_id AND date = CURRENT_DATE + 2);

  -- A session for the demo client (so their dashboard has upcoming data)
  INSERT INTO public.sessions (client_id, client_name, date, start_time, end_time, duration_minutes, location, status)
  SELECT (SELECT id FROM public.clients WHERE user_id = client_uid), 'Sam Taylor', CURRENT_DATE + 1, '17:00', '18:00', 60, 'Studio A', 'scheduled'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.sessions WHERE client_id = (SELECT id FROM public.clients WHERE user_id = client_uid) AND date = CURRENT_DATE + 1
  );
END $$;
