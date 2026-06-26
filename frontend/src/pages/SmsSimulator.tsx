import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { SmsLog } from '../types';
import { 
  Send, 
  Trash2, 
  MessageSquare, 
  Phone, 
  Clock, 
  Loader2,
  Sparkles
} from 'lucide-react';

export const SmsSimulator: React.FC = () => {
  const queryClient = useQueryClient();
  const [mobile, setMobile] = useState('');
  const [message, setMessage] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch simulated logs
  const { data: logs, isLoading: logsLoading } = useQuery<SmsLog[]>({
    queryKey: ['sms-logs'],
    queryFn: async () => {
      const res = await api.get('/super-admin/sms/logs');
      return res.data;
    },
  });

  // Send Manual SMS Mutation
  const sendSmsMutation = useMutation({
    mutationFn: async (payload: { mobile: string; message: string }) => {
      const res = await api.post('/super-admin/sms/send', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-logs'] });
      setMobile('');
      setMessage('');
      setSuccessMsg('Simulated SMS sent successfully! Check logs below.');
      setTimeout(() => setSuccessMsg(null), 3500);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to dispatch SMS');
    },
  });

  // Clear Logs Mutation
  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete('/super-admin/sms/logs');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-logs'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile || !message) return;
    sendSmsMutation.mutate({ mobile, message });
  };

  const handleClearLogs = () => {
    if (window.confirm('Delete all simulated SMS history?')) {
      clearLogsMutation.mutate();
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Banner */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">SMS Gateway Simulator</h2>
        <p className="text-sm text-slate-400">Dispatch test SMS notifications to users. Output displays in the Notice Box.</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Form Panel */}
        <div className="md:col-span-1">
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-xl">
            <h3 className="text-base font-bold text-white mb-4">Send Custom SMS</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Recipient Mobile *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01700000000"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 pl-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Message Content *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={sendSmsMutation.isPending || !mobile || !message}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-50"
              >
                {sendSmsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Send SMS</span>
              </button>
            </form>
          </div>
        </div>

        {/* Logs Panel */}
        <div className="md:col-span-2">
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-xl overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-900 flex justify-between items-center bg-slate-900/10">
              <div className="flex items-center gap-2 text-indigo-400">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">Simulated SMS Output Logs</h3>
              </div>
              
              {logs && logs.length > 0 && (
                <button
                  onClick={handleClearLogs}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[360px] p-5 space-y-3">
              {logsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              ) : logs && logs.length > 0 ? (
                logs.map((log) => (
                  <div key={log._id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono text-slate-300 font-semibold">Recipient: {log.mobile}</span>
                      <div className="flex items-center gap-1 text-slate-500 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <p className="text-sm text-white bg-slate-900/40 p-2.5 rounded-lg border border-slate-900 select-all font-sans leading-relaxed">
                      {log.message}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
                  <Sparkles className="w-8 h-8 text-slate-700 animate-pulse" />
                  <p className="text-sm font-medium">No messages dispatched yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
