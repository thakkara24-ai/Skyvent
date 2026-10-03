import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PublicLayout } from '../layouts/PublicLayout';
import { MemberLayout } from '../layouts/MemberLayout';
import { LandingPage } from '../pages/public/LandingPage';
import { AboutPage } from '../pages/public/AboutPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { VerifyEmailPage } from '../pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { MemberDashboardPage } from '../pages/member/MemberDashboardPage';
import { MembershipPage } from '../pages/member/MembershipPage';
import { ProfilePage } from '../pages/member/ProfilePage';

const Protected=({children})=>{const {isAuthenticated,isLoading}=useAuth();if(isLoading)return <div className="min-h-screen flex items-center justify-center">Loading SKYVENT...</div>;return isAuthenticated?children:<Navigate to="/login" replace/>};
export const AppRoutes=()=> <Routes>
<Route element={<PublicLayout/>}>
<Route path="/" element={<LandingPage/>}/><Route path="/about" element={<AboutPage/>}/><Route path="/login" element={<LoginPage/>}/><Route path="/register" element={<RegisterPage/>}/><Route path="/verify-email" element={<VerifyEmailPage/>}/><Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
</Route>
<Route element={<Protected><MemberLayout/></Protected>}>
<Route path="/dashboard" element={<MemberDashboardPage/>}/><Route path="/membership" element={<MembershipPage/>}/><Route path="/profile" element={<ProfilePage/>}/>
</Route>
<Route path="*" element={<Navigate to="/" replace/>}/></Routes>;
