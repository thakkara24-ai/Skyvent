import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { notificationService } from '../services/api';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Calendar, 
  Ticket, 
  QrCode, 
  ShoppingBag, 
  Package, 
  Megaphone, 
  HeartHandshake, 
  KanbanSquare, 
  Wallet, 
  BarChart3, 
  ScrollText, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  ExternalLink,
  Bell
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { SkyventLogo } from '../components/common/Logo';
import { ThemeSwitcher } from '../components/common/ThemeSwitcher';

export const AdminLayout = () => {
  const { user, isStaff, logout } = useAuth();
  const { subscribe } = useSocket();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationService.getUnreadCount();
      if (res.data?.unread_count !== undefined) {
        setUnreadCount(res.data.unread_count);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const unsub = subscribe?.('notification_created', () => {
      fetchUnreadCount();
    });
    return unsub;
  }, [subscribe]);

  // Authorization check
  if (!isStaff) {
    return <Navigate to="/dashboard" replace />;
  }

  // Define role-filtered navigation items
  const allSidebarLinks = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'MERCHANDISE', 'TREASURER', 'VOLUNTEER'] },
    { name: 'Members', path: '/admin/members', icon: Users, roles: ['SUPER_ADMIN'] },
    { name: 'Memberships', path: '/admin/memberships', icon: CreditCard, roles: ['SUPER_ADMIN'] },
    { name: 'Events', path: '/admin/events', icon: Calendar, roles: ['SUPER_ADMIN', 'VOLUNTEER'] },
    { name: 'Tickets', path: '/admin/tickets', icon: Ticket, roles: ['SUPER_ADMIN', 'VOLUNTEER'] },
    { name: 'Check-In Station', path: '/admin/attendance', icon: QrCode, badge: 'Live QR', roles: ['SUPER_ADMIN', 'VOLUNTEER'] },
    { name: 'Merchandise', path: '/admin/products', icon: ShoppingBag, roles: ['SUPER_ADMIN', 'MERCHANDISE'] },
    { name: 'Orders', path: '/admin/orders', icon: Package, roles: ['SUPER_ADMIN', 'MERCHANDISE'] },
    { name: 'Announcements', path: '/admin/announcements', icon: Megaphone, roles: ['SUPER_ADMIN'] },
    { name: 'Fundraisers', path: '/admin/fundraisers', icon: HeartHandshake, roles: ['SUPER_ADMIN', 'TREASURER'] },
    { name: 'Tasks Board', path: '/admin/tasks', icon: KanbanSquare, roles: ['SUPER_ADMIN', 'MERCHANDISE', 'TREASURER', 'VOLUNTEER'] },
    { name: 'Finance & Claims', path: '/admin/finance', icon: Wallet, roles: ['SUPER_ADMIN', 'TREASURER'] },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'TREASURER'] },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: ScrollText, roles: ['SUPER_ADMIN'] },
    { name: 'Settings', path: '/admin/settings', icon: Settings, roles: ['SUPER_ADMIN'] },
  ];

  const sidebarLinks = allSidebarLinks.filter(link => 
    !link.roles || link.roles.includes(user?.role) || user?.is_superuser
  );

  return (
    <div className="min-h-screen flex bg-[var(--cream)] text-[var(--ink-brown)] transition-colors duration-200">
      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-[var(--ink-brown)]/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Desktop & Mobile Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[var(--ink-brown)] text-[var(--cream)] flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
          <Link to="/admin" className="flex items-center gap-3 overflow-hidden">
            <SkyventLogo size={32} withText={!sidebarCollapsed} light={true} />
          </Link>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-1 rounded-md text-[var(--sand)]/60 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="lg:hidden p-1 rounded-md text-[var(--sand)]/60 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path || (link.path !== '/admin' && location.pathname.startsWith(link.path));

            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileDrawerOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--coffee-brown)] text-white font-semibold shadow-xs'
                    : 'text-[var(--sand)]/80 hover:bg-white/10 hover:text-white'
                }`}
                title={sidebarCollapsed ? link.name : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span className="flex-1 truncate">{link.name}</span>}
                {!sidebarCollapsed && link.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer User Info */}
        <div className="p-3 border-t border-white/10 bg-black/20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[var(--coffee-brown)] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              {!sidebarCollapsed && (
                <div className="truncate text-left">
                  <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-[var(--sand)]/60 truncate">{user?.role}</p>
                </div>
              )}
            </div>

            <button
              onClick={logout}
              className="p-1.5 text-[var(--sand)]/70 hover:text-rose-400 hover:bg-white/10 rounded-md transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-[var(--card-bg,white)] border-b border-[var(--sand)] h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[var(--warm-gray)] hover:bg-[var(--cream)]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-xs text-[var(--warm-gray)] font-medium hidden sm:flex items-center gap-1.5">
              <span>Admin Console</span>
              <span>/</span>
              <span className="text-[var(--ink-brown)] font-semibold capitalize">
                {location.pathname.split('/')[2] || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Theme Gear Switcher */}
            <ThemeSwitcher />

            <Link
              to="/admin/notifications"
              className="relative p-2 rounded-lg text-[var(--warm-gray)] hover:text-[var(--ink-brown)] hover:bg-[var(--cream)] transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </Link>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--sand)] text-[var(--ink-brown)] hover:bg-[var(--cream)] transition-colors"
            >
              <span>Member Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-[var(--warm-gray)]" />
            </Link>

            <Badge 
              variant={user?.role === 'SUPER_ADMIN' ? 'danger' : user?.role === 'MERCHANDISE' ? 'coffee' : user?.role === 'TREASURER' ? 'clay' : user?.role === 'VOLUNTEER' ? 'default' : 'secondary'} 
              size="md"
            >
              {user?.role?.replace('_', ' ')}
            </Badge>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
