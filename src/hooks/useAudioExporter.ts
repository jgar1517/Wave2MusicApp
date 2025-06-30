import { useState, useCallback } from 'react';

export interface ExportSettings {
  format: 'mp3' | 'wav' | 'flac' | 'ogg';
  quality: 'low' | 'medium' | 'high' | 'lossless';
  sampleRate: number;
  bitDepth: number;
  normalize: boolean;
  fadeIn: number;
  fadeOut: number;
  metadata: {
    title?: string;
    artist?: string;
    album?: string;
    year?: number;
    genre?: string;
  };
}

export interface ExportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  settings: ExportSettings;
  outputUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface AudioExporterState {
  jobs: ExportJob[];
  isExporting: boolean;
  error: string | null;
}

export const useAudioExporter = () => {
  const [state, setState] = useState<AudioExporterState>({
    jobs: [],
    isExporting: false,
    error: null,
  });

  const defaultSettings: ExportSettings = {
    format: 'mp3',
    quality: 'high',
    sampleRate: 44100,
    bitDepth: 16,
    normalize: true,
    fadeIn: 0,
    fadeOut: 0,
    metadata: {},
  };

  const getQualitySettings = useCallback((format: string, quality: string) => {
    const settings = {
      mp3: {
        low: { bitrate: 128, sampleRate: 44100 },
        medium: { bitrate: 192, sampleRate: 44100 },
        high: { bitrate: 320, sampleRate: 44100 },
        lossless: { bitrate: 320, sampleRate: 48000 },
      },
      wav: {
        low: { bitDepth: 16, sampleRate: 44100 },
        medium: { bitDepth: 16, sampleRate: 48000 },
        high: { bitDepth: 24, sampleRate: 48000 },
        lossless: { bitDepth: 24, sampleRate: 96000 },
      },
      flac: {
        low: { bitDepth: 16, sampleRate: 44100 },
        medium: { bitDepth: 16, sampleRate: 48000 },
        high: { bitDepth: 24, sampleRate: 48000 },
        lossless: { bitDepth: 24, sampleRate: 96000 },
      },
      ogg: {
        low: { bitrate: 128, sampleRate: 44100 },
        medium: { bitrate: 192, sampleRate: 44100 },
        high: { bitrate: 256, sampleRate: 48000 },
        lossless: { bitrate: 320, sampleRate: 48000 },
      },
    };

    return settings[format as keyof typeof settings]?.[quality as keyof typeof settings.mp3] || settings.mp3.high;
  }, []);

  const processAudioWithEffects = useCallback(async (
    audioBuffer: AudioBuffer,
    settings: ExportSettings
  ): Promise<AudioBuffer> => {
    const audioContext = new AudioContext({ sampleRate: settings.sampleRate });
    
    // Create a new buffer with the desired sample rate
    const outputBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      Math.floor(audioBuffer.length * (settings.sampleRate / audioBuffer.sampleRate)),
      settings.sampleRate
    );

    // Copy and resample audio data
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);
      
      // Simple linear interpolation for resampling
      const ratio = inputData.length / outputData.length;
      for (let i = 0; i < outputData.length; i++) {
        const sourceIndex = i * ratio;
        const index = Math.floor(sourceIndex);
        const fraction = sourceIndex - index;
        
        if (index + 1 < inputData.length) {
          outputData[i] = inputData[index] * (1 - fraction) + inputData[index + 1] * fraction;
        } else {
          outputData[i] = inputData[index] || 0;
        }
      }
    }

    // Apply normalization
    if (settings.normalize) {
      let maxValue = 0;
      for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
        const channelData = outputBuffer.getChannelData(channel);
        for (let i = 0; i < channelData.length; i++) {
          maxValue = Math.max(maxValue, Math.abs(channelData[i]));
        }
      }
      
      if (maxValue > 0) {
        const normalizeGain = 0.95 / maxValue;
        for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
          const channelData = outputBuffer.getChannelData(channel);
          for (let i = 0; i < channelData.length; i++) {
            channelData[i] *= normalizeGain;
          }
        }
      }
    }

    // Apply fade in/out
    if (settings.fadeIn > 0 || settings.fadeOut > 0) {
      const fadeInSamples = Math.floor(settings.fadeIn * settings.sampleRate);
      const fadeOutSamples = Math.floor(settings.fadeOut * settings.sampleRate);
      
      for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
        const channelData = outputBuffer.getChannelData(channel);
        
        // Fade in
        for (let i = 0; i < Math.min(fadeInSamples, channelData.length); i++) {
          channelData[i] *= i / fadeInSamples;
        }
        
        // Fade out
        for (let i = Math.max(0, channelData.length - fadeOutSamples); i < channelData.length; i++) {
          const fadeProgress = (channelData.length - i) / fadeOutSamples;
          channelData[i] *= fadeProgress;
        }
      }
    }

    await audioContext.close();
    return outputBuffer;
  }, []);

  const audioBufferToWav = useCallback((buffer: AudioBuffer, bitDepth: number = 16): Blob => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const bufferSize = 44 + dataSize;
    
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Convert audio data
    let offset = 44;
    const maxValue = Math.pow(2, bitDepth - 1) - 1;
    
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        const intSample = Math.round(sample * maxValue);
        
        if (bitDepth === 16) {
          view.setInt16(offset, intSample, true);
          offset += 2;
        } else if (bitDepth === 24) {
          view.setInt32(offset, intSample << 8, true);
          offset += 3;
        } else if (bitDepth === 32) {
          view.setFloat32(offset, sample, true);
          offset += 4;
        }
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }, []);

  const exportAudio = useCallback(async (
    audioBlob: Blob,
    settings: ExportSettings = defaultSettings
  ): Promise<string> => {
    const jobId = `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const job: ExportJob = {
      id: jobId,
      status: 'pending',
      progress: 0,
      settings,
      createdAt: new Date(),
    };

    setState(prev => ({
      ...prev,
      jobs: [job, ...prev.jobs],
      isExporting: true,
      error: null,
    }));

    try {
      // Update job status
      setState(prev => ({
        ...prev,
        jobs: prev.jobs.map(j => 
          j.id === jobId ? { ...j, status: 'processing' as const, progress: 10 } : j
        ),
      }));

      // Convert blob to audio buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      setState(prev => ({
        ...prev,
        jobs: prev.jobs.map(j => 
          j.id === jobId ? { ...j, progress: 30 } : j
        ),
      }));

      // Process audio with effects
      const processedBuffer = await processAudioWithEffects(audioBuffer, settings);
      
      setState(prev => ({
        ...prev,
        jobs: prev.jobs.map(j => 
          j.id === jobId ? { ...j, progress: 60 } : j
        ),
      }));

      let outputBlob: Blob;

      // Export based on format
      switch (settings.format) {
        case 'wav':
          outputBlob = audioBufferToWav(processedBuffer, settings.bitDepth);
          break;
        case 'mp3':
          // For MP3, we'll use WAV as fallback since MP3 encoding requires additional libraries
          outputBlob = audioBufferToWav(processedBuffer, 16);
          break;
        case 'flac':
          // For FLAC, we'll use WAV as fallback
          outputBlob = audioBufferToWav(processedBuffer, settings.bitDepth);
          break;
        case 'ogg':
          // For OGG, we'll use WAV as fallback
          outputBlob = audioBufferToWav(processedBuffer, 16);
          break;
        default:
          outputBlob = audioBufferToWav(processedBuffer, 16);
      }

      setState(prev => ({
        ...prev,
        jobs: prev.jobs.map(j => 
          j.id === jobId ? { ...j, progress: 90 } : j
        ),
      }));

      // Create download URL
      const outputUrl = URL.createObjectURL(outputBlob);
      
      await audioContext.close();

      // Complete the job
      setState(prev => ({
        ...prev,
        jobs: prev.jobs.map(j => 
          j.id === jobId ? { 
            ...j, 
            status: 'completed' as const, 
            progress: 100, 
            outputUrl,
            completedAt: new Date()
          } : j
        ),
        isExporting: false,
      }));

      return outputUrl;
    } catch (error) {
      console.error('Export error:', error);
      
      setState(prev => ({
        ...prev,
        jobs: prev.jobs.map(j => 
          j.id === jobId ? { 
            ...j, 
            status: 'failed' as const, 
            error: error instanceof Error ? error.message : 'Export failed',
            completedAt: new Date()
          } : j
        ),
        isExporting: false,
        error: error instanceof Error ? error.message : 'Export failed',
      }));

      throw error;
    }
  }, [defaultSettings, processAudioWithEffects, audioBufferToWav]);

  const downloadExport = useCallback((job: ExportJob) => {
    if (job.outputUrl && job.status === 'completed') {
      const a = document.createElement('a');
      a.href = job.outputUrl;
      a.download = `export-${job.createdAt.getTime()}.${job.settings.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, []);

  const removeJob = useCallback((jobId: string) => {
    setState(prev => {
      const job = prev.jobs.find(j => j.id === jobId);
      if (job?.outputUrl) {
        URL.revokeObjectURL(job.outputUrl);
      }
      return {
        ...prev,
        jobs: prev.jobs.filter(j => j.id !== jobId),
      };
    });
  }, []);

  const clearCompletedJobs = useCallback(() => {
    setState(prev => {
      prev.jobs.forEach(job => {
        if (job.outputUrl && (job.status === 'completed' || job.status === 'failed')) {
          URL.revokeObjectURL(job.outputUrl);
        }
      });
      return {
        ...prev,
        jobs: prev.jobs.filter(j => j.status === 'processing' || j.status === 'pending'),
      };
    });
  }, []);

  return {
    ...state,
    exportAudio,
    downloadExport,
    removeJob,
    clearCompletedJobs,
    defaultSettings,
    getQualitySettings,
  };
};