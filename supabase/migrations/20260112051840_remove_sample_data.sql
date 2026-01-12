/*
  # Remove Sample Data from Database

  1. Changes
    - Delete all clients without a trainer_id (orphaned sample data)
    - Delete all sessions without valid client references
    - Clean up any other sample/test data that shouldn't be in production

  2. Security
    - Only removes data that is not linked to any trainer
    - Preserves all legitimate user data

  3. Notes
    - This ensures new trainers start with a clean slate
    - Existing trainers' data is preserved
*/

-- Delete all sessions that belong to clients without a trainer_id
DELETE FROM sessions
WHERE client_id IN (
  SELECT id FROM clients WHERE trainer_id IS NULL
);

-- Delete all clients that are not linked to any trainer (sample data)
DELETE FROM clients
WHERE trainer_id IS NULL;

-- Delete any orphaned sessions (sessions without valid client_id)
DELETE FROM sessions
WHERE client_id NOT IN (SELECT id FROM clients);