import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import { PublicLayout } from '../layouts/PublicLayout';
import { MemberLayout } from '../layouts/MemberLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Public Pages
import { LandingPage } from '../pages/public/LandingPage';
import { EventsPage } from '../pages/public/EventsPage';
import { EventDetailPage } from '../pages/public/EventDetailPage';
import { AboutPage } from '../pages/public/AboutPage';
import { MerchandiseShopPage } from '../pages/public/MerchandiseShopPage';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { VerifyEmailPage } from '../pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';

// Member Pages
import { MemberDashboardPage } from '../pages/member/MemberDashboardPage';
import { MembershipPage } from '../pages/member/MembershipPage';
import { MyTicketsPage } from '../pages/member/MyTicketsPage';
import { MyOrdersPage } from '../pages/member/MyOrdersPage';
import { NotificationsPage } from '../pages/member/NotificationsPage';
import { ProfilePage } from '../pages/member/ProfilePage';

// Admin Pages
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminMembersPage } from '../pages/admin/AdminMembersPage';
import { AdminMembershipsPage } from '../pages/admin/AdminMembershipsPage';
import { AdminEventsPage } from '../pages/admin/AdminEventsPage';
import { AdminEventFormPage } from '../pages/admin/AdminEventFormPage';
import { AdminTicketsPage } from '../pages/admin/AdminTicketsPage';
import { AdminAttendancePage } from '../pages/admin/AdminAttendancePage';
import { AdminProductsPage } from '../pages/admin/AdminProductsPage';
import { AdminOrdersPage } from '../pages/admin/AdminOrdersPage';
import { AdminAnnouncementsPage } from '../pages/admin/AdminAnnouncementsPage';
import { AdminFundraisersPage } from '../pages/admin/AdminFundraisersPage';
import { AdminTasksPage } from '../pages/admin/AdminTasksPage';
import { AdminFinancePage } from '../pages/admin/AdminFinancePage';
import { AdminReportsPage } from '../pages/admin/AdminReportsPage';
import { AdminAuditLogsPage } from '../pages/admin/AdminAuditLogsPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';

// Route Guards
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-xs text-[#7A6A5E]">Loading SKYVENT...</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const StaffRoute = ({ children }) => {
  const { isAuthenticated, isStaff, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-xs text-[#7A6A5E]">Loading SKYVENT...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return isStaff ? children : <Navigate to="/dashboard" replace />;
};

const RoleRoute = ({ roles, children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-xs text-[#7A6A5E]">Loading SKYVENT...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.is_superuser || user.role === 'SUPER_ADMIN') return children;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/merchandise" element={<MerchandiseShopPage />} />
        <Route path="/shop" element={<MerchandiseShopPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Member Protected Pages */}
      <Route element={<ProtectedRoute><MemberLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<MemberDashboardPage />} />
        <Route path="/membership" element={<MembershipPage />} />
        <Route path="/store" element={<MerchandiseShopPage />} />
        <Route path="/my-tickets" element={<MyTicketsPage />} />
        <Route path="/my-orders" element={<MyOrdersPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>


      {/* Admin / Staff Protected Pages */}
      <Route path="/admin" element={<StaffRoute><AdminLayout /></StaffRoute>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="members" element={<RoleRoute roles={['SUPER_ADMIN']}><AdminMembersPage /></RoleRoute>} />
        <Route path="memberships" element={<RoleRoute roles={['SUPER_ADMIN']}><AdminMembershipsPage /></RoleRoute>} />
        <Route path="events" element={<RoleRoute roles={['SUPER_ADMIN', 'VOLUNTEER']}><AdminEventsPage /></RoleRoute>} />
        <Route path="events/new" element={<RoleRoute roles={['SUPER_ADMIN', 'VOLUNTEER']}><AdminEventFormPage /></RoleRoute>} />
        <Route path="events/:id/edit" element={<RoleRoute roles={['SUPER_ADMIN', 'VOLUNTEER']}><AdminEventFormPage /></RoleRoute>} />
        <Route path="tickets" element={<RoleRoute roles={['SUPER_ADMIN', 'VOLUNTEER']}><AdminTicketsPage /></RoleRoute>} />
        <Route path="attendance" element={<RoleRoute roles={['SUPER_ADMIN', 'VOLUNTEER']}><AdminAttendancePage /></RoleRoute>} />
        <Route path="products" element={<RoleRoute roles={['SUPER_ADMIN', 'MERCHANDISE']}><AdminProductsPage /></RoleRoute>} />
        <Route path="orders" element={<RoleRoute roles={['SUPER_ADMIN', 'MERCHANDISE']}><AdminOrdersPage /></RoleRoute>} />
        <Route path="announcements" element={<RoleRoute roles={['SUPER_ADMIN']}><AdminAnnouncementsPage /></RoleRoute>} />
        <Route path="fundraisers" element={<RoleRoute roles={['SUPER_ADMIN', 'TREASURER']}><AdminFundraisersPage /></RoleRoute>} />
        <Route path="tasks" element={<RoleRoute roles={['SUPER_ADMIN', 'MERCHANDISE', 'TREASURER', 'VOLUNTEER']}><AdminTasksPage /></RoleRoute>} />
        <Route path="finance" element={<RoleRoute roles={['SUPER_ADMIN', 'TREASURER']}><AdminFinancePage /></RoleRoute>} />
        <Route path="reports" element={<RoleRoute roles={['SUPER_ADMIN', 'TREASURER']}><AdminReportsPage /></RoleRoute>} />
        <Route path="audit-logs" element={<RoleRoute roles={['SUPER_ADMIN']}><AdminAuditLogsPage /></RoleRoute>} />
        <Route path="settings" element={<RoleRoute roles={['SUPER_ADMIN']}><AdminSettingsPage /></RoleRoute>} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
