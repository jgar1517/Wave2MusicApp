# Studio Nexus - Database Schemas
**Last Updated:** January 15, 2025  
**Database:** PostgreSQL (Supabase)

## Overview
This document defines all database schemas, relationships, and constraints for Studio Nexus. All tables implement Row-Level Security (RLS) for data protection.

## Core Authentication Schema

### auth.users (Supabase Built-in)
```sql
-- Extended by Supabase Auth
-- Core fields: id, email, encrypted_password, email_confirmed_at, etc.
```

## User Management Schemas

### profiles
User profile information and subscription details.

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  total_projects INTEGER DEFAULT 0,
  total_transformations INTEGER DEFAULT 0,
  storage_used_mb INTEGER DEFAULT 0,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_subscription ON profiles(subscription_tier);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles viewable" ON profiles
  FOR SELECT USING (preferences->>'profile_public' = 'true');
```

### user_sessions
Track user login sessions and activity.

```sql
CREATE TABLE user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  session_token TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_activity ON user_sessions(last_activity);

-- RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);
```

## Project Management Schemas

### projects
Core project storage and metadata.

```sql
CREATE TABLE projects (
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

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_public ON projects(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_projects_featured ON projects(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_tags ON projects USING GIN(tags);

-- RLS Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public projects viewable by all" ON projects
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Admins can manage all projects" ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND preferences->>'role' = 'admin'
    )
  );
```

### project_versions
Version control for project iterations.

```sql
CREATE TABLE project_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  audio_file_path TEXT,
  effects_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(project_id, version_number)
);

-- Indexes
CREATE INDEX idx_project_versions_project_id ON project_versions(project_id);
CREATE INDEX idx_project_versions_created_at ON project_versions(created_at DESC);

-- RLS
ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own project versions" ON project_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id 
      AND user_id = auth.uid()
    )
  );
```

### project_collaborators
Collaboration and sharing permissions.

```sql
CREATE TABLE project_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users NOT NULL,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
  permissions JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(project_id, user_id)
);

-- Indexes
CREATE INDEX idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX idx_project_collaborators_user_id ON project_collaborators(user_id);

-- RLS
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Project owners can manage collaborators" ON project_collaborators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own collaborations" ON project_collaborators
  FOR SELECT USING (auth.uid() = user_id);
```

## AI Processing Schemas

### ai_transformations
Track AI music generation requests and results.

```sql
CREATE TABLE ai_transformations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  
  -- Processing details
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  transformation_type TEXT NOT NULL, -- 'orchestral', 'electronic', 'jazz', etc.
  input_audio_path TEXT NOT NULL,
  output_audio_path TEXT,
  
  -- AI parameters
  parameters JSONB DEFAULT '{}',
  model_version TEXT,
  processing_time_seconds INTEGER,
  
  -- External service tracking
  replicate_prediction_id TEXT UNIQUE,
  external_job_id TEXT,
  
  -- Quality and feedback
  quality_score DECIMAL(3,2), -- 0.00 to 1.00
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  user_feedback TEXT,
  
  -- Error handling
  error_code TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Indexes
CREATE INDEX idx_ai_transformations_project_id ON ai_transformations(project_id);
CREATE INDEX idx_ai_transformations_user_id ON ai_transformations(user_id);
CREATE INDEX idx_ai_transformations_status ON ai_transformations(status);
CREATE INDEX idx_ai_transformations_type ON ai_transformations(transformation_type);
CREATE INDEX idx_ai_transformations_created_at ON ai_transformations(created_at DESC);
CREATE INDEX idx_ai_transformations_replicate_id ON ai_transformations(replicate_prediction_id);

-- RLS
ALTER TABLE ai_transformations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own transformations" ON ai_transformations
  FOR ALL USING (auth.uid() = user_id);
```

### ai_model_presets
Predefined AI transformation settings.

```sql
CREATE TABLE ai_model_presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  transformation_type TEXT NOT NULL,
  parameters JSONB NOT NULL,
  preview_audio_url TEXT,
  thumbnail_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_presets_type ON ai_model_presets(transformation_type);
