import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, Compass, Shield, ShoppingBag, LogIn, UserPlus, Sparkles } from 'lucide-react';
import { Button } from '../components/common/Button';

export const PublicLayout = () => {
  const { user, isAuthenticated, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/events' },
    { name: 'About', path: '/about' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2A1E18]">
      {/* Top Banner Tagline */}
      <div className="bg-[#2A1E18] text-[#E8DCCE] text-xs py-1.5 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        "One Campus. One Community. One Platform."
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8DCCE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#6B4A38] flex items-center justify-center text-[#FAF8F5] font-black tracking-tight text-lg shadow-xs group-hover:bg-[#2A1E18] transition-colors">
              S
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#2A1E18]">SKYVENT</span>
              <span className="block text-[10px] font-medium tracking-widest text-[#7A6A5E] uppercase -mt-1">
                Student Org Hub
              </span>
            </div>
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
                    isActive ? 'text-[#6B4A38] font-semibold' : 'text-[#7A6A5E] hover:text-[#2A1E18]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
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
              <div className="flex items-center gap-2.5">
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
      <footer className="bg-[#2A1E18] text-[#FAF8F5] border-t border-[#6B4A38]/30 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#7A6A5E]/30">
            {/* Brand column */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] flex items-center justify-center text-[#2A1E18] font-black">
                  S
                </div>
                <span className="text-xl font-bold tracking-tight text-white">SKYVENT</span>
              </div>
              <p className="text-xs text-[#E8DCCE]/80 leading-relaxed max-w-sm">
                The comprehensive student organization management platform. Unifying memberships, events, ticketing, digital check-in, merchandise, and financial reporting.
              </p>
              <div className="text-xs text-[#8B6353] font-medium pt-1">
                "Connect. Organize. Celebrate."
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-[#E8DCCE] mb-3">
                Platform
              </h5>
              <ul className="space-y-2 text-xs text-[#E8DCCE]/70">
                <li><Link to="/events" className="hover:text-white transition-colors">Campus Events</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Member Portal</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors">About System</Link></li>
              </ul>
            </div>

            {/* Demo Accounts Quick Info */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-[#E8DCCE] mb-3">
                Demo Accounts
              </h5>
              <div className="text-[11px] text-[#E8DCCE]/70 space-y-1 font-mono">
                <div>admin@skyvent.demo</div>
                <div>president@skyvent.demo</div>
                <div>treasurer@skyvent.demo</div>
                <div>volunteer@skyvent.demo</div>
                <div>member@skyvent.demo</div>
                <div className="text-[#8B6353] pt-1">Password: Skyvent@2026</div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#E8DCCE]/60 gap-3">
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
