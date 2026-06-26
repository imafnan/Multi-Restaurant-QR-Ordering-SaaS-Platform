import React from 'react';
import { Heart, Sparkles } from 'lucide-react';

export const ThankYou: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black text-white text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-[0.03]" />
      
      <div className="relative z-10 max-w-2xl px-8 py-12 rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl flex flex-col items-center gap-6">
        <div className="bg-gradient-to-tr from-indigo-500 to-pink-500 p-4 rounded-2xl shadow-xl flex items-center justify-center animate-pulse">
          <Heart className="w-10 h-10 text-white fill-white" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
          Thank You for Ordering!
        </h1>
        
        <p className="text-lg text-slate-300 max-w-md mx-auto leading-relaxed">
          We hope you enjoyed your dining experience. If you are a restaurant owner looking to launch contactless QR menus, click below.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full justify-center">
          <a
            href="/login"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl shadow-lg transition-all hover:scale-105"
          >
            Go to Dashboard Login
          </a>
        </div>

        <div className="mt-8 flex items-center gap-1.5 text-xs text-slate-500 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Multi-Restaurant QR SaaS Platform</span>
        </div>
      </div>
    </div>
  );
};
