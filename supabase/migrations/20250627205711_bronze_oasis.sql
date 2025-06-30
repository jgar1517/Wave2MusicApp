/*
  # Create projects table for audio recording and project management

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text, required)
      - `description` (text, optional)
      - `genre` (text, optional)
      - `tags` (text array)
      - `original_audio_path` (text, optional)
      - `processed_audio_path` (text, optional)
      - `waveform_data` (jsonb, optional)
      - `duration_seconds` (decimal, optional)
      - `sample_rate` (integer, default 44100)
      - `effects_settings` (jsonb, default {})
      - `metronome_bpm` (integer, default 120)
      - `project_settings` (jsonb, default {})
      - `status` (text, default 'draft')
      - `is_public` (boolean, default false)
      - `is_featured` (boolean, default false)
      - `play_count` (integer, default 0)
      - `like_count` (integer, default 0)
      - `download_count` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `last_played_at` (timestamp, optional)

  2. Security
    - Enable RLS on `projects` table
    - Add policies for users to manage their own projects
    - Add policy for public projects to be viewable by all
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Audio file references
  original_audio_path TEXT,
  processed_audio_path TEXT,
  waveform_data JSONB,
  duration_seconds DECIMAL(10,3),
  sample_rate INTEGER DEFAULT 44100,
  
  -- Project settings
  effects_settings JSONB DEFAULT '{}',
  metronome_bpm INTEGER DEFAULT 120 CHECK (metronome_bpm BETWEEN 60 AND 200),
  project_settings JSONB DEFAULT '{}',
  
  -- Status and visibility
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'archived')),
  is_public BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Statistics
  play_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_played_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_public ON projects(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public projects viewable by all" ON projects
  FOR SELECT USING (is_public = TRUE);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();