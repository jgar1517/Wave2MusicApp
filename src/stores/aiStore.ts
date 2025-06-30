import { create } from 'zustand';
import { replicateProxy, ProxyTransformRequest } from '../lib/replicateProxy';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface AITransformation {
  id: string;
  project_id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transformation_type: string;
  input_audio_path: string;
  output_audio_path?: string;
  parameters: Record<string, any>;
  replicate_prediction_id?: string;
  error_message?: string;
  quality_score?: number;
  user_rating?: number;
  processing_time_seconds?: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export type TransformationStyle = 'orchestral' | 'electronic' | 'jazz' | 'rock' | 'acoustic' | 'ambient';

export const TRANSFORMATION_STYLES = {
  orchestral: {
    name: 'Orchestral',
    description: 'Transform into a full orchestral arrangement',
    prompts: [
      'orchestral arrangement with strings, brass, and woodwinds',
      'classical symphony orchestra with rich harmonies',
      'cinematic orchestral score with dramatic dynamics',
      'romantic period orchestra with lush strings'
    ],
    icon: '🎼',
    color: 'neon-blue'
  },
  electronic: {
    name: 'Electronic',
    description: 'Convert to electronic/EDM style',
    prompts: [
      'electronic dance music with synthesizers and beats',
      'ambient electronic with atmospheric pads',
      'techno with driving bassline and percussion',
      'synthwave with retro electronic sounds'
    ],
    icon: '🎛️',
    color: 'neon-purple'
  },
  jazz: {
    name: 'Jazz',
    description: 'Transform into jazz arrangement',
    prompts: [
      'jazz ensemble with piano, bass, and drums',
      'smooth jazz with saxophone and guitar',
      'bebop jazz with complex harmonies',
      'latin jazz with percussion and brass'
    ],
    icon: '🎷',
    color: 'neon-yellow'
  },
  rock: {
    name: 'Rock',
    description: 'Convert to rock/metal style',
    prompts: [
      'rock band with electric guitars and drums',
      'heavy metal with distorted guitars',
      'classic rock with guitar solos',
      'progressive rock with complex arrangements'
    ],
    icon: '🎸',
    color: 'neon-pink'
  },
  acoustic: {
    name: 'Acoustic',
    description: 'Transform to acoustic instruments',
    prompts: [
      'acoustic guitar and vocals',
      'folk music with acoustic instruments',
      'unplugged acoustic arrangement',
      'singer-songwriter style with guitar'
    ],
    icon: '🎸',
    color: 'neon-green'
  },
  ambient: {
    name: 'Ambient',
    description: 'Create atmospheric ambient music',
    prompts: [
      'ambient soundscape with ethereal textures',
      'atmospheric music with reverb and delay',
      'meditative ambient with soft tones',
      'space ambient with cosmic sounds'
    ],
    icon: '🌌',
    color: 'neon-blue'
  }
};

interface AIState {
  transformations: AITransformation[];
  currentTransformation: AITransformation | null;
  isProcessing: boolean;
  error: string | null;
  
  // AI Operations
  createTransformation: (
    projectId: string,
    audioBlob: Blob,
    style: TransformationStyle,
    options?: any
  ) => Promise<AITransformation | null>;
  
  checkTransformationStatus: (transformationId: string) => Promise<void>;
  cancelTransformation: (transformationId: string) => Promise<boolean>;
  loadTransformations: (projectId?: string) => Promise<void>;
  rateTransformation: (transformationId: string, rating: number, feedback?: string) => Promise<boolean>;
  clearAllTransformations: () => Promise<void>;
  
  // Real-time status updates
  pollTransformation: (transformationId: string) => void;
  stopPolling: () => void;
  
  // API testing
  testAPIConnection: () => Promise<boolean>;
}

export const useAIStore = create<AIState>((set, get) => {
  let pollingInterval: NodeJS.Timeout | null = null;

  return {
    transformations: [],
    currentTransformation: null,
    isProcessing: false,
    error: null,

    testAPIConnection: async () => {
      try {
        console.log('🧪 Testing AI API connection via proxy...');
        const isConnected = await replicateProxy.testConnection();
        console.log('📍 Connection test result:', isConnected);
        return isConnected;
      } catch (error) {
        console.error('❌ API connection test failed:', error);
        set({ error: error instanceof Error ? error.message : 'API connection failed' });
        return false;
      }
    },

    createTransformation: async (
      projectId: string,
      audioBlob: Blob,
      style: TransformationStyle,
      options = {}
    ) => {
      const { user } = useAuthStore.getState();
      if (!user) {
        set({ error: 'User not authenticated' });
        return null;
      }

      set({ isProcessing: true, error: null });

      try {
        console.log('🎵 Starting AI transformation:', { projectId, style, options });
        
        // Convert audio blob to base64
        console.log('📤 Converting audio to base64...');
        const audioBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(audioBlob);
        });

        console.log('✅ Audio conversion complete');
        
        // Get style configuration
        const styleConfig = TRANSFORMATION_STYLES[style];
        const prompt = options.prompt || styleConfig.prompts[0]; // Use custom prompt if provided
        
        console.log('📍 Using style config:', styleConfig);
        console.log('📍 Generated prompt:', prompt);
        
        // Prepare request for proxy
        const proxyRequest: ProxyTransformRequest = {
          audioBase64,
          style,
          parameters: {
            prompt,
            duration: Math.min(30, Math.max(8, options.duration || 15)),
            temperature: Math.min(2.0, Math.max(0.1, options.temperature || 1.0)),
            continuation: false, // Explicitly set to false to avoid the error
            ...options
          }
        };

        console.log('🚀 Sending request to proxy...');
        
        // Create transformation via proxy
        const proxyResponse = await replicateProxy.createTransformation(proxyRequest);
        
        if (!proxyResponse.success) {
          throw new Error(proxyResponse.error || 'Transformation request failed');
        }

        console.log('✅ Proxy response received:', proxyResponse);

        // Store transformation in database
        const transformationData = {
          project_id: projectId,
          user_id: user.id,
          status: 'pending' as const,
          transformation_type: style,
          input_audio_path: '', 
          parameters: {
            style,
            prompt,
            ...proxyRequest.parameters,
            audio_input: '[BLOB_DATA]' // Don't store the actual base64 in DB
          },
          replicate_prediction_id: proxyResponse.prediction_id,
        };

        console.log('💾 Storing transformation in database...');
        const { data, error } = await supabase
          .from('ai_transformations')
          .insert([transformationData])
          .select()
          .single();

        if (error) {
          console.error('❌ Database error:', error);
          throw new Error(`Database error: ${error.message}`);
        }

        const transformation = data as AITransformation;
        console.log('✅ Transformation stored:', transformation);
        
        set(state => ({
          transformations: [transformation, ...state.transformations],
          currentTransformation: transformation,
          isProcessing: false,
        }));

        // Start polling for status updates
        get().pollTransformation(transformation.id);

        return transformation;
      } catch (error) {
        console.error('❌ Error creating AI transformation:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to create transformation';
        set({ 
          error: errorMessage,
          isProcessing: false 
        });
        return null;
      }
    },

    checkTransformationStatus: async (transformationId: string) => {
      try {
        const { data: transformation } = await supabase
          .from('ai_transformations')
          .select('*')
          .eq('id', transformationId)
          .single();

        if (!transformation || !transformation.replicate_prediction_id) return;

        console.log('🔍 Checking status for:', transformation.replicate_prediction_id);

        // Check status via proxy
        const statusResponse = await replicateProxy.getTransformationStatus(transformation.replicate_prediction_id);
        
        if (!statusResponse.success) {
          console.error('❌ Status check failed:', statusResponse.error);
          return;
        }

        console.log('📍 Status response:', statusResponse);
        
        let updates: Partial<AITransformation> = {
          status: statusResponse.status as AITransformation['status']
        };

        if (statusResponse.status === 'processing' && !transformation.started_at) {
          updates.started_at = new Date().toISOString();
        }

        if (statusResponse.status === 'succeeded') {
          updates.status = 'completed';
          updates.completed_at = new Date().toISOString();
          updates.output_audio_path = Array.isArray(statusResponse.output) 
            ? statusResponse.output[0] 
            : statusResponse.output;
          
          if (transformation.started_at) {
            const processingTime = (new Date().getTime() - new Date(transformation.started_at).getTime()) / 1000;
            updates.processing_time_seconds = Math.round(processingTime);
          }
        }

        if (statusResponse.status === 'failed') {
          updates.error_message = statusResponse.error || 'Processing failed';
          updates.completed_at = new Date().toISOString();
        }

        // Update database
        const { data: updatedTransformation } = await supabase
          .from('ai_transformations')
          .update(updates)
          .eq('id', transformationId)
          .select()
          .single();

        if (updatedTransformation) {
          set(state => ({
            transformations: state.transformations.map(t => 
              t.id === transformationId ? updatedTransformation as AITransformation : t
            ),
            currentTransformation: state.currentTransformation?.id === transformationId 
              ? updatedTransformation as AITransformation 
              : state.currentTransformation
          }));

          // Stop polling if completed
          if (['completed', 'failed', 'cancelled'].includes(statusResponse.status || '')) {
            get().stopPolling();
          }
        }
      } catch (error) {
        console.error('❌ Error checking transformation status:', error);
        // Don't set error state for network issues during status checks
      }
    },

    cancelTransformation: async (transformationId: string) => {
      try {
        const { error } = await supabase
          .from('ai_transformations')
          .update({ 
            status: 'cancelled',
            completed_at: new Date().toISOString()
          })
          .eq('id', transformationId);

        if (error) throw error;

        set(state => ({
          transformations: state.transformations.map(t => 
            t.id === transformationId 
              ? { ...t, status: 'cancelled' as const, completed_at: new Date().toISOString() }
              : t
          ),
          currentTransformation: state.currentTransformation?.id === transformationId
            ? { ...state.currentTransformation, status: 'cancelled' as const, completed_at: new Date().toISOString() }
            : state.currentTransformation
        }));

        if (get().currentTransformation?.id === transformationId) {
          get().stopPolling();
        }
        
        return true;
      } catch (error) {
        console.error('❌ Error cancelling transformation:', error);
        return false;
      }
    },

    clearAllTransformations: async () => {
      try {
        // Stop any active polling
        get().stopPolling();
        
        // Clear transformations from state
        set({ 
          transformations: [],
          currentTransformation: null,
          error: null
        });
        
        console.log('✅ All transformations cleared from UI');
      } catch (error) {
        console.error('❌ Error clearing transformations:', error);
      }
    },

    loadTransformations: async (projectId?: string) => {
      const { user } = useAuthStore.getState();
      if (!user) return;

      try {
        let query = supabase
          .from('ai_transformations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        const { data, error } = await query;

        if (error) throw error;

        set({ transformations: data as AITransformation[] });
      } catch (error) {
        console.error('❌ Error loading transformations:', error);
        set({ error: 'Failed to load transformations' });
      }
    },

    rateTransformation: async (transformationId: string, rating: number, feedback?: string) => {
      try {
        const updates: any = { user_rating: rating };
        if (feedback) {
          updates.user_feedback = feedback;
        }

        const { error } = await supabase
          .from('ai_transformations')
          .update(updates)
          .eq('id', transformationId);

        if (error) throw error;

        set(state => ({
          transformations: state.transformations.map(t => 
            t.id === transformationId 
              ? { ...t, user_rating: rating }
              : t
          )
        }));

        return true;
      } catch (error) {
        console.error('❌ Error rating transformation:', error);
        return false;
      }
    },

    pollTransformation: (transformationId: string) => {
      // Clear existing polling
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }

      // Poll every 5 seconds
      pollingInterval = setInterval(() => {
        get().checkTransformationStatus(transformationId);
      }, 5000);

      // Initial check
      get().checkTransformationStatus(transformationId);
    },

    stopPolling: () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    }
  };
});