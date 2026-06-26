import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import { Shield, Lock, Phone, AlertCircle, Sparkles } from 'lucide-react';

const loginSchema = z.object({
  mobile: z.string().min(10, 'Mobile number must be at least 10 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFields = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(searchParams.get('reason'));
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFields) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.post('/auth/login', data);
      login(res.data.token, res.data.user);
      
      if (res.data.user.role === 'super_admin') {
        navigate('/super-admin');
      } else {
        // Restaurant admin dashboard routes are routed to a stub page
        navigate(`/restaurant-admin/${res.data.user.restaurantSlug}`);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid credentials or connection error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-black relative">
      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-xl shadow-2xl glass-card">
        <div className="flex flex-col items-center gap-3 mb-8 text-center">
          <div className="bg-indigo-600/10 p-3 rounded-2xl border border-indigo-500/20 text-indigo-400">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Access Portal</h2>
          <p className="text-sm text-slate-400">Sign in to manage your QR ordering SaaS</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Mobile Number
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="e.g. 01700000000"
                {...register('mobile')}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-sans"
              />
            </div>
            {errors.mobile && (
              <p className="mt-1.5 text-xs text-red-400">
                {errors.mobile.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-sans"
              />
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <a href="/forgot-password" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center gap-1 text-[10px] text-slate-500 uppercase tracking-widest">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>SaaS Contactless Ordering</span>
        </div>
      </div>
    </div>
  );
};
