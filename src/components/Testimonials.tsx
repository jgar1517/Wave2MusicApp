import React from 'react';
import { Star, Quote } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Content Creator',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      content: 'Wave2Music transformed my content creation process. I can now create unique soundtracks for my videos in minutes instead of hours searching for royalty-free music.',
      rating: 5,
      platform: 'YouTube Creator',
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Music Teacher',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      content: 'My students love experimenting with Wave2Music. It\'s incredible how they can hear their voice transformed into different instruments. It makes music theory come alive!',
      rating: 5,
      platform: 'Music Educator',
    },
    {
      name: 'Alex Thompson',
      role: 'Indie Musician',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      content: 'As a bedroom producer, Wave2Music gives me access to sounds I could never afford. The AI orchestration feature helped me create my first EP.',
      rating: 5,
      platform: 'Independent Artist',
    },
    {
      name: 'Emily Watson',
      role: 'Podcast Producer',
      avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      content: 'The custom intro music I created with Wave2Music perfectly captures my podcast\'s vibe. The AI understood exactly what I was going for.',
      rating: 5,
      platform: 'Podcast Host',
    },
    {
      name: 'David Kim',
      role: 'Game Developer',
      avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      content: 'Creating atmospheric soundscapes for my indie games has never been easier. Wave2Music helps me prototype musical ideas incredibly quickly.',
      rating: 5,
      platform: 'Indie Game Dev',
    },
    {
      name: 'Lisa Park',
      role: 'Marketing Director',
      avatar: 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      content: 'We use Wave2Music to create unique audio branding for our campaigns. The quality is professional and the turnaround time is amazing.',
      rating: 5,
      platform: 'Marketing Agency',
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-dark-800 to-dark-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-yellow/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="font-righteous text-3xl sm:text-4xl lg:text-5xl text-neon-blue mb-4 sm:mb-6 leading-tight">
            Loved by{' '}
            <span className="text-neon-blue block sm:inline">
              Creators Worldwide
            </span>
          </h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
              Join thousands of musicians, content creators, and educators who are transforming their creative process with Wave2Music.
            </p>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="bg-dark-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-gray-600 hover:bg-dark-800/70 transition-all duration-300 transform hover:scale-105"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Quote Icon */}
              <div className="flex items-center justify-between mb-4">
                <Quote className="h-8 w-8 text-neon-blue opacity-50" />
                <div className="flex items-center space-x-1">
                  {Array.from({ length: testimonial.rating }, (_, i) => (
                    <Star key={i} className="h-4 w-4 text-neon-yellow fill-current" />
                  ))}
                </div>
              </div>

              {/* Content */}
              <p className="text-gray-300 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center space-x-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-600"
                />
                <div>
                  <h4 className="font-semibold text-white">{testimonial.name}</h4>
                  <p className="text-sm text-gray-400">{testimonial.role}</p>
                  <p className="text-xs text-neon-blue">{testimonial.platform}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-16 sm:mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-neon-blue mb-2">10K+</div>
            <div className="text-sm sm:text-base text-gray-400">Active Creators</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-neon-purple mb-2">50K+</div>
            <div className="text-sm sm:text-base text-gray-400">Songs Created</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-neon-green mb-2">95%</div>
            <div className="text-sm sm:text-base text-gray-400">Satisfaction Rate</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-neon-yellow mb-2">24/7</div>
            <div className="text-sm sm:text-base text-gray-400">AI Processing</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;