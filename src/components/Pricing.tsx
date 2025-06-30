import React from 'react';
import { Check, Star, Zap } from 'lucide-react';

interface PricingProps {
  onGetStarted: () => void;
}

const Pricing: React.FC<PricingProps> = ({ onGetStarted }) => {
  const plans = [
    {
      name: 'Free',
      price: 0,
      period: 'forever',
      description: 'Perfect for getting started with AI music creation',
      icon: Star,
      color: 'neon-blue',
      features: [
        '5 AI transformations per month',
        'Basic audio recording',
        'Standard effects (reverb, delay)',
        'MP3 export (with watermark)',
        '3 projects maximum',
        'Community support',
      ],
      limitations: [
        'Limited export quality',
        'Watermarked exports',
        'Basic effects only',
      ],
      cta: 'Get Started Free',
      popular: false,
    },
    {
      name: 'Pro',
      price: 12,
      period: 'month',
      description: 'Unlock the full power of AI music creation',
      icon: Zap,
      color: 'neon-purple',
      features: [
        '50 AI transformations per month',
        'Professional audio recording',
        'Premium effects library',
        'High-quality WAV/FLAC export',
        'Unlimited projects',
        'Advanced mixing tools',
        'Priority AI processing',
        'No watermarks',
        'Email support',
      ],
      cta: 'Start Pro Trial',
      popular: true,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-dark-900 to-dark-800 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-righteous text-4xl sm:text-5xl text-neon-blue mb-6">
            Choose Your{' '}
            <span className="text-neon-blue">
              Creative Journey
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Start free and upgrade as your musical ambitions grow. All plans include our core AI transformation technology.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            return (
              <div
                key={plan.name}
                className={`relative bg-dark-800/50 backdrop-blur-sm border rounded-2xl p-8 transition-all duration-300 transform hover:scale-105 ${
                  plan.popular
                    ? 'border-neon-purple shadow-neon-sm'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-neon-purple to-neon-pink text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-${plan.color} to-${plan.color} bg-opacity-20 mb-4`}>
                    <IconComponent className={`h-8 w-8 text-${plan.color}`} />
                  </div>
                  <h3 className="font-righteous text-2xl text-neon-blue mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    {plan.description}
                  </p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                    <span className="text-gray-400">/{plan.period}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start space-x-3">
                      <Check className={`h-5 w-5 text-${plan.color} mt-0.5 flex-shrink-0`} />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={plan.name === 'Free' ? onGetStarted : undefined}
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:shadow-neon'
                      : 'bg-dark-700 text-white hover:bg-dark-600 border border-gray-600 hover:border-gray-500'
                  }`}
                >
                  {plan.cta}
                </button>

                {/* Limitations (for Free plan) */}
                {plan.limitations && (
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <p className="text-sm text-gray-500 mb-2">Limitations:</p>
                    <ul className="space-y-1">
                      {plan.limitations.map((limitation, limitIndex) => (
                        <li key={limitIndex} className="text-sm text-gray-500">
                          • {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <h3 className="font-righteous text-2xl text-neon-blue mb-8">
            Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h4 className="font-semibold text-white mb-2">Can I upgrade or downgrade anytime?</h4>
              <p className="text-gray-400">Yes, you can change your plan at any time. Changes take effect immediately.</p>
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-white mb-2">What happens to my projects if I downgrade?</h4>
              <p className="text-gray-400">Your projects remain safe. You'll just have access to fewer monthly transformations.</p>
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-white mb-2">Is there a free trial for Pro?</h4>
              <p className="text-gray-400">Yes! Get 14 days of Pro features free when you sign up.</p>
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-white mb-2">Do you offer student discounts?</h4>
              <p className="text-gray-400">Yes, students get 50% off Pro plans with valid student ID verification.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;