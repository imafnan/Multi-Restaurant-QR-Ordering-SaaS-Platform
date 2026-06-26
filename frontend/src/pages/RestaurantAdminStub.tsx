import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, LogOut, LayoutDashboard } from 'lucide-react';

export const RestaurantAdminStub: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { logout, token, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState('');

  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'restaurant_admin' || user.restaurantSlug !== slug) {
      navigate('/login?reason=Unauthorized+access');
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/auth/restaurant/${slug}`);
        setRestaurantName(res.data.name);
        setLoading(false);
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Deactivated restaurant portal');
        setLoading(false);
        // Automatically logout deactivated admins
        logout();
      }
    };
    checkStatus();
  }, [slug, token, user, navigate, logout]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-3xl border border-rose-500/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl glass-card flex flex-col items-center gap-5">
          <div className="bg-rose-500/10 p-4 rounded-2xl text-rose-500 border border-rose-500/20">
            <ShieldAlert className="w-10 h-10 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Dashboard Inaccessible</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your restaurant account has been disabled by the platform Super Admin. All dashboard services are temporarily suspended.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-6 rounded-xl text-xs transition-all"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md p-8 rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl flex flex-col items-center gap-6">
        <div className="bg-indigo-600/15 p-4 rounded-2xl text-indigo-400">
          <LayoutDashboard className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">{restaurantName} Portal</h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Welcome to the restaurant admin portal. <br />
          This dashboard panel will be fully designed and implemented in **Prompt 2**.
        </p>

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 font-semibold py-2.5 px-6 rounded-xl text-xs transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
