import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { GlobalSettings, User } from '../types';
import { 
  Upload, 
  Plus, 
  Trash2, 
  Calendar, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  KeyRound,
  Sparkles
} from 'lucide-react';

export const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [newAdminMobile, setNewAdminMobile] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch Global Settings
  const { data: settings, isLoading: settingsLoading } = useQuery<GlobalSettings>({
    queryKey: ['global-settings'],
    queryFn: async () => {
      const res = await api.get('/super-admin/settings');
      return res.data;
    },
  });

  // Fetch Super Admins List
  const { data: admins, isLoading: adminsLoading } = useQuery<User[]>({
    queryKey: ['super-admins'],
    queryFn: async () => {
      const res = await api.get('/super-admin/settings/admins');
      return res.data;
    },
  });

  // Upload Logo Mutation
  const logoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await api.post('/super-admin/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-settings'] });
      setLogoFile(null);
      setSuccessMsg('Logo updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Logo upload failed');
      setTimeout(() => setErrorMsg(null), 4000);
    },
  });

  // Create Super Admin Mutation
  const createAdminMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/super-admin/settings/admins', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admins'] });
      setNewAdminMobile('');
      setNewAdminPassword('');
      setSuccessMsg('New Super Admin login created!');
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to create Super Admin');
      setTimeout(() => setErrorMsg(null), 4500);
    },
  });

  // Delete Super Admin Mutation
  const deleteAdminMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/super-admin/settings/admins/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admins'] });
      setSuccessMsg('Super Admin account deleted');
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Deletion failed');
    },
  });

  const handleLogoUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoFile) return;
    logoMutation.mutate(logoFile);
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminMobile || !newAdminPassword) return;
    createAdminMutation.mutate({ mobile: newAdminMobile, password: newAdminPassword });
  };

  const handleDeleteAdmin = (id: string, mobile: string) => {
    if (window.confirm(`Are you sure you want to remove Super Admin login for ${mobile}?`)) {
      deleteAdminMutation.mutate(id);
    }
  };

  const isLoading = settingsLoading || adminsLoading;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Alert Notices */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Column 1: Branding Logo */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-xl">
              <h3 className="text-lg font-bold text-white mb-2">Global Branding Logo</h3>
              <p className="text-xs text-slate-400 mb-6">
                This logo updates the platform sidebar header and footers across all active restaurants.
              </p>

              <div className="flex items-center gap-6 mb-6">
                <div className="w-20 h-20 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center p-3">
                  {settings?.globalLogo ? (
                    <img 
                      src={`http://localhost:5000${settings.globalLogo}`} 
                      alt="Brand Logo" 
                      className="max-h-full max-w-full object-contain rounded"
                    />
                  ) : (
                    <Sparkles className="w-8 h-8 text-slate-700" />
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  <p className="font-semibold text-slate-200">Format: PNG, JPG, WEBP</p>
                  <p className="mt-1">Max resolution: 512x512 px</p>
                  <p className="mt-0.5">Size limit: 5MB</p>
                </div>
              </div>

              <form onSubmit={handleLogoUpload} className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700"
                />
                
                <button
                  type="submit"
                  disabled={!logoFile || logoMutation.isPending}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-5 rounded-xl text-xs transition-all disabled:opacity-50"
                >
                  {logoMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>Upload Logo</span>
                </button>
              </form>
            </div>
          </div>

          {/* Column 2: Create Super Admin Login */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <KeyRound className="w-5 h-5" />
                <h3 className="text-lg font-bold text-white">Create Super Admin</h3>
              </div>
              <p className="text-xs text-slate-400 mb-5">Add additional credentials to access this management dashboard.</p>

              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Mobile Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01700000001"
                    value={newAdminMobile}
                    onChange={(e) => setNewAdminMobile(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Secret Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={createAdminMutation.isPending || !newAdminMobile || !newAdminPassword}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-5 rounded-xl text-xs transition-all disabled:opacity-50"
                >
                  {createAdminMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Save Login</span>
                </button>
              </form>
            </div>
          </div>

          {/* Full Width Row: Super Admin Credentials Directory */}
          <div className="col-span-1 md:col-span-2">
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-xl overflow-hidden">
              <div className="p-6 border-b border-slate-900">
                <h3 className="font-bold text-lg text-white">Super Admin Accounts</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="p-4 pl-6">Admin Mobile</th>
                      <th className="p-4">Created Date</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-sm text-slate-300">
                    {admins && admins.length > 0 ? (
                      admins.map((adm) => (
                        <tr key={adm.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-4 pl-6 font-mono text-white">{adm.mobile}</td>
                          <td className="p-4 text-slate-400 flex items-center gap-1.5 mt-1 border-none">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <span>{new Date(adm.createdAt || '').toLocaleDateString()}</span>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <button
                              onClick={() => handleDeleteAdmin(adm.id, adm.mobile)}
                              className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                              disabled={admins.length <= 1}
                              title={admins.length <= 1 ? "Cannot delete the last admin accounts" : "Delete Login"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-6 text-center text-slate-500">
                          No Super Admin logs.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
