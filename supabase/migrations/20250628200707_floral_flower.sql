/*
  # Create AI transformations table

  1. New Tables
    - `ai_transformations`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `user_id` (uuid, foreign key to auth.users)
      - `status` (text, transformation status)
      - `transformation_type` (text, style of transformation)
      - `input_audio_path` (text, path to input audio)
      - `output_audio_path` (text, path to generated audio)
      - `parameters` (jsonb, transformation parameters)
      - `replicate_prediction_id` (text, external service ID)
      - `error_message` (text, error details if failed)
      - `quality_score` (decimal, AI quality assessment)
      - `user_rating` (integer, user rating 1-5)
      - `user_feedback` (text, user feedback)
      - `processing_time_seconds` (integer, processing duration)
      - `created_at` (timestamp)
      - `started_at` (timestamp)
      - `completed_at` (timestamp)

  2. Security
    - Enable RLS on `ai_transformations` table
    - Add policy for users to manage their own transformations
*/

CREATE TABLE IF NOT EXISTS ai_transformations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  
  -- Processing details
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  transformation_type TEXT NOT NULL,
  input_audio_path TEXT NOT NULL,
  output_audio_path TEXT,
  
  -- AI parameters and external tracking
  parameters JSONB DEFAULT '{}',
  replicate_prediction_id TEXT UNIQUE,
  
  -- Quality and feedback
  quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  user_feedback TEXT,
  
  -- Error handling
  error_message TEXT,
  
  -- Timing
  processing_time_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_transformations_project_id ON ai_transformations(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_transformations_user_id ON ai_transformations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_transformations_status ON ai_transformations(status);
CREATE INDEX IF NOT EXISTS idx_ai_transformations_type ON ai_transformations(transformation_type);
CREATE INDEX IF NOT EXISTS idx_ai_transformations_created_at ON ai_transformations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_transformations_replicate_id ON ai_transformations(replicate_prediction_id);

-- Enable Row Level Security
ALTER TABLE ai_transformations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage own transformations" ON ai_transformations
  FOR ALL USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at (reuse existing function)
-- Note: We don't have updated_at column, but we could add it if needed