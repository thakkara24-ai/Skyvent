import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { notificationService } from '../services/api';
import { 
  Home, 
  Calendar, 
  CreditCard, 
  Ticket, 
  ShoppingBag, 
  Package,
  Bell, 
  User as UserIcon, 
  LogOut, 
  ShieldAlert,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { SkyventLogo } from '../components/common/Logo';
import { ThemeSwitcher } from '../components/common/ThemeSwitcher';

export const MemberLayout = () => {
  const { user, logout, isStaff } = useAuth();
  const { subscribe } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationService.getUnreadCount();
      if (res.data) setUnreadCount(res.data.unread_count);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const unsub = subscribe('notification_created', () => {
      fetchUnreadCount();
    });
    return unsub;
  }, [subscribe]);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Membership', path: '/membership', icon: CreditCard },
    { name: 'Store', path: '/store', icon: ShoppingBag },
    { name: 'My Tickets', path: '/my-tickets', icon: Ticket },
    { name: 'My Orders', path: '/my-orders', icon: Package },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--cream)] text-[var(--ink-brown)] transition-colors duration-200">
      {/* Member Navbar */}
      <header className="sticky top-0 z-40 bg-[var(--card-bg,white)] border-b border-[var(--sand)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-[var(--warm-gray)] hover:bg-[var(--cream)]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/dashboard" className="flex items-center gap-2.5">
              <SkyventLogo size={32} withText={true} />
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[var(--coffee-brown)]/10 text-[var(--coffee-brown)]'
                      : 'text-[var(--warm-gray)] hover:text-[var(--ink-brown)] hover:bg-[var(--cream)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isStaff && (
              <Button
                size="sm"
                variant="clay"
                icon={ShieldAlert}
                className="hidden sm:inline-flex text-xs py-1.5 font-bold shadow-xs"
                onClick={() => navigate('/admin')}
              >
                {user?.role === 'TREASURER' ? 'Treasurer Console' : user?.role === 'MERCHANDISE' ? 'Merchandise Console' : user?.role === 'VOLUNTEER' ? 'Volunteer Station' : 'Admin Console'}
              </Button>
            )}

            {/* Notification Bell */}
            <Link
              to="/notifications"
              className="relative p-2 rounded-lg text-[var(--warm-gray)] hover:text-[var(--ink-brown)] hover:bg-[var(--cream)] transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </Link>

            {/* Theme Switcher with Gear Icon */}
            <ThemeSwitcher />

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg hover:bg-[var(--cream)] border border-transparent hover:border-[var(--sand)] transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[var(--coffee-brown)] text-white flex items-center justify-center font-bold text-xs">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:block text-xs font-semibold text-[var(--ink-brown)] max-w-[100px] truncate">
                  {user?.name || 'Account'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--warm-gray)]" />
              </button>

              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-60 bg-[var(--card-bg,white)] border border-[var(--sand)] rounded-xl shadow-lg z-50 py-2 divide-y divide-[var(--sand)]/60 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5">
                      <p className="text-xs font-bold text-[var(--ink-brown)] truncate">{user?.name}</p>
                      <p className="text-[11px] text-[var(--warm-gray)] truncate">{user?.email}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <Badge variant="coffee" size="sm">
                          Member
                        </Badge>
                        {user?.role && user.role !== 'MEMBER' && (
                          <Badge
                            variant={user.role === 'SUPER_ADMIN' ? 'danger' : user.role === 'TREASURER' ? 'clay' : user.role === 'MERCHANDISE' ? 'default' : 'secondary'}
                            size="sm"
                          >
                            {user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'TREASURER' ? 'Treasurer' : user.role === 'MERCHANDISE' ? 'Merch Manager' : 'Volunteer'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="py-1">
                      {isStaff && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-[var(--coffee-brown)] font-bold bg-[var(--cream)] hover:bg-[var(--sand)]/40 transition-colors"
                        >
                          <ShieldAlert className="w-4 h-4 text-[var(--coffee-brown)]" />
                          <span>
                            {user?.role === 'TREASURER' ? 'Treasurer Console' : user?.role === 'MERCHANDISE' ? 'Merch Console' : user?.role === 'VOLUNTEER' ? 'Volunteer Station' : 'Admin Console'}
                          </span>
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-[var(--ink-brown)] hover:bg-[var(--cream)]"
                      >
                        <UserIcon className="w-4 h-4 text-[var(--warm-gray)]" />
                        <span>Profile & Settings</span>
                      </Link>
                      <Link
                        to="/membership"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-[var(--ink-brown)] hover:bg-[var(--cream)]"
                      >
                        <CreditCard className="w-4 h-4 text-[var(--warm-gray)]" />
                        <span>Membership Pass</span>
                      </Link>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-700 hover:bg-rose-50 cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--sand)] px-4 py-3 space-y-1 bg-[var(--cream)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold ${
                    isActive ? 'bg-[var(--coffee-brown)] text-white' : 'text-[var(--ink-brown)] hover:bg-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            {isStaff && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--clay-brown)] text-white mt-2"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Switch to Admin Panel</span>
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Main Outlet */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
};
