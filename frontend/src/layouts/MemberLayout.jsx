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
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2A1E18]">
      {/* Member Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E8DCCE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-[#7A6A5E] hover:bg-[#FAF8F5]"
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
                      ? 'bg-[#6B4A38]/10 text-[#6B4A38]'
                      : 'text-[#7A6A5E] hover:text-[#2A1E18] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {isStaff && (
              <Button
                size="sm"
                variant="clay"
                className="hidden sm:inline-flex text-xs py-1.5"
                onClick={() => navigate('/admin')}
              >
                Admin Panel
              </Button>
            )}

            {/* Notification Bell */}
            <Link
              to="/notifications"
              className="relative p-2 rounded-lg text-[#7A6A5E] hover:text-[#2A1E18] hover:bg-[#FAF8F5] transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </Link>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg hover:bg-[#FAF8F5] border border-transparent hover:border-[#E8DCCE] transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#6B4A38] text-white flex items-center justify-center font-bold text-xs">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:block text-xs font-semibold text-[#2A1E18] max-w-[100px] truncate">
                  {user?.name || 'Account'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#7A6A5E]" />
              </button>

              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E8DCCE] rounded-xl shadow-lg z-50 py-2 divide-y divide-[#E8DCCE]/60 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2">
                      <p className="text-xs font-bold text-[#2A1E18] truncate">{user?.name}</p>
                      <p className="text-[11px] text-[#7A6A5E] truncate">{user?.email}</p>
                      <div className="mt-1.5">
                        <Badge variant="coffee" size="sm">
                          {user?.role?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-[#2A1E18] hover:bg-[#FAF8F5]"
                      >
                        <UserIcon className="w-4 h-4 text-[#7A6A5E]" />
                        <span>Profile & Settings</span>
                      </Link>
                      <Link
                        to="/membership"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-[#2A1E18] hover:bg-[#FAF8F5]"
                      >
                        <CreditCard className="w-4 h-4 text-[#7A6A5E]" />
                        <span>Membership Pass</span>
                      </Link>
                      {isStaff && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs text-[#8B6353] font-semibold hover:bg-[#FAF8F5]"
                        >
                          <ShieldAlert className="w-4 h-4 text-[#8B6353]" />
                          <span>Admin Console</span>
                        </Link>
                      )}
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
          <div className="md:hidden border-t border-[#E8DCCE] px-4 py-3 space-y-1 bg-[#FAF8F5]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold ${
                    isActive ? 'bg-[#6B4A38] text-white' : 'text-[#2A1E18] hover:bg-white'
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
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#8B6353] text-white mt-2"
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
