import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  genre?: string;
  tags: string[];
  original_audio_path?: string;
  processed_audio_path?: string;
  waveform_data?: {
    peaks: number[];
    duration: number;
  };
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

export interface AudioSession {
  id: string;
  projectId: string;
  audioBlob?: Blob;
  audioUrl?: string;
  waveformData?: {
    peaks: number[];
    duration: number;
  };
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  currentSession: AudioSession | null;
  loading: boolean;
  error: string | null;
  
  // Project management
  createProject: (title: string, description?: string) => Promise<Project | null>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
  loadProjects: () => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  
  // Audio session management
  createSession: (projectId: string, audioBlob: Blob) => Promise<void>;
  updateSession: (updates: Partial<AudioSession>) => void;
  clearSession: () => void;
  
  // Audio playback
  playAudio: () => void;
  pauseAudio: () => void;
  seekAudio: (time: number) => void;
}

// Improved audio duration detection with multiple fallback methods
const getAudioDuration = (audioBlob: Blob): Promise<number> => {
  return new Promise((resolve, reject) => {
    console.log('Starting audio analysis for blob:', audioBlob.size, 'bytes');
    
    // Method 1: Try using Audio element
    const tryAudioElement = () => {
      const audio = new Audio();
      const url = URL.createObjectURL(audioBlob);
      let resolved = false;
      
      const cleanup = () => {
        if (!resolved) {
          URL.revokeObjectURL(url);
          audio.removeEventListener('loadedmetadata', onLoadedMetadata);
          audio.removeEventListener('durationchange', onDurationChange);
          audio.removeEventListener('canplaythrough', onCanPlayThrough);
          audio.removeEventListener('error', onError);
        }
      };
      
      const resolveWithDuration = (duration: number) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        
        console.log('Audio element method succeeded, duration:', duration);
        
        // Accept any finite positive duration, including very short ones
        if (isFinite(duration) && duration > 0) {
          resolve(duration);
        } else {
          console.warn('Invalid duration from audio element:', duration);
          tryWebAudioAPI();
        }
      };
      
      const onLoadedMetadata = () => {
        console.log('Audio metadata loaded, duration:', audio.duration);
        if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
          resolveWithDuration(audio.duration);
        }
      };
      
      const onDurationChange = () => {
        console.log('Audio duration changed:', audio.duration);
        if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
          resolveWithDuration(audio.duration);
        }
      };
      
      const onCanPlayThrough = () => {
        console.log('Audio can play through, duration:', audio.duration);
        if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
          resolveWithDuration(audio.duration);
        }
      };
      
      const onError = (e: Event) => {
        console.error('Audio element error:', e);
        if (!resolved) {
          cleanup();
          tryWebAudioAPI();
        }
      };
      
      // Set timeout for this method
      const timeout = setTimeout(() => {
        if (!resolved) {
          console.log('Audio element method timed out, trying Web Audio API');
          cleanup();
          tryWebAudioAPI();
        }
      }, 5000);
      
      audio.addEventListener('loadedmetadata', onLoadedMetadata);
      audio.addEventListener('durationchange', onDurationChange);
      audio.addEventListener('canplaythrough', onCanPlayThrough);
      audio.addEventListener('error', onError);
      
      audio.preload = 'metadata';
      audio.src = url;
      audio.load();
    };

    // Method 2: Try using Web Audio API
    const tryWebAudioAPI = () => {
      console.log('Trying Web Audio API method');
      
      audioBlob.arrayBuffer()
        .then(buffer => {
          const audioContext = new AudioContext();
          return audioContext.decodeAudioData(buffer)
            .then(audioBuffer => {
              const duration = audioBuffer.duration;
              console.log('Web Audio API method succeeded, duration:', duration);
              
              audioContext.close();
              
              if (isFinite(duration) && duration > 0) {
                resolve(duration);
              } else {
                console.warn('Invalid duration from Web Audio API:', duration);
                tryEstimateFromSize();
              }
            });
        })
        .catch(error => {
          console.error('Web Audio API failed:', error);
          tryEstimateFromSize();
        });
    };

    // Method 3: Estimate from file size (very rough fallback)
    const tryEstimateFromSize = () => {
      console.log('Trying size estimation method');
      
      // Very rough estimation: assume ~128kbps encoding
      // This is just a fallback and won't be very accurate
      const estimatedDuration = (audioBlob.size * 8) / (128 * 1000); // Convert to seconds
      
      console.log('Estimated duration from size:', estimatedDuration);
      
      if (estimatedDuration > 0 && estimatedDuration < 3600) { // Sanity check: less than 1 hour
        resolve(estimatedDuration);
      } else {
        reject(new Error('Could not determine audio duration'));
      }
    };

    // Start with the most reliable method
    tryAudioElement();
  });
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  currentSession: null,
  loading: false,
  error: null,

  createProject: async (title: string, description?: string) => {
    const { user } = useAuthStore.getState();
    if (!user) return null;

    set({ loading: true, error: null });

    try {
      const newProject = {
        user_id: user.id,
        title,
        description: description || '',
        genre: '',
        tags: [],
        sample_rate: 44100,
        effects_settings: {},
        metronome_bpm: 120,
        project_settings: {},
        status: 'draft' as const,
        is_public: false,
        is_featured: false,
        play_count: 0,
        like_count: 0,
        download_count: 0,
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([newProject])
        .select()
        .single();

      if (error) throw error;

      const project = data as Project;
      set(state => ({
        projects: [project, ...state.projects],
        currentProject: project,
        loading: false,
      }));

      return project;
    } catch (error) {
      console.error('Error creating project:', error);
      set({ error: 'Failed to create project', loading: false });
      return null;
    }
  },

  updateProject: async (id: string, updates: Partial<Project>) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedProject = data as Project;
      set(state => ({
        projects: state.projects.map(p => p.id === id ? updatedProject : p),
        currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
        loading: false,
      }));

      return true;
    } catch (error) {
      console.error('Error updating project:', error);
      set({ error: 'Failed to update project', loading: false });
      return false;
    }
  },

  deleteProject: async (id: string) => {
    set({ loading: true, error: null });

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        loading: false,
      }));

      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      set({ error: 'Failed to delete project', loading: false });
      return false;
    }
  },

  loadProjects: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      set({ projects: data as Project[], loading: false });
    } catch (error) {
      console.error('Error loading projects:', error);
      set({ error: 'Failed to load projects', loading: false });
    }
  },

  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project });
  },

  createSession: async (projectId: string, audioBlob: Blob) => {
    try {
      // Use the robust audio duration detection
      const duration = await getAudioDuration(audioBlob);
      
      // Create the audio URL
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const session: AudioSession = {
        id: `session-${Date.now()}`,
        projectId,
        audioBlob,
        audioUrl,
        isPlaying: false,
        currentTime: 0,
        duration, // Use the reliably detected duration
      };

      set({ currentSession: session });
      
      console.log('Session created successfully with duration:', duration);
    } catch (error) {
      console.error('Error creating session:', error);
      
      // Fallback: create session with estimated duration
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Rough estimation based on file size (fallback)
      const estimatedDuration = Math.max(1, (audioBlob.size * 8) / (128 * 1000));
      
      const session: AudioSession = {
        id: `session-${Date.now()}`,
        projectId,
        audioBlob,
        audioUrl,
        isPlaying: false,
        currentTime: 0,
        duration: estimatedDuration, // Use estimated duration as fallback
      };

      set({ currentSession: session });
      console.log('Session created with estimated duration:', estimatedDuration);
    }
  },

  updateSession: (updates: Partial<AudioSession>) => {
    set(state => ({
      currentSession: state.currentSession ? {
        ...state.currentSession,
        ...updates,
      } : null,
    }));
  },

  clearSession: () => {
    const { currentSession } = get();
    if (currentSession?.audioUrl) {
      URL.revokeObjectURL(currentSession.audioUrl);
    }
    set({ currentSession: null });
  },

  playAudio: () => {
    set(state => ({
      currentSession: state.currentSession ? {
        ...state.currentSession,
        isPlaying: true,
      } : null,
    }));
  },

  pauseAudio: () => {
    set(state => ({
      currentSession: state.currentSession ? {
        ...state.currentSession,
        isPlaying: false,
      } : null,
    }));
  },

  seekAudio: (time: number) => {
    set(state => ({
      currentSession: state.currentSession ? {
        ...state.currentSession,
        currentTime: time,
      } : null,
    }));
  },
}));