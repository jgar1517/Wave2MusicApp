import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

interface NavigationProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onSignIn, onSignUp }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Pricing', href: '#pricing' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-dark-900/95 backdrop-blur-md border-b border-dark-700/50' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Increased size */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="relative">
              <img 
                src="/music app logo.png" 
                alt="Wave2Music Logo" 
                className="h-16 w-16 sm:h-20 sm:w-20 object-contain animate-pulse"
              />
            </div>
            <span className="font-righteous text-lg sm:text-xl text-neon-blue whitespace-nowrap animate-pulse">
              Wave2Music
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-6 lg:space-x-8">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-300 hover:text-neon-blue transition-colors duration-200 px-3 py-2 text-sm font-medium whitespace-nowrap"
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4 flex-shrink-0">
            <button 
              onClick={onSignIn}
              className="text-gray-300 hover:text-neon-blue transition-colors duration-200 px-3 lg:px-4 py-2 text-sm font-medium whitespace-nowrap"
            >
              Sign In
            </button>
            <button 
              onClick={onSignUp}
              className="bg-gradient-to-r from-neon-blue to-neon-purple text-white px-4 lg:px-6 py-2 rounded-lg font-medium hover:shadow-neon-sm transition-all duration-200 transform hover:scale-105 text-sm whitespace-nowrap"
            >
              Get Started Free
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-neon-blue hover:text-white transition-colors duration-200"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-dark-900/95 backdrop-blur-md border-t border-dark-700/50">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-300 hover:text-neon-blue block px-3 py-2 text-base font-medium transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <div className="pt-4 pb-2 space-y-2">
              <button 
                onClick={() => {
                  onSignIn();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left text-gray-300 hover:text-neon-blue px-3 py-2 text-base font-medium transition-colors duration-200"
              >
                Sign In
              </button>
              <button 
                onClick={() => {
                  onSignUp();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white px-3 py-2 rounded-lg font-medium hover:shadow-neon-sm transition-all duration-200"
              >
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;