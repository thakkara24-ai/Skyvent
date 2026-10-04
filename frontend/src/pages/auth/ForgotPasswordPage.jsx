import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { Mail, Lock, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { toast } from 'sonner';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset with OTP
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register: registerStep1, handleSubmit: handleSubmitStep1 } = useForm();
  const { register: registerStep2, handleSubmit: handleSubmitStep2, formState: { errors: errorsStep2 } } = useForm();

  const handleRequestOtp = async (data) => {
    setIsLoading(true);
    try {
      await authService.sendOtp(data.email, 'FORGOT_PASSWORD');
      setEmail(data.email);
      setStep(2);
      toast.success('Password reset code sent to your email.');
    } catch (err) {
      toast.error(err.message || 'Failed to send reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (data) => {
    setIsLoading(true);
    try {
      await authService.resetPassword({
        email,
        otp: data.otp,
        new_password: data.new_password,
      });
      toast.success('Password reset successfully! You can now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Invalid or expired code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[#6B4A38] text-white font-black text-2xl flex items-center justify-center mx-auto shadow-xs mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#2A1E18]">
            Reset Password
          </h2>
          <p className="mt-1 text-xs text-[#7A6A5E]">
            {step === 1 ? "Enter your registered student email" : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        <Card padding="lg">
          {step === 1 ? (
            <form onSubmit={handleSubmitStep1(handleRequestOtp)} className="space-y-4">
              <Input
                label="Student Email Address"
                type="email"
                placeholder="e.g. member@skyvent.demo"
                icon={Mail}
                required
                {...registerStep1('email', { required: true })}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full font-bold"
                icon={ArrowRight}
              >
                Send Reset Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmitStep2(handleResetPassword)} className="space-y-4">
              <Input
                label="6-Digit Verification Code"
                placeholder="123456"
                icon={KeyRound}
                error={errorsStep2.otp?.message}
                {...registerStep2('otp', { required: 'Code is required', minLength: 6, maxLength: 6 })}
              />

              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                icon={Lock}
                error={errorsStep2.new_password?.message}
                {...registerStep2('new_password', { required: 'New password is required', minLength: { value: 6, message: 'Minimum 6 chars' } })}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full font-bold"
                icon={CheckCircle2}
              >
                Confirm New Password
              </Button>
            </form>
          )}
        </Card>

        <p className="text-center text-xs text-[#7A6A5E]">
          Remember your password?{' '}
          <Link to="/login" className="font-bold text-[#6B4A38] hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};
