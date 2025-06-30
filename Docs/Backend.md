# Studio Nexus - Backend Operations Documentation
**Last Updated:** January 15, 2025  
**Architecture:** Supabase + Serverless Functions

## Overview
Studio Nexus uses Supabase as the primary backend infrastructure, providing authentication, database, storage, and real-time capabilities. Additional serverless functions handle AI processing and audio export operations.

## Architecture Components

### Primary Backend: Supabase
- **Database:** PostgreSQL with Row-Level Security (RLS)
- **Authentication:** Built-in auth with multiple providers
- **Storage:** File storage with bucket organization
- **Real-time:** WebSocket connections for live updates
- **Edge Functions:** Serverless functions for custom logic

### External Services
- **Replicate API:** AI music generation (MusicGen)
- **FFmpeg WASM:** Client-side audio processing
- **Payment Processing:** Stripe integration (future)

## Database Operations

### User Management
```sql
-- User profile operations
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies for user data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Project Management
```sql
-- Project storage and metadata
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  audio_file_path TEXT,
  waveform_data JSONB,
  effects_settings JSONB,
  ai_transformations JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project access control
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public projects viewable by all" ON projects
  FOR SELECT USING (is_public = TRUE);
```

### AI Processing Queue
```sql
-- Track AI transformation requests
CREATE TABLE ai_transformations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  input_audio_path TEXT NOT NULL,
  output_audio_path TEXT,
  transformation_type TEXT NOT NULL, -- orchestral, electronic, etc.
  parameters JSONB DEFAULT '{}',
  replicate_prediction_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Queue access policies
ALTER TABLE ai_transformations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transformations" ON ai_transformations
  FOR SELECT USING (auth.uid() = user_id);
```

### Usage Tracking
```sql
-- Track user resource usage for subscription limits
CREATE TABLE usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  resource_type TEXT NOT NULL, -- ai_transformations, exports, storage_mb
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage policies
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);
```

## Authentication Operations

### User Registration
```typescript
// New user signup with profile creation
const signUpUser = async (email: string, password: string, userData: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  });
  
  if (data.user) {
    // Create profile record
    await supabase
      .from('profiles')
      .insert([
        {
          id: data.user.id,
          username: userData.username,
          full_name: userData.full_name
        }
      ]);
  }
  
  return { data, error };
};
```

### Session Management
```typescript
// Secure session handling
const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return error;
};
```

## File Storage Operations

### Audio File Management
```typescript
// Upload audio file with metadata
const uploadAudioFile = async (file: File, userId: string, projectId: string) => {
  const filePath = `audio/${userId}/${projectId}/${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('audio-files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
    
  return { data, error, filePath };
};

// Get signed URL for audio playback
const getAudioUrl = async (filePath: string) => {
  const { data } = await supabase.storage
    .from('audio-files')
    .createSignedUrl(filePath, 3600); // 1 hour expiry
    
  return data?.signedUrl;
};
```

### File Organization
```
Storage Buckets:
├── audio-files/
│   ├── [user-id]/
│   │   ├── [project-id]/
│   │   │   ├── original.wav
│   │   │   ├── processed.mp3
│   │   │   └── ai-generated.wav
├── user-avatars/
│   └── [user-id]/
│       └── avatar.jpg
└── public-assets/
    ├── presets/
    └── samples/
```

## AI Processing Operations

### MusicGen Integration
```typescript
// Process audio through AI transformation
const processAITransformation = async (
  audioFilePath: string,
  transformationType: string,
  parameters: any
) => {
  // Upload to Replicate
  const prediction = await replicate.predictions.create({
    version: "musicgen-model-version",
    input: {
      audio: audioFilePath,
      style: transformationType,
      ...parameters
    }
  });
  
  // Store transformation record
  await supabase
    .from('ai_transformations')
    .insert([
      {
        project_id: parameters.projectId,
        user_id: parameters.userId,
        status: 'processing',
        replicate_prediction_id: prediction.id,
        transformation_type: transformationType,
        parameters: parameters
      }
    ]);
    
  return prediction;
};
```

### Queue Management
```typescript
// Check processing status
const checkTransformationStatus = async (transformationId: string) => {
  const { data } = await supabase
    .from('ai_transformations')
    .select('*')
    .eq('id', transformationId)
    .single();
    
  if (data?.replicate_prediction_id) {
    const prediction = await replicate.predictions.get(
      data.replicate_prediction_id
    );
    
    // Update status if changed
    if (prediction.status !== data.status) {
      await supabase
        .from('ai_transformations')
        .update({
          status: prediction.status,
          output_audio_path: prediction.output?.[0],
          completed_at: prediction.status === 'succeeded' ? new Date() : null
        })
        .eq('id', transformationId);
    }
  }
  
  return data;
};
```

## Real-time Operations

### Project Collaboration
```typescript
// Subscribe to project updates
const subscribeToProject = (projectId: string, callback: Function) => {
  return supabase
    .channel(`project-${projectId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'projects',
      filter: `id=eq.${projectId}`
    }, callback)
    .subscribe();
};

