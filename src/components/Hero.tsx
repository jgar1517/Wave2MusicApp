import React from 'react';
import { Play, Mic, Wand2, Download, ArrowRight } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-128 h-128 bg-neon-pink/10 rounded-full blur-3xl animate-pulse-slow"></div>
        
        {/* Wood texture overlay */}
        <div className="absolute inset-0 bg-wood-texture opacity-5"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-dark-800/50 backdrop-blur-sm border border-neon-blue/30 rounded-full px-4 py-2 mb-8 animate-fade-in">
            <Wand2 className="h-4 w-4 text-neon-blue" />
            <span className="text-sm text-neon-blue">AI-Powered Music Creation</span>
            <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
          </div>

          {/* Logo Showcase */}
          <div className="flex items-center justify-center space-x-4 mb-8 animate-slide-up">
            <div className="relative">
              <img 
                src="/music app logo.png" 
                alt="Wave2Music Logo" 
                className="h-16 w-16 sm:h-20 sm:w-20 object-contain filter drop-shadow-lg animate-pulse"
              />
              <div className="absolute inset-0 bg-neon-blue/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <span className="font-righteous text-3xl sm:text-4xl md:text-5xl text-neon-blue animate-pulse">
              Wave2Music
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="font-righteous text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-white mb-6 animate-slide-up leading-tight" style={{ animationDelay: '0.2s' }}>
            Transform Your{' '}
            <span className="text-neon-blue">
              Voice
            </span>
            {' '}Into Any{' '}
            <span className="text-neon-purple">
              Instrument
            </span>
          </h1>

          {/* Subtitle */}
          <div className="max-w-4xl mx-auto mb-8">
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 leading-relaxed animate-slide-up px-4" style={{ animationDelay: '0.4s' }}>
              Create professional music with AI-powered tools. Record your voice, apply real-time effects, and transform it into orchestral masterpieces or electronic beats.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-12 animate-slide-up px-4" style={{ animationDelay: '0.6s' }}>
            <button 
              onClick={onGetStarted}
              className="group bg-gradient-to-r from-neon-blue to-neon-purple text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:shadow-neon transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 w-full sm:w-auto justify-center"
            >
              <Play className="h-5 w-5 group-hover:animate-pulse" />
              <span>Start Creating Free</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
            <button className="group bg-dark-800/50 backdrop-blur-sm border border-gray-600 text-gray-300 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:border-neon-blue hover:text-neon-blue hover:shadow-neon-sm transition-all duration-300 flex items-center space-x-2 w-full sm:w-auto justify-center">
              <Play className="h-5 w-5" />
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-16 animate-slide-up px-4" style={{ animationDelay: '0.8s' }}>
            <div className="flex items-center space-x-2 bg-dark-800/30 backdrop-blur-sm border border-gray-700 rounded-full px-3 sm:px-4 py-2">
              <Mic className="h-4 w-4 text-neon-blue" />
              <span className="text-sm text-gray-300">Voice Recording</span>
            </div>
            <div className="flex items-center space-x-2 bg-dark-800/30 backdrop-blur-sm border border-gray-700 rounded-full px-3 sm:px-4 py-2">
              <Wand2 className="h-4 w-4 text-neon-purple" />
              <span className="text-sm text-gray-300">AI Transformation</span>
            </div>
            <div className="flex items-center space-x-2 bg-dark-800/30 backdrop-blur-sm border border-gray-700 rounded-full px-3 sm:px-4 py-2">
              <Download className="h-4 w-4 text-neon-green" />
              <span className="text-sm text-gray-300">Professional Export</span>
            </div>
          </div>

          {/* Demo Waveform Visualization */}
          <div className="relative max-w-2xl mx-auto animate-slide-up px-4" style={{ animationDelay: '1s' }}>
            <div className="bg-dark-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 sm:p-6">
              <div className="flex items-center justify-center space-x-1 h-16 sm:h-24">
                {Array.from({ length: 40 }, (_, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-t from-neon-blue to-neon-purple rounded-full animate-waveform"
                    style={{
                      width: '3px',
                      height: `${Math.random() * 40 + 15}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  ></div>
                ))}
              </div>
              <p className="text-sm text-gray-300 mt-4">Live audio visualization preview</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-neon-blue rounded-full flex justify-center">
          <div className="w-1 h-3 bg-neon-blue rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;