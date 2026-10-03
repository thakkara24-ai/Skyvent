import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, LogIn, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { toast } from 'sonner';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const user = await login(data.email, data.password);
      if (['SUPER_ADMIN', 'PRESIDENT', 'TREASURER', 'VOLUNTEER'].includes(user.role)) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoCredentials = (email, role) => {
    setValue('email', email);
    setValue('password', 'Skyvent@2026');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[#6B4A38] text-white font-black text-2xl flex items-center justify-center mx-auto shadow-xs mb-3">
            S
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2A1E18]">
            Sign in to SKYVENT
          </h2>
          <p className="mt-1 text-xs text-[#7A6A5E]">
            Access your student organization dashboard and tickets
          </p>
        </div>

        {/* Demo Account Fillers */}
        <div className="bg-[#E8DCCE]/40 border border-[#E8DCCE] rounded-xl p-3.5 space-y-2">
          <span className="text-[11px] font-bold text-[#6B4A38] uppercase tracking-wider block">
            ⚡ Quick Demo Accounts (Click to Fill)
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setDemoCredentials('admin@skyvent.demo', 'Admin')}
              className="px-2 py-1 bg-white border border-[#E8DCCE] rounded-md text-[#2A1E18] hover:bg-[#FAF8F5] text-[11px] font-medium text-left truncate cursor-pointer"
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('president@skyvent.demo', 'President')}
              className="px-2 py-1 bg-white border border-[#E8DCCE] rounded-md text-[#2A1E18] hover:bg-[#FAF8F5] text-[11px] font-medium text-left truncate cursor-pointer"
            >
              President
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('treasurer@skyvent.demo', 'Treasurer')}
              className="px-2 py-1 bg-white border border-[#E8DCCE] rounded-md text-[#2A1E18] hover:bg-[#FAF8F5] text-[11px] font-medium text-left truncate cursor-pointer"
            >
              Treasurer
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('volunteer@skyvent.demo', 'Volunteer')}
              className="px-2 py-1 bg-white border border-[#E8DCCE] rounded-md text-[#2A1E18] hover:bg-[#FAF8F5] text-[11px] font-medium text-left truncate cursor-pointer"
            >
              Volunteer
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('member@skyvent.demo', 'Member')}
              className="col-span-2 px-2 py-1 bg-[#6B4A38] text-white rounded-md text-[11px] font-medium text-center truncate cursor-pointer hover:bg-[#563B2C]"
            >
              Demo Member (Lucas)
            </button>
          </div>
        </div>

        {/* Login Form */}
        <Card padding="lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Student Email Address"
              type="email"
              placeholder="e.g. member@skyvent.demo"
              icon={Mail}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address'
                }
              })}
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[#2A1E18] uppercase tracking-wider">Password</span>
                <Link to="/forgot-password" className="text-xs text-[#6B4A38] hover:underline font-medium">
                  Forgot?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                icon={Lock}
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2 font-bold"
              icon={LogIn}
            >
              Sign In
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-[#7A6A5E]">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-[#6B4A38] hover:underline">
            Register for SKYVENT
          </Link>
        </p>
      </div>
    </div>
  );
};
