import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface Track {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  description?: string;
  audio_blob?: Blob;
  audio_url?: string;
  audio_path?: string;
  waveform_data?: {
    peaks: number[];
    duration: number;
  };
  duration_seconds: number;
  sample_rate: number;
  effects_settings: Record<string, any>;
  volume: number;
  pan: number;
  is_muted: boolean;
  is_solo: boolean;
  track_order: number;
  created_at: string;
  updated_at: string;
}

export interface TrackSession {
  trackId: string;
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

interface TrackState {
  tracks: Track[];
  currentTrack: Track | null;
  trackSessions: Map<string, TrackSession>;
  loading: boolean;
  error: string | null;
  
  // Track management
  createTrack: (projectId: string, name: string, audioBlob: Blob, description?: string) => Promise<Track | null>;
  updateTrack: (id: string, updates: Partial<Track>) => Promise<boolean>;
  deleteTrack: (id: string) => Promise<boolean>;
  loadTracks: (projectId: string) => Promise<void>;
  setCurrentTrack: (track: Track | null) => void;
  
  // Track session management
  createTrackSession: (trackId: string, audioBlob: Blob) => Promise<void>;
  updateTrackSession: (trackId: string, updates: Partial<TrackSession>) => void;
  clearTrackSession: (trackId: string) => void;
  clearAllSessions: () => void;
  
  // Track playback
  playTrack: (trackId: string) => void;
  pauseTrack: (trackId: string) => void;
  seekTrack: (trackId: string, time: number) => void;
  
  // Track controls
  setTrackVolume: (trackId: string, volume: number) => Promise<void>;
  setTrackPan: (trackId: string, pan: number) => Promise<void>;
  muteTrack: (trackId: string, muted: boolean) => Promise<void>;
  soloTrack: (trackId: string, solo: boolean) => Promise<void>;
  reorderTracks: (projectId: string, trackIds: string[]) => Promise<void>;
}

// Improved audio duration detection
const getAudioDuration = (audioBlob: Blob): Promise<number> => {
  return new Promise((resolve, reject) => {
    console.log('Analyzing audio duration for blob:', audioBlob.size, 'bytes');
    
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
        
        if (isFinite(duration) && duration > 0) {
          resolve(duration);
        } else {
          tryWebAudioAPI();
        }
      };
      
      const onLoadedMetadata = () => {
        if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
          resolveWithDuration(audio.duration);
        }
      };
      
      const onDurationChange = () => {
        if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
          resolveWithDuration(audio.duration);
        }
      };
      
      const onCanPlayThrough = () => {
        if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
          resolveWithDuration(audio.duration);
        }
      };
      
      const onError = () => {
        if (!resolved) {
          cleanup();
          tryWebAudioAPI();
        }
      };
      
      const timeout = setTimeout(() => {
        if (!resolved) {
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

    const tryWebAudioAPI = () => {
      audioBlob.arrayBuffer()
        .then(buffer => {
          const audioContext = new AudioContext();
          return audioContext.decodeAudioData(buffer)
            .then(audioBuffer => {
              const duration = audioBuffer.duration;
              audioContext.close();
              
              if (isFinite(duration) && duration > 0) {
                resolve(duration);
              } else {
                tryEstimateFromSize();
              }
            });
        })
        .catch(() => {
          tryEstimateFromSize();
        });
    };

    const tryEstimateFromSize = () => {
      const estimatedDuration = (audioBlob.size * 8) / (128 * 1000);
      
      if (estimatedDuration > 0 && estimatedDuration < 3600) {
        resolve(estimatedDuration);
      } else {
        reject(new Error('Could not determine audio duration'));
      }
    };

    tryAudioElement();
  });
};

