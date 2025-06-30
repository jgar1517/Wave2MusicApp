import React, { useState } from 'react';
import { Music, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';

const FontShowcase = () => {
  const [currentFont, setCurrentFont] = useState(0);

  const fontOptions = [
    {
      id: 'playfair-extrabold',
      name: 'Playfair Display ExtraBold',
      description: 'Current choice with extra weight - elegant, sophisticated, premium feel',
      headerClass: 'font-display font-extrabold',
      logoClass: 'font-display font-extrabold',
      personality: 'Elegant • Premium • Sophisticated',
      bestFor: 'Professional music platforms, classical/orchestral focus'
    },
    {
      id: 'fredoka',
      name: 'Fredoka',
      description: 'Fun, rounded, playful - perfect for creative and approachable vibes',
      headerClass: 'font-fredoka font-bold',
      logoClass: 'font-fredoka font-bold',
      personality: 'Playful • Friendly • Creative',
      bestFor: 'Content creators, educational platforms, younger audiences'
    },
    {
      id: 'comfortaa',
      name: 'Comfortaa',
      description: 'Modern, geometric, clean - contemporary and accessible design',
      headerClass: 'font-comfortaa font-bold',
      logoClass: 'font-comfortaa font-bold',
      personality: 'Modern • Clean • Accessible',
      bestFor: 'Tech-savvy users, minimalist design, broad appeal'
    },
    {
      id: 'righteous',
      name: 'Righteous',
      description: 'Bold, retro, creative - stands out with personality and character',
      headerClass: 'font-righteous font-normal',
      logoClass: 'font-righteous font-normal',
      personality: 'Bold • Retro • Creative',
      bestFor: 'Indie musicians, creative studios, artistic communities'
    },
    {
      id: 'orbitron',
      name: 'Orbitron',
      description: 'Futuristic, tech-inspired - perfect for AI and technology focus',
      headerClass: 'font-orbitron font-bold',
      logoClass: 'font-orbitron font-bold',
      personality: 'Futuristic • Tech • AI-focused',
      bestFor: 'AI/tech emphasis, electronic music, sci-fi aesthetic'
    }
  ];

  const currentFontOption = fontOptions[currentFont];

  const nextFont = () => {
    setCurrentFont((prev) => (prev + 1) % fontOptions.length);
  };

  const prevFont = () => {
    setCurrentFont((prev) => (prev - 1 + fontOptions.length) % fontOptions.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold text-neon-blue mb-4">
            Font Style Showcase
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Explore different typography options for Studio Nexus headers and logo
          </p>
        </div>

        {/* Font Navigation */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <button
            onClick={prevFont}
            className="p-3 bg-dark-800 border border-gray-600 rounded-lg hover:border-neon-blue transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-neon-blue" />
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-1">
              {currentFontOption.name}
            </h2>
            <p className="text-sm text-gray-400">
              {currentFont + 1} of {fontOptions.length}
            </p>
          </div>
          
          <button
            onClick={nextFont}
            className="p-3 bg-dark-800 border border-gray-600 rounded-lg hover:border-neon-blue transition-colors duration-200"
          >
            <ArrowRight className="h-5 w-5 text-neon-blue" />
          </button>
        </div>

        {/* Font Preview */}
        <div className="bg-dark-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 mb-8">
          {/* Logo Preview */}
          <div className="text-center mb-12">
            <h3 className="text-lg text-gray-400 mb-4">Logo Preview</h3>
            <div className="flex items-center justify-center space-x-3">
              <div className="relative">
                <Music className="h-8 w-8 text-neon-blue" />
                <Sparkles className="h-4 w-4 text-neon-purple absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className={`${currentFontOption.logoClass} text-2xl text-neon-blue`}>
                Studio Nexus
              </span>
            </div>
          </div>

          {/* Section Headers Preview */}
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-lg text-gray-400 mb-4">Section Headers Preview</h3>
              
              <h2 className={`${currentFontOption.headerClass} text-4xl sm:text-5xl text-neon-blue mb-6`}>
                Powerful Features for{' '}
                <span className="text-neon-blue">
                  Every Creator
                </span>
              </h2>
              
              <h2 className={`${currentFontOption.headerClass} text-4xl sm:text-5xl text-neon-blue mb-6`}>
                Create Music in{' '}
                <span className="text-neon-blue">
                  Three Simple Steps
                </span>
              </h2>
              
              <h2 className={`${currentFontOption.headerClass} text-4xl sm:text-5xl text-neon-blue mb-6`}>
                Choose Your{' '}
                <span className="text-neon-blue">
                  Creative Journey
                </span>
              </h2>
              
              <h2 className={`${currentFontOption.headerClass} text-4xl sm:text-5xl text-neon-blue`}>
                Loved by{' '}
                <span className="text-neon-blue">
                  Creators Worldwide
                </span>
              </h2>
            </div>
          </div>
        </div>

        {/* Font Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-dark-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="font-semibold text-neon-blue mb-3">Description</h3>
            <p className="text-gray-300">{currentFontOption.description}</p>
          </div>
          
          <div className="bg-dark-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="font-semibold text-neon-purple mb-3">Personality</h3>
            <p className="text-gray-300">{currentFontOption.personality}</p>
          </div>
          
          <div className="bg-dark-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="font-semibold text-neon-green mb-3">Best For</h3>
            <p className="text-gray-300">{currentFontOption.bestFor}</p>
          </div>
        </div>

        {/* Font Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {fontOptions.map((font, index) => (
            <button
              key={font.id}
              onClick={() => setCurrentFont(index)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                currentFont === index
                  ? 'border-neon-blue bg-dark-800/70'
                  : 'border-gray-700 bg-dark-800/30 hover:border-gray-600'
              }`}
            >
              <div className={`${font.headerClass} text-lg text-neon-blue mb-2`}>
                Studio Nexus
              </div>
              <div className="text-sm text-gray-400">
                {font.name}
              </div>
            </button>
          ))}
        </div>

        {/* Implementation Note */}
        <div className="mt-12 bg-dark-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
          <h3 className="font-semibold text-neon-blue mb-3">Implementation Ready</h3>
          <p className="text-gray-300 mb-4">
            All fonts are loaded and configured. Simply choose your preferred style and I'll apply it to the entire site.
          </p>
          <p className="text-sm text-gray-400">
            Current selection: <span className="text-neon-blue font-semibold">{currentFontOption.name}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FontShowcase;