CREATE INDEX idx_ai_presets_active ON ai_model_presets(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_ai_presets_usage ON ai_model_presets(usage_count DESC);

-- RLS
ALTER TABLE ai_model_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active presets viewable by all" ON ai_model_presets
  FOR SELECT USING (is_active = TRUE);
```

## Audio Effects Schemas

### effects_presets
User-created and system effects presets.

```sql
CREATE TABLE effects_presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'vocal', 'instrument', 'ambient', etc.
  effects_chain JSONB NOT NULL, -- Array of effect configurations
  preview_audio_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  is_system_preset BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0.00,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_effects_presets_user_id ON effects_presets(user_id);
CREATE INDEX idx_effects_presets_category ON effects_presets(category);
CREATE INDEX idx_effects_presets_public ON effects_presets(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_effects_presets_system ON effects_presets(is_system_preset) WHERE is_system_preset = TRUE;
CREATE INDEX idx_effects_presets_rating ON effects_presets(rating_average DESC);

-- RLS
ALTER TABLE effects_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own presets" ON effects_presets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public and system presets viewable" ON effects_presets
  FOR SELECT USING (is_public = TRUE OR is_system_preset = TRUE);
```

## Usage Tracking Schemas

### usage_tracking
Track resource usage for subscription limits.

```sql
CREATE TABLE usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  resource_type TEXT NOT NULL, -- 'ai_transformations', 'exports', 'storage_mb', 'projects'
  resource_id UUID, -- Reference to specific resource (optional)
  quantity DECIMAL(10,3) DEFAULT 1.0,
  unit TEXT DEFAULT 'count', -- 'count', 'mb', 'seconds', 'minutes'
  metadata JSONB DEFAULT '{}',
  billing_period DATE DEFAULT DATE_TRUNC('month', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_type ON usage_tracking(resource_type);
CREATE INDEX idx_usage_tracking_period ON usage_tracking(billing_period);
CREATE INDEX idx_usage_tracking_created_at ON usage_tracking(created_at);

-- RLS
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage" ON usage_tracking
  FOR INSERT WITH CHECK (true);
```

### subscription_limits
Define usage limits per subscription tier.

```sql
CREATE TABLE subscription_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_tier TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  limit_value DECIMAL(10,3) NOT NULL,
  limit_unit TEXT NOT NULL,
  reset_period TEXT DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly', 'yearly', 'lifetime'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(subscription_tier, resource_type)
);

-- Default limits
INSERT INTO subscription_limits (subscription_tier, resource_type, limit_value, limit_unit) VALUES
('free', 'ai_transformations', 5, 'count'),
('free', 'exports', 10, 'count'),
('free', 'storage_mb', 100, 'mb'),
('free', 'projects', 3, 'count'),
('pro', 'ai_transformations', 50, 'count'),
('pro', 'exports', -1, 'count'), -- unlimited
('pro', 'storage_mb', 1000, 'mb'),
('pro', 'projects', -1, 'count'); -- unlimited

-- RLS
ALTER TABLE subscription_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Limits viewable by all" ON subscription_limits
  FOR SELECT USING (is_active = TRUE);
```

## Analytics & Monitoring Schemas

### analytics_events
Track user behavior and system events.

```sql
CREATE TABLE analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  session_id TEXT,
  event_type TEXT NOT NULL, -- 'page_view', 'feature_used', 'export_completed', etc.
  event_category TEXT, -- 'navigation', 'audio', 'ai', 'export'
  event_properties JSONB DEFAULT '{}',
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes (Partitioned by month for performance)
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own events" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert events" ON analytics_events
  FOR INSERT WITH CHECK (true);
```

### error_logs
System error tracking and debugging.

```sql
CREATE TABLE error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  error_type TEXT NOT NULL, -- 'client_error', 'server_error', 'api_error'
  error_code TEXT,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);

-- RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "System can manage error logs" ON error_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND preferences->>'role' IN ('admin', 'system')
    )
  );
```

## Social Features Schemas

### project_likes
User likes/favorites for projects.

```sql
CREATE TABLE project_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(project_id, user_id)
);

-- Indexes
CREATE INDEX idx_project_likes_project_id ON project_likes(project_id);
CREATE INDEX idx_project_likes_user_id ON project_likes(user_id);

-- RLS
ALTER TABLE project_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own likes" ON project_likes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Likes viewable for public projects" ON project_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_id 
      AND is_public = TRUE
    )
  );
