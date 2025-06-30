import React, { useState, useRef } from 'react';
import { Music, Headphones, Settings, Layers, Wand2, Download, Crown, Wifi, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AudioRecorder from './AudioRecorder';
import EnhancedAudioPlayer from './EnhancedAudioPlayer';
import EffectsPanel from './EffectsPanel';
import ProjectManager from './ProjectManager';
import AITransformationPanel from './AITransformationPanel';
import ExportPanel from './ExportPanel';
import SubscriptionManager from '../subscription/SubscriptionManager';
import APIConnectionTest from './APIConnectionTest';
import TrackManager from './TrackManager';
import MultiTrackPlayer from './MultiTrackPlayer';
import { useProjectStore } from '../../stores/projectStore';
import { useTrackStore } from '../../stores/trackStore';

const Studio: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject } = useProjectStore();
  const { tracks } = useTrackStore();
  const [activeTab, setActiveTab] = useState<'record' | 'tracks' | 'effects' | 'ai' | 'export' | 'subscription' | 'api-test'>('record');
  
  const tabs = [
    { id: 'record', label: 'Record', icon: Music },
    { id: 'tracks', label: 'Tracks', icon: Layers, badge: tracks.length > 0 ? tracks.length : undefined },
    { id: 'effects', label: 'Effects', icon: Headphones },
    { id: 'ai', label: 'AI Transform', icon: Wand2 },
    { id: 'export', label: 'Export', icon: Download },
    { id: 'subscription', label: 'Subscription', icon: Crown },
    { id: 'api-test', label: 'API Test', icon: Wifi },
  ];

  const handleRecordNewTrack = () => {
    setActiveTab('record');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {/* Logo - Increased size */}
              <div className="w-24 h-24 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl flex items-center justify-center p-3">
                <img 
                  src="/music app logo.png" 
                  alt="Wave2Music Logo" 
                  className="h-full w-full object-contain filter brightness-0 invert"
                />
              </div>
              <div>
                <h1 className="font-righteous text-3xl text-white">Studio</h1>
                <p className="text-gray-400">
                  {currentProject ? `Working on: ${currentProject.title}` : 'Select or create a project to get started'}
                </p>
              </div>
            </div>
            
            {/* Back to Dashboard Button */}
            <button
              onClick={handleBackToDashboard}
              className="bg-dark-800/50 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-2 text-gray-300 hover:text-neon-blue hover:border-neon-blue transition-all duration-200 flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center space-x-1 bg-dark-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-1 overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap relative ${
                    activeTab === tab.id
                      ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                      : 'text-gray-400 hover:text-white hover:bg-dark-700/50'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="font-medium">{tab.label}</span>
                  {tab.badge && (
                    <span className="bg-neon-green text-dark-900 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Studio Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Project Management & Info */}
          <div className="lg:col-span-1 space-y-6">
            <ProjectManager onRecordNewTrack={handleRecordNewTrack} />
            
            {/* Project Info */}
            {currentProject && (
              <div className="bg-dark-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                <h3 className="font-righteous text-lg text-neon-yellow mb-4">Project Info</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-white capitalize">{currentProject.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">BPM:</span>
                    <span className="text-white">{currentProject.metronome_bpm}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sample Rate:</span>
                    <span className="text-white">{currentProject.sample_rate} Hz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tracks:</span>
                    <span className="text-white">{tracks.length}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white text-sm">
                      {new Date(currentProject.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            {currentProject && (
              <div className="bg-dark-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                <h3 className="font-righteous text-lg text-neon-green mb-4">Session Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Tracks:</span>
                    <span className="text-white">{tracks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active Tracks:</span>
                    <span className="text-white">
                      {tracks.filter(t => !t.is_muted && (!tracks.some(tr => tr.is_solo) || t.is_solo)).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Duration:</span>
                    <span className="text-white">
                      {tracks.length > 0 
                        ? `${Math.floor(Math.max(...tracks.map(t => t.duration_seconds)) / 60)}:${Math.floor(Math.max(...tracks.map(t => t.duration_seconds)) % 60).toString().padStart(2, '0')}`
                        : '--:--'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Audio Tools */}
          <div className="lg:col-span-2 space-y-6">
            {/* API Test Tab */}
            {activeTab === 'api-test' && (
              <APIConnectionTest />
            )}

            {/* Record Tab */}
            {activeTab === 'record' && (
              <>
                <AudioRecorder />
                <EnhancedAudioPlayer />
              </>
            )}

            {/* Tracks Tab */}
            {activeTab === 'tracks' && (
              <>
                <TrackManager onRecordNewTrack={handleRecordNewTrack} />
                {tracks.length > 0 && <MultiTrackPlayer />}
              </>
            )}

            {/* Effects Tab */}
            {activeTab === 'effects' && (
              <>
                <EffectsPanel />
                <EnhancedAudioPlayer />
              </>
            )}

            {/* AI Transform Tab */}
            {activeTab === 'ai' && (
              <>
                <AITransformationPanel />
                <EnhancedAudioPlayer />
              </>
            )}

            {/* Export Tab */}
            {activeTab === 'export' && (
              <>
                <ExportPanel />
                <EnhancedAudioPlayer />
              </>
            )}

            {/* Subscription Tab */}
            {activeTab === 'subscription' && (
              <SubscriptionManager />
            )}

            {/* Show message when no project is selected */}
            {!currentProject && activeTab !== 'subscription' && activeTab !== 'api-test' && (
              <div className="bg-dark-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-12 text-center">
                {/* Logo - Increased size for no project state */}
                <div className="w-32 h-32 bg-neon-blue/20 rounded-full flex items-center justify-center mx-auto mb-4 p-6">
                  <img 
                    src="/music app logo.png" 
                    alt="Wave2Music Logo" 
                    className="h-full w-full object-contain opacity-50"
                  />
                </div>
                <h3 className="font-righteous text-xl text-gray-400 mb-2">No Project Selected</h3>
                <p className="text-gray-500">
                  Create a new project or select an existing one to start recording and creating music.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Studio;