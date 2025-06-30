import { useState, useRef, useCallback } from 'react';

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  audioLevel: number;
  error: string | null;
  permissionStatus: 'unknown' | 'granted' | 'denied' | 'prompt';
  isCheckingPermissions: boolean;
}

export interface AudioRecorderControls {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
  requestPermissions: () => Promise<boolean>;
  checkPermissions: () => Promise<void>;
}

export const useAudioRecorder = () => {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    audioLevel: 0,
    error: null,
    permissionStatus: 'unknown',
    isCheckingPermissions: false,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedLevel = Math.min(average / 128, 1);
    
    setState(prev => ({ ...prev, audioLevel: normalizedLevel }));
    
    if (state.isRecording && !state.isPaused) {
      animationRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [state.isRecording, state.isPaused]);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setState(prev => ({ ...prev, recordingTime: prev.recordingTime + 1 }));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const checkPermissions = useCallback(async () => {
    setState(prev => ({ ...prev, isCheckingPermissions: true, error: null }));

    try {
      // Check if we're in a secure context
      if (!window.isSecureContext) {
        throw new Error('Microphone access requires HTTPS or localhost');
      }

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio recording');
      }

      // Try to get permission status if supported
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setState(prev => ({ 
            ...prev, 
            permissionStatus: permission.state,
            isCheckingPermissions: false 
          }));
          return;
        } catch (e) {
          // Permission API not supported, continue with getUserMedia test
        }
      }

      // Fallback: try to access microphone briefly to check permissions
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false 
          } 
        });
        
        // Stop immediately
        stream.getTracks().forEach(track => track.stop());
        
        setState(prev => ({ 
          ...prev, 
          permissionStatus: 'granted',
          isCheckingPermissions: false,
          error: null
        }));
      } catch (error: any) {
        let permissionStatus: 'denied' | 'prompt' = 'denied';
        
        if (error.name === 'NotAllowedError') {
          permissionStatus = 'denied';
        } else if (error.name === 'NotFoundError') {
          permissionStatus = 'denied';
        } else {
          permissionStatus = 'prompt';
        }
        
        setState(prev => ({ 
          ...prev, 
          permissionStatus,
          isCheckingPermissions: false
        }));
      }
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        permissionStatus: 'denied',
        isCheckingPermissions: false,
        error: error.message
      }));
    }
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, error: null, isCheckingPermissions: true }));

    try {
      // Check basic requirements
      if (!window.isSecureContext) {
        throw new Error('Microphone access requires a secure connection (HTTPS or localhost). Please ensure you\'re using HTTPS.');
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio recording. Please use Chrome, Firefox, Safari, or Edge.');
      }

      // Request microphone access with minimal constraints first
      console.log('Requesting microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true // Start with minimal constraints
      });

      console.log('Microphone access granted');
      
      // Stop the stream immediately
      stream.getTracks().forEach(track => {
        console.log('Stopping track:', track.label);
        track.stop();
      });
      
      setState(prev => ({ 
        ...prev, 
        permissionStatus: 'granted',
        isCheckingPermissions: false,
        error: null
      }));
      
      return true;
    } catch (error: any) {
      console.error('Permission request failed:', error);
      
      let errorMessage = 'Failed to access microphone.';
      let permissionStatus: 'denied' | 'prompt' = 'denied';
      
      switch (error.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          errorMessage = 'Microphone access was denied. Please click the microphone icon in your browser\'s address bar and select "Allow", then try again.';
          permissionStatus = 'denied';
          break;
        case 'NotFoundError':
        case 'DevicesNotFoundError':
          errorMessage = 'No microphone was found. Please connect a microphone to your device and try again.';
          permissionStatus = 'denied';
          break;
        case 'NotReadableError':
        case 'TrackStartError':
          errorMessage = 'Your microphone is currently being used by another application. Please close other apps that might be using the microphone and try again.';
          permissionStatus = 'denied';
          break;
        case 'OverconstrainedError':
        case 'ConstraintNotSatisfiedError':
          errorMessage = 'Your microphone doesn\'t support the required settings. This is unusual - please try refreshing the page.';
          permissionStatus = 'prompt';
          break;
        case 'NotSupportedError':
          errorMessage = 'Audio recording is not supported in your browser. Please use Chrome, Firefox, Safari, or Edge.';
          permissionStatus = 'denied';
          break;
        case 'AbortError':
          errorMessage = 'Microphone access was cancelled. Please try again.';
          permissionStatus = 'prompt';
          break;
        case 'SecurityError':
          errorMessage = 'Security error: Please ensure you\'re using HTTPS or localhost.';
          permissionStatus = 'denied';
          break;
        default:
          errorMessage = `Microphone access failed: ${error.message || 'Unknown error'}. Please check your browser settings and try again.`;
          permissionStatus = 'prompt';
      }
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        permissionStatus,
        isCheckingPermissions: false
      }));
      
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));

      // Check permissions first
      if (state.permissionStatus !== 'granted') {
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
          return;
        }
      }

      console.log('Starting recording...');

      // Request microphone access with full constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      });

      console.log('Got media stream:', stream);
      streamRef.current = stream;

      // Set up audio context for level monitoring
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Set up MediaRecorder with fallback mime types
      let mimeType = '';
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/wav'
      ];

      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      console.log('Using mime type:', mimeType || 'default');

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event.error);
        setState(prev => ({ 
          ...prev, 
          error: `Recording error: ${event.error?.message || 'Unknown error'}` 
        }));
      };

      mediaRecorder.start(100); // Collect data every 100ms
      startTimer();
      updateAudioLevel();

      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        recordingTime: 0,
      }));

      console.log('Recording started successfully');
    } catch (error: any) {
      console.error('Error starting recording:', error);
      
      let errorMessage = 'Failed to start recording.';
      
      switch (error.name) {
        case 'NotAllowedError':
          errorMessage = 'Microphone access was denied. Please allow microphone access and try again.';
          break;
        case 'NotFoundError':
          errorMessage = 'No microphone found. Please connect a microphone and try again.';
          break;
        case 'NotReadableError':
          errorMessage = 'Microphone is being used by another application. Please close other apps and try again.';
          break;
        case 'OverconstrainedError':
          errorMessage = 'Microphone settings are not supported. Please try again.';
          break;
        default:
          errorMessage = error.message || 'Failed to start recording. Please check your microphone and try again.';
      }
      
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, [state.permissionStatus, startTimer, updateAudioLevel, requestPermissions]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        console.log('Recording stopped, blob size:', blob.size);
        resolve(blob);
      };

      mediaRecorderRef.current.stop();
      stopTimer();

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          console.log('Stopping track:', track.label);
          track.stop();
        });
        streamRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      setState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false,
        audioLevel: 0,
      }));
    });
  }, [stopTimer]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.pause();
      stopTimer();
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      setState(prev => ({ ...prev, isPaused: true }));
    }
  }, [state.isRecording, stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isPaused) {
      mediaRecorderRef.current.resume();
      startTimer();
      updateAudioLevel();
      setState(prev => ({ ...prev, isPaused: false }));
    }
  }, [state.isPaused, startTimer, updateAudioLevel]);

  const resetRecording = useCallback(() => {
    if (state.isRecording) {
      stopRecording();
    }
    
    setState(prev => ({
      ...prev,
      isRecording: false,
      isPaused: false,
      recordingTime: 0,
      audioLevel: 0,
      error: null,
    }));
    
    chunksRef.current = [];
  }, [state.isRecording, stopRecording]);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    requestPermissions,
    checkPermissions,
  };
};