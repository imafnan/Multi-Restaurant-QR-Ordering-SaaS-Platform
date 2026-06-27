import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import { 
  DollarSign, 
  ShoppingBag, 
  Layers, 
  Utensils, 
  Users, 
  BellRing,
  AlertTriangle
} from 'lucide-react';

interface Stats {
  salesToday: number;
  totalOrdersToday: number;
  totalCategories: number;
  totalProducts: number;
  totalVisitors: number;
}

export const RestaurantDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [alert, setAlert] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await api.get('/restaurant/stats');
      setStats(statsRes.data);

      if (user?.restaurant) {
        const alertRes = await api.get(`/super-admin/alerts/${user.restaurant}`);
        if (alertRes.data && alertRes.data.message) {
          setAlert(alertRes.data.message);
        } else {
          setAlert(null);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Poll for alerts and stats updates every 5 seconds
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Today's Sales",
      value: `$${stats?.salesToday.toFixed(2) || '0.00'}`,
      icon: <DollarSign className="w-6 h-6 text-emerald-400" />,
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Total Orders Today",
      value: stats?.totalOrdersToday || 0,
      icon: <ShoppingBag className="w-6 h-6 text-blue-400" />,
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Total Categories",
      value: stats?.totalCategories || 0,
      icon: <Layers className="w-6 h-6 text-purple-400" />,
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Total Products",
      value: stats?.totalProducts || 0,
      icon: <Utensils className="w-6 h-6 text-amber-400" />,
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Total Visitors",
      value: stats?.totalVisitors || 0,
      icon: <Users className="w-6 h-6 text-pink-400" />,
      bg: "bg-pink-500/10 border-pink-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Super Admin Alert Notification */}
      {alert && (
        <div className="bg-gradient-to-r from-amber-600/20 via-orange-600/10 to-transparent border border-amber-500/30 p-5 rounded-2xl flex items-start gap-4 shadow-xl shadow-amber-950/10 relative overflow-hidden animate-pulse">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="bg-amber-500/20 p-3 rounded-xl border border-amber-500/30 text-amber-400 flex-shrink-0">
            <BellRing className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h4 className="font-bold text-amber-300 text-sm tracking-wide uppercase mb-1">
              Super Admin Announcement
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">{alert}</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card, i) => (
          <div
            key={i}
            className={`p-6 rounded-2xl border bg-slate-900/40 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 hover:bg-slate-900/60 shadow-lg ${card.bg}`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {card.title}
              </span>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5">
                {card.icon}
              </div>
            </div>
            <p className="text-3xl font-extrabold text-white tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Welcome Banner */}
      <div className="bg-slate-900/35 border border-slate-900 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 space-y-3">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xl font-sans">
            Use the sidebar controls to customize your branding logo, add categories, update menu products with variants/stock tracking, and manage your contactless QR Ordering menu portal.
          </p>
        </div>
      </div>
    </div>
  );
};
