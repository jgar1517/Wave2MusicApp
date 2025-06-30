import React, { useState, useEffect } from 'react';
import { Plus, Music, Trash2, Edit3, Volume2, VolumeX, Play, Pause, MoreVertical, Save, X, Mic } from 'lucide-react';
import { useTrackStore } from '../../stores/trackStore';
import { useProjectStore } from '../../stores/projectStore';

interface TrackManagerProps {
  onRecordNewTrack?: () => void;
}

const TrackManager: React.FC<TrackManagerProps> = ({ onRecordNewTrack }) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [trackName, setTrackName] = useState('');
  const [trackDescription, setTrackDescription] = useState('');
  const [editingTrack, setEditingTrack] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const {
    tracks,
    currentTrack,
    trackSessions,
    loading,
    error,
    createTrack,
    updateTrack,
    deleteTrack,
    loadTracks,
    setCurrentTrack,
    playTrack,
    pauseTrack,
    setTrackVolume,
    muteTrack,
    soloTrack,
  } = useTrackStore();

  const { currentProject, currentSession } = useProjectStore();

  useEffect(() => {
    if (currentProject) {
      loadTracks(currentProject.id);
    }
  }, [currentProject, loadTracks]);

  const handleSaveCurrentSession = async () => {
    if (!currentProject || !currentSession?.audioBlob) {
      alert('No audio session to save');
      return;
    }

    if (!trackName.trim()) {
      alert('Please enter a track name');
      return;
    }

    const track = await createTrack(
      currentProject.id,
      trackName.trim(),
      currentSession.audioBlob,
      trackDescription.trim() || undefined
    );

    if (track) {
      setTrackName('');
      setTrackDescription('');
      setShowSaveModal(false);
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (confirm('Are you sure you want to delete this track?')) {
      await deleteTrack(trackId);
    }
  };

  const handleEditTrack = (track: any) => {
    setEditingTrack(track.id);
    setEditName(track.name);
    setEditDescription(track.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editingTrack || !editName.trim()) return;

    await updateTrack(editingTrack, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
    });

    setEditingTrack(null);
    setEditName('');
    setEditDescription('');
  };

  const handleCancelEdit = () => {
    setEditingTrack(null);
    setEditName('');
    setEditDescription('');
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTrackSession = (trackId: string) => {
    return trackSessions.get(trackId);
  };

  const isTrackPlaying = (trackId: string) => {
    const session = getTrackSession(trackId);
    return session?.isPlaying || false;
  };

  const handlePlayPause = (trackId: string) => {
    if (isTrackPlaying(trackId)) {
      pauseTrack(trackId);
    } else {
      playTrack(trackId);
    }
  };

  const getVolumePercentage = (volume: number) => {
    return Math.round(volume * 100);
  };

  return (
    <div className="bg-dark-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Music className="h-6 w-6 text-neon-green" />
          <h2 className="font-righteous text-xl text-neon-green">Tracks</h2>
          <span className="text-sm text-gray-400">
            ({tracks.length}/10)
          </span>
        </div>
        <div className="flex items-center space-x-3">
          {currentSession?.audioBlob && (
            <button
              onClick={() => setShowSaveModal(true)}
              className="bg-gradient-to-r from-neon-green to-neon-blue text-white px-4 py-2 rounded-lg font-medium hover:shadow-neon-sm transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save Current</span>
            </button>
          )}
          <button
            onClick={onRecordNewTrack}
            disabled={tracks.length >= 10}
            className="bg-gradient-to-r from-neon-blue to-neon-purple text-white px-4 py-2 rounded-lg font-medium hover:shadow-neon-sm transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Mic className="h-4 w-4" />
            <span>Record New</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Current Session Info */}
      {currentSession?.audioBlob && (
        <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-300">Current Recording Session</h3>
              <p className="text-sm text-blue-400">
                Duration: {formatTime(currentSession.duration)} • Ready to save as track
              </p>
            </div>
            <button
              onClick={() => setShowSaveModal(true)}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-500 transition-colors duration-200"
            >
              Save as Track
            </button>
          </div>
        </div>
      )}

      {/* Tracks List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center text-gray-400 py-8">
            <div className="animate-spin w-6 h-6 border-2 border-neon-green border-t-transparent rounded-full mx-auto mb-2" />
            Loading tracks...
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No tracks yet</p>
            <p className="text-sm">Record and save your first track to get started</p>
          </div>
        ) : (
          tracks.map((track) => (
            <div
              key={track.id}
              className={`p-4 rounded-lg border transition-all duration-200 ${
                currentTrack?.id === track.id
                  ? 'border-neon-green bg-neon-green/10'
                  : 'border-gray-600 hover:border-gray-500 bg-dark-700/50'
              }`}
            >
              {editingTrack === track.id ? (
                /* Edit Mode */
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-dark-600 border border-gray-500 rounded px-3 py-2 text-white focus:outline-none focus:border-neon-green"
                    placeholder="Track name"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-dark-600 border border-gray-500 rounded px-3 py-2 text-white focus:outline-none focus:border-neon-green resize-none"
                    placeholder="Description (optional)"
                    rows={2}
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSaveEdit}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-500 transition-colors duration-200"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-500 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Display Mode */
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{track.name}</h3>
                      {track.description && (
                        <p className="text-sm text-gray-400 truncate">{track.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {/* Play/Pause Button */}
                      <button
                        onClick={() => handlePlayPause(track.id)}
                        className="text-neon-green hover:text-neon-blue transition-colors duration-200"
                        title={isTrackPlaying(track.id) ? 'Pause' : 'Play'}
                      >
                        {isTrackPlaying(track.id) ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>

                      {/* Mute Button */}
                      <button
                        onClick={() => muteTrack(track.id, !track.is_muted)}
                        className={`transition-colors duration-200 ${
                          track.is_muted ? 'text-red-400' : 'text-gray-400 hover:text-white'
                        }`}
                        title={track.is_muted ? 'Unmute' : 'Mute'}
                      >
                        {track.is_muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </button>

                      {/* Solo Button */}
                      <button
                        onClick={() => soloTrack(track.id, !track.is_solo)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors duration-200 ${
                          track.is_solo
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        title={track.is_solo ? 'Unsolo' : 'Solo'}
                      >
                        S
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditTrack(track)}
                        className="text-gray-400 hover:text-neon-blue transition-colors duration-200"
                        title="Edit track"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteTrack(track.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors duration-200"
                        title="Delete track"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Track Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    {/* Volume Control */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Volume: {getVolumePercentage(track.volume)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={track.volume}
                        onChange={(e) => setTrackVolume(track.id, parseFloat(e.target.value))}
                        className="w-full accent-neon-green"
                      />
                    </div>

                    {/* Pan Control */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Pan: {track.pan > 0 ? 'R' : track.pan < 0 ? 'L' : 'C'}{Math.abs(Math.round(track.pan * 100))}
                      </label>
                      <input
                        type="range"
                        min="-1"
                        max="1"
                        step="0.01"
                        value={track.pan}
                        onChange={(e) => setTrackPan(track.id, parseFloat(e.target.value))}
                        className="w-full accent-neon-blue"
                      />
                    </div>

                    {/* Track Info */}
                    <div className="text-xs text-gray-400 space-y-1">
                      <div>Duration: {formatTime(track.duration_seconds)}</div>
                      <div>Order: #{track.track_order}</div>
                    </div>
                  </div>

                  {/* Track Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Created: {formatDate(track.created_at)}</span>
                    <div className="flex items-center space-x-2">
                      {track.is_muted && <span className="text-red-400">MUTED</span>}
                      {track.is_solo && <span className="text-yellow-400">SOLO</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Track Limit Warning */}
      {tracks.length >= 8 && (
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-300 text-sm">
            {tracks.length >= 10 
              ? 'Maximum track limit reached (10/10). Delete a track to record new ones.'
              : `Approaching track limit (${tracks.length}/10). You can add ${10 - tracks.length} more tracks.`
            }
          </p>
        </div>
      )}

      {/* Save Track Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-dark-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-righteous text-xl text-neon-green">Save Track</h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Track Name *
                </label>
                <input
                  type="text"
                  value={trackName}
                  onChange={(e) => setTrackName(e.target.value)}
                  className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-neon-green transition-colors duration-200"
                  placeholder="Enter track name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={trackDescription}
                  onChange={(e) => setTrackDescription(e.target.value)}
                  className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-neon-green transition-colors duration-200 resize-none"
                  placeholder="Describe this track"
                  rows={3}
                />
              </div>

              {currentSession && (
                <div className="bg-dark-700/50 rounded-lg p-3">
                  <p className="text-sm text-gray-400">
                    Duration: {formatTime(currentSession.duration)}
                  </p>
                </div>
              )}
              
              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={handleSaveCurrentSession}
                  disabled={!trackName.trim()}
                  className="flex-1 bg-gradient-to-r from-neon-green to-neon-blue text-white py-3 rounded-lg font-semibold hover:shadow-neon-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Track
                </button>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackManager;