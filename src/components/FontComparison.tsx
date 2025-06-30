import React, { useState } from 'react';
import { Music, Sparkles, Play, Mic, Wand2, Download, ArrowRight, Star, Zap, Crown, Check } from 'lucide-react';

const FontComparison = () => {
  const [selectedFont, setSelectedFont] = useState('fredoka');

  const fontOptions = [
    {
      id: 'fredoka',
      name: 'Fredoka',
      headerClass: 'font-fredoka font-bold',
      logoClass: 'font-fredoka font-bold',
      personality: 'Playful • Friendly • Creative',
      description: 'Perfect for content creators and approachable music creation'
    },
    {
      id: 'righteous',
      name: 'Righteous',
      headerClass: 'font-righteous font-normal',
      logoClass: 'font-righteous font-normal',
      personality: 'Bold • Retro • Creative',
      description: 'Great for indie musicians and artistic communities'
    }
  ];

  const currentFont = fontOptions.find(f => f.id === selectedFont);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Font Selector */}
      <div className="sticky top-0 z-50 bg-dark-900/95 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center space-x-6">
            {fontOptions.map((font) => (
              <button
                key={font.id}
                onClick={() => setSelectedFont(font.id)}
                className={`px-6 py-3 rounded-lg border-2 transition-all duration-200 ${
                  selectedFont === font.id
                    ? 'border-neon-blue bg-neon-blue/10 text-neon-blue'
                    : 'border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className={`${font.logoClass} text-lg mb-1`}>
                  {font.name}
                </div>
                <div className="text-xs opacity-75">
                  {font.personality}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section Preview */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* Logo */}
            <div className="flex items-center justify-center space-x-3 mb-8">
              <div className="relative">
                <Music className="h-8 w-8 text-neon-blue" />
                <Sparkles className="h-4 w-4 text-neon-purple absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className={`${currentFont?.logoClass} text-2xl text-neon-blue`}>
                Studio Nexus
              </span>
            </div>

            {/* Main Headline */}
            <h1 className={`${currentFont?.headerClass} text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-neon-blue mb-6 leading-tight`}>
              Transform Your{' '}
              <span className="text-neon-blue">
                Voice
              </span>
              {' '}Into Any{' '}
              <span className="text-neon-blue">
                Instrument
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed mb-8 max-w-4xl mx-auto">
              Create professional music with AI-powered tools. Record your voice, apply real-time effects, and transform it into orchestral masterpieces or electronic beats.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-12">
              <button className="group bg-gradient-to-r from-neon-blue to-neon-purple text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:shadow-neon transition-all duration-300 transform hover:scale-105 flex items-center space-x-2">
                <Play className="h-5 w-5 group-hover:animate-pulse" />
                <span>Start Creating Free</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section Preview */}
      <section className="py-24 bg-gradient-to-b from-dark-900 to-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`${currentFont?.headerClass} text-4xl sm:text-5xl text-neon-blue mb-6`}>
              Powerful Features for{' '}
              <span className="text-neon-blue">
                Every Creator
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From recording to export, Studio Nexus provides everything you need to create professional-quality music.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Mic, title: 'High-Quality Recording', color: 'neon-blue' },
              { icon: Wand2, title: 'AI Transformation', color: 'neon-purple' },
              { icon: Download, title: 'Professional Export', color: 'neon-green' }
            ].map((feature) => {
              const IconComponent = feature.icon;
              return (
                <div key={feature.title} className="bg-dark-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-${feature.color} to-${feature.color} bg-opacity-20 mb-4`}>
                    <IconComponent className={`h-6 w-6 text-${feature.color}`} />
                  </div>
                  <h3 className={`${currentFont?.headerClass} text-xl text-white mb-3`}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-300">
                    Professional tools that make music creation accessible to everyone.
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section Preview */}
      <section className="py-24 bg-gradient-to-b from-dark-800 to-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`${currentFont?.headerClass} text-4xl sm:text-5xl text-neon-blue mb-6`}>
              Create Music in{' '}
              <span className="text-neon-blue">
                Three Simple Steps
              </span>
            </h2>
          </div>
        </div>
      </section>

      {/* Pricing Section Preview */}
      <section className="py-24 bg-gradient-to-b from-dark-900 to-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`${currentFont?.headerClass} text-4xl sm:text-5xl text-neon-blue mb-6`}>
              Choose Your{' '}
              <span className="text-neon-blue">
                Creative Journey
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { name: 'Free', price: 0, icon: Star, color: 'neon-blue' },
              { name: 'Pro', price: 12, icon: Zap, color: 'neon-purple', popular: true },
              { name: 'Enterprise', price: 'Custom', icon: Crown, color: 'neon-green' }
            ].map((plan) => {
              const IconComponent = plan.icon;
              return (
                <div key={plan.name} className={`relative bg-dark-800/50 backdrop-blur-sm border rounded-2xl p-8 ${plan.popular ? 'border-neon-purple' : 'border-gray-700'}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-neon-purple to-neon-pink text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-${plan.color} to-${plan.color} bg-opacity-20 mb-4`}>
                      <IconComponent className={`h-8 w-8 text-${plan.color}`} />
                    </div>
                    <h3 className={`${currentFont?.headerClass} text-2xl text-neon-blue mb-2`}>
                      {plan.name}
                    </h3>
                    <div className="mb-4">
                      {typeof plan.price === 'number' ? (
                        <>
                          <span className="text-4xl font-bold text-white">${plan.price}</span>
                          <span className="text-gray-400">/month</span>
                        </>
                      ) : (
                        <span className="text-4xl font-bold text-white">{plan.price}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section Preview */}
      <section className="py-24 bg-gradient-to-b from-dark-800 to-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`${currentFont?.headerClass} text-4xl sm:text-5xl text-neon-blue mb-6`}>
              Loved by{' '}
              <span className="text-neon-blue">
                Creators Worldwide
              </span>
            </h2>
          </div>
        </div>
      </section>

      {/* Font Info Panel */}
      <div className="bg-dark-900 border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className={`${currentFont?.headerClass} text-2xl text-neon-blue mb-4`}>
              Currently Viewing: {currentFont?.name}
            </h3>
            <p className="text-gray-300 mb-2">{currentFont?.description}</p>
            <p className="text-sm text-gray-400">{currentFont?.personality}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FontComparison;