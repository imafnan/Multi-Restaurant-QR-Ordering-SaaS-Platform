import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { UtensilsCrossed, ShieldAlert, Heart } from 'lucide-react';

export const RestaurantMenuStub: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantLoc, setRestaurantLoc] = useState('');

  useEffect(() => {
    const fetchRest = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/auth/restaurant/${slug}`);
        setRestaurantName(res.data.name);
        setRestaurantLoc(res.data.location);
        setLoading(false);
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Failed to fetch restaurant details');
        setLoading(false);
      }
    };
    fetchRest();
  }, [slug]);

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
          <h2 className="text-2xl font-bold tracking-tight text-white">Menu Unavailable</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            {errorMsg.includes('disabled') 
              ? "This restaurant's contactless QR ordering menu has been temporarily disabled by the Super Admin."
              : errorMsg}
          </p>
          <a href="/" className="mt-2 text-xs font-semibold text-indigo-400 hover:underline">
            Go back home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-950 via-slate-900 to-black text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-[0.02]" />
      
      <div className="relative z-10 max-w-md w-full p-8 rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl flex flex-col items-center gap-6">
        <div className="bg-gradient-to-tr from-indigo-500 to-pink-500 p-4 rounded-2xl shadow-xl flex items-center justify-center">
          <UtensilsCrossed className="w-10 h-10 text-white" />
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
            {restaurantName}
          </h1>
          <p className="text-xs text-slate-400 font-mono tracking-wider">{restaurantLoc}</p>
        </div>

        <div className="w-full bg-slate-950/60 rounded-2xl p-5 border border-slate-850 text-center text-sm text-slate-300 leading-relaxed">
          🍴 Welcome to our QR Menu! <br />
          This QR Menu interface will be fully developed during Phase 2.
        </div>

        <div className="text-[10px] text-slate-600 font-mono flex items-center gap-1">
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          <span>Antigravity QR Ordering SaaS</span>
        </div>
      </div>
    </div>
  );
};
