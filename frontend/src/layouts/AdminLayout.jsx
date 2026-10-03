import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
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
  Radio,
  LogOut,
  ExternalLink
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { SkyventLogo } from '../components/common/Logo';


export const AdminLayout = () => {
  const { user, isStaff, logout } = useAuth();
  const { isConnected } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Authorization check
  if (!isStaff) {
    return <Navigate to="/dashboard" replace />;
  }

  const sidebarLinks = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Members', path: '/admin/members', icon: Users },
    { name: 'Memberships', path: '/admin/memberships', icon: CreditCard },
    { name: 'Events', path: '/admin/events', icon: Calendar },
    { name: 'Tickets', path: '/admin/tickets', icon: Ticket },
    { name: 'Check-In Station', path: '/admin/attendance', icon: QrCode, badge: 'Live QR' },
    { name: 'Merchandise', path: '/admin/products', icon: ShoppingBag },
    { name: 'Orders', path: '/admin/orders', icon: Package },
    { name: 'Announcements', path: '/admin/announcements', icon: Megaphone },
    { name: 'Fundraisers', path: '/admin/fundraisers', icon: HeartHandshake },
    { name: 'Tasks Board', path: '/admin/tasks', icon: KanbanSquare },
    { name: 'Finance & Claims', path: '/admin/finance', icon: Wallet },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: ScrollText },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-[#FAF8F5] text-[#2A1E18]">
      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#2A1E18]/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Desktop & Mobile Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#2A1E18] text-[#FAF8F5] flex flex-col transition-all duration-300 ${
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
            className="hidden lg:flex p-1 rounded-md text-[#E8DCCE]/60 hover:text-white hover:bg-white/10"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="lg:hidden p-1 rounded-md text-[#E8DCCE]/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Realtime WebSocket Badge */}
        <div className="px-4 py-2.5 bg-black/20 border-b border-white/5 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          {!sidebarCollapsed && (
            <span className="text-[11px] font-mono font-medium text-[#E8DCCE]/80">
              {isConnected ? 'Realtime Stream Active' : 'Connecting Stream...'}
            </span>
          )}
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
                    ? 'bg-[#6B4A38] text-white font-semibold'
                    : 'text-[#E8DCCE]/80 hover:bg-white/10 hover:text-white'
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
              <div className="w-8 h-8 rounded-full bg-[#6B4A38] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              {!sidebarCollapsed && (
                <div className="truncate text-left">
                  <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-[#E8DCCE]/60 truncate">{user?.role}</p>
                </div>
              )}
            </div>

            <button
              onClick={logout}
              className="p-1.5 text-[#E8DCCE]/70 hover:text-rose-400 hover:bg-white/10 rounded-md transition-colors cursor-pointer"
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
        <header className="sticky top-0 z-30 bg-white border-b border-[#E8DCCE] h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[#7A6A5E] hover:bg-[#FAF8F5]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-xs text-[#7A6A5E] font-medium hidden sm:flex items-center gap-1.5">
              <span>Admin Console</span>
              <span>/</span>
              <span className="text-[#2A1E18] font-semibold capitalize">
                {location.pathname.split('/')[2] || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E8DCCE] text-[#2A1E18] hover:bg-[#FAF8F5] transition-colors"
            >
              <span>View Member Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#7A6A5E]" />
            </Link>

            <Badge variant="coffee" size="md">
              {user?.role}
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
