import React, { useState } from 'react';
import { Download, Settings, Music, FileAudio, Trash2, CheckCircle, AlertCircle, Clock, X } from 'lucide-react';
import { useAudioExporter, ExportSettings } from '../../hooks/useAudioExporter';
import { useProjectStore } from '../../stores/projectStore';
import { useAuthStore } from '../../stores/authStore';

const ExportPanel: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'mp3',
    quality: 'high',
    sampleRate: 44100,
    bitDepth: 16,
    normalize: true,
    fadeIn: 0,
    fadeOut: 0,
    metadata: {},
  });

  const { currentSession } = useProjectStore();
  const { profile } = useAuthStore();
  const {
    jobs,
    isExporting,
    error,
    exportAudio,
    downloadExport,
    removeJob,
    clearCompletedJobs,
    getQualitySettings,
  } = useAudioExporter();

  const handleExport = async () => {
    if (!currentSession?.audioBlob) {
      alert('No audio to export. Please record some audio first.');
      return;
    }

    // Check subscription limits
    if (profile?.subscription_tier === 'free') {
      const todayExports = jobs.filter(job => {
        const today = new Date();
        const jobDate = job.createdAt;
        return jobDate.toDateString() === today.toDateString();
      }).length;

      if (todayExports >= 10) {
        alert('Free tier export limit reached (10 per day). Upgrade to Pro for unlimited exports.');
        return;
      }

      // Free tier restrictions
      if (exportSettings.format !== 'mp3') {
        alert('Free tier only supports MP3 export. Upgrade to Pro for WAV, FLAC, and OGG formats.');
        return;
      }

      if (exportSettings.quality === 'lossless') {
        alert('Free tier does not support lossless quality. Upgrade to Pro for lossless exports.');
        return;
      }
    }

    try {
      await exportAudio(currentSession.audioBlob, exportSettings);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const updateSettings = (updates: Partial<ExportSettings>) => {
    setExportSettings(prev => ({ ...prev, ...updates }));
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'wav': return <FileAudio className="h-4 w-4" />;
      case 'mp3': return <Music className="h-4 w-4" />;
      case 'flac': return <FileAudio className="h-4 w-4" />;
      case 'ogg': return <Music className="h-4 w-4" />;
      default: return <FileAudio className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'processing': return <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-400" />;
      default: return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isProFeature = (feature: string) => {
    return profile?.subscription_tier === 'free' && (
      (feature === 'format' && exportSettings.format !== 'mp3') ||
      (feature === 'quality' && exportSettings.quality === 'lossless') ||
      (feature === 'advanced')
    );
  };

  return (
    <div className="bg-dark-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Download className="h-6 w-6 text-neon-green" />
          <h2 className="font-righteous text-xl text-neon-green">Export Audio</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-400 hover:text-white transition-colors duration-200"
            title="Export settings"
          >
            <Settings className="h-5 w-5" />
          </button>
          {jobs.length > 0 && (
            <button
              onClick={clearCompletedJobs}
              className="text-gray-400 hover:text-red-400 transition-colors duration-200"
              title="Clear completed exports"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      )}

      {/* Quick Export */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Quick Export</h3>
          <div className="text-sm text-gray-400">
            {exportSettings.format.toUpperCase()} • {exportSettings.quality}
          </div>
        </div>
        
        <button
          onClick={handleExport}
          disabled={!currentSession?.audioBlob || isExporting}
          className="w-full bg-gradient-to-r from-neon-green to-neon-blue text-white py-3 rounded-xl font-semibold hover:shadow-neon transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
        >
          <Download className="h-5 w-5" />
          <span>{isExporting ? 'Exporting...' : 'Export Audio'}</span>
        </button>

        {profile?.subscription_tier === 'free' && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            Free tier: 10 MP3 exports per day • Upgrade to Pro for unlimited exports and more formats
          </p>
        )}
      </div>

      {/* Export Settings */}
      {showSettings && (
        <div className="mb-6 bg-dark-700/50 rounded-xl p-4 border border-gray-600">
          <h3 className="font-semibold text-white mb-4">Export Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Format Selection */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">Format</label>
              <select
                value={exportSettings.format}
                onChange={(e) => updateSettings({ format: e.target.value as any })}
                disabled={profile?.subscription_tier === 'free'}
                className="w-full bg-dark-600 border border-gray-500 rounded px-3 py-2 text-white focus:outline-none focus:border-neon-green disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="mp3">MP3 (Universal)</option>
                <option value="wav">WAV (Uncompressed)</option>
                <option value="flac">FLAC (Lossless)</option>
                <option value="ogg">OGG (Open Source)</option>
              </select>
              {isProFeature('format') && (
                <p className="text-xs text-yellow-400 mt-1">Pro feature</p>
              )}
            </div>

            {/* Quality Selection */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">Quality</label>
              <select
                value={exportSettings.quality}
                onChange={(e) => updateSettings({ quality: e.target.value as any })}
                className="w-full bg-dark-600 border border-gray-500 rounded px-3 py-2 text-white focus:outline-none focus:border-neon-green"
              >
                <option value="low">Low (Smaller file)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="high">High (Best quality)</option>
                <option value="lossless" disabled={profile?.subscription_tier === 'free'}>
                  Lossless {profile?.subscription_tier === 'free' ? '(Pro)' : ''}
                </option>
              </select>
              {isProFeature('quality') && (
                <p className="text-xs text-yellow-400 mt-1">Pro feature</p>
              )}
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="normalize"
                checked={exportSettings.normalize}
                onChange={(e) => updateSettings({ normalize: e.target.checked })}
                className="accent-neon-green"
              />
              <label htmlFor="normalize" className="text-sm text-gray-300">
                Normalize audio levels
              </label>
            </div>

            {profile?.subscription_tier !== 'free' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Fade In (seconds)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={exportSettings.fadeIn}
                      onChange={(e) => updateSettings({ fadeIn: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-dark-600 border border-gray-500 rounded px-3 py-2 text-white focus:outline-none focus:border-neon-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Fade Out (seconds)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={exportSettings.fadeOut}
                      onChange={(e) => updateSettings({ fadeOut: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-dark-600 border border-gray-500 rounded px-3 py-2 text-white focus:outline-none focus:border-neon-green"
                    />
                  </div>
                </div>

                {/* Metadata */}
                <div>
                  <h4 className="font-medium text-white mb-2">Metadata (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Title"
                      value={exportSettings.metadata.title || ''}
                      onChange={(e) => updateSettings({ 
                        metadata: { ...exportSettings.metadata, title: e.target.value }
                      })}
                      className="bg-dark-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-neon-green"
                    />
                    <input
                      type="text"
                      placeholder="Artist"
                      value={exportSettings.metadata.artist || ''}
                      onChange={(e) => updateSettings({ 
                        metadata: { ...exportSettings.metadata, artist: e.target.value }
                      })}
                      className="bg-dark-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-neon-green"
                    />
                    <input
                      type="text"
                      placeholder="Album"
                      value={exportSettings.metadata.album || ''}
                      onChange={(e) => updateSettings({ 
                        metadata: { ...exportSettings.metadata, album: e.target.value }
                      })}
                      className="bg-dark-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-neon-green"
                    />
                    <input
                      type="text"
                      placeholder="Genre"
                      value={exportSettings.metadata.genre || ''}
                      onChange={(e) => updateSettings({ 
                        metadata: { ...exportSettings.metadata, genre: e.target.value }
                      })}
                      className="bg-dark-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-neon-green"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Export Queue */}
      {jobs.length > 0 && (
        <div>
          <h3 className="font-semibold text-white mb-4">Export History</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-dark-700/50 rounded-lg p-4 border border-gray-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {getFormatIcon(job.settings.format)}
                    <span className="font-medium text-white">
                      {job.settings.format.toUpperCase()} • {job.settings.quality}
                    </span>
                    {getStatusIcon(job.status)}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {job.status === 'completed' && (
                      <button
                        onClick={() => downloadExport(job)}
                        className="text-neon-green hover:text-neon-blue transition-colors duration-200"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => removeJob(job.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors duration-200"
                      title="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {job.status === 'processing' && (
                  <div className="mb-2">
                    <div className="bg-dark-600 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-neon-green to-neon-blue h-2 transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{job.progress}% complete</p>
                  </div>
                )}
                
                <div className="text-xs text-gray-400">
                  {job.createdAt.toLocaleString()}
                  {job.completedAt && job.status === 'completed' && (
                    <span> • Completed in {Math.round((job.completedAt.getTime() - job.createdAt.getTime()) / 1000)}s</span>
                  )}
                </div>
                
                {job.error && (
                  <p className="text-red-400 text-xs mt-2">{job.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div className="mt-6 text-center">
        {!currentSession?.audioBlob && (
          <p className="text-gray-400 text-sm">Record audio to enable export</p>
        )}
        {currentSession?.audioBlob && !isExporting && (
          <p className="text-green-400 text-sm">Ready to export</p>
        )}
        {isExporting && (
          <p className="text-blue-400 text-sm">Processing export...</p>
        )}
      </div>
    </div>
  );
};

export default ExportPanel;