```

### user_followers
User following system.

```sql
CREATE TABLE user_followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Indexes
CREATE INDEX idx_user_followers_follower_id ON user_followers(follower_id);
CREATE INDEX idx_user_followers_following_id ON user_followers(following_id);

-- RLS
ALTER TABLE user_followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own follows" ON user_followers
  FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Following relationships viewable" ON user_followers
  FOR SELECT USING (
    auth.uid() = follower_id OR 
    auth.uid() = following_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = following_id 
      AND preferences->>'profile_public' = 'true'
    )
  );
```

## Database Functions & Triggers

### Update Timestamps Trigger
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at columns
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Usage Tracking Functions
```sql
CREATE OR REPLACE FUNCTION track_resource_usage(
  p_user_id UUID,
  p_resource_type TEXT,
  p_quantity DECIMAL DEFAULT 1.0,
  p_resource_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO usage_tracking (user_id, resource_type, quantity, resource_id)
  VALUES (p_user_id, p_resource_type, p_quantity, p_resource_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id UUID,
  p_resource_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
  limit_value DECIMAL;
  current_usage DECIMAL;
BEGIN
  -- Get user subscription tier
  SELECT subscription_tier INTO user_tier
  FROM profiles WHERE id = p_user_id;
  
  -- Get limit for this tier and resource
  SELECT sl.limit_value INTO limit_value
  FROM subscription_limits sl
  WHERE sl.subscription_tier = user_tier
    AND sl.resource_type = p_resource_type
    AND sl.is_active = TRUE;
  
  -- If no limit found or unlimited (-1), allow
  IF limit_value IS NULL OR limit_value = -1 THEN
    RETURN TRUE;
  END IF;
  
  -- Get current usage for this billing period
  SELECT COALESCE(SUM(quantity), 0) INTO current_usage
  FROM usage_tracking
  WHERE user_id = p_user_id
    AND resource_type = p_resource_type
    AND billing_period = DATE_TRUNC('month', NOW());
  
  RETURN current_usage < limit_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Project Statistics Updates
```sql
CREATE OR REPLACE FUNCTION update_project_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update project like count
    IF TG_TABLE_NAME = 'project_likes' THEN
      UPDATE projects 
      SET like_count = like_count + 1 
      WHERE id = NEW.project_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update project like count
    IF TG_TABLE_NAME = 'project_likes' THEN
      UPDATE projects 
      SET like_count = like_count - 1 
      WHERE id = OLD.project_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_likes_stats_trigger
  AFTER INSERT OR DELETE ON project_likes
  FOR EACH ROW EXECUTE FUNCTION update_project_stats();
```

## Data Migration Scripts

### Initial Setup
```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE subscription_tier_enum AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE project_status_enum AS ENUM ('draft', 'processing', 'completed', 'archived');
CREATE TYPE transformation_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
```

### Sample Data for Development
```sql
-- Insert sample presets
INSERT INTO ai_model_presets (name, description, transformation_type, parameters, is_active) VALUES
('Classical Orchestra', 'Transform vocals into a full orchestral arrangement', 'orchestral', '{"style": "classical", "tempo": "moderate", "instruments": ["strings", "brass", "woodwinds"]}', true),
('Electronic Dance', 'Convert to upbeat electronic dance music', 'electronic', '{"style": "edm", "tempo": "fast", "synthesizers": true}', true),
('Jazz Ensemble', 'Create a smooth jazz interpretation', 'jazz', '{"style": "smooth_jazz", "instruments": ["piano", "saxophone", "bass", "drums"]}', true);

-- Insert system effects presets
INSERT INTO effects_presets (name, description, category, effects_chain, is_system_preset, is_public) VALUES
('Vocal Warmth', 'Warm, professional vocal sound', 'vocal', '[{"type": "equalizer", "settings": {"low": 1.2, "mid": 1.0, "high": 1.1}}, {"type": "reverb", "settings": {"room_size": 0.3, "damping": 0.5}}]', true, true),
('Ambient Space', 'Create atmospheric, spacious sound', 'ambient', '[{"type": "reverb", "settings": {"room_size": 0.8, "damping": 0.2}}, {"type": "delay", "settings": {"time": 0.5, "feedback": 0.3}}]', true, true);
```

This comprehensive schema design provides the foundation for all Studio Nexus functionality while maintaining security, performance, and scalability.