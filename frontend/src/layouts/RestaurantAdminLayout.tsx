import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import { 
  LayoutDashboard, 
  Layers, 
  ShoppingBag, 
  Utensils, 
  BarChart3, 
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  X, 
  Store
} from 'lucide-react';
import { NoticeBox } from '../components/NoticeBox';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
  badge?: React.ReactNode;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, active, onClick, badge }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
        active
          ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0">{icon}</div>
        <span className="truncate">{label}</span>
      </div>
      {badge && <div className="flex-shrink-0 ml-2">{badge}</div>}
    </Link>
  );
};

export const RestaurantAdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branding, setBranding] = useState<{ name: string; logo: string }>({ name: '', logo: '' });
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'restaurant_admin' || user.restaurantSlug !== slug) {
      navigate('/login?reason=Unauthorized+access');
    }
  }, [token, user, navigate, slug]);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await api.get('/restaurant/settings');
        // Fetch restaurant details (like name) from public details
        const detailsRes = await api.get(`/auth/restaurant/${slug}`);
        setBranding({
          name: detailsRes.data.name,
          logo: res.data.logo || '',
        });
      } catch (err) {
        console.error('Failed to load branding info', err);
      }
    };
    if (token && user?.role === 'restaurant_admin') fetchBranding();
  }, [token, user, slug]);

  useEffect(() => {
    const fetchPendingOrdersCount = async () => {
      try {
        const res = await api.get('/restaurant/orders?status=pending&limit=1');
        setPendingCount(res.data.totalCount || 0);
      } catch (err) {
        console.error('Failed to fetch pending orders count', err);
      }
    };
    if (token && user?.role === 'restaurant_admin') {
      fetchPendingOrdersCount();
      const interval = setInterval(fetchPendingOrdersCount, 5000);
      return () => clearInterval(interval);
    }
  }, [token, user]);

  const basePath = `/restaurant-admin/${slug}`;

  const menuItems = [
    { to: basePath, icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { to: `${basePath}/categories`, icon: <Layers className="w-5 h-5" />, label: 'Categories' },
    { to: `${basePath}/orders`, icon: <ShoppingBag className="w-5 h-5" />, label: 'Orders' },
    { to: `${basePath}/items`, icon: <Utensils className="w-5 h-5" />, label: 'Items' },
    { to: `${basePath}/analysis`, icon: <BarChart3 className="w-5 h-5" />, label: 'Analysis' },
    { to: `${basePath}/settings`, icon: <SettingsIcon className="w-5 h-5" />, label: 'Settings' },
  ];

  if (!token || !user || user.role !== 'restaurant_admin' || user.restaurantSlug !== slug) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-900 bg-slate-900/20 backdrop-blur-xl p-5 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-4 mb-8">
          {branding.logo ? (
            <img src={`http://localhost:5000${branding.logo}`} alt="Logo" className="h-9 w-9 object-cover rounded-xl" />
          ) : (
            <div className="bg-amber-600/10 p-2 rounded-xl border border-amber-500/20 text-amber-500">
              <Store className="w-6 h-6" />
            </div>
          )}
          <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent truncate">
            {branding.name || 'Restaurant Portal'}
          </span>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.to}
              badge={
                item.label === 'Orders' && pendingCount > 0 ? (
                  <span className="flex items-center justify-center bg-rose-500 text-white font-extrabold text-[10px] w-5 h-5 rounded-full animate-pulse shadow-md shadow-rose-500/25">
                    {pendingCount}
                  </span>
                ) : undefined
              }
            />
          ))}
        </nav>


        <div className="border-t border-slate-900 pt-4">
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-slate-950 border-r border-slate-900 p-5 h-full z-50">
            <div className="flex items-center justify-between py-4 mb-8">
              <div className="flex items-center gap-3">
                {branding.logo ? (
                  <img src={`http://localhost:5000${branding.logo}`} alt="Logo" className="h-8 w-8 object-cover rounded-lg" />
                ) : (
                  <Store className="w-6 h-6 text-amber-500" />
                )}
                <span className="font-bold text-base truncate">{branding.name || 'Restaurant Admin'}</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 space-y-2">
              {menuItems.map((item) => (
                <SidebarItem
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  active={location.pathname === item.to}
                  onClick={() => setSidebarOpen(false)}
                  badge={
                    item.label === 'Orders' && pendingCount > 0 ? (
                      <span className="flex items-center justify-center bg-rose-500 text-white font-extrabold text-[10px] w-5 h-5 rounded-full animate-pulse shadow-md shadow-rose-500/25">
                        {pendingCount}
                      </span>
                    ) : undefined
                  }
                />
              ))}
            </nav>

            <div className="border-t border-slate-900 pt-4">
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="flex-grow flex flex-col min-w-0 overflow-y-auto">
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-900 bg-slate-900/10 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold capitalize text-slate-300">
              {menuItems.find((item) => item.to === location.pathname)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="text-right hidden sm:block">
              <p className="font-semibold text-slate-200">{user.name}</p>
              <p className="text-xs text-slate-500 font-mono">{user.mobile}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-bold text-slate-950 shadow-md">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-grow p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      <NoticeBox />
    </div>
  );
};
