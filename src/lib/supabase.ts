import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a placeholder client if environment variables are not set
// This allows the app to run while Supabase is being configured
let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not configured. Please click "Connect to Supabase" to set up your database connection.');
  
  // Create a mock client that throws helpful errors for database operations
  supabase = {
    auth: {
      signUp: () => Promise.reject(new Error('Supabase not configured. Please set up your database connection.')),
      signInWithPassword: () => Promise.reject(new Error('Supabase not configured. Please set up your database connection.')),
      signOut: () => Promise.reject(new Error('Supabase not configured. Please set up your database connection.')),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({
      select: () => Promise.reject(new Error('Supabase not configured. Please set up your database connection.')),
      insert: () => Promise.reject(new Error('Supabase not configured. Please set up your database connection.')),
      update: () => Promise.reject(new Error('Supabase not configured. Please set up your database connection.')),
      delete: () => Promise.reject(new Error('Supabase not configured. Please set up your database connection.'))
    })
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}

export { supabase };

// Database types
export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  website_url?: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  subscription_expires_at?: string;
  total_projects: number;
  total_transformations: number;
  storage_used_mb: number;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  genre?: string;
  tags: string[];
  original_audio_path?: string;
  processed_audio_path?: string;
  waveform_data?: Record<string, any>;
  duration_seconds?: number;
  sample_rate: number;
  effects_settings: Record<string, any>;
  metronome_bpm: number;
  project_settings: Record<string, any>;
  status: 'draft' | 'processing' | 'completed' | 'archived';
  is_public: boolean;
  is_featured: boolean;
  play_count: number;
  like_count: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  last_played_at?: string;
}