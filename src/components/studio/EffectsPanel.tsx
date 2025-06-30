import React, { useState, useEffect } from 'react';
import { Sliders, Volume2, Zap, Waves, Music, RotateCcw, Power, Play, Pause, Download } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';

interface EffectParameters {
  reverb: {
    roomSize: number;
    damping: number;
    wetLevel: number;
    dryLevel: number;
  };
  delay: {
    delayTime: number;
    feedback: number;
    wetLevel: number;
    dryLevel: number;
  };
  chorus: {
    rate: number;
    depth: number;
    wetLevel: number;
    dryLevel: number;
  };
  equalizer: {
    lowGain: number;
    midGain: number;
    highGain: number;
  };
  compressor: {
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
  };
}

const EffectsPanel: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [activeEffects, setActiveEffects] = useState<string[]>([]);
  const [parameters, setParameters] = useState<EffectParameters>({
    reverb: {
      roomSize: 0.3,
      damping: 0.5,
      wetLevel: 0.3,
      dryLevel: 0.7,
    },
    delay: {
      delayTime: 0.3,
      feedback: 0.25,
      wetLevel: 0.3,
      dryLevel: 0.7,
    },
    chorus: {
      rate: 1.5,
      depth: 0.3,
      wetLevel: 0.4,
      dryLevel: 0.6,
    },
    equalizer: {
      lowGain: 0,
      midGain: 0,
      highGain: 0,
    },
    compressor: {
      threshold: -24,
      ratio: 3,
      attack: 0.003,
      release: 0.25,
    },
  });

  const [processedAudioUrl, setProcessedAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingProcessed, setIsPlayingProcessed] = useState(false);
  const [processedAudioRef] = useState(new Audio());

  const { currentSession, updateSession } = useProjectStore();

  // Clean up processed audio URL when component unmounts or session changes
  useEffect(() => {
    return () => {
      if (processedAudioUrl) {
        URL.revokeObjectURL(processedAudioUrl);
      }
    };
  }, [processedAudioUrl]);

  // Reset processed audio when session changes
  useEffect(() => {
    if (processedAudioUrl) {
      URL.revokeObjectURL(processedAudioUrl);
      setProcessedAudioUrl(null);
    }
    setIsPlayingProcessed(false);
  }, [currentSession?.id]);

  const toggleEffect = (effectName: string) => {
    setActiveEffects(prev => 
      prev.includes(effectName)
        ? prev.filter(name => name !== effectName)
        : [...prev, effectName]
    );
  };

  const updateParameter = (effectType: keyof EffectParameters, parameterName: string, value: number) => {
    setParameters(prev => ({
      ...prev,
      [effectType]: {
        ...prev[effectType],
        [parameterName]: value,
      },
    }));
  };

  const resetParameters = () => {
    setParameters({
      reverb: {
        roomSize: 0.3,
        damping: 0.5,
        wetLevel: 0.3,
        dryLevel: 0.7,
      },
      delay: {
        delayTime: 0.3,
        feedback: 0.25,
        wetLevel: 0.3,
        dryLevel: 0.7,
      },
      chorus: {
        rate: 1.5,
        depth: 0.3,
        wetLevel: 0.4,
        dryLevel: 0.6,
      },
      equalizer: {
        lowGain: 0,
        midGain: 0,
        highGain: 0,
      },
      compressor: {
        threshold: -24,
        ratio: 3,
        attack: 0.003,
        release: 0.25,
      },
    });
    setActiveEffects([]);
  };

  const processAudioWithEffects = async () => {
    if (!currentSession?.audioBlob || activeEffects.length === 0) {
      return;
    }

    setIsProcessing(true);

    try {
      // Convert blob to audio buffer
      const arrayBuffer = await currentSession.audioBlob.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Create offline audio context for processing
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      // Create source
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;

      let currentNode: AudioNode = source;

      // Apply effects in order
      activeEffects.forEach(effectType => {
        switch (effectType) {
          case 'equalizer': {
            const lowShelf = offlineContext.createBiquadFilter();
            const midPeaking = offlineContext.createBiquadFilter();
            const highShelf = offlineContext.createBiquadFilter();

            lowShelf.type = 'lowshelf';
            lowShelf.frequency.value = 320;
            lowShelf.gain.value = parameters.equalizer.lowGain;

            midPeaking.type = 'peaking';
            midPeaking.frequency.value = 1000;
            midPeaking.Q.value = 1;
            midPeaking.gain.value = parameters.equalizer.midGain;

            highShelf.type = 'highshelf';
            highShelf.frequency.value = 3200;
            highShelf.gain.value = parameters.equalizer.highGain;

            currentNode.connect(lowShelf);
            lowShelf.connect(midPeaking);
            midPeaking.connect(highShelf);
            currentNode = highShelf;
            break;
          }
          
          case 'compressor': {
            const compressor = offlineContext.createDynamicsCompressor();
            compressor.threshold.value = parameters.compressor.threshold;
            compressor.ratio.value = parameters.compressor.ratio;
            compressor.attack.value = parameters.compressor.attack;
            compressor.release.value = parameters.compressor.release;

            currentNode.connect(compressor);
            currentNode = compressor;
            break;
          }
          
          case 'reverb': {
            const convolver = offlineContext.createConvolver();
            const wetGain = offlineContext.createGain();
            const dryGain = offlineContext.createGain();
            const outputGain = offlineContext.createGain();

            // Create simple impulse response
            const length = offlineContext.sampleRate * parameters.reverb.roomSize * 4;
            const impulse = offlineContext.createBuffer(2, length, offlineContext.sampleRate);
            
            for (let channel = 0; channel < 2; channel++) {
              const channelData = impulse.getChannelData(channel);
              for (let i = 0; i < length; i++) {
                const decay = Math.pow(1 - i / length, parameters.reverb.damping * 10);
                channelData[i] = (Math.random() * 2 - 1) * decay;
              }
            }
            
            convolver.buffer = impulse;
            wetGain.gain.value = parameters.reverb.wetLevel;
            dryGain.gain.value = parameters.reverb.dryLevel;

            // Wet path
            currentNode.connect(convolver);
            convolver.connect(wetGain);
            wetGain.connect(outputGain);
            
            // Dry path
            currentNode.connect(dryGain);
            dryGain.connect(outputGain);
            
            currentNode = outputGain;
            break;
          }
          
          case 'delay': {
            const delay = offlineContext.createDelay(1.0);
            const feedback = offlineContext.createGain();
            const wetGain = offlineContext.createGain();
            const dryGain = offlineContext.createGain();
            const outputGain = offlineContext.createGain();

            delay.delayTime.value = parameters.delay.delayTime;
            feedback.gain.value = parameters.delay.feedback;
            wetGain.gain.value = parameters.delay.wetLevel;
            dryGain.gain.value = parameters.delay.dryLevel;

            // Wet path with feedback
            currentNode.connect(delay);
            delay.connect(feedback);
            feedback.connect(delay);
            delay.connect(wetGain);
            wetGain.connect(outputGain);
            
            // Dry path
            currentNode.connect(dryGain);
            dryGain.connect(outputGain);
            
            currentNode = outputGain;
            break;
          }
          
          case 'chorus': {
            const delay = offlineContext.createDelay(0.05);
            const lfo = offlineContext.createOscillator();
            const lfoGain = offlineContext.createGain();
            const wetGain = offlineContext.createGain();
            const dryGain = offlineContext.createGain();
            const outputGain = offlineContext.createGain();

            lfo.frequency.value = parameters.chorus.rate;
            lfoGain.gain.value = parameters.chorus.depth * 0.01;
            delay.delayTime.value = 0.02;
            wetGain.gain.value = parameters.chorus.wetLevel;
            dryGain.gain.value = parameters.chorus.dryLevel;

            lfo.connect(lfoGain);
            lfoGain.connect(delay.delayTime);
            lfo.start();

            // Wet path
            currentNode.connect(delay);
            delay.connect(wetGain);
            wetGain.connect(outputGain);
            
            // Dry path
            currentNode.connect(dryGain);
            dryGain.connect(outputGain);
            
            currentNode = outputGain;
            break;
          }
        }
      });

      // Connect to destination
      currentNode.connect(offlineContext.destination);

      // Start processing
      source.start();
      const processedBuffer = await offlineContext.startRendering();

      // Convert processed buffer to blob
      const processedBlob = audioBufferToWav(processedBuffer);
      
      // Create URL for processed audio
      if (processedAudioUrl) {
        URL.revokeObjectURL(processedAudioUrl);
      }
      const newProcessedUrl = URL.createObjectURL(processedBlob);
      setProcessedAudioUrl(newProcessedUrl);

      // Update processed audio element
      processedAudioRef.src = newProcessedUrl;

      await audioContext.close();
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bytesPerSample = 2;
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
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Convert audio data
    let offset = 44;
    const maxValue = 32767;
    
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        const intSample = Math.round(sample * maxValue);
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const playProcessedAudio = () => {
    if (processedAudioRef.paused) {
      processedAudioRef.play();
      setIsPlayingProcessed(true);
    } else {
      processedAudioRef.pause();
      setIsPlayingProcessed(false);
    }
  };

  const downloadProcessedAudio = () => {
    if (processedAudioUrl) {
      const a = document.createElement('a');
      a.href = processedAudioUrl;
      a.download = `processed-audio-${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const applyEffectsToSession = () => {
    if (processedAudioUrl) {
      // Convert processed audio URL back to blob and update session
      fetch(processedAudioUrl)
        .then(response => response.blob())
        .then(blob => {
          const newAudioUrl = URL.createObjectURL(blob);
          updateSession({
            audioBlob: blob,
            audioUrl: newAudioUrl,
          });
          
          // Clear processed audio since it's now the main audio
          URL.revokeObjectURL(processedAudioUrl);
          setProcessedAudioUrl(null);
          setIsPlayingProcessed(false);
        });
    }
  };

  // Set up audio event listeners
  useEffect(() => {
    const audio = processedAudioRef;
    
    const handleEnded = () => {
      setIsPlayingProcessed(false);
    };

    const handlePause = () => {
      setIsPlayingProcessed(false);
    };

    const handlePlay = () => {
      setIsPlayingProcessed(true);
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, []);

  const effectsConfig = [
    {
      name: 'equalizer',
      label: 'Equalizer',
      icon: Sliders,
      color: 'neon-blue',
      description: 'Adjust frequency response',
    },
    {
      name: 'compressor',
      label: 'Compressor',
      icon: Volume2,
      color: 'neon-purple',
      description: 'Dynamic range control',
    },
    {
      name: 'reverb',
      label: 'Reverb',
      icon: Waves,
      color: 'neon-green',
      description: 'Add spatial depth',
    },
    {
      name: 'delay',
      label: 'Delay',
      icon: Zap,
      color: 'neon-yellow',
      description: 'Echo and repeat effects',
    },
    {
      name: 'chorus',
      label: 'Chorus',
      icon: Music,
      color: 'neon-pink',
      description: 'Thicken and widen sound',
    },
  ];

  return (
    <div className="bg-dark-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Sliders className="h-6 w-6 text-neon-blue" />
          <h2 className="font-righteous text-xl text-neon-blue">Audio Effects</h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={resetParameters}
            className="text-gray-400 hover:text-white transition-colors duration-200"
            title="Reset all parameters"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Audio Status */}
      <div className="mb-6 p-4 bg-dark-700/50 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium">Audio Status</span>
          <span className={`text-sm ${currentSession?.audioBlob ? 'text-green-400' : 'text-gray-400'}`}>
            {currentSession?.audioBlob ? 'Audio Ready' : 'No Audio'}
          </span>
        </div>
        <p className="text-gray-400 text-sm">
          {currentSession?.audioBlob 
            ? 'Select effects below and click "Process Audio" to apply them to your recording.'
            : 'Record audio first to apply effects.'
          }
        </p>
      </div>

      {/* Effects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {effectsConfig.map((effect) => {
          const IconComponent = effect.icon;
          const isActive = activeEffects.includes(effect.name);
          
          return (
            <button
              key={effect.name}
              onClick={() => toggleEffect(effect.name)}
              disabled={!currentSession?.audioBlob}
              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                isActive
                  ? `border-${effect.color} bg-${effect.color}/10`
                  : 'border-gray-600 bg-dark-700/50 hover:border-gray-500'
              } ${!currentSession?.audioBlob ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <IconComponent className={`h-5 w-5 ${isActive ? `text-${effect.color}` : 'text-gray-400'}`} />
                <span className={`font-semibold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                  {effect.label}
                </span>
              </div>
              <p className="text-sm text-gray-400">{effect.description}</p>
            </button>
          );
        })}
      </div>

      {/* Parameter Controls */}
      {activeEffects.length > 0 && (
        <div className="space-y-6 mb-6">
          <h3 className="font-semibold text-white">Effect Parameters</h3>
          
          {/* Equalizer Controls */}
          {activeEffects.includes('equalizer') && (
            <div className="bg-dark-700/50 rounded-xl p-4">
              <h4 className="font-semibold text-neon-blue mb-4">Equalizer</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Low ({parameters.equalizer.lowGain.toFixed(1)} dB)</label>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.5"
                    value={parameters.equalizer.lowGain}
                    onChange={(e) => updateParameter('equalizer', 'lowGain', parseFloat(e.target.value))}
                    className="w-full accent-neon-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Mid ({parameters.equalizer.midGain.toFixed(1)} dB)</label>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.5"
                    value={parameters.equalizer.midGain}
                    onChange={(e) => updateParameter('equalizer', 'midGain', parseFloat(e.target.value))}
                    className="w-full accent-neon-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">High ({parameters.equalizer.highGain.toFixed(1)} dB)</label>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.5"
                    value={parameters.equalizer.highGain}
                    onChange={(e) => updateParameter('equalizer', 'highGain', parseFloat(e.target.value))}
                    className="w-full accent-neon-blue"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Reverb Controls */}
          {activeEffects.includes('reverb') && (
            <div className="bg-dark-700/50 rounded-xl p-4">
              <h4 className="font-semibold text-neon-green mb-4">Reverb</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Room Size ({(parameters.reverb.roomSize * 100).toFixed(0)}%)</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={parameters.reverb.roomSize}
                    onChange={(e) => updateParameter('reverb', 'roomSize', parseFloat(e.target.value))}
                    className="w-full accent-neon-green"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Damping ({(parameters.reverb.damping * 100).toFixed(0)}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={parameters.reverb.damping}
                    onChange={(e) => updateParameter('reverb', 'damping', parseFloat(e.target.value))}
                    className="w-full accent-neon-green"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Wet Level ({(parameters.reverb.wetLevel * 100).toFixed(0)}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={parameters.reverb.wetLevel}
                    onChange={(e) => updateParameter('reverb', 'wetLevel', parseFloat(e.target.value))}
                    className="w-full accent-neon-green"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Dry Level ({(parameters.reverb.dryLevel * 100).toFixed(0)}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={parameters.reverb.dryLevel}
                    onChange={(e) => updateParameter('reverb', 'dryLevel', parseFloat(e.target.value))}
                    className="w-full accent-neon-green"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Delay Controls */}
          {activeEffects.includes('delay') && (
            <div className="bg-dark-700/50 rounded-xl p-4">
              <h4 className="font-semibold text-neon-yellow mb-4">Delay</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Delay Time ({(parameters.delay.delayTime * 1000).toFixed(0)}ms)</label>
                  <input
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.05"
                    value={parameters.delay.delayTime}
                    onChange={(e) => updateParameter('delay', 'delayTime', parseFloat(e.target.value))}
                    className="w-full accent-neon-yellow"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Feedback ({(parameters.delay.feedback * 100).toFixed(0)}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.05"
                    value={parameters.delay.feedback}
                    onChange={(e) => updateParameter('delay', 'feedback', parseFloat(e.target.value))}
                    className="w-full accent-neon-yellow"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Wet Level ({(parameters.delay.wetLevel * 100).toFixed(0)}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={parameters.delay.wetLevel}
                    onChange={(e) => updateParameter('delay', 'wetLevel', parseFloat(e.target.value))}
                    className="w-full accent-neon-yellow"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Dry Level ({(parameters.delay.dryLevel * 100).toFixed(0)}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={parameters.delay.dryLevel}
                    onChange={(e) => updateParameter('delay', 'dryLevel', parseFloat(e.target.value))}
                    className="w-full accent-neon-yellow"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Chorus Controls */}
          {activeEffects.includes('chorus') && (
            <div className="bg-dark-700/50 rounded-xl p-4">
              <h4 className="font-semibold text-neon-pink mb-4">Chorus</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Rate ({parameters.chorus.rate.toFixed(1)} Hz)</label>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={parameters.chorus.rate}
                    onChange={(e) => updateParameter('chorus', 'rate', parseFloat(e.target.value))}
                    className="w-full accent-neon-pink"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Depth ({(parameters.chorus.depth * 100).toFixed(0)}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={parameters.chorus.depth}
                    onChange={(e) => updateParameter('chorus', 'depth', parseFloat(e.target.value))}
                    className="w-full accent-neon-pink"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Wet Level ({(parameters.chorus.wetLevel * 100).toFixed(0)}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={parameters.chorus.wetLevel}
                    onChange={(e) => updateParameter('chorus', 'wetLevel', parseFloat(e.target.value))}
                    className="w-full accent-neon-pink"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Dry Level ({(parameters.chorus.dryLevel * 100).toFixed(0)}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={parameters.chorus.dryLevel}
                    onChange={(e) => updateParameter('chorus', 'dryLevel', parseFloat(e.target.value))}
                    className="w-full accent-neon-pink"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Compressor Controls */}
          {activeEffects.includes('compressor') && (
            <div className="bg-dark-700/50 rounded-xl p-4">
              <h4 className="font-semibold text-neon-purple mb-4">Compressor</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Threshold ({parameters.compressor.threshold.toFixed(1)} dB)</label>
                  <input
                    type="range"
                    min="-60"
                    max="0"
                    step="1"
                    value={parameters.compressor.threshold}
                    onChange={(e) => updateParameter('compressor', 'threshold', parseFloat(e.target.value))}
                    className="w-full accent-neon-purple"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Ratio ({parameters.compressor.ratio.toFixed(1)}:1)</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={parameters.compressor.ratio}
                    onChange={(e) => updateParameter('compressor', 'ratio', parseFloat(e.target.value))}
                    className="w-full accent-neon-purple"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Attack ({(parameters.compressor.attack * 1000).toFixed(1)}ms)</label>
                  <input
                    type="range"
                    min="0.001"
                    max="0.1"
                    step="0.001"
                    value={parameters.compressor.attack}
                    onChange={(e) => updateParameter('compressor', 'attack', parseFloat(e.target.value))}
                    className="w-full accent-neon-purple"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Release ({(parameters.compressor.release * 1000).toFixed(0)}ms)</label>
                  <input
                    type="range"
                    min="0.01"
                    max="1"
                    step="0.01"
                    value={parameters.compressor.release}
                    onChange={(e) => updateParameter('compressor', 'release', parseFloat(e.target.value))}
                    className="w-full accent-neon-purple"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Process Audio Button */}
      {activeEffects.length > 0 && (
        <div className="mb-6">
          <button
            onClick={processAudioWithEffects}
            disabled={!currentSession?.audioBlob || isProcessing}
            className="w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white py-3 rounded-xl font-semibold hover:shadow-neon transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                <span>Process Audio with Effects</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Processed Audio Controls */}
      {processedAudioUrl && (
        <div className="bg-dark-700/50 rounded-xl p-4 mb-6">
          <h4 className="font-semibold text-neon-green mb-4">Processed Audio</h4>
          <div className="flex items-center space-x-4">
            <button
              onClick={playProcessedAudio}
              className="bg-gradient-to-r from-neon-green to-neon-blue text-white px-4 py-2 rounded-lg font-medium hover:shadow-neon-sm transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
            >
              {isPlayingProcessed ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{isPlayingProcessed ? 'Pause' : 'Play'} Preview</span>
            </button>
            
            <button
              onClick={downloadProcessedAudio}
              className="bg-dark-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-dark-500 transition-colors duration-200 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
            
            <button
              onClick={applyEffectsToSession}
              className="bg-gradient-to-r from-neon-purple to-neon-pink text-white px-4 py-2 rounded-lg font-medium hover:shadow-neon-sm transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
            >
              <Power className="h-4 w-4" />
              <span>Apply to Session</span>
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Preview the processed audio, download it, or apply it to replace your current session audio.
          </p>
        </div>
      )}

      {/* Status */}
      <div className="text-center">
        {!currentSession?.audioBlob && (
          <p className="text-gray-400 text-sm">Record audio first to apply effects</p>
        )}
        {currentSession?.audioBlob && activeEffects.length === 0 && (
          <p className="text-blue-400 text-sm">Select effects above to process your audio</p>
        )}
        {currentSession?.audioBlob && activeEffects.length > 0 && !processedAudioUrl && (
          <p className="text-green-400 text-sm">
            {activeEffects.length} effect{activeEffects.length > 1 ? 's' : ''} selected • Click "Process Audio" to apply
          </p>
        )}
        {processedAudioUrl && (
          <p className="text-neon-green text-sm">
            Effects applied successfully! Preview, download, or apply to your session.
          </p>
        )}
      </div>
    </div>
  );
};

export default EffectsPanel;