import React, { useState, useEffect } from 'react';
import { Wand2, Play, Pause, Download, Star, X, Clock, CheckCircle, AlertCircle, Loader2, Wifi, WifiOff, Server, Settings, ExternalLink, Trash2 } from 'lucide-react';
import { useAIStore, TRANSFORMATION_STYLES, TransformationStyle } from '../../stores/aiStore';
import { useProjectStore } from '../../stores/projectStore';

const AITransformationPanel: React.FC = () => {
  const [selectedStyle, setSelectedStyle] = useState<TransformationStyle>('orchestral');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [duration, setDuration] = useState(15);
  const [temperature, setTemperature] = useState(1.0);
  const [customPrompt, setCustomPrompt] = useState('');
  const [playingTransformation, setPlayingTransformation] = useState<string | null>(null);
  const [apiConnectionStatus, setApiConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [showSetupHelp, setShowSetupHelp] = useState(false);
  const [audioElements, setAudioElements] = useState<{[key: string]: HTMLAudioElement}>({});

  const {
    transformations,
    currentTransformation,
    isProcessing,
    error,
    createTransformation,
    cancelTransformation,
    loadTransformations,
    rateTransformation,
    stopPolling,
    testAPIConnection,
    clearAllTransformations
  } = useAIStore();

  const { currentProject, currentSession } = useProjectStore();

  useEffect(() => {
    if (currentProject) {
      loadTransformations(currentProject.id);
    }
    
    return () => {
      stopPolling();
    };
  }, [currentProject, loadTransformations, stopPolling]);

  // Test API connection on mount
  useEffect(() => {
    const testConnection = async () => {
      const isConnected = await testAPIConnection();
      setApiConnectionStatus(isConnected ? 'connected' : 'disconnected');
    };
    
    testConnection();
  }, [testAPIConnection]);

  // Clean up audio elements when component unmounts
  useEffect(() => {
    return () => {
      Object.values(audioElements).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, [audioElements]);

  const handleTransform = async () => {
    if (!currentProject || !currentSession?.audioBlob) {
      alert('Please record some audio first');
      return;
    }

    // Check API connection first
    if (apiConnectionStatus === 'disconnected') {
      setShowSetupHelp(true);
      return;
    }

    // Get audio duration from the session
    const audioDuration = currentSession.duration;

    // Check if we have a valid duration
    if (!audioDuration || audioDuration <= 0) {
      alert('Audio duration could not be determined. Please try recording again.');
      return;
    }

    // Check duration limits (more lenient for very short audio)
    if (audioDuration > 10.1) {
      alert(`The input audio must be 10 seconds or shorter for AI transformation. Current duration: ${formatDuration(audioDuration)}. Please record a shorter segment.`);
      return;
    }

    if (audioDuration < 0.5) {
      alert('Audio duration is too short. Please record at least 0.5 seconds of audio.');
      return;
    }

    const options = {
      duration,
      temperature,
      prompt: customPrompt || undefined,
      continuation: false // Explicitly set to false to avoid the error
    };

    await createTransformation(
      currentProject.id,
      currentSession.audioBlob,
      selectedStyle,
      options
    );
  };

  const handleCancel = async (transformationId: string) => {
    await cancelTransformation(transformationId);
  };

  const handleRate = async (transformationId: string, rating: number) => {
    await rateTransformation(transformationId, rating);
  };

  const handlePlayTransformation = (transformationId: string, audioUrl: string) => {
    // Stop any currently playing audio
    if (playingTransformation) {
      if (audioElements[playingTransformation]) {
        audioElements[playingTransformation].pause();
      }
    }

    if (playingTransformation === transformationId) {
      setPlayingTransformation(null);
    } else {
      // Create or get audio element
      let audio = audioElements[transformationId];
      if (!audio) {
        audio = new Audio(audioUrl);
        audio.onended = () => setPlayingTransformation(null);
        setAudioElements(prev => ({...prev, [transformationId]: audio}));
      }
      
      // Play the audio
      audio.currentTime = 0;
      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        alert('Failed to play audio. Please try again.');
      });
      setPlayingTransformation(transformationId);
    }
  };

  const handleDownload = (audioUrl: string, transformationType: string) => {
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${transformationType}-transformation-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleClearAllTransformations = () => {
    if (confirm('Are you sure you want to clear all transformations? This will remove all pending and completed transformations from the list.')) {
      clearAllTransformations();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'processing': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'cancelled': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get audio duration from session
  const audioDuration = currentSession?.duration || null;

  // Determine audio status with more lenient validation
  const isAudioTooLong = audioDuration !== null && audioDuration > 10.1;
  const isAudioTooShort = audioDuration !== null && audioDuration < 0.5;
  const hasValidAudio = currentSession?.audioBlob && audioDuration !== null && audioDuration >= 0.5 && audioDuration <= 10.1;

  // Get audio status message
  const getAudioStatusMessage = () => {
    if (!currentSession?.audioBlob) {
      return 'Record audio first';
    }
    
    if (audioDuration !== null) {
      return `Audio ready: ${formatDuration(audioDuration)}`;
    }
    
    return 'Audio analysis pending';
  };

  // Check if there are any active transformations (pending or processing)
  const hasActiveTransformations = transformations.some(t => 
    t.status === 'pending' || t.status === 'processing'
  );

  return (
    <div className="bg-dark-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Wand2 className="h-6 w-6 text-neon-purple" />
          <h2 className="font-righteous text-xl text-neon-purple">AI Transformation</h2>
        </div>
        <div className="flex items-center space-x-4">
          {/* API Connection Status */}
          <div className="flex items-center space-x-2">
            {apiConnectionStatus === 'connected' ? (
              <Server className="h-4 w-4 text-green-400" />
            ) : apiConnectionStatus === 'disconnected' ? (
              <WifiOff className="h-4 w-4 text-red-400" />
            ) : (
              <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />
            )}
            <span className="text-xs text-gray-400">
              {apiConnectionStatus === 'connected' ? 'AI Ready' : 
               apiConnectionStatus === 'disconnected' ? 'Setup Required' : 'Checking...'}
            </span>
          </div>
          
          <div className="text-sm text-gray-400">
            {getAudioStatusMessage()}
          </div>
        </div>
      </div>

      {/* Setup Help Modal */}
      {showSetupHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-dark-800 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-righteous text-xl text-neon-purple">AI Setup Required</h3>
              <button
                onClick={() => setShowSetupHelp(false)}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <span className="text-red-300 font-medium">Replicate API Key Not Configured</span>
                </div>
                <p className="text-red-300 text-sm">
                  The AI transformation service requires a Replicate API key to be configured in your Supabase project.
                </p>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h4 className="font-medium text-blue-300 mb-3">Setup Instructions:</h4>
                <ol className="text-blue-300 text-sm space-y-2 list-decimal list-inside">
                  <li>
                    <strong>Get a Replicate API Key:</strong>
                    <br />
                    <a 
                      href="https://replicate.com/account/api-tokens" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-neon-blue hover:text-neon-purple transition-colors duration-200 inline-flex items-center space-x-1 mt-1"
                    >
                      <span>Visit Replicate API Tokens</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <br />
                    <span className="text-xs text-blue-400">Create an account if needed, then generate a new API token</span>
                  </li>
                  
                  <li>
                    <strong>Add to Supabase:</strong>
                    <br />
                    <span className="text-xs text-blue-400">
                      Go to your Supabase project → Settings → Edge Functions → Environment Variables
                      <br />
                      Add: <code className="bg-dark-700 px-1 rounded">REPLICATE_API_TOKEN</code> = your API key
                    </span>
                  </li>
                  
                  <li>
                    <strong>Deploy Edge Functions:</strong>
                    <br />
                    <span className="text-xs text-blue-400">
                      The AI transformation functions need to be deployed to your Supabase project
                    </span>
                  </li>
                </ol>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <h4 className="font-medium text-yellow-300 mb-2">Alternative: Local Development</h4>
                <p className="text-yellow-300 text-sm">
                  For testing, you can add your Replicate API key to the local <code className="bg-dark-700 px-1 rounded">.env</code> file:
                  <br />
                  <code className="bg-dark-700 px-2 py-1 rounded mt-1 block">VITE_REPLICATE_API_TOKEN=r8_your_api_key_here</code>
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={() => setShowSetupHelp(false)}
                  className="flex-1 bg-gradient-to-r from-neon-purple to-neon-pink text-white py-3 rounded-lg font-semibold hover:shadow-neon transition-all duration-300"
                >
                  Got It
                </button>
                <button
                  onClick={async () => {
                    const isConnected = await testAPIConnection();
                    setApiConnectionStatus(isConnected ? 'connected' : 'disconnected');
                    if (isConnected) {
                      setShowSetupHelp(false);
                    }
                  }}
                  className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Wifi className="h-4 w-4" />
                  <span>Test Again</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status Info */}
      {apiConnectionStatus === 'connected' && (
        <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <div className="text-green-300 text-sm">
            <p className="font-medium">AI Service Connected</p>
            <p>Ready for voice-to-instrument transformations!</p>
          </div>
        </div>
      )}

      {apiConnectionStatus === 'disconnected' && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="text-red-300 text-sm flex-1">
            <p className="font-medium">AI Service Setup Required</p>
            <p>Replicate API key needs to be configured in Supabase.</p>
          </div>
          <button
            onClick={() => setShowSetupHelp(true)}
            className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-500 transition-colors duration-200 flex items-center space-x-1"
          >
            <Settings className="h-3 w-3" />
            <span>Setup</span>
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="text-red-300 text-sm">
            <p className="font-medium">AI Transformation Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Audio Duration Warnings */}
      {isAudioTooLong && (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
          <div className="text-yellow-300 text-sm">
            <p className="font-medium">Audio too long for AI transformation</p>
            <p>Current duration: {formatDuration(audioDuration!)} • Maximum: 10 seconds</p>
            <p>Please record a shorter segment.</p>
          </div>
        </div>
      )}

      {isAudioTooShort && (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
          <div className="text-yellow-300 text-sm">
            <p className="font-medium">Audio too short for AI transformation</p>
            <p>Current duration: {formatDuration(audioDuration!)} • Minimum: 0.5 seconds</p>
            <p>Please record a longer segment.</p>
          </div>
        </div>
      )}

      {/* Style Selection */}
      <div className="mb-6">
        <h3 className="font-semibold text-white mb-4">Choose Transformation Style</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(TRANSFORMATION_STYLES).map(([key, style]) => (
            <button
              key={key}
              onClick={() => setSelectedStyle(key as TransformationStyle)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                selectedStyle === key
                  ? `border-${style.color} bg-${style.color}/10`
                  : 'border-gray-600 bg-dark-700/50 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">{style.icon}</span>
                <span className={`font-semibold ${
                  selectedStyle === key ? 'text-white' : 'text-gray-300'
                }`}>
                  {style.name}
                </span>
              </div>
              <p className="text-sm text-gray-400">{style.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Options */}
      <div className="mb-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-neon-blue hover:text-neon-purple transition-colors duration-200 text-sm font-medium"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </button>
        
        {showAdvanced && (
          <div className="mt-4 bg-dark-700/50 rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Duration: {formatDuration(duration)}
              </label>
              <input
                type="range"
                min="8"
                max="30"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full accent-neon-purple"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>8s</span>
                <span>30s</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Creativity: {temperature.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-neon-purple"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Conservative</span>
                <span>Creative</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Custom Prompt (Optional)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe the musical style you want..."
                className="w-full bg-dark-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-neon-purple resize-none"
                rows={2}
              />
            </div>
          </div>
        )}
      </div>

      {/* Transform Button */}
      <div className="mb-6">
        <button
          onClick={handleTransform}
          disabled={!hasValidAudio || isProcessing || apiConnectionStatus !== 'connected'}
          className="w-full bg-gradient-to-r from-neon-purple to-neon-pink text-white py-3 rounded-xl font-semibold hover:shadow-neon transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Transforming...</span>
            </>
          ) : (
            <>
              <Wand2 className="h-5 w-5" />
              <span>Transform Audio</span>
            </>
          )}
        </button>
        
        {/* Button Status Messages */}
        {!currentSession?.audioBlob && (
          <p className="text-gray-400 text-xs mt-2 text-center">
            Record audio first to enable transformation
          </p>
        )}
        {(isAudioTooLong || isAudioTooShort) && (
          <p className="text-yellow-400 text-xs mt-2 text-center">
            Audio must be between 0.5-10 seconds for transformation
          </p>
        )}
        {hasValidAudio && !isProcessing && apiConnectionStatus === 'connected' && (
          <p className="text-green-400 text-xs mt-2 text-center">
            Ready for transformation • Duration: {formatDuration(audioDuration!)}
          </p>
        )}
        {apiConnectionStatus !== 'connected' && (
          <p className="text-red-400 text-xs mt-2 text-center">
            AI service setup required
          </p>
        )}
      </div>

      {/* Current Transformation Status */}
      {currentTransformation && (
        <div className="mb-6 bg-dark-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-white">Current Transformation</h4>
            {(currentTransformation.status === 'processing' || currentTransformation.status === 'pending') && (
              <button
                onClick={() => handleCancel(currentTransformation.id)}
                className="text-red-400 hover:text-red-300 transition-colors duration-200 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-3 mb-2">
            {getStatusIcon(currentTransformation.status)}
            <span className={`font-medium ${getStatusColor(currentTransformation.status)}`}>
              {currentTransformation.status.charAt(0).toUpperCase() + currentTransformation.status.slice(1)}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-400 capitalize">
              {currentTransformation.transformation_type}
            </span>
          </div>
          
          {(currentTransformation.status === 'processing' || currentTransformation.status === 'pending') && (
            <div className="w-full bg-dark-600 rounded-full h-2 mb-2">
              <div className="bg-gradient-to-r from-neon-blue to-neon-purple h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          )}
          
          {currentTransformation.error_message && (
            <p className="text-red-400 text-sm">{currentTransformation.error_message}</p>
          )}
        </div>
      )}

      {/* Transformations History Header with Clear Button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">Recent Transformations</h3>
        {transformations.length > 0 && (
          <button
            onClick={handleClearAllTransformations}
            className="text-gray-400 hover:text-red-400 transition-colors duration-200 flex items-center space-x-1 text-sm"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear All</span>
          </button>
        )}
      </div>
      
      {/* Transformations History */}
      <div>
        {transformations.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No transformations yet</p>
            <p className="text-sm">Transform your audio to see results here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {transformations.map((transformation) => (
              <div
                key={transformation.id}
                className="bg-dark-700/50 rounded-lg p-4 border border-gray-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(transformation.status)}
                    <span className="font-medium text-white capitalize">
                      {transformation.transformation_type}
                    </span>
                    <span className={`text-sm ${getStatusColor(transformation.status)}`}>
                      {transformation.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {transformation.status === 'processing' || transformation.status === 'pending' ? (
                      <button
                        onClick={() => handleCancel(transformation.id)}
                        className="text-red-400 hover:text-red-300 transition-colors duration-200"
                        title="Cancel transformation"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : transformation.status === 'completed' && transformation.output_audio_path ? (
                      <>
                        <button
                          onClick={() => handlePlayTransformation(transformation.id, transformation.output_audio_path!)}
                          className="text-neon-blue hover:text-neon-purple transition-colors duration-200"
                          title={playingTransformation === transformation.id ? "Pause" : "Play"}
                        >
                          {playingTransformation === transformation.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDownload(transformation.output_audio_path!, transformation.transformation_type)}
                          className="text-neon-green hover:text-neon-yellow transition-colors duration-200"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 mb-2">
                  {new Date(transformation.created_at).toLocaleString()}
                  {transformation.processing_time_seconds && (
                    <span> • Processed in {transformation.processing_time_seconds}s</span>
                  )}
                </div>
                
                {transformation.status === 'completed' && (
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-400">Rate:</span>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleRate(transformation.id, rating)}
                        className={`transition-colors duration-200 ${
                          transformation.user_rating && rating <= transformation.user_rating
                            ? 'text-yellow-400'
                            : 'text-gray-600 hover:text-yellow-400'
                        }`}
                      >
                        <Star className="h-3 w-3 fill-current" />
                      </button>
                    ))}
                  </div>
                )}
                
                {transformation.error_message && (
                  <p className="text-red-400 text-xs mt-2">{transformation.error_message}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AITransformationPanel;