// Broadcast project changes
const broadcastProjectUpdate = (projectId: string, update: any) => {
  return supabase
    .channel(`project-${projectId}`)
    .send({
      type: 'broadcast',
      event: 'project-update',
      payload: update
    });
};
```

## Security Operations

### Row-Level Security Policies
```sql
-- Comprehensive RLS for all tables
-- Projects
CREATE POLICY "project_owners_all_access" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- AI Transformations
CREATE POLICY "transformation_owners_access" ON ai_transformations
  FOR ALL USING (auth.uid() = user_id);

-- Usage Tracking
CREATE POLICY "usage_owners_view" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "system_can_insert_usage" ON usage_tracking
  FOR INSERT WITH CHECK (true);
```

### API Security
```typescript
// Middleware for protected routes
const requireAuth = async (req: Request) => {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No authentication token');
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Invalid authentication');
  
  return user;
};

// Subscription tier validation
const requireSubscription = async (userId: string, feature: string) => {
  const { data } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single();
    
  const hasAccess = checkFeatureAccess(data?.subscription_tier, feature);
  if (!hasAccess) throw new Error('Subscription upgrade required');
  
  return true;
};
```

## Performance Optimizations

### Database Indexing
```sql
-- Critical indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_ai_transformations_user_id ON ai_transformations(user_id);
CREATE INDEX idx_ai_transformations_status ON ai_transformations(status);
CREATE INDEX idx_usage_tracking_user_date ON usage_tracking(user_id, created_at);
```

### Connection Pooling
```typescript
// Optimize Supabase client configuration
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    db: {
      schema: 'public'
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
);
```

## Monitoring & Logging

### Error Tracking
```typescript
// Centralized error logging
const logError = async (error: Error, context: any) => {
  await supabase
    .from('error_logs')
    .insert([
      {
        error_message: error.message,
        error_stack: error.stack,
        context: context,
        created_at: new Date()
      }
    ]);
};

// Usage analytics
const trackUsage = async (userId: string, action: string, metadata: any) => {
  await supabase
    .from('analytics_events')
    .insert([
      {
        user_id: userId,
        event_type: action,
        metadata: metadata,
        created_at: new Date()
      }
    ]);
};
```

## Backup & Recovery

### Data Backup Strategy
- **Automated Backups:** Daily PostgreSQL backups via Supabase
- **File Storage:** Replicated across multiple regions
- **Point-in-time Recovery:** Available for 7 days
- **Export Capabilities:** User data export on demand

### Disaster Recovery Plan
1. **RTO (Recovery Time Objective):** <4 hours
2. **RPO (Recovery Point Objective):** <1 hour
3. **Failover Process:** Automated with health checks
4. **Communication Plan:** Status page and user notifications

## API Rate Limiting

### Implementation
```typescript
// Rate limiting by user and endpoint
const rateLimiter = {
  ai_transformations: { limit: 10, window: '1h' },
  file_uploads: { limit: 100, window: '1h' },
  api_calls: { limit: 1000, window: '1h' }
};

const checkRateLimit = async (userId: string, action: string) => {
  const limit = rateLimiter[action];
  if (!limit) return true;
  
  const count = await getUsageCount(userId, action, limit.window);
  return count < limit.limit;
};
```

## Deployment Operations

### Environment Configuration
```bash
# Production environment variables
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
REPLICATE_API_TOKEN=your-replicate-token
STRIPE_SECRET_KEY=your-stripe-key
```

### Health Checks
```typescript
// Service health monitoring
const healthCheck = async () => {
  const checks = await Promise.all([
    checkDatabase(),
    checkStorage(),
    checkExternalAPIs()
  ]);
  
  return {
    status: checks.every(c => c.healthy) ? 'healthy' : 'degraded',
    services: checks
  };
};
```

This backend documentation provides a comprehensive overview of all backend operations, security measures, and infrastructure management for Studio Nexus.