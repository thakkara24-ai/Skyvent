import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PublicLayout } from '../layouts/PublicLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { LandingPage } from '../pages/public/LandingPage';
import { AboutPage } from '../pages/public/AboutPage';
import { EventsPage } from '../pages/public/EventsPage';
import { EventDetailPage } from '../pages/public/EventDetailPage';
import { MerchandiseShopPage } from '../pages/public/MerchandiseShopPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { VerifyEmailPage } from '../pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
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

const Staff=({children})=>{const {isAuthenticated,isStaff,isLoading}=useAuth();if(isLoading)return <div className="min-h-screen flex items-center justify-center">Loading SKYVENT...</div>;if(!isAuthenticated)return <Navigate to="/login" replace/>;return isStaff?children:<Navigate to="/events" replace/>};
export const AppRoutes=()=> <Routes>
<Route element={<PublicLayout/>}><Route path="/" element={<LandingPage/>}/><Route path="/about" element={<AboutPage/>}/><Route path="/events" element={<EventsPage/>}/><Route path="/events/:id" element={<EventDetailPage/>}/><Route path="/merchandise" element={<MerchandiseShopPage/>}/><Route path="/shop" element={<MerchandiseShopPage/>}/><Route path="/login" element={<LoginPage/>}/><Route path="/register" element={<RegisterPage/>}/><Route path="/verify-email" element={<VerifyEmailPage/>}/><Route path="/forgot-password" element={<ForgotPasswordPage/>}/></Route>
<Route path="/admin" element={<Staff><AdminLayout/></Staff>}><Route index element={<AdminDashboardPage/>}/><Route path="members" element={<AdminMembersPage/>}/><Route path="memberships" element={<AdminMembershipsPage/>}/><Route path="events" element={<AdminEventsPage/>}/><Route path="events/new" element={<AdminEventFormPage/>}/><Route path="events/:id/edit" element={<AdminEventFormPage/>}/><Route path="tickets" element={<AdminTicketsPage/>}/><Route path="attendance" element={<AdminAttendancePage/>}/><Route path="products" element={<AdminProductsPage/>}/><Route path="orders" element={<AdminOrdersPage/>}/><Route path="announcements" element={<AdminAnnouncementsPage/>}/><Route path="fundraisers" element={<AdminFundraisersPage/>}/><Route path="tasks" element={<AdminTasksPage/>}/><Route path="finance" element={<AdminFinancePage/>}/><Route path="reports" element={<AdminReportsPage/>}/><Route path="audit-logs" element={<AdminAuditLogsPage/>}/><Route path="settings" element={<AdminSettingsPage/>}/></Route>
<Route path="*" element={<Navigate to="/" replace/>}/></Routes>;
