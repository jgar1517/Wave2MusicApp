import React, { useRef, useEffect, useState } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, AlertCircle, Settings, Shield, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useWaveform } from '../../hooks/useWaveform';
import { useProjectStore } from '../../stores/projectStore';

interface AudioRecorderProps {
  onRecordingComplete?: (audioBlob: Blob) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [recordingSettings, setRecordingSettings] = useState({
    sampleRate: 44100,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  });

  const {
    isRecording,
    isPaused,
    recordingTime,
    audioLevel,
    error,
    permissionStatus,
    isCheckingPermissions,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    requestPermissions,
    checkPermissions,
  } = useAudioRecorder();

  const { generateLiveWaveform } = useWaveform(canvasRef);
  const { createSession, currentProject } = useProjectStore();

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  // Update live waveform during recording
  useEffect(() => {
    if (isRecording && !isPaused) {
      generateLiveWaveform(audioLevel, true);
    }
  }, [audioLevel, isRecording, isPaused, generateLiveWaveform]);

  // Format recording time with milliseconds for precision
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const millisecs = Math.floor((secs % 1) * 100);
    const wholeSecs = Math.floor(secs);
    return `${mins.toString().padStart(2, '0')}:${wholeSecs.toString().padStart(2, '0')}.${millisecs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    if (!currentProject) {
      alert('Please create a project first');
      return;
    }
    await startRecording();
  };

  const handleStopRecording = async () => {
    const audioBlob = await stopRecording();
    if (audioBlob && currentProject) {
      await createSession(currentProject.id, audioBlob);
      onRecordingComplete?.(audioBlob);
    }
  };

  const handlePauseResume = () => {
    if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  const handleRequestPermissions = async () => {
    await requestPermissions();
  };

  // Get audio level color based on level
  const getAudioLevelColor = (level: number) => {
    if (level < 0.3) return 'from-neon-green to-neon-blue';
    if (level < 0.7) return 'from-neon-yellow to-neon-green';
    return 'from-neon-pink to-red-500';
  };

  // Get recording status color
  const getStatusColor = () => {
    if (error) return 'text-red-400';
    if (isRecording && !isPaused) return 'text-red-400';
    if (isRecording && isPaused) return 'text-yellow-400';
    if (recordingTime > 0) return 'text-green-400';
    return 'text-gray-400';
  };

  const getPermissionStatusIcon = () => {
    if (isCheckingPermissions) {
      return <Clock className="h-4 w-4 text-yellow-400 animate-pulse" />;
    }
    
    switch (permissionStatus) {
      case 'granted': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'denied': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'prompt': return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      default: return <Shield className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPermissionStatusText = () => {
    if (isCheckingPermissions) {
      return 'Checking permissions...';
    }
    
    switch (permissionStatus) {
      case 'granted': return 'Microphone ready';
      case 'denied': return 'Access denied';
      case 'prompt': return 'Permission needed';
      default: return 'Unknown status';
    }
  };

  const canRecord = permissionStatus === 'granted' && !error && !isCheckingPermissions;

  return (
    <div className="bg-dark-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Mic className="h-6 w-6 text-neon-blue" />
          <h2 className="font-righteous text-xl text-neon-blue">Audio Recorder</h2>
        </div>
        <div className="flex items-center space-x-4">
          {/* Permission Status */}
          <div className="flex items-center space-x-2">
            {getPermissionStatusIcon()}
            <span className="text-xs text-gray-400">
              {getPermissionStatusText()}
            </span>
          </div>
          
          {/* Recording Time */}
          <div className="text-2xl font-mono text-white bg-dark-700/50 px-4 py-2 rounded-lg border border-gray-600">
            {formatTime(recordingTime)}
          </div>
          
          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-400 hover:text-white transition-colors duration-200"
            title="Recording settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Permission Error/Request */}
      {(permissionStatus !== 'granted' || error) && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-red-300 mb-2">Microphone Access Required</h3>
              <p className="text-red-300 text-sm mb-3">
                {error || 'Wave2Music needs access to your microphone to record audio. Please grant permission to continue.'}
              </p>
              
              {/* Troubleshooting Steps */}
              <div className="bg-red-900/30 rounded-lg p-3 mb-3">
                <h4 className="font-medium text-red-200 mb-2">Troubleshooting Steps:</h4>
                <ol className="text-xs text-red-200 space-y-1 list-decimal list-inside">
                  <li>Click "Request Access" below</li>
                  <li>Look for a microphone icon in your browser's address bar</li>
                  <li>Click the microphone icon and select "Allow"</li>
                  <li>Make sure no other apps are using your microphone</li>
                  <li>Try refreshing the page if needed</li>
                  <li>Ensure you're using Chrome, Firefox, Safari, or Edge</li>
                </ol>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRequestPermissions}
                  disabled={isCheckingPermissions}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-500 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingPermissions ? (
                    <Clock className="h-4 w-4 animate-pulse" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span>
                    {isCheckingPermissions ? 'Checking...' : 'Request Microphone Access'}
                  </span>
                </button>
                
                <button
                  onClick={checkPermissions}
                  disabled={isCheckingPermissions}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Check Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recording Settings */}
      {showSettings && (
        <div className="mb-6 bg-dark-700/50 rounded-xl p-4 border border-gray-600">
          <h3 className="font-semibold text-white mb-4">Recording Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Sample Rate</label>
              <select
                value={recordingSettings.sampleRate}
                onChange={(e) => setRecordingSettings(prev => ({ ...prev, sampleRate: parseInt(e.target.value) }))}
                className="w-full bg-dark-600 border border-gray-500 rounded px-3 py-2 text-white focus:outline-none focus:border-neon-blue"
                disabled={isRecording}
              >
                <option value={22050}>22.05 kHz</option>
                <option value={44100}>44.1 kHz (CD Quality)</option>
                <option value={48000}>48 kHz (Professional)</option>
                <option value={96000}>96 kHz (High-Res)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={recordingSettings.echoCancellation}
                  onChange={(e) => setRecordingSettings(prev => ({ ...prev, echoCancellation: e.target.checked }))}
                  className="accent-neon-blue"
                  disabled={isRecording}
                />
                <span className="text-sm text-gray-300">Echo Cancellation</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={recordingSettings.noiseSuppression}
                  onChange={(e) => setRecordingSettings(prev => ({ ...prev, noiseSuppression: e.target.checked }))}
                  className="accent-neon-blue"
                  disabled={isRecording}
                />
                <span className="text-sm text-gray-300">Noise Suppression</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={recordingSettings.autoGainControl}
                  onChange={(e) => setRecordingSettings(prev => ({ ...prev, autoGainControl: e.target.checked }))}
                  className="accent-neon-blue"
                  disabled={isRecording}
                />
                <span className="text-sm text-gray-300">Auto Gain Control</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Waveform Visualization */}
      <div className="mb-6">
        <canvas
          ref={canvasRef}
          width={800}
          height={120}
          className="w-full h-24 bg-dark-900/50 rounded-lg border border-gray-600"
        />
      </div>

      {/* Audio Level Indicator */}
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <Mic className={`h-5 w-5 ${isRecording ? 'text-red-400' : 'text-gray-400'}`} />
          <div className="flex-1 bg-dark-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getAudioLevelColor(audioLevel)} transition-all duration-100`}
              style={{ width: `${audioLevel * 100}%` }}
            />
          </div>
          <span className="text-sm text-gray-400 w-12 font-mono">
            {Math.round(audioLevel * 100)}%
          </span>
        </div>
        
        {/* Peak Warning */}
        {audioLevel > 0.9 && isRecording && (
          <div className="mt-2 text-xs text-red-400 flex items-center space-x-1">
            <AlertCircle className="h-3 w-3" />
            <span>Audio level too high - reduce input gain</span>
          </div>
        )}
      </div>

      {/* Recording Controls */}
      <div className="flex items-center justify-center space-x-4 mb-4">
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            disabled={!canRecord}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
            title={canRecord ? 'Start recording' : 'Microphone access required'}
          >
            <Mic className="h-6 w-6" />
          </button>
        ) : (
          <>
            <button
              onClick={handlePauseResume}
              className="bg-gradient-to-r from-neon-blue to-neon-purple text-white p-3 rounded-full hover:shadow-neon-sm transition-all duration-300 transform hover:scale-105"
              title={isPaused ? 'Resume recording' : 'Pause recording'}
            >
              {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </button>
            
            <button
              onClick={handleStopRecording}
              className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-3 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              title="Stop recording"
            >
              <Square className="h-5 w-5" />
            </button>
          </>
        )}

        <button
          onClick={resetRecording}
          className="bg-gradient-to-r from-gray-700 to-gray-800 text-white p-3 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          disabled={!isRecording && recordingTime === 0}
          title="Reset recording"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>

      {/* Recording Status */}
      <div className="text-center">
        {isRecording && (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className={`font-medium ${getStatusColor()}`}>
              {isPaused ? 'Recording Paused' : 'Recording...'}
            </span>
          </div>
        )}
        {!isRecording && recordingTime > 0 && (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-green-400 font-medium">Recording Complete</span>
          </div>
        )}
        {!isRecording && recordingTime === 0 && canRecord && (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full" />
            <span className="text-gray-400">Ready to Record</span>
          </div>
        )}
        {!canRecord && (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-red-400">Microphone Access Required</span>
          </div>
        )}
      </div>

      {/* Recording Tips */}
      {canRecord && !isRecording && recordingTime === 0 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            💡 Tip: Keep audio levels between 30-70% for best quality
          </p>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;