import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../api';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings as SettingsIcon, 
  MessageSquare, 
  LogOut, 
  Menu, 
  X, 
  Store,
  Sun,
  Moon
} from 'lucide-react';
import { NoticeBox } from '../components/NoticeBox';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, active, onClick }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
        active
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
      }`}
    >
      <div className="flex-shrink-0">{icon}</div>
      <span>{label}</span>
    </Link>
  );
};

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');

  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'super_admin') {
      navigate('/login?reason=Unauthorized+access');
    }
  }, [token, user, navigate]);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await api.get('/super-admin/settings');
        if (res.data && res.data.globalLogo) {
          setLogoUrl(res.data.globalLogo);
        }
      } catch (err) {
        console.error('Failed to load global logo', err);
      }
    };
    if (token) fetchLogo();
  }, [token]);

  const menuItems = [
    { to: '/super-admin', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/super-admin/users', icon: <Users className="w-5 h-5" />, label: 'All Users' },
    { to: '/super-admin/payments', icon: <CreditCard className="w-5 h-5" />, label: 'Payment' },
    { to: '/super-admin/settings', icon: <SettingsIcon className="w-5 h-5" />, label: 'Settings' },
    { to: '/super-admin/sms', icon: <MessageSquare className="w-5 h-5" />, label: 'SMS' },
  ];

  if (!token || !user || user.role !== 'super_admin') return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-900 bg-slate-900/20 backdrop-blur-xl p-5 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-4 mb-8">
          {logoUrl ? (
            <img src={`http://localhost:5000${logoUrl}`} alt="Logo" className="h-9 w-auto object-contain rounded-lg" />
          ) : (
            <div className="bg-indigo-600/10 p-2 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Store className="w-6 h-6" />
            </div>
          )}
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Antigravity QR
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
                {logoUrl ? (
                  <img src={`http://localhost:5000${logoUrl}`} alt="Logo" className="h-8 w-auto object-contain rounded-lg" />
                ) : (
                  <Store className="w-6 h-6 text-indigo-500" />
                )}
                <span className="font-bold text-base">Antigravity QR</span>
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
              {menuItems.find((item) => item.to === location.pathname)?.label || 'Super Admin'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-slate-900/40 border border-slate-800/40 transition-all cursor-pointer"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-3 text-sm">
              <div className="text-right hidden sm:block">
                <p className="font-semibold text-slate-200">{user.name}</p>
                <p className="text-xs text-slate-500 font-mono">{user.mobile}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-slate-950 shadow-md">
                SA
              </div>
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
