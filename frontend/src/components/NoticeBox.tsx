import React, { useState, useEffect } from 'react';
import api from '../api';
import { SmsLog } from '../types';
import { Bell, Copy, Check, X } from 'lucide-react';

export const NoticeBox: React.FC = () => {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      // In development, the SMS logs endpoint can be queried
      const res = await api.get('/super-admin/sms/logs');
      setLogs(res.data);
    } catch (err) {
      // Ignore unauthorized errors (e.g. before logging in)
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    // Try to extract 4 digit OTP, else copy whole message
    const otpMatch = text.match(/\b\d{4}\b/);
    const copyText = otpMatch ? otpMatch[0] : text;
    
    navigator.clipboard.writeText(copyText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (logs.length === 0 || !isOpen) return null;

  const latestLog = logs[0];

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl overflow-hidden glass-card">
      <div className="bg-amber-500/10 px-4 py-3 border-b border-amber-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
          <Bell className="w-4 h-4 animate-bounce" />
          <span>[Dev Mode] SMS Notice Box</span>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4">
        <p className="text-slate-400 text-xs font-mono mb-1">To: {latestLog.mobile}</p>
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-slate-200 font-sans text-sm select-all">
          {latestLog.message}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">
            {new Date(latestLog.createdAt).toLocaleTimeString()}
          </span>
          <button
            onClick={() => copyToClipboard(latestLog.message, latestLog._id)}
            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          >
            {copiedId === latestLog._id ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy OTP</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
