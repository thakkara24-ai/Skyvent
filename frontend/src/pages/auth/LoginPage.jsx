import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, LogIn, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { toast } from 'sonner';

import { SkyventLogo } from '../../components/common/Logo';

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

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <SkyventLogo size={52} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2A1E18]">
            Sign in to SKYVENT
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#7A6A5E]">
            Access your student membership, events, passes, and campus activities
          </p>
        </div>

        {/* Login Form */}
        <Card padding="lg" className="shadow-sm border-[#E8DCCE]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Student / Account Email Address"
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
