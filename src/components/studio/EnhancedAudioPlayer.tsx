import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle, Download } from 'lucide-react';
import { useWaveform } from '../../hooks/useWaveform';
import { useProjectStore } from '../../stores/projectStore';

const EnhancedAudioPlayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showTimeRemaining, setShowTimeRemaining] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [actualDuration, setActualDuration] = useState(0);
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  
  const { drawWaveform, generateWaveformFromAudio } = useWaveform(canvasRef);
  const { currentSession, updateSession, playAudio, pauseAudio, seekAudio } = useProjectStore();

  // Update waveform when session changes
  useEffect(() => {
    if (currentSession?.audioBlob && currentSession.waveformData) {
      drawWaveform(
        currentSession.waveformData.peaks,
        currentTime,
        actualDuration || currentSession.duration,
        false
      );
    }
  }, [currentSession, currentTime, actualDuration, drawWaveform]);

  // Generate waveform data when audio blob changes
  useEffect(() => {
    if (currentSession?.audioBlob && !currentSession.waveformData) {
      currentSession.audioBlob.arrayBuffer().then(async (buffer) => {
        const waveformData = await generateWaveformFromAudio(buffer);
        updateSession({ waveformData });
      });
    }
  }, [currentSession?.audioBlob, generateWaveformFromAudio, updateSession]);

  // Enhanced audio loading with better duration detection
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSession?.audioUrl) {
      setLoadingState('idle');
      setIsAudioReady(false);
      setActualDuration(0);
      return;
    }

    // Reset states
    setLoadingState('loading');
    setIsAudioReady(false);
    setActualDuration(0);
    setCurrentTime(0);

    // Pause any current playback
    if (!audio.paused) {
      audio.pause();
    }

    const handleLoadStart = () => {
      console.log('Audio load started');
      setLoadingState('loading');
    };

    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded, duration:', audio.duration);
      
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setActualDuration(audio.duration);
        updateSession({ duration: audio.duration });
        console.log('Duration set to:', audio.duration);
      } else {
        console.warn('Invalid duration detected:', audio.duration);
      }
    };

    const handleLoadedData = () => {
      console.log('Audio data loaded');
    };

    const handleCanPlay = () => {
      console.log('Audio can play');
    };

    const handleCanPlayThrough = () => {
      console.log('Audio can play through, duration:', audio.duration);
      setIsAudioReady(true);
      setLoadingState('ready');
      
      // Set audio properties
      audio.volume = volume;
      audio.loop = isLooping;
      audio.playbackRate = playbackRate;

      // Final duration check
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setActualDuration(audio.duration);
        updateSession({ duration: audio.duration });
      }
    };

    const handleError = (e: Event) => {
      console.error('Audio loading error:', e);
      setLoadingState('error');
      setIsAudioReady(false);
    };

    const handleDurationChange = () => {
      console.log('Duration changed:', audio.duration);
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setActualDuration(audio.duration);
        updateSession({ duration: audio.duration });
      }
    };

    // Add all event listeners
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('error', handleError);
    audio.addEventListener('durationchange', handleDurationChange);

    // Set source and load
    audio.src = currentSession.audioUrl;
    audio.load();

    // Cleanup function
    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('durationchange', handleDurationChange);
    };
  }, [currentSession?.audioUrl, updateSession]);

  // Update audio properties when they change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isAudioReady) return;

    audio.volume = volume;
    audio.loop = isLooping;
    audio.playbackRate = playbackRate;
  }, [volume, isLooping, playbackRate, isAudioReady]);

  // Handle audio time updates and events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const newTime = audio.currentTime;
      setCurrentTime(newTime);
      updateSession({ currentTime: newTime });
    };

    const handleEnded = () => {
      if (!isLooping) {
        setCurrentTime(0);
        audio.currentTime = 0;
        updateSession({ 
          currentTime: 0, 
          isPlaying: false 
        });
        pauseAudio();
      }
    };

    const handlePause = () => {
      updateSession({ isPlaying: false });
    };

    const handlePlay = () => {
      updateSession({ isPlaying: true });
    };

    // Add all event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      // Clean up all event listeners
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, [updateSession, pauseAudio, isLooping]);

  // Sync playback state with proper audio ready check
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSession || !isAudioReady) return;

    if (currentSession.isPlaying && audio.paused) {
      audio.play().catch((error) => {
        console.error('Error playing audio:', error);
        // Reset playing state if play fails
        updateSession({ isPlaying: false });
      });
    } else if (!currentSession.isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [currentSession?.isPlaying, isAudioReady, updateSession]);

  const handlePlayPause = () => {
    if (!isAudioReady) return;
    
    if (currentSession?.isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const duration = actualDuration || currentSession?.duration;
    if (!duration || !canvasRef.current || !isAudioReady) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    const newTime = progress * duration;

    setCurrentTime(newTime);
    seekAudio(newTime);

    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSkipBack = () => {
    if (!isAudioReady) return;
    
    const newTime = Math.max(0, currentTime - 10);
    setCurrentTime(newTime);
    seekAudio(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSkipForward = () => {
    if (!isAudioReady) return;
    
    const duration = actualDuration || currentSession?.duration || 0;
    const newTime = Math.min(duration, currentTime + 10);
    setCurrentTime(newTime);
    seekAudio(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleDownload = () => {
    if (currentSession?.audioBlob) {
      const url = URL.createObjectURL(currentSession.audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Improved time formatting with proper seconds display
  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds) || seconds < 0) return '00:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRemainingTime = () => {
    const duration = actualDuration || currentSession?.duration || 0;
    const remaining = Math.max(0, duration - currentTime);
    return formatTime(remaining);
  };

  const getProgress = () => {
    const duration = actualDuration || currentSession?.duration;
    if (!duration || duration <= 0) return 0;
    return Math.min((currentTime / duration) * 100, 100);
  };

  // Use the most reliable duration source
  const displayDuration = actualDuration || currentSession?.duration || 0;

  // Loading state indicator
  const getLoadingStateText = () => {
    switch (loadingState) {
      case 'loading': return 'Loading audio...';
      case 'ready': return 'Audio ready';
      case 'error': return 'Audio error';
      default: return 'No audio';
    }
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-righteous text-xl text-neon-purple">Audio Player</h2>
        <div className="flex items-center space-x-4">
          {/* Audio Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              loadingState === 'ready' ? 'bg-neon-green' : 
              loadingState === 'loading' ? 'bg-yellow-500 animate-pulse' :
              loadingState === 'error' ? 'bg-red-500' : 'bg-gray-500'
            }`} />
            <span className="text-xs text-gray-400">{getLoadingStateText()}</span>
          </div>
          
          {/* Time Display */}
          <button
            onClick={() => setShowTimeRemaining(!showTimeRemaining)}
            className="text-sm text-gray-400 hover:text-white transition-colors duration-200 font-mono"
          >
            {showTimeRemaining 
              ? `-${getRemainingTime()}` 
              : formatTime(currentTime)
            } / {formatTime(displayDuration)}
          </button>
          
          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="text-gray-400 hover:text-neon-green transition-colors duration-200"
            title="Download audio"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="bg-dark-700 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-neon-purple to-neon-pink transition-all duration-100"
            style={{ width: `${getProgress()}%` }}
          />
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

      {/* Main Controls */}
      <div className="flex items-center justify-center space-x-6 mb-6">
        <button
          onClick={handleSkipBack}
          disabled={!isAudioReady}
          className="text-gray-400 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Skip back 10s"
        >
          <SkipBack className="h-6 w-6" />
        </button>
        
        <button
          onClick={handlePlayPause}
          disabled={!isAudioReady}
          className="bg-gradient-to-r from-neon-purple to-neon-pink text-white p-4 rounded-full hover:shadow-neon-sm transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {currentSession.isPlaying ? (
            <Pause className="h-8 w-8" />
          ) : (
            <Play className="h-8 w-8" />
          )}
        </button>
        
        <button
          onClick={handleSkipForward}
          disabled={!isAudioReady}
          className="text-gray-400 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Skip forward 10s"
        >
          <SkipForward className="h-6 w-6" />
        </button>
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center justify-between">
        {/* Left Controls */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`transition-colors duration-200 ${
              isLooping ? 'text-neon-blue' : 'text-gray-400 hover:text-white'
            }`}
            title={isLooping ? 'Disable loop' : 'Enable loop'}
          >
            <Repeat className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Speed:</span>
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="bg-dark-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-neon-purple"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </div>
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
            className="w-24 accent-neon-purple"
          />
          <span className="text-sm text-gray-400 w-8">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 text-xs text-gray-500 bg-dark-700/30 rounded p-2">
          <div>Loading State: {loadingState}</div>
          <div>Audio Ready: {isAudioReady ? 'Yes' : 'No'}</div>
          <div>Actual Duration: {actualDuration.toFixed(2)}s</div>
          <div>Session Duration: {currentSession.duration.toFixed(2)}s</div>
          <div>Current Time: {currentTime.toFixed(2)}s</div>
        </div>
      )}

      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />
    </div>
  );
};

export default EnhancedAudioPlayer;