import React from 'react';
import { Mic, Wand2, Download, ArrowRight } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      step: 1,
      icon: Mic,
      title: 'Record Your Voice',
      description: 'Use our professional recording tools to capture your voice or any sound. Real-time waveform visualization helps you get the perfect take.',
      color: 'neon-blue',
    },
    {
      step: 2,
      icon: Wand2,
      title: 'AI Transformation',
      description: 'Choose from orchestral, electronic, jazz, or custom styles. Our AI analyzes your audio and creates professional instrumental arrangements.',
      color: 'neon-purple',
    },
    {
      step: 3,
      icon: Download,
      title: 'Export & Share',
      description: 'Download your creation in high-quality formats, apply professional mastering, and share with the world or collaborate with others.',
      color: 'neon-green',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-b from-dark-800 to-dark-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl transform -translate-y-1/2"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl transform -translate-y-1/2"></div>
        <div className="absolute inset-0 bg-wood-texture opacity-5"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-righteous text-4xl sm:text-5xl text-neon-blue mb-6">
            Create Music in{' '}
            <span className="text-neon-blue">
              Three Simple Steps
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            From voice to professional music in minutes. No musical training required - just your creativity and our AI.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Lines */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-green transform -translate-y-1/2 opacity-30"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={step.step} className="relative">
                  {/* Step Card */}
                  <div className="bg-dark-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 text-center hover:border-gray-600 hover:bg-dark-800/70 transition-all duration-300 transform hover:scale-105">
                    {/* Step Number */}
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-${step.color} to-${step.color} bg-opacity-20 border-2 border-${step.color} mb-6 relative`}>
                      <span className={`text-2xl font-bold text-${step.color}`}>{step.step}</span>
                      <div className={`absolute inset-0 rounded-full bg-${step.color} opacity-20 animate-pulse`}></div>
                    </div>

                    {/* Icon */}
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-${step.color} to-${step.color} bg-opacity-20 mb-4`}>
                      <IconComponent className={`h-6 w-6 text-${step.color}`} />
                    </div>

                    {/* Content */}
                    <h3 className="font-righteous text-2xl text-neon-blue mb-4">
                      {step.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow (Desktop) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <ArrowRight className="h-8 w-8 text-gray-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Demo Section */}
        <div className="mt-20 text-center">
          <div className="bg-dark-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="font-righteous text-2xl text-neon-blue mb-4">
              See It In Action
            </h3>
            <p className="text-gray-300 mb-6">
              Watch how a simple voice recording transforms into a full orchestral piece
            </p>
            
            {/* Demo Placeholder */}
            <div className="bg-dark-900/50 rounded-xl p-8 mb-6">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="w-3 h-3 bg-neon-blue rounded-full animate-pulse"></div>
                <span className="text-gray-400">Demo Video Coming Soon</span>
                <div className="w-3 h-3 bg-neon-purple rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              </div>
              <div className="h-48 bg-gradient-to-r from-dark-800 to-dark-700 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-neon-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wand2 className="h-8 w-8 text-neon-blue animate-pulse" />
                  </div>
                  <p className="text-gray-400">Interactive Demo</p>
                </div>
              </div>
            </div>

            <button className="bg-gradient-to-r from-neon-blue to-neon-purple text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-neon transition-all duration-300 transform hover:scale-105">
              Try It Yourself
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;