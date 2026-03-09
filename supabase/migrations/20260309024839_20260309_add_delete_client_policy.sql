/*
  # Add DELETE policy for clients table

  1. Changes
    - Add DELETE policy allowing trainers to delete their clients
    - Ensures only trainers can delete clients they own

  2. Security
    - DELETE policy checks trainer_id to ensure trainers can only delete their own clients
    - Authenticated users only
*/

CREATE POLICY "Trainers can delete their clients"
  ON clients FOR DELETE
  TO authenticated
  USING (
    trainer_id IN (
      SELECT id FROM trainers WHERE user_id = auth.uid()
    )
  );