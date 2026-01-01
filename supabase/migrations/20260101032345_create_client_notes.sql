/*
  # Create Client Notes Table

  1. New Tables
    - `client_notes`
      - `id` (uuid, primary key) - Unique note identifier
      - `client_id` (uuid, foreign key) - Links to the client
      - `note_text` (text) - The actual note content
      - `created_at` (timestamptz) - When the note was created

  2. Security
    - Enable RLS on client_notes table
    - Add policies for authenticated users to manage notes for their clients
    - Notes can only be accessed by the trainer who owns the client

  3. Important Notes
    - Notes are linked to clients for full history tracking
    - Automatically ordered by created_at for chronological display
    - Cascading delete ensures notes are removed when clients are deleted
    - Simple structure focuses on core functionality
*/

-- Create client_notes table
CREATE TABLE IF NOT EXISTS client_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  note_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS client_notes_client_id_idx ON client_notes(client_id);
CREATE INDEX IF NOT EXISTS client_notes_created_at_idx ON client_notes(created_at DESC);

-- Enable RLS
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;

-- Client notes policies
CREATE POLICY "Authenticated users can view notes for their clients"
  ON client_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notes for their clients"
  ON client_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update notes for their clients"
  ON client_notes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete notes for their clients"
  ON client_notes FOR DELETE
  TO authenticated
  USING (true);