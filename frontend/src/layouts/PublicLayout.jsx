import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus } from 'lucide-react';
import { Button } from '../components/common/Button';
import { SkyventLogo } from '../components/common/Logo';
import { ThemeSwitcher } from '../components/common/ThemeSwitcher';

export const PublicLayout = () => {
  const { isAuthenticated, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/events' },
    { name: 'Merchandise', path: '/merchandise' },
    { name: 'About', path: '/about' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--cream)] text-[var(--ink-brown)] transition-colors duration-200">
      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-[var(--card-bg,white)]/95 backdrop-blur-md border-b border-[var(--sand)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <SkyventLogo size={36} withText={true} />
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm font-medium transition-colors ${
                    isActive ? 'text-[var(--coffee-brown)] font-bold' : 'text-[var(--warm-gray)] hover:text-[var(--ink-brown)]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action buttons + Theme Gear Switcher */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Theme Switcher with Gear Icon */}
            <ThemeSwitcher />

            {isAuthenticated ? (
              <div className="flex items-center gap-2 sm:gap-2.5">
                {isStaff ? (
                  <Button
                    size="sm"
                    variant="clay"
                    onClick={() => navigate('/admin')}
                  >
                    Admin Portal
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => navigate('/dashboard')}
                  >
                    My Dashboard
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={logout}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Link to="/login">
                  <Button size="sm" variant="ghost" icon={LogIn}>
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" variant="primary" icon={UserPlus}>
                    Join SKYVENT
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[var(--ink-brown)] text-[var(--cream)] border-t border-[var(--coffee-brown)]/30 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-[var(--warm-gray)]/30">
            {/* Brand column */}
            <div className="md:col-span-2 space-y-3">
              <SkyventLogo size={32} withText={true} light={true} />
              <p className="text-xs text-[var(--sand)]/80 leading-relaxed max-w-sm">
                The comprehensive student organization management platform. Unifying memberships, events, ticketing, digital check-in, merchandise, and financial reporting.
              </p>
              <div className="text-xs text-[var(--clay-brown)] font-medium pt-1">
                "Connect. Organize. Celebrate."
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--sand)] mb-3">
                Quick Navigation
              </h5>
              <ul className="space-y-2 text-xs text-[var(--sand)]/70">
                <li><Link to="/events" className="hover:text-white transition-colors">Campus Events & Passes</Link></li>
                <li><Link to="/merchandise" className="hover:text-white transition-colors">Official Merchandise Store</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Student Member Portal</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors">About Platform</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--sand)]/60 gap-3">
            <div>
              © {new Date().getFullYear()} SKYVENT Student Organization Platform. All rights reserved.
            </div>
            <div className="text-[11px]">
              Built with React, Django & SQLite.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
