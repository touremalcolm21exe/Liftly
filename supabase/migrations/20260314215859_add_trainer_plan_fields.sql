/*
  # Add Plan and Status Fields to Trainers Table

  1. Changes
    - Add `plan` column to trainers table (values: 'free', 'pro')
    - Add `status` column to trainers table (values: 'active', 'cancelled')
  
  2. Security
    - No RLS changes needed (existing policies cover these fields)
  
  Note: These fields track subscription information directly on the trainer record.
*/

-- Add plan column to trainers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trainers' AND column_name = 'plan'
  ) THEN
    ALTER TABLE trainers ADD COLUMN plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro'));
  END IF;
END $$;

-- Add status column to trainers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trainers' AND column_name = 'status'
  ) THEN
    ALTER TABLE trainers ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled'));
  END IF;
END $$;
