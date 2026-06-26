import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { Restaurant } from '../types';
import { 
  Search, 
  CreditCard, 
  Bell, 
  Check, 
  X, 
  Loader2,
  Calendar,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';

export const Payments: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Modals state
  const [selectedRest, setSelectedRest] = useState<Restaurant | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  // Form states
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [alertMessage, setAlertMessage] = useState('');

  // Fetch payments list (using the updated backend which includes hasAlert / alertMessage)
  const { data: payments, isLoading } = useQuery<Restaurant[]>({
    queryKey: ['payments', searchTerm, statusFilter],
    queryFn: async () => {
      const res = await api.get('/super-admin/payments', {
        params: {
          search: searchTerm,
          paymentStatus: statusFilter === 'all' ? undefined : statusFilter,
        },
      });
      return res.data;
    },
  });

  // Confirm Payment Mutation
  const confirmPaymentMutation = useMutation({
    mutationFn: async ({ id, method }: { id: string; method: string }) => {
      const res = await api.put(`/super-admin/payments/${id}/status`, { paymentMethod: method });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      closePaymentModal();
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Payment confirmation failed');
    },
  });

  // Save Alert Mutation
  const saveAlertMutation = useMutation({
    mutationFn: async ({ restaurantId, message }: { restaurantId: string; message: string }) => {
      const res = await api.post('/super-admin/alerts', { restaurantId, message });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      closeAlertModal();
    },
  });

  // Remove Alert Mutation
  const removeAlertMutation = useMutation({
    mutationFn: async (restaurantId: string) => {
      const res = await api.delete(`/super-admin/alerts/${restaurantId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      closeAlertModal();
    },
  });

  const openPaymentModal = (rest: Restaurant) => {
    setSelectedRest(rest);
    setPaymentMethod('Cash');
    setIsPaymentOpen(true);
  };

  const closePaymentModal = () => {
    setIsPaymentOpen(false);
    setSelectedRest(null);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRest) return;
    confirmPaymentMutation.mutate({ id: selectedRest._id, method: paymentMethod });
  };

  const openAlertModal = (rest: any) => {
    setSelectedRest(rest);
    setAlertMessage(rest.alertMessage || '');
    setIsAlertOpen(true);
  };

  const closeAlertModal = () => {
    setIsAlertOpen(false);
    setSelectedRest(null);
    setAlertMessage('');
  };

  const handleAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRest || !alertMessage) return;
    saveAlertMutation.mutate({ restaurantId: selectedRest._id, message: alertMessage });
  };

  const handleRemoveAlert = () => {
    if (selectedRest) {
      removeAlertMutation.mutate(selectedRest._id);
    }
  };

  const methods = ['Cash', 'Bank', 'Bkash', 'Nagad', 'Rocket', 'Other'];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Billing & Alerts</h2>
        <p className="text-sm text-slate-400">Record subscription payments and push alerts directly to restaurant portals</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search restaurant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex p-1 bg-slate-900 border border-slate-850 rounded-xl w-full md:w-auto">
          {(['all', 'pending', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`flex-1 md:flex-none capitalize px-5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === status
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {status === 'all' ? 'All Billing' : status}
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
                  <th className="p-4 pl-6">Restaurant</th>
                  <th className="p-4">Mobile</th>
                  <th className="p-4">Monthly Fee</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-sm text-slate-300">
                {payments && payments.length > 0 ? (
                  payments.map((rest: any) => (
                    <tr key={rest._id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4 pl-6 font-medium text-white">{rest.name}</td>
                      <td className="p-4 font-mono text-slate-400">{rest.mobile}</td>
                      <td className="p-4 font-mono text-indigo-400 font-semibold">${rest.subscriptionFee}</td>
                      <td className="p-4">
                        {rest.paymentStatus === 'completed' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium">
                            <Check className="w-3 h-3" />
                            <span>Paid via {rest.paymentMethod}</span>
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-slate-500">
                        {rest.paymentDate ? (
                          <div className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(rest.paymentDate).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-2">
                          {/* Payment Button */}
                          {rest.paymentStatus === 'pending' ? (
                            <button
                              onClick={() => openPaymentModal(rest)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Payment OK</span>
                            </button>
                          ) : (
                            <div className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-500 border border-slate-850 text-xs select-none">
                              Completed
                            </div>
                          )}

                          {/* Alert Button */}
                          <button
                            onClick={() => openAlertModal(rest)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              rest.hasAlert
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500 hover:text-slate-950'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                            }`}
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>{rest.hasAlert ? 'Already Sent' : 'Alert'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No records match the filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Confirmation Popup */}
      {isPaymentOpen && selectedRest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closePaymentModal} />
          
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl glass-card overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="font-extrabold text-lg text-white">Record Subscription Payment</h3>
              <button onClick={closePaymentModal} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-5 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-slate-300 text-sm">
              <p>Restaurant: <strong className="text-white">{selectedRest.name}</strong></p>
              <p className="mt-1">Subscription Fee: <strong className="text-indigo-400 font-mono">${selectedRest.subscriptionFee} USD</strong></p>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {methods.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all ${
                        paymentMethod === m
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={confirmPaymentMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {confirmPaymentMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Approve Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alert Messaging System Popup */}
      {isAlertOpen && selectedRest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeAlertModal} />
          
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl glass-card overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="font-extrabold text-lg text-white">Push Alert Notification</h3>
              <button onClick={closeAlertModal} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 text-sm text-slate-400">
              Target portal: <strong className="text-white">{selectedRest.name}</strong>
            </div>

            <form onSubmit={handleAlertSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Notification Alert Message
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Action Required: Your subscription is expiring in 3 days. Please complete payment."
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-sans resize-none"
                />
              </div>

              {selectedRest.hasAlert && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>An active alert is already pushed to this portal. Resaving will replace the alert.</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                {selectedRest.hasAlert ? (
                  <button
                    type="button"
                    onClick={handleRemoveAlert}
                    disabled={removeAlertMutation.isPending}
                    className="flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 py-2 transition-colors disabled:opacity-50"
                  >
                    {removeAlertMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    <span>Remove Alert</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeAlertModal}
                    className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2 rounded-xl text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveAlertMutation.isPending || !alertMessage}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {saveAlertMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Push Notice</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
