import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { useWaveform } from '../../hooks/useWaveform';
import { useProjectStore } from '../../stores/projectStore';

const AudioPlayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  
  const { drawWaveform, generateWaveformFromAudio } = useWaveform(canvasRef);
  const { currentSession, updateSession, playAudio, pauseAudio, seekAudio } = useProjectStore();

  // Update waveform when session changes
  useEffect(() => {
    if (currentSession?.audioBlob && currentSession.waveformData) {
      drawWaveform(
        currentSession.waveformData.peaks,
        currentTime,
        currentSession.duration,
        false
      );
    }
  }, [currentSession, currentTime, drawWaveform]);

  // Generate waveform data when audio blob changes
  useEffect(() => {
    if (currentSession?.audioBlob && !currentSession.waveformData) {
      currentSession.audioBlob.arrayBuffer().then(async (buffer) => {
        const waveformData = await generateWaveformFromAudio(buffer);
        updateSession({ waveformData });
      });
    }
  }, [currentSession?.audioBlob, generateWaveformFromAudio, updateSession]);

  // Set up audio element
  useEffect(() => {
    if (audioRef.current && currentSession?.audioUrl) {
      audioRef.current.src = currentSession.audioUrl;
      audioRef.current.volume = volume;
    }
  }, [currentSession?.audioUrl, volume]);

  // Handle audio time updates and events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      updateSession({ currentTime: audio.currentTime });
    };

    const handleEnded = () => {
      // When audio playback ends, ensure the play button is shown
      setCurrentTime(0);
      audio.currentTime = 0;
      
      // Update both local state and store state to show play button
      updateSession({ 
        currentTime: 0, 
        isPlaying: false 
      });
      
      // Also call pauseAudio to ensure consistent state
      pauseAudio();
    };

    const handleLoadedMetadata = () => {
      // Update duration when metadata is loaded
      updateSession({ duration: audio.duration });
    };

    const handlePause = () => {
      // Ensure state is synced when audio is paused
      updateSession({ isPlaying: false });
    };

    const handlePlay = () => {
      // Ensure state is synced when audio starts playing
      updateSession({ isPlaying: true });
    };

    // Add all event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      // Clean up all event listeners
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, [updateSession, pauseAudio]);

  // Sync playback state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSession) return;

    if (currentSession.isPlaying && audio.paused) {
      audio.play().catch(console.error);
    } else if (!currentSession.isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [currentSession?.isPlaying]);

  const handlePlayPause = () => {
    if (currentSession?.isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!currentSession?.duration || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    const newTime = progress * currentSession.duration;

    setCurrentTime(newTime);
    seekAudio(newTime);

    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSkipBack = () => {
    const newTime = Math.max(0, currentTime - 10);
    setCurrentTime(newTime);
    seekAudio(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSkipForward = () => {
    const maxTime = currentSession?.duration || 0;
    const newTime = Math.min(maxTime, currentTime + 10);
    setCurrentTime(newTime);
    seekAudio(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentSession) {
    return (
      <div className="bg-dark-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
        <div className="text-center text-gray-400">
          <p>No audio to play</p>
          <p className="text-sm mt-2">Record some audio to see the player</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-righteous text-xl text-neon-purple">Audio Player</h2>
        <div className="text-sm text-gray-400">
          {formatTime(currentTime)} / {formatTime(currentSession.duration)}
        </div>
      </div>

      {/* Waveform */}
      <div className="mb-6">
        <canvas
          ref={canvasRef}
          width={800}
          height={120}
          className="w-full h-24 bg-dark-900/50 rounded-lg border border-gray-600 cursor-pointer"
          onClick={handleSeek}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSkipBack}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <SkipBack className="h-5 w-5" />
          </button>
          
          <button
            onClick={handlePlayPause}
            className="bg-gradient-to-r from-neon-purple to-neon-pink text-white p-3 rounded-full hover:shadow-neon-sm transition-all duration-300 transform hover:scale-105"
          >
            {currentSession.isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </button>
          
          <button
            onClick={handleSkipForward}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-3">
          <Volume2 className="h-5 w-5 text-gray-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 accent-neon-purple"
          />
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />
    </div>
  );
};

export default AudioPlayer;