import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PublicLayout } from '../layouts/PublicLayout';
import { MemberLayout } from '../layouts/MemberLayout';
import { AdminLayout } from '../layouts/AdminLayout';

import { LandingPage } from '../pages/public/LandingPage';
import { EventsPage } from '../pages/public/EventsPage';
import { EventDetailPage } from '../pages/public/EventDetailPage';
import { AboutPage } from '../pages/public/AboutPage';
import { MerchandiseShopPage } from '../pages/public/MerchandiseShopPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { VerifyEmailPage } from '../pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { MemberDashboardPage } from '../pages/member/MemberDashboardPage';
import { MembershipPage } from '../pages/member/MembershipPage';
import { MyTicketsPage } from '../pages/member/MyTicketsPage';
import { MyOrdersPage } from '../pages/member/MyOrdersPage';
import { NotificationsPage } from '../pages/member/NotificationsPage';
import { ProfilePage } from '../pages/member/ProfilePage';

const ProtectedRoute = ({ children }) => { const { isAuthenticated, isLoading } = useAuth(); if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading SKYVENT...</div>; return isAuthenticated ? children : <Navigate to="/login" replace />; };
const StaffRoute = ({ children }) => { const { isAuthenticated, isStaff, isLoading } = useAuth(); if (isLoading) return <div>Loading SKYVENT...</div>; if (!isAuthenticated) return <Navigate to="/login" replace />; return isStaff ? children : <Navigate to="/dashboard" replace />; };
const RoleRoute = ({ roles, children }) => { const { user, isLoading } = useAuth(); if (isLoading) return <div>Loading SKYVENT...</div>; if (!user) return <Navigate to="/login" replace />; if (user.is_superuser || user.role === "SUPER_ADMIN") return children; if (roles && !roles.includes(user.role)) return <Navigate to="/admin" replace />; return children; };

export const AppRoutes = () => (<Routes>
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
  <Route element={<ProtectedRoute><MemberLayout /></ProtectedRoute>}>
    <Route path="/dashboard" element={<MemberDashboardPage />} />
    <Route path="/membership" element={<MembershipPage />} />
    <Route path="/store" element={<MerchandiseShopPage />} />
    <Route path="/my-tickets" element={<MyTicketsPage />} />
    <Route path="/my-orders" element={<MyOrdersPage />} />
    <Route path="/notifications" element={<NotificationsPage />} />
    <Route path="/profile" element={<ProfilePage />} />
  </Route>
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>);
