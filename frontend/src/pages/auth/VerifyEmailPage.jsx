import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, CheckCircle2, RefreshCw, KeyRound, ArrowRight } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { toast } from 'sonner';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyOtp, sendOtp } = useAuth();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // 60-second cooldown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }
    if (otp.length !== 6) {
      toast.error('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await verifyOtp(email, otp, 'REGISTER');
      if (data?.user) {
        if (['SUPER_ADMIN', 'PRESIDENT', 'TREASURER', 'VOLUNTEER'].includes(data.user.role)) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.message || 'Invalid or expired code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Please provide your email address to resend OTP.');
      return;
    }
    try {
      await sendOtp(email, 'REGISTER');
      setCooldown(60);
      setCanResend(false);
    } catch (err) {
      toast.error(err.message || 'Failed to resend code.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[#6B4A38] text-white font-black text-2xl flex items-center justify-center mx-auto shadow-xs mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#2A1E18]">
            Verify Email Address
          </h2>
          <p className="mt-1 text-xs text-[#7A6A5E]">
            A 6-digit verification code was sent to <strong className="text-[#2A1E18]">{email || 'your email'}</strong>
          </p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleVerify} className="space-y-4">
            {!searchParams.get('email') && (
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                icon={Mail}
                required
              />
            )}

            <div>
              <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-2">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className="w-full text-center tracking-[0.75em] text-2xl font-mono font-bold py-3 bg-white border border-[#E8DCCE] rounded-xl focus:border-[#6B4A38] focus:ring-1 focus:ring-[#6B4A38] focus:outline-none transition-colors"
                autoFocus
              />
              <p className="mt-1.5 text-[11px] text-[#7A6A5E] text-center">
                Code expires in 5 minutes
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full font-bold"
              icon={CheckCircle2}
            >
              Verify & Enter Platform
            </Button>
          </form>

          {/* Resend Cooldown */}
          <div className="mt-5 pt-4 border-t border-[#E8DCCE] text-center">
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B4A38] hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Resend Code
              </button>
            ) : (
              <span className="text-xs text-[#7A6A5E]">
                Resend code available in <strong className="text-[#2A1E18]">{cooldown}s</strong>
              </span>
            )}
          </div>
        </Card>

        <p className="text-center text-xs text-[#7A6A5E]">
          Need to change email?{' '}
          <Link to="/register" className="font-bold text-[#6B4A38] hover:underline">
            Back to Register
          </Link>
        </p>
      </div>
    </div>
  );
};
