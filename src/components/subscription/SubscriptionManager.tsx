import React, { useState } from 'react';
import { Crown, Star, Zap, Check, X, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  features: string[];
  limitations?: string[];
  popular?: boolean;
}

const SubscriptionManager: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const { profile, updateProfile } = useAuthStore();

  const plans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'forever',
      description: 'Perfect for getting started with AI music creation',
      icon: Star,
      color: 'neon-blue',
      features: [
        '5 AI transformations per month',
        'Basic audio recording',
        'Standard effects (reverb, delay, chorus)',
        'MP3 export (with watermark)',
        '3 projects maximum',
        '100MB storage',
        'Community support',
      ],
      limitations: [
        'Limited export quality',
        'Watermarked exports',
        'Basic effects only',
        'No collaboration features',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: billingPeriod === 'monthly' ? 12 : 120,
      period: billingPeriod === 'monthly' ? 'month' : 'year',
      description: 'Unlock the full power of AI music creation',
      icon: Zap,
      color: 'neon-purple',
      popular: true,
      features: [
        '50 AI transformations per month',
        'Professional audio recording',
        'Premium effects library',
        'High-quality WAV/FLAC export',
        'Unlimited projects',
        'Advanced mixing tools',
        'Priority AI processing',
        'No watermarks',
        '1GB storage',
        'Email support',
        'Collaboration features',
        'Custom presets',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: billingPeriod === 'monthly' ? 49 : 490,
      period: billingPeriod === 'monthly' ? 'month' : 'year',
      description: 'For teams and professional studios',
      icon: Crown,
      color: 'neon-green',
      features: [
        'Unlimited AI transformations',
        'Team collaboration tools',
        'Advanced analytics',
        'Custom AI model training',
        'White-label options',
        'Unlimited storage',
        'Priority support',
        'API access',
        'Custom integrations',
        'Dedicated account manager',
      ],
    },
  ];

  const currentPlan = plans.find(plan => plan.id === profile?.subscription_tier) || plans[0];

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') return;
    
    setSelectedPlan(planId);
    setShowUpgradeModal(true);
  };

  const processUpgrade = async () => {
    // In a real app, this would integrate with Stripe or another payment processor
    try {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + (billingPeriod === 'yearly' ? 12 : 1));
      
      await updateProfile({
        subscription_tier: selectedPlan as any,
        subscription_expires_at: expiresAt.toISOString(),
      });
      
      setShowUpgradeModal(false);
      alert('Subscription updated successfully!');
    } catch (error) {
      console.error('Upgrade failed:', error);
      alert('Upgrade failed. Please try again.');
    }
  };

  const formatPrice = (price: number, period: string) => {
    if (price === 0) return 'Free';
    return `$${price}/${period}`;
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  return (
    <div className="bg-dark-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Crown className="h-6 w-6 text-neon-yellow" />
          <h2 className="font-righteous text-xl text-neon-yellow">Subscription</h2>
        </div>
        <div className="flex items-center space-x-2 bg-dark-700 rounded-lg p-1">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-200 ${
              billingPeriod === 'monthly'
                ? 'bg-neon-blue text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-200 ${
              billingPeriod === 'yearly'
                ? 'bg-neon-blue text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Yearly
            <span className="ml-1 text-xs bg-neon-green text-dark-900 px-1 rounded">-17%</span>
          </button>
        </div>
      </div>

      {/* Current Plan Status */}
      <div className="mb-6 bg-dark-700/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Current Plan</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            currentPlan.id === 'free' 
              ? 'bg-gray-700 text-gray-300' 
              : 'bg-gradient-to-r from-neon-purple to-neon-pink text-white'
          }`}>
            {currentPlan.name.toUpperCase()}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-gray-400 text-sm">AI Transformations</p>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-dark-600 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-neon-blue to-neon-purple h-2 rounded-full"
                  style={{ width: `${getUsagePercentage(profile?.total_transformations || 0, currentPlan.id === 'free' ? 5 : 50)}%` }}
                />
              </div>
              <span className="text-white text-sm">
                {profile?.total_transformations || 0}/{currentPlan.id === 'free' ? '5' : currentPlan.id === 'pro' ? '50' : '∞'}
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-gray-400 text-sm">Projects</p>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-dark-600 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-neon-green to-neon-blue h-2 rounded-full"
                  style={{ width: `${getUsagePercentage(profile?.total_projects || 0, currentPlan.id === 'free' ? 3 : -1)}%` }}
                />
              </div>
              <span className="text-white text-sm">
                {profile?.total_projects || 0}/{currentPlan.id === 'free' ? '3' : '∞'}
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-gray-400 text-sm">Storage</p>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-dark-600 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-neon-yellow to-neon-pink h-2 rounded-full"
                  style={{ width: `${getUsagePercentage(profile?.storage_used_mb || 0, currentPlan.id === 'free' ? 100 : currentPlan.id === 'pro' ? 1000 : -1)}%` }}
                />
              </div>
              <span className="text-white text-sm">
                {profile?.storage_used_mb || 0}MB/{currentPlan.id === 'free' ? '100MB' : currentPlan.id === 'pro' ? '1GB' : '∞'}
              </span>
            </div>
          </div>
        </div>

        {profile?.subscription_expires_at && (
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>
              {currentPlan.id !== 'free' ? 'Renews' : 'Expires'} on {new Date(profile.subscription_expires_at).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Plan Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {plans.map((plan) => {
          const IconComponent = plan.icon;
          const isCurrentPlan = plan.id === profile?.subscription_tier;
          
          return (
            <div
              key={plan.id}
              className={`relative bg-dark-700/50 border rounded-2xl p-6 transition-all duration-300 ${
                plan.popular
                  ? 'border-neon-purple shadow-neon-sm'
                  : 'border-gray-600 hover:border-gray-500'
              } ${isCurrentPlan ? 'ring-2 ring-neon-blue' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-neon-purple to-neon-pink text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Most Popular
                  </div>
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <div className="bg-neon-blue text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Current Plan
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-${plan.color} to-${plan.color} bg-opacity-20 mb-3`}>
                  <IconComponent className={`h-6 w-6 text-${plan.color}`} />
                </div>
                <h3 className="font-righteous text-xl text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">{formatPrice(plan.price, plan.period)}</span>
                  {billingPeriod === 'yearly' && plan.price > 0 && (
                    <p className="text-sm text-gray-400">
                      Save ${Math.round(plan.price * 12 * 0.17)} per year
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <Check className={`h-4 w-4 text-${plan.color} mt-0.5 flex-shrink-0`} />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
                
                {plan.limitations && (
                  <>
                    <hr className="border-gray-600 my-4" />
                    {plan.limitations.map((limitation, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <X className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-500 text-sm">{limitation}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrentPlan}
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 ${
                  isCurrentPlan
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : plan.id === 'free'
                    ? 'bg-dark-600 text-white hover:bg-dark-500'
                    : 'bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:shadow-neon transform hover:scale-105'
                }`}
              >
                {isCurrentPlan ? 'Current Plan' : plan.id === 'free' ? 'Downgrade' : 'Upgrade'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-dark-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-righteous text-xl text-white">Upgrade Subscription</h3>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-dark-700/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">
                    {plans.find(p => p.id === selectedPlan)?.name} Plan
                  </span>
                  <span className="text-neon-green font-bold">
                    {formatPrice(plans.find(p => p.id === selectedPlan)?.price || 0, billingPeriod === 'monthly' ? 'month' : 'year')}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">
                  {plans.find(p => p.id === selectedPlan)?.description}
                </p>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-blue-400" />
                  <span className="text-blue-300 text-sm font-medium">Demo Mode</span>
                </div>
                <p className="text-blue-300 text-xs mt-1">
                  This is a demo. In production, this would integrate with Stripe for secure payment processing.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={processUpgrade}
                className="flex-1 bg-gradient-to-r from-neon-purple to-neon-pink text-white py-3 rounded-lg font-semibold hover:shadow-neon transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <CreditCard className="h-4 w-4" />
                <span>Upgrade Now</span>
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager;