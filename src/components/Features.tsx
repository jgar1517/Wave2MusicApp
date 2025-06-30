import React from 'react';
import { Mic, Wand2, Sliders, Music, Download, Users, Shield, Zap } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Mic,
      title: 'High-Quality Recording',
      description: 'Capture crystal-clear audio with professional-grade recording tools and real-time waveform visualization.',
      color: 'neon-blue',
    },
    {
      icon: Wand2,
      title: 'AI Transformation',
      description: 'Transform your voice into orchestral arrangements, electronic beats, or any musical style with advanced AI.',
      color: 'neon-purple',
    },
    {
      icon: Sliders,
      title: 'Real-Time Effects',
      description: 'Apply professional effects like reverb, delay, and chorus with intuitive controls and instant feedback.',
      color: 'neon-pink',
    },
    {
      icon: Music,
      title: 'Multiple Genres',
      description: 'Create music in any style - from classical orchestras to modern electronic, jazz, rock, and more.',
      color: 'neon-green',
    },
    {
      icon: Download,
      title: 'Professional Export',
      description: 'Export your creations in high-quality formats with professional mastering and metadata support.',
      color: 'neon-yellow',
    },
    {
      icon: Users,
      title: 'Collaboration Tools',
      description: 'Share projects, collaborate with others, and build a community around your musical creations.',
      color: 'neon-blue',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your music and data are protected with enterprise-grade security and privacy controls.',
      color: 'neon-purple',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Experience real-time processing with optimized performance across all devices and browsers.',
      color: 'neon-pink',
    },
  ];

  return (
    <section id="features" className="py-24 bg-gradient-to-b from-dark-900 to-dark-800 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-righteous text-4xl sm:text-5xl text-neon-blue mb-6">
            Powerful Features for{' '}
            <span className="text-neon-blue">
              Every Creator
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            From recording to export, Wave2Music provides everything you need to create professional-quality music with the power of AI.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.title}
                className="group bg-dark-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-gray-600 hover:bg-dark-800/50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-${feature.color} to-${feature.color} bg-opacity-20 mb-4 group-hover:shadow-neon-sm transition-all duration-300`}>
                  <IconComponent className={`h-6 w-6 text-${feature.color}`} />
                </div>
                <h3 className="font-semibold text-lg text-white mb-3 group-hover:text-neon-blue transition-colors duration-200">
                  {feature.title}
                </h3>
                <p className="text-gray-300 group-hover:text-gray-200 transition-colors duration-200">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <button className="bg-gradient-to-r from-neon-blue to-neon-purple text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-neon transition-all duration-300 transform hover:scale-105">
            Explore All Features
          </button>
        </div>
      </div>
    </section>
  );
};

export default Features;