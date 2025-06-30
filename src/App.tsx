import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Landing Page Components
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Pricing from './components/Pricing';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';

// Auth Components
import AuthModal from './components/auth/AuthModal';
import Dashboard from './components/dashboard/Dashboard';
import Studio from './components/studio/Studio';
import ProtectedRoute from './components/ProtectedRoute';

// Landing Page Component
const LandingPage: React.FC = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <Navigation onSignIn={() => openAuthModal('signin')} onSignUp={() => openAuthModal('signup')} />
      <Hero onGetStarted={() => openAuthModal('signup')} />
      <Features />
      <HowItWorks />
      <Pricing onGetStarted={() => openAuthModal('signup')} />
      <Testimonials />
      <Footer />
      
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
};

function App() {
  const { user, initialize, initialized } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          {/* Logo - Increased size for loading state */}
          <div className="w-32 h-32 bg-neon-blue/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse p-6">
            <img 
              src="/music app logo.png" 
              alt="Wave2Music Logo" 
              className="h-full w-full object-contain"
            />
          </div>
          <p className="text-gray-400">Initializing Wave2Music...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute fallback={<Navigate to="/" replace />}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/studio" 
          element={
            <ProtectedRoute fallback={<Navigate to="/" replace />}>
              <Studio />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;