export const useTrackStore = create<TrackState>((set, get) => ({
  tracks: [],
  currentTrack: null,
  trackSessions: new Map(),
  loading: false,
  error: null,

  createTrack: async (projectId: string, name: string, audioBlob: Blob, description?: string) => {
    const { user } = useAuthStore.getState();
    if (!user) return null;

    set({ loading: true, error: null });

    try {
      // Check track limit (10 tracks per project)
      const existingTracks = get().tracks.filter(t => t.project_id === projectId);
      if (existingTracks.length >= 10) {
        throw new Error('Maximum of 10 tracks per project allowed');
      }

      // Get audio duration
      const duration = await getAudioDuration(audioBlob);
      
      // Create audio URL for immediate playback
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Get next track order
      const maxOrder = Math.max(0, ...existingTracks.map(t => t.track_order));
      
      const newTrack = {
        project_id: projectId,
        user_id: user.id,
        name,
        description: description || '',
        duration_seconds: duration,
        sample_rate: 44100,
        effects_settings: {},
        volume: 1.0,
        pan: 0.0,
        is_muted: false,
        is_solo: false,
        track_order: maxOrder + 1,
      };

      const { data, error } = await supabase
        .from('tracks')
        .insert([newTrack])
        .select()
        .single();

      if (error) throw error;

      const track = data as Track;
      
      // Add audio blob and URL to the track object for immediate use
      track.audio_blob = audioBlob;
      track.audio_url = audioUrl;

      set(state => ({
        tracks: [...state.tracks, track],
        currentTrack: track,
        loading: false,
      }));

      // Create a session for immediate playback
      await get().createTrackSession(track.id, audioBlob);

      return track;
    } catch (error) {
      console.error('Error creating track:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create track', loading: false });
      return null;
    }
  },

  updateTrack: async (id: string, updates: Partial<Track>) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('tracks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedTrack = data as Track;
      set(state => ({
        tracks: state.tracks.map(t => t.id === id ? { ...t, ...updatedTrack } : t),
        currentTrack: state.currentTrack?.id === id ? { ...state.currentTrack, ...updatedTrack } : state.currentTrack,
        loading: false,
      }));

      return true;
    } catch (error) {
      console.error('Error updating track:', error);
      set({ error: 'Failed to update track', loading: false });
      return false;
    }
  },

  deleteTrack: async (id: string) => {
    set({ loading: true, error: null });

    try {
      const { error } = await supabase
        .from('tracks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Clean up session
      get().clearTrackSession(id);

      set(state => ({
        tracks: state.tracks.filter(t => t.id !== id),
        currentTrack: state.currentTrack?.id === id ? null : state.currentTrack,
        loading: false,
      }));

      return true;
    } catch (error) {
      console.error('Error deleting track:', error);
      set({ error: 'Failed to delete track', loading: false });
      return false;
    }
  },

  loadTracks: async (projectId: string) => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('track_order', { ascending: true });

      if (error) throw error;

      set({ tracks: data as Track[], loading: false });
    } catch (error) {
      console.error('Error loading tracks:', error);
      set({ error: 'Failed to load tracks', loading: false });
    }
  },

  setCurrentTrack: (track: Track | null) => {
    set({ currentTrack: track });
  },

  createTrackSession: async (trackId: string, audioBlob: Blob) => {
    try {
      const duration = await getAudioDuration(audioBlob);
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const session: TrackSession = {
        trackId,
        audioBlob,
        audioUrl,
        isPlaying: false,
        currentTime: 0,
        duration,
      };

      set(state => ({
        trackSessions: new Map(state.trackSessions.set(trackId, session))
      }));
    } catch (error) {
      console.error('Error creating track session:', error);
    }
  },

  updateTrackSession: (trackId: string, updates: Partial<TrackSession>) => {
    set(state => {
      const currentSession = state.trackSessions.get(trackId);
      if (!currentSession) return state;

      const updatedSession = { ...currentSession, ...updates };
      return {
        trackSessions: new Map(state.trackSessions.set(trackId, updatedSession))
      };
    });
  },

  clearTrackSession: (trackId: string) => {
    const session = get().trackSessions.get(trackId);
    if (session?.audioUrl) {
      URL.revokeObjectURL(session.audioUrl);
    }
    
    set(state => {
      const newSessions = new Map(state.trackSessions);
      newSessions.delete(trackId);
      return { trackSessions: newSessions };
    });
  },

  clearAllSessions: () => {
    const sessions = get().trackSessions;
    sessions.forEach(session => {
      if (session.audioUrl) {
        URL.revokeObjectURL(session.audioUrl);
      }
    });
    
    set({ trackSessions: new Map() });
  },

  playTrack: (trackId: string) => {
    get().updateTrackSession(trackId, { isPlaying: true });
  },

  pauseTrack: (trackId: string) => {
    get().updateTrackSession(trackId, { isPlaying: false });
  },

  seekTrack: (trackId: string, time: number) => {
    get().updateTrackSession(trackId, { currentTime: time });
  },

  setTrackVolume: async (trackId: string, volume: number) => {
    await get().updateTrack(trackId, { volume });
  },

  setTrackPan: async (trackId: string, pan: number) => {
    await get().updateTrack(trackId, { pan });
  },

  muteTrack: async (trackId: string, muted: boolean) => {
    await get().updateTrack(trackId, { is_muted: muted });
  },

  soloTrack: async (trackId: string, solo: boolean) => {
    const tracks = get().tracks;
    
    if (solo) {
      // When soloing a track, unmute it and mute all others
      for (const track of tracks) {
        if (track.id === trackId) {
          await get().updateTrack(track.id, { is_solo: true, is_muted: false });
        } else {
          await get().updateTrack(track.id, { is_solo: false });
        }
      }
    } else {
      // When unsoloing, just remove solo status
      await get().updateTrack(trackId, { is_solo: false });
    }
  },

  reorderTracks: async (projectId: string, trackIds: string[]) => {
    try {
      // Update track orders in database
      const updates = trackIds.map((trackId, index) => ({
        id: trackId,
        track_order: index + 1
      }));

      for (const update of updates) {
        await get().updateTrack(update.id, { track_order: update.track_order });
      }

      // Reload tracks to get updated order
      await get().loadTracks(projectId);
    } catch (error) {
      console.error('Error reordering tracks:', error);
      set({ error: 'Failed to reorder tracks' });
    }
  },
}));