/*
  # Create sessions and clients tables for appointment scheduling

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `name` (text, client full name)
      - `email` (text, optional contact email)
      - `phone` (text, optional contact phone)
      - `total_sessions` (integer, total completed sessions)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `sessions`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `client_name` (text, denormalized for quick access)
      - `date` (date, session date)
      - `start_time` (time, session start time)
      - `end_time` (time, session end time)
      - `duration_minutes` (integer, session duration)
      - `location` (text, where the session takes place)
      - `status` (text, session status: scheduled/completed/cancelled)
      - `notes` (text, optional session notes)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (MVP - will add auth later)

  3. Indexes
    - Add index on sessions.date for fast calendar queries
    - Add index on sessions.client_id for client lookups
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  total_sessions integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_minutes integer NOT NULL,
  location text DEFAULT 'Studio A',
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (MVP)
CREATE POLICY "Allow public read access to clients"
  ON clients FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to clients"
  ON clients FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to clients"
  ON clients FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to sessions"
  ON sessions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to sessions"
  ON sessions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to sessions"
  ON sessions FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to sessions"
  ON sessions FOR DELETE
  TO public
  USING (true);

-- Insert sample clients
INSERT INTO clients (name, email, total_sessions) VALUES
  ('Sarah Johnson', 'sarah.j@email.com', 12),
  ('Mike Thompson', 'mike.t@email.com', 8),
  ('Emily Davis', 'emily.d@email.com', 15),
  ('James Wilson', 'james.w@email.com', 6),
  ('Lisa Anderson', 'lisa.a@email.com', 10)
ON CONFLICT DO NOTHING;

-- Insert sample sessions for the next few weeks
INSERT INTO sessions (client_id, client_name, date, start_time, end_time, duration_minutes, location, status) 
SELECT 
  c.id,
  c.name,
  CURRENT_DATE + (d || ' days')::interval,
  ('09:00:00')::time,
  ('10:00:00')::time,
  60,
  'Studio A',
  'scheduled'
FROM clients c, generate_series(1, 3) d
WHERE c.name = 'Sarah Johnson'
ON CONFLICT DO NOTHING;

INSERT INTO sessions (client_id, client_name, date, start_time, end_time, duration_minutes, location, status) 
SELECT 
  c.id,
  c.name,
  CURRENT_DATE + (d || ' days')::interval,
  ('14:00:00')::time,
  ('15:00:00')::time,
  60,
  'Studio B',
  'scheduled'
FROM clients c, generate_series(2, 5, 3) d
WHERE c.name = 'Mike Thompson'
ON CONFLICT DO NOTHING;
