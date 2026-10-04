import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Lock, Phone, GraduationCap, Building2, UserPlus } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { toast } from 'sonner';

import { SkyventLogo } from '../../components/common/Logo';

export const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await registerUser(data);
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please check form details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <SkyventLogo size={52} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2A1E18]">
            Create Student Account
          </h2>
          <p className="mt-1 text-xs text-[#7A6A5E]">
            Join SKYVENT to participate in events and access student memberships
          </p>
        </div>


        <Card padding="lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="e.g. Maya Lin"
              icon={User}
              error={errors.name?.message}
              {...register('name', { required: 'Full name is required' })}
            />

            <Input
              label="University Email"
              type="email"
              placeholder="e.g. maya.lin@campus.edu"
              icon={Mail}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address'
                }
              })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Student ID #"
                placeholder="STU-2026-XXXX"
                icon={GraduationCap}
                error={errors.student_id?.message}
                {...register('student_id', { required: 'Student ID is required' })}
              />

              <Input
                label="Department / Faculty"
                placeholder="e.g. Computer Science"
                icon={Building2}
                error={errors.department?.message}
                {...register('department', { required: 'Department is required' })}
              />
            </div>

            <Input
              label="Phone Number"
              type="tel"
              placeholder="+91 98765 43210"
              icon={Phone}
              {...register('phone')}
            />

            <Input
              label="Create Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              error={errors.password?.message}
              helperText="Must be at least 6 characters"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2 font-bold"
              icon={UserPlus}
            >
              Register & Send Verification Code
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-[#7A6A5E]">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#6B4A38] hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
