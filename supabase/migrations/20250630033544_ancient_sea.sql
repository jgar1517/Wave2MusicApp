/*
  # Create tracks table for multi-track recording

  1. New Tables
    - `tracks`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `user_id` (uuid, foreign key to users)
      - `name` (text, track name)
      - `description` (text, optional description)
      - `audio_path` (text, path to audio file in storage)
      - `waveform_data` (jsonb, waveform visualization data)
      - `duration_seconds` (decimal, track duration)
      - `sample_rate` (integer, audio sample rate)
      - `effects_settings` (jsonb, applied effects)
      - `volume` (decimal, track volume 0-1)
      - `pan` (decimal, stereo pan -1 to 1)
      - `is_muted` (boolean, mute status)
      - `is_solo` (boolean, solo status)
      - `track_order` (integer, display order)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `tracks` table
    - Add policies for users to manage their own tracks
    - Add policies for viewing tracks in public projects

  3. Indexes
    - Index on project_id for efficient track loading
    - Index on user_id for user track queries
    - Index on track_order for sorting
*/

CREATE TABLE IF NOT EXISTS tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  audio_path text,
  waveform_data jsonb,
  duration_seconds decimal(10,3) NOT NULL DEFAULT 0,
  sample_rate integer DEFAULT 44100,
  effects_settings jsonb DEFAULT '{}',
  volume decimal(3,2) DEFAULT 1.0 CHECK (volume >= 0 AND volume <= 1),
  pan decimal(3,2) DEFAULT 0.0 CHECK (pan >= -1 AND pan <= 1),
  is_muted boolean DEFAULT false,
  is_solo boolean DEFAULT false,
  track_order integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tracks_project_id ON tracks(project_id);
CREATE INDEX IF NOT EXISTS idx_tracks_user_id ON tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_tracks_order ON tracks(project_id, track_order);
CREATE INDEX IF NOT EXISTS idx_tracks_created_at ON tracks(created_at DESC);

-- Enable RLS
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own tracks" ON tracks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Tracks viewable for public projects" ON tracks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id 
      AND is_public = true
    )
  );

-- Update trigger
CREATE TRIGGER update_tracks_updated_at 
  BEFORE UPDATE ON tracks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraint to limit tracks per project
CREATE OR REPLACE FUNCTION check_track_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) 
    FROM tracks 
    WHERE project_id = NEW.project_id 
    AND user_id = NEW.user_id
  ) >= 10 THEN
    RAISE EXCEPTION 'Maximum of 10 tracks per project allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_track_limit
  BEFORE INSERT ON tracks
  FOR EACH ROW EXECUTE FUNCTION check_track_limit();