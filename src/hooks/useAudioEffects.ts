import { useRef, useCallback, useEffect } from 'react';

export interface EffectParameters {
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

export interface AudioEffectsState {
  isEnabled: boolean;
  activeEffects: string[];
  parameters: EffectParameters;
}

export const useAudioEffects = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const effectsChainRef = useRef<AudioNode[]>([]);
  const outputNodeRef = useRef<GainNode | null>(null);

  const defaultParameters: EffectParameters = {
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
  };

  const createReverbNode = useCallback((context: AudioContext, parameters: EffectParameters['reverb']) => {
    const convolver = context.createConvolver();
    const wetGain = context.createGain();
    const dryGain = context.createGain();
    const outputGain = context.createGain();

    // Create impulse response for reverb
    const length = context.sampleRate * parameters.roomSize * 4;
    const impulse = context.createBuffer(2, length, context.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, parameters.damping * 10);
        channelData[i] = (Math.random() * 2 - 1) * decay;
      }
    }
    
    convolver.buffer = impulse;
    wetGain.gain.value = parameters.wetLevel;
    dryGain.gain.value = parameters.dryLevel;

    return { convolver, wetGain, dryGain, outputGain };
  }, []);

  const createDelayNode = useCallback((context: AudioContext, parameters: EffectParameters['delay']) => {
    const delay = context.createDelay(1.0);
    const feedback = context.createGain();
    const wetGain = context.createGain();
    const dryGain = context.createGain();
    const outputGain = context.createGain();

    delay.delayTime.value = parameters.delayTime;
    feedback.gain.value = parameters.feedback;
    wetGain.gain.value = parameters.wetLevel;
    dryGain.gain.value = parameters.dryLevel;

    // Connect delay feedback loop
    delay.connect(feedback);
    feedback.connect(delay);

    return { delay, feedback, wetGain, dryGain, outputGain };
  }, []);

  const createChorusNode = useCallback((context: AudioContext, parameters: EffectParameters['chorus']) => {
    const delay = context.createDelay(0.05);
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    const wetGain = context.createGain();
    const dryGain = context.createGain();
    const outputGain = context.createGain();

    lfo.frequency.value = parameters.rate;
    lfoGain.gain.value = parameters.depth * 0.01;
    delay.delayTime.value = 0.02;
    wetGain.gain.value = parameters.wetLevel;
    dryGain.gain.value = parameters.dryLevel;

    lfo.connect(lfoGain);
    lfoGain.connect(delay.delayTime);
    lfo.start();

    return { delay, lfo, lfoGain, wetGain, dryGain, outputGain };
  }, []);

  const createEqualizerNode = useCallback((context: AudioContext, parameters: EffectParameters['equalizer']) => {
    const lowShelf = context.createBiquadFilter();
    const midPeaking = context.createBiquadFilter();
    const highShelf = context.createBiquadFilter();

    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 320;
    lowShelf.gain.value = parameters.lowGain;

    midPeaking.type = 'peaking';
    midPeaking.frequency.value = 1000;
    midPeaking.Q.value = 1;
    midPeaking.gain.value = parameters.midGain;

    highShelf.type = 'highshelf';
    highShelf.frequency.value = 3200;
    highShelf.gain.value = parameters.highGain;

    return { lowShelf, midPeaking, highShelf };
  }, []);

  const createCompressorNode = useCallback((context: AudioContext, parameters: EffectParameters['compressor']) => {
    const compressor = context.createDynamicsCompressor();
    
    compressor.threshold.value = parameters.threshold;
    compressor.ratio.value = parameters.ratio;
    compressor.attack.value = parameters.attack;
    compressor.release.value = parameters.release;

    return compressor;
  }, []);

  const initializeAudioContext = useCallback(async (stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext();
      const context = audioContextRef.current;
      
      sourceNodeRef.current = context.createMediaStreamSource(stream);
      outputNodeRef.current = context.createGain();
      
      // Initially connect source directly to output (bypass mode)
      sourceNodeRef.current.connect(outputNodeRef.current);
      
      return true;
    } catch (error) {
      console.error('Error initializing audio context:', error);
      return false;
    }
  }, []);

  const applyEffects = useCallback((activeEffects: string[], parameters: EffectParameters) => {
    if (!audioContextRef.current || !sourceNodeRef.current || !outputNodeRef.current) {
      return;
    }

    const context = audioContextRef.current;
    
    // Disconnect existing chain
    sourceNodeRef.current.disconnect();
    effectsChainRef.current.forEach(node => {
      try {
        node.disconnect();
      } catch (e) {
        // Node might already be disconnected
      }
    });
    
    effectsChainRef.current = [];
    let currentNode: AudioNode = sourceNodeRef.current;

    // Build effects chain
    activeEffects.forEach(effectType => {
      switch (effectType) {
        case 'equalizer': {
          const { lowShelf, midPeaking, highShelf } = createEqualizerNode(context, parameters.equalizer);
          currentNode.connect(lowShelf);
          lowShelf.connect(midPeaking);
          midPeaking.connect(highShelf);
          currentNode = highShelf;
          effectsChainRef.current.push(lowShelf, midPeaking, highShelf);
          break;
        }
        
        case 'compressor': {
          const compressor = createCompressorNode(context, parameters.compressor);
          currentNode.connect(compressor);
          currentNode = compressor;
          effectsChainRef.current.push(compressor);
          break;
        }
        
        case 'reverb': {
          const { convolver, wetGain, dryGain, outputGain } = createReverbNode(context, parameters.reverb);
          
          // Wet path
          currentNode.connect(convolver);
          convolver.connect(wetGain);
          wetGain.connect(outputGain);
          
          // Dry path
          currentNode.connect(dryGain);
          dryGain.connect(outputGain);
          
          currentNode = outputGain;
          effectsChainRef.current.push(convolver, wetGain, dryGain, outputGain);
          break;
        }
        
        case 'delay': {
          const { delay, feedback, wetGain, dryGain, outputGain } = createDelayNode(context, parameters.delay);
          
          // Wet path
          currentNode.connect(delay);
          delay.connect(wetGain);
          wetGain.connect(outputGain);
          
          // Dry path
          currentNode.connect(dryGain);
          dryGain.connect(outputGain);
          
          currentNode = outputGain;
          effectsChainRef.current.push(delay, feedback, wetGain, dryGain, outputGain);
          break;
        }
        
        case 'chorus': {
          const { delay, lfo, lfoGain, wetGain, dryGain, outputGain } = createChorusNode(context, parameters.chorus);
          
          // Wet path
          currentNode.connect(delay);
          delay.connect(wetGain);
          wetGain.connect(outputGain);
          
          // Dry path
          currentNode.connect(dryGain);
          dryGain.connect(outputGain);
          
          currentNode = outputGain;
          effectsChainRef.current.push(delay, lfo, lfoGain, wetGain, dryGain, outputGain);
          break;
        }
      }
    });

    // Connect final node to output
    currentNode.connect(outputNodeRef.current);
  }, [createReverbNode, createDelayNode, createChorusNode, createEqualizerNode, createCompressorNode]);

  const updateEffectParameter = useCallback((effectType: keyof EffectParameters, parameterName: string, value: number) => {
    if (!audioContextRef.current) return;

    // This would update specific effect parameters in real-time
    // Implementation depends on the specific effect and parameter
    console.log(`Updating ${effectType}.${parameterName} to ${value}`);
  }, []);

  const cleanup = useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    
    effectsChainRef.current.forEach(node => {
      try {
        node.disconnect();
      } catch (e) {
        // Node might already be disconnected
      }
    });
    effectsChainRef.current = [];
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    initializeAudioContext,
    applyEffects,
    updateEffectParameter,
    cleanup,
    defaultParameters,
  };
};