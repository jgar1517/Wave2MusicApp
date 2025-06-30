import { useRef, useCallback, useEffect } from 'react';

export interface WaveformData {
  peaks: number[];
  duration: number;
}

export const useWaveform = (canvasRef: React.RefObject<HTMLCanvasElement> | null) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);

  const drawWaveform = useCallback((
    peaks: number[],
    currentTime: number = 0,
    duration: number = 0,
    isRecording: boolean = false,
    canvas?: HTMLCanvasElement
  ) => {
    const targetCanvas = canvas || canvasRef?.current;
    if (!targetCanvas) return;

    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = targetCanvas;
    const centerY = height / 2;
    const barWidth = width / peaks.length;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw waveform bars
    peaks.forEach((peak, index) => {
      const barHeight = peak * (height * 0.8);
      const x = index * barWidth;
      const y = centerY - barHeight / 2;

      // Determine color based on playback position
      const progress = duration > 0 ? currentTime / duration : 0;
      const isPlayed = index / peaks.length <= progress;
      
      if (isRecording) {
        // Recording mode: gradient from blue to purple
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#00d4ff');
        gradient.addColorStop(1, '#b347d9');
        ctx.fillStyle = gradient;
      } else if (isPlayed) {
        // Played portion: neon blue
        ctx.fillStyle = '#00d4ff';
      } else {
        // Unplayed portion: gray
        ctx.fillStyle = '#475569';
      }

      ctx.fillRect(x, y, Math.max(barWidth - 1, 1), Math.max(barHeight, 2));
    });

    // Draw playback position indicator
    if (duration > 0 && !isRecording) {
      const progress = currentTime / duration;
      const indicatorX = progress * width;
      
      ctx.strokeStyle = '#ff47d9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(indicatorX, 0);
      ctx.lineTo(indicatorX, height);
      ctx.stroke();
    }
  }, [canvasRef]);

  const generateWaveformFromAudio = useCallback(async (audioBuffer: ArrayBuffer): Promise<WaveformData> => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const audioData = await audioContextRef.current.decodeAudioData(audioBuffer);
      const channelData = audioData.getChannelData(0);
      const samples = 200; // Number of bars in waveform
      const blockSize = Math.floor(channelData.length / samples);
      const peaks: number[] = [];

      for (let i = 0; i < samples; i++) {
        const start = i * blockSize;
        const end = start + blockSize;
        let max = 0;

        for (let j = start; j < end; j++) {
          const sample = Math.abs(channelData[j]);
          if (sample > max) {
            max = sample;
          }
        }

        peaks.push(max);
      }

      return {
        peaks,
        duration: audioData.duration,
      };
    } catch (error) {
      console.error('Error generating waveform:', error);
      return {
        peaks: Array(200).fill(0),
        duration: 0,
      };
    }
  }, []);

  const generateLiveWaveform = useCallback((audioLevel: number, isRecording: boolean) => {
    if (!isRecording) return;

    // Generate animated waveform for live recording
    const peaks = Array.from({ length: 200 }, (_, i) => {
      const baseLevel = audioLevel * 0.8;
      const variation = Math.sin((Date.now() / 100) + i * 0.1) * 0.2;
      return Math.max(0, Math.min(1, baseLevel + variation));
    });

    drawWaveform(peaks, 0, 0, true);
  }, [drawWaveform]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    drawWaveform,
    generateWaveformFromAudio,
    generateLiveWaveform,
  };
};