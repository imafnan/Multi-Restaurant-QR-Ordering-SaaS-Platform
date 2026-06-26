import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { Restaurant } from '../types';
import { 
  Plus, 
  Search, 
  Eye, 
  Trash2, 
  Ban, 
  CheckCircle2, 
  X, 
  MapPin, 
  DollarSign, 
  Phone, 
  Calendar,
  FileText,
  Loader2
} from 'lucide-react';

export const AllUsers: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // Form states (Create Restaurant User)
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [subscriptionFee, setSubscriptionFee] = useState('');
  const [adminMobile, setAdminMobile] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [regFile, setRegFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  // Query Restaurants
  const { data: restaurants, isLoading } = useQuery<Restaurant[]>({
    queryKey: ['restaurants', searchTerm, statusFilter],
    queryFn: async () => {
      const res = await api.get('/super-admin/restaurants', {
        params: {
          search: searchTerm,
          status: statusFilter === 'all' ? undefined : statusFilter,
        },
      });
      return res.data;
    },
  });

  // Create Restaurant Mutation
  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/super-admin/restaurants', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      closeCreateModal();
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to create restaurant');
    },
  });

  // Toggle Status Mutation (Disable/Enable)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'disabled' }) => {
      const res = await api.put(`/super-admin/restaurants/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });

  // Delete Restaurant Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/super-admin/restaurants/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile || !location || !subscriptionFee || !adminMobile || !adminPassword) {
      alert('Please fill out all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('mobile', mobile);
    if (email) formData.append('email', email);
    formData.append('location', location);
    formData.append('subscriptionFee', subscriptionFee);
    formData.append('adminMobile', adminMobile);
    formData.append('adminPassword', adminPassword);

    if (regFile) formData.append('registrationFormImage', regFile);
    if (licenseFile) formData.append('tradeLicenseImage', licenseFile);

    createMutation.mutate(formData);
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setName('');
    setMobile('');
    setEmail('');
    setLocation('');
    setSubscriptionFee('');
    setAdminMobile('');
    setAdminPassword('');
    setRegFile(null);
    setLicenseFile(null);
  };

  const handleToggleStatus = (restaurant: Restaurant) => {
    const nextStatus = restaurant.status === 'active' ? 'disabled' : 'active';
    const action = restaurant.status === 'active' ? 'Disable' : 'Enable';
    if (window.confirm(`Are you sure you want to ${action} ${restaurant.name}?`)) {
      toggleStatusMutation.mutate({ id: restaurant._id, status: nextStatus });
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`⚠️ PERMANENT DELETE WARNING ⚠️\nDeleting "${name}" will permanently wipe: \n- Restaurant Data\n- Products & Categories\n- Orders & Analytics\n- All Files & Admin Logins.\n\nAre you absolutely sure you want to proceed?`)) {
      deleteMutation.mutate(id);
    }
  };

  const openViewModal = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsViewOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Restaurant Directory</h2>
          <p className="text-sm text-slate-400">Manage, review, disable, or delete SaaS restaurant accounts</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-3 rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <Plus className="w-5 h-5" />
          <span>Create User</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search name or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex p-1 bg-slate-900 border border-slate-850 rounded-xl w-full md:w-auto">
          {(['all', 'active', 'disabled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`flex-1 md:flex-none capitalize px-5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === status
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table UI */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 pl-6">Restaurant Name</th>
                  <th className="p-4">Store Mobile</th>
                  <th className="p-4">Admin Mobile</th>
                  <th className="p-4">Subscription</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-sm text-slate-300">
                {restaurants && restaurants.length > 0 ? (
                  restaurants.map((rest) => (
                    <tr key={rest._id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4 pl-6 font-medium text-white">{rest.name}</td>
                      <td className="p-4 font-mono text-slate-400">{rest.mobile}</td>
                      <td className="p-4 font-mono text-slate-400">{rest.adminMobile || 'N/A'}</td>
                      <td className="p-4 font-mono text-indigo-400 font-semibold">${rest.subscriptionFee}/mo</td>
                      <td className="p-4">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                          rest.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {rest.status === 'active' ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openViewModal(rest)}
                            title="View Record"
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-750 transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(rest)}
                            title={rest.status === 'active' ? 'Disable Account' : 'Activate Account'}
                            className={`p-2 rounded-lg border transition-all ${
                              rest.status === 'active'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500 hover:text-white'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white'
                            }`}
                          >
                            {rest.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(rest._id, rest.name)}
                            title="Delete Permanently"
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No restaurants match the search filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Popup Form Modal — Create Restaurant User */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeCreateModal} />
          
          <div className="relative w-full max-w-2xl p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl glass-card overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <h3 className="font-extrabold text-lg text-white">Create Restaurant & Admin User</h3>
              <button onClick={closeCreateModal} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Store Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wide border-b border-slate-800 pb-1">Restaurant Details</h4>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Restaurant Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gourmet Burger"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Restaurant Phone *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 01711111111"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="e.g. info@gourmet.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Location *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Banani, Dhaka"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Monthly Subscription Fee ($) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="e.g. 49"
                      value={subscriptionFee}
                      onChange={(e) => setSubscriptionFee(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {/* Admin user section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wide border-b border-slate-800 pb-1">Admin Credentials</h4>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Admin Mobile Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 01722222222"
                      value={adminMobile}
                      onChange={(e) => setAdminMobile(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Admin Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
                    />
                  </div>

                  <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wide border-b border-slate-800 pb-1 pt-2">Documentation Uploads</h4>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Registration Form Image</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setRegFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Trade License Image</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700"
                    />
                  </div>

                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Register Restaurant</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Read Only Modal Popup — View User */}
      {isViewOpen && selectedRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsViewOpen(false)} />
          
          <div className="relative w-full max-w-2xl p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl glass-card overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <h3 className="font-extrabold text-lg text-white">Restaurant Profile Details</h3>
              <button onClick={() => setIsViewOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2 text-sm text-slate-300">
              
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Restaurant Name</span>
                  <span className="text-base font-semibold text-white">{selectedRestaurant.name}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Restaurant Mobile</span>
                  <span className="text-base font-mono text-white">{selectedRestaurant.mobile}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Email Address</span>
                  <span className="text-base text-white">{selectedRestaurant.email || 'None Provided'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Location Address</span>
                  <div className="flex items-center gap-1.5 text-white text-base mt-0.5">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span>{selectedRestaurant.location}</span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Monthly Fee</span>
                  <div className="flex items-center gap-0.5 text-indigo-400 font-extrabold text-base mt-0.5">
                    <DollarSign className="w-4 h-4" />
                    <span>{selectedRestaurant.subscriptionFee} USD / month</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Admin Login Mobile</span>
                  <div className="flex items-center gap-1.5 text-white text-base mt-0.5">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span className="font-mono">{selectedRestaurant.adminMobile}</span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Onboarding Date</span>
                  <div className="flex items-center gap-1.5 text-white text-base mt-0.5">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>{new Date(selectedRestaurant.openingDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Total Website Visitors</span>
                  <span className="text-base font-bold text-white font-mono">{selectedRestaurant.visitorsCount.toLocaleString()}</span>
                </div>

                <div>
                  <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider mb-1">Uploaded Documents</span>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1">Registration Form</span>
                      {selectedRestaurant.registrationFormImage ? (
                        <a
                          href={`http://localhost:5000${selectedRestaurant.registrationFormImage}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-black rounded-lg border border-slate-800 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Doc</span>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-600 italic">Not Uploaded</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1">Trade License</span>
                      {selectedRestaurant.tradeLicenseImage ? (
                        <a
                          href={`http://localhost:5000${selectedRestaurant.tradeLicenseImage}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-black rounded-lg border border-slate-800 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Doc</span>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-600 italic">Not Uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-6 border-t border-slate-800 mt-6">
              <button
                type="button"
                onClick={() => setIsViewOpen(false)}
                className="bg-slate-800 hover:bg-slate-750 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
