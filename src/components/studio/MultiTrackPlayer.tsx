import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, RotateCcw } from 'lucide-react';
import { useTrackStore } from '../../stores/trackStore';
import { useWaveform } from '../../hooks/useWaveform';

const MultiTrackPlayer: React.FC = () => {
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [masterVolume, setMasterVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  const { tracks, trackSessions, playTrack, pauseTrack, seekTrack, updateTrackSession } = useTrackStore();
  const { drawWaveform, generateWaveformFromAudio } = useWaveform(null);

  // Calculate master duration (longest track)
  useEffect(() => {
    const maxDuration = Math.max(0, ...tracks.map(t => t.duration_seconds));
    setDuration(maxDuration);
  }, [tracks]);

  // Set up audio elements for each track
  useEffect(() => {
    tracks.forEach(track => {
      const session = trackSessions.get(track.id);
      if (session?.audioUrl) {
        let audio = audioRefs.current.get(track.id);
        if (!audio) {
          audio = new Audio();
          audioRefs.current.set(track.id, audio);
        }
        
        if (audio.src !== session.audioUrl) {
          audio.src = session.audioUrl;
          audio.load();
        }
        
        // Apply track settings
        audio.volume = track.volume * masterVolume * (track.is_muted ? 0 : 1);
        audio.muted = track.is_muted || (tracks.some(t => t.is_solo) && !track.is_solo);
      }
    });

    // Clean up removed tracks
    const currentTrackIds = new Set(tracks.map(t => t.id));
    for (const [trackId, audio] of audioRefs.current.entries()) {
      if (!currentTrackIds.has(trackId)) {
        audio.pause();
        audioRefs.current.delete(trackId);
      }
    }
  }, [tracks, trackSessions, masterVolume]);

  // Generate waveforms for tracks
  useEffect(() => {
    tracks.forEach(async (track) => {
      const session = trackSessions.get(track.id);
      if (session?.audioBlob && !session.waveformData) {
        try {
          const arrayBuffer = await session.audioBlob.arrayBuffer();
          const waveformData = await generateWaveformFromAudio(arrayBuffer);
          updateTrackSession(track.id, { waveformData });
        } catch (error) {
          console.error('Error generating waveform for track:', track.id, error);
        }
      }
    });
  }, [tracks, trackSessions, generateWaveformFromAudio, updateTrackSession]);

  // Draw waveforms
  useEffect(() => {
    tracks.forEach(track => {
      const canvas = canvasRefs.current.get(track.id);
      const session = trackSessions.get(track.id);
      
      if (canvas && session?.waveformData) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawWaveform(
            session.waveformData.peaks,
            currentTime,
            track.duration_seconds,
            false,
            canvas
          );
        }
      }
    });
  }, [tracks, trackSessions, currentTime, drawWaveform]);

  // Sync playback across all tracks
  useEffect(() => {
    const audioElements = Array.from(audioRefs.current.values());
    
    if (isPlaying) {
      audioElements.forEach(audio => {
        if (audio.paused) {
          audio.currentTime = currentTime;
          audio.play().catch(console.error);
        }
      });
    } else {
      audioElements.forEach(audio => {
        if (!audio.paused) {
          audio.pause();
        }
      });
    }
  }, [isPlaying, currentTime]);

  // Handle time updates
  useEffect(() => {
    let animationFrame: number;
    
    const updateTime = () => {
      if (isPlaying) {
        const audioElements = Array.from(audioRefs.current.values());
        const playingAudio = audioElements.find(audio => !audio.paused);
        
        if (playingAudio) {
          setCurrentTime(playingAudio.currentTime);
          
          // Check if we've reached the end
          if (playingAudio.currentTime >= duration) {
            setIsPlaying(false);
            setCurrentTime(0);
            audioElements.forEach(audio => {
              audio.currentTime = 0;
              audio.pause();
            });
          }
        }
        
        animationFrame = requestAnimationFrame(updateTime);
      }
    };
    
    if (isPlaying) {
      animationFrame = requestAnimationFrame(updateTime);
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlaying, duration]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    audioRefs.current.forEach(audio => {
      audio.currentTime = newTime;
    });
  };

  const handleSkipBack = () => {
    const newTime = Math.max(0, currentTime - 10);
    handleSeek(newTime);
  };

  const handleSkipForward = () => {
    const newTime = Math.min(duration, currentTime + 10);
    handleSeek(newTime);
  };

  const handleReset = () => {
    setIsPlaying(false);
    handleSeek(0);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!duration || duration <= 0) return 0;
    return Math.min((currentTime / duration) * 100, 100);
  };

  if (tracks.length === 0) {
    return (
      <div className="bg-dark-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
        <div className="text-center text-gray-400">
          <p>No tracks to play</p>
          <p className="text-sm mt-2">Record and save tracks to see the multi-track player</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-righteous text-xl text-neon-purple">Multi-Track Player</h2>
        <div className="text-sm text-gray-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Master Progress Bar */}
      <div className="mb-6">
        <div className="bg-dark-700 rounded-full h-3 overflow-hidden cursor-pointer"
             onClick={(e) => {
               const rect = e.currentTarget.getBoundingClientRect();
               const x = e.clientX - rect.left;
               const progress = x / rect.width;
               const newTime = progress * duration;
               handleSeek(newTime);
             }}>
          <div 
            className="h-full bg-gradient-to-r from-neon-purple to-neon-pink transition-all duration-100"
            style={{ width: `${getProgress()}%` }}
          />
        </div>
      </div>

      {/* Track Waveforms */}
      <div className="mb-6 space-y-3 max-h-64 overflow-y-auto">
        {tracks.map((track) => {
          const session = trackSessions.get(track.id);
          return (
            <div key={track.id} className="bg-dark-700/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white truncate">{track.name}</span>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  {track.is_muted && <span className="text-red-400">MUTED</span>}
                  {track.is_solo && <span className="text-yellow-400">SOLO</span>}
                  <span>{formatTime(track.duration_seconds)}</span>
                </div>
              </div>
              <canvas
                ref={(canvas) => {
                  if (canvas) {
                    canvasRefs.current.set(track.id, canvas);
                  }
                }}
                width={600}
                height={60}
                className="w-full h-12 bg-dark-900/50 rounded border border-gray-600"
              />
            </div>
          );
        })}
      </div>

      {/* Master Controls */}
      <div className="flex items-center justify-center space-x-6 mb-6">
        <button
          onClick={handleReset}
          className="text-gray-400 hover:text-white transition-colors duration-200"
          title="Reset to beginning"
        >
          <RotateCcw className="h-6 w-6" />
        </button>
        
        <button
          onClick={handleSkipBack}
          className="text-gray-400 hover:text-white transition-colors duration-200"
          title="Skip back 10s"
        >
          <SkipBack className="h-6 w-6" />
        </button>
        
        <button
          onClick={handlePlayPause}
          className="bg-gradient-to-r from-neon-purple to-neon-pink text-white p-4 rounded-full hover:shadow-neon-sm transition-all duration-300 transform hover:scale-105"
        >
          {isPlaying ? (
            <Pause className="h-8 w-8" />
          ) : (
            <Play className="h-8 w-8" />
          )}
        </button>
        
        <button
          onClick={handleSkipForward}
          className="text-gray-400 hover:text-white transition-colors duration-200"
          title="Skip forward 10s"
        >
          <SkipForward className="h-6 w-6" />
        </button>
      </div>

      {/* Master Volume */}
      <div className="flex items-center justify-center space-x-4">
        <Volume2 className="h-5 w-5 text-gray-400" />
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-400">Master</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            className="w-32 accent-neon-purple"
          />
          <span className="text-sm text-gray-400 w-8">
            {Math.round(masterVolume * 100)}%
          </span>
        </div>
      </div>

      {/* Track Count Info */}
      <div className="mt-4 text-center text-sm text-gray-400">
        Playing {tracks.filter(t => !t.is_muted && (!tracks.some(tr => tr.is_solo) || t.is_solo)).length} of {tracks.length} tracks
      </div>
    </div>
  );
};

export default MultiTrackPlayer;