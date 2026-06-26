import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Phone, Lock, CheckCircle, KeyRound, AlertCircle, ArrowLeft } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'mobile' | 'otp' | 'reset'>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await api.post('/auth/request-otp', { mobile });
      setSuccessMsg('OTP generated successfully. Look at the simulated SMS Notice Box.');
      setStep('otp');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error requesting OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 4) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await api.post('/auth/verify-otp', { mobile, otp });
      setSuccessMsg('OTP verified. Set your new password.');
      setStep('reset');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      await api.post('/auth/reset-password', { mobile, otp, newPassword });
      setSuccessMsg('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-black">
      <div className="w-full max-w-md p-8 rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-xl shadow-2xl glass-card">
        
        <div className="mb-6">
          <a href="/login" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 font-semibold transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </a>
        </div>

        <div className="flex flex-col items-center gap-3 mb-8 text-center">
          <div className="bg-indigo-600/10 p-3 rounded-2xl border border-indigo-500/20 text-indigo-400">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Reset Password</h2>
          <p className="text-sm text-slate-400">Recover your Restaurant Admin account password</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 'mobile' && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 01700000000"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !mobile}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Send OTP</span>
              )}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
                Enter 4-Digit OTP
              </label>
              <input
                type="text"
                required
                maxLength={4}
                placeholder="0 0 0 0"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-4 text-center text-2xl font-bold tracking-[1.5em] pl-[1.5em] text-white focus:outline-none focus:border-indigo-500 transition-all"
              />
              <p className="mt-2 text-xs text-slate-400 text-center">
                OTP sent to {mobile}. Confirm button activates when 4 digits are entered.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 4}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Confirm OTP</span>
              )}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || newPassword.length < 6}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Save & Reset Password</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
