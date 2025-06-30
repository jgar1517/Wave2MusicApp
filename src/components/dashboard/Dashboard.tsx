import React from 'react';
import { Music, Plus, Settings, User, LogOut, Mic, Wand2, Download, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
  };

  const stats = [
    {
      label: 'Projects',
      value: profile?.total_projects || 0,
      icon: Music,
      color: 'neon-blue'
    },
    {
      label: 'AI Transformations',
      value: profile?.total_transformations || 0,
      icon: Wand2,
      color: 'neon-purple'
    },
    {
      label: 'Storage Used',
      value: `${profile?.storage_used_mb || 0}MB`,
      icon: Download,
      color: 'neon-green'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Navigation */}
      <nav className="bg-dark-900/95 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Increased size */}
            <div className="flex items-center space-x-3">
              <img 
                src="/music app logo.png" 
                alt="Wave2Music Logo" 
                className="h-16 w-16 object-contain"
              />
              <span className="font-righteous text-xl text-neon-blue">
                Wave2Music
              </span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => navigate('/studio')}
                className="text-gray-300 hover:text-neon-blue transition-colors duration-200 px-3 py-2 text-sm font-medium"
              >
                Studio
              </button>
              <button className="text-gray-300 hover:text-neon-blue transition-colors duration-200 px-3 py-2 text-sm font-medium">
                Library
              </button>
              <button className="text-gray-300 hover:text-neon-blue transition-colors duration-200 px-3 py-2 text-sm font-medium">
                Community
              </button>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-white font-medium">{profile?.full_name || 'User'}</p>
                  <p className="text-sm text-gray-400">@{profile?.username}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-righteous text-3xl sm:text-4xl text-white mb-2">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Creator'}!
          </h1>
          <p className="text-gray-300 text-lg">
            Ready to create some amazing music today?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-dark-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-gray-600 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-r from-${stat.color} to-${stat.color} bg-opacity-20 rounded-xl flex items-center justify-center`}>
                    <IconComponent className={`h-6 w-6 text-${stat.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Create New Project */}
          <div className="bg-dark-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
            <h2 className="font-righteous text-2xl text-neon-blue mb-4">
              Create New Project
            </h2>
            <p className="text-gray-300 mb-6">
              Start a new musical journey with AI-powered tools
            </p>
            <button 
              onClick={() => navigate('/studio')}
              className="bg-gradient-to-r from-neon-blue to-neon-purple text-white px-6 py-3 rounded-xl font-semibold hover:shadow-neon transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Open Studio</span>
            </button>
          </div>

          {/* Recent Activity */}
          <div className="bg-dark-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
            <h2 className="font-righteous text-2xl text-neon-purple mb-4">
              Recent Activity
            </h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-gray-300">
                <Mic className="h-5 w-5 text-neon-blue" />
                <span>No recent projects yet</span>
              </div>
              <p className="text-gray-400 text-sm">
                Your recent projects and transformations will appear here
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="bg-dark-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-righteous text-2xl text-neon-green">
              Subscription Status
            </h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              profile?.subscription_tier === 'free' 
                ? 'bg-gray-700 text-gray-300' 
                : 'bg-gradient-to-r from-neon-purple to-neon-pink text-white'
            }`}>
              {profile?.subscription_tier?.toUpperCase() || 'FREE'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-400 text-sm">AI Transformations</p>
              <p className="text-white font-semibold">
                {profile?.subscription_tier === 'free' ? '5/month' : 'Unlimited'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Projects</p>
              <p className="text-white font-semibold">
                {profile?.subscription_tier === 'free' ? '3 max' : 'Unlimited'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Export Quality</p>
              <p className="text-white font-semibold">
                {profile?.subscription_tier === 'free' ? 'MP3 (with watermark)' : 'WAV/FLAC'}
              </p>
            </div>
          </div>
          
          {profile?.subscription_tier === 'free' && (
            <div className="mt-6">
              <button className="bg-gradient-to-r from-neon-purple to-neon-pink text-white px-6 py-3 rounded-xl font-semibold hover:shadow-neon transition-all duration-300 transform hover:scale-105">
                Upgrade to Pro
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;