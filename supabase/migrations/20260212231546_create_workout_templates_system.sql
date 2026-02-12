/*
  # Create Workout Templates System

  1. New Tables
    - `workout_templates`
      - `id` (uuid, primary key) - Unique template identifier
      - `trainer_id` (uuid, foreign key) - Links to the trainer who created it
      - `name` (text) - Template name
      - `description` (text, nullable) - Optional description
      - `is_global` (boolean) - Whether template is shared across all clients
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `template_exercises`
      - `id` (uuid, primary key) - Unique exercise identifier
      - `template_id` (uuid, foreign key) - Links to the workout template
      - `exercise_name` (text) - Name of the exercise
      - `sets` (integer) - Target number of sets
      - `reps` (text) - Target reps (can be range like "8-12")
      - `rest_seconds` (integer) - Rest time between sets in seconds
      - `notes` (text, nullable) - Optional exercise notes
      - `section` (text) - Exercise section: warm-up, main, cooldown
      - `order_index` (integer) - Order within the template
      - `created_at` (timestamptz) - Creation timestamp
    
    - `template_assignments`
      - `id` (uuid, primary key) - Unique assignment identifier
      - `template_id` (uuid, foreign key) - Links to the workout template
      - `client_id` (uuid, foreign key) - Links to the client
      - `assigned_at` (timestamptz) - When the template was assigned
      - `assigned_by` (uuid, foreign key) - Trainer who made the assignment

  2. Security
    - Enable RLS on all tables
    - Trainers can only manage their own templates
    - Trainers can only assign templates to their clients
    - Clients can view templates assigned to them

  3. Indexes
    - Add index on template_exercises.template_id for fast lookups
    - Add index on template_assignments for client and template queries
*/

-- Create workout_templates table
CREATE TABLE IF NOT EXISTS workout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_global boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create template_exercises table
CREATE TABLE IF NOT EXISTS template_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  sets integer NOT NULL DEFAULT 3,
  reps text NOT NULL DEFAULT '10',
  rest_seconds integer NOT NULL DEFAULT 60,
  notes text,
  section text NOT NULL DEFAULT 'main' CHECK (section IN ('warm-up', 'main', 'cooldown')),
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create template_assignments table
CREATE TABLE IF NOT EXISTS template_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  UNIQUE(template_id, client_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workout_templates_trainer ON workout_templates(trainer_id);
CREATE INDEX IF NOT EXISTS idx_template_exercises_template ON template_exercises(template_id);
CREATE INDEX IF NOT EXISTS idx_template_exercises_section ON template_exercises(section);
CREATE INDEX IF NOT EXISTS idx_template_assignments_template ON template_assignments(template_id);
CREATE INDEX IF NOT EXISTS idx_template_assignments_client ON template_assignments(client_id);

-- Enable RLS
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_assignments ENABLE ROW LEVEL SECURITY;

-- Workout Templates Policies
CREATE POLICY "Trainers can view their own templates"
  ON workout_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trainers
      WHERE trainers.id = workout_templates.trainer_id
      AND trainers.user_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can create templates"
  ON workout_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trainers
      WHERE trainers.id = workout_templates.trainer_id
      AND trainers.user_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can update their own templates"
  ON workout_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trainers
      WHERE trainers.id = workout_templates.trainer_id
      AND trainers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trainers
      WHERE trainers.id = workout_templates.trainer_id
      AND trainers.user_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can delete their own templates"
  ON workout_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trainers
      WHERE trainers.id = workout_templates.trainer_id
      AND trainers.user_id = auth.uid()
    )
  );

-- Template Exercises Policies
CREATE POLICY "Users can view exercises for templates they can access"
  ON template_exercises FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_templates wt
      JOIN trainers t ON t.id = wt.trainer_id
      WHERE wt.id = template_exercises.template_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can insert exercises to their templates"
  ON template_exercises FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_templates wt
      JOIN trainers t ON t.id = wt.trainer_id
      WHERE wt.id = template_exercises.template_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can update exercises in their templates"
  ON template_exercises FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_templates wt
      JOIN trainers t ON t.id = wt.trainer_id
      WHERE wt.id = template_exercises.template_id
      AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_templates wt
      JOIN trainers t ON t.id = wt.trainer_id
      WHERE wt.id = template_exercises.template_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can delete exercises from their templates"
  ON template_exercises FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_templates wt
      JOIN trainers t ON t.id = wt.trainer_id
      WHERE wt.id = template_exercises.template_id
      AND t.user_id = auth.uid()
    )
  );

-- Template Assignments Policies
CREATE POLICY "Trainers can view assignments for their templates"
  ON template_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trainers t
      WHERE t.id = template_assignments.assigned_by
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can assign templates to their clients"
  ON template_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trainers t
      JOIN clients c ON c.trainer_id = t.id
      WHERE t.id = template_assignments.assigned_by
      AND c.id = template_assignments.client_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can remove template assignments"
  ON template_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trainers t
      WHERE t.id = template_assignments.assigned_by
      AND t.user_id = auth.uid()
    )
  );