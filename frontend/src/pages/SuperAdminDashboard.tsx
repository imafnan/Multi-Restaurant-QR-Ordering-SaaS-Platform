import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { DashboardStats, Cost } from '../types';
import { 
  Store, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  X,
  Loader2
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<Cost | null>(null);

  // Form states
  const [costName, setCostName] = useState('');
  const [costAmount, setCostAmount] = useState('');
  const [costDate, setCostDate] = useState('');

  // Fetch Stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/super-admin/stats');
      return res.data;
    },
  });

  // Fetch Costs List
  const { data: costs, isLoading: costsLoading } = useQuery<Cost[]>({
    queryKey: ['costs'],
    queryFn: async () => {
      const res = await api.get('/super-admin/costs');
      return res.data;
    },
  });

  // Add Cost Mutation
  const addCostMutation = useMutation({
    mutationFn: async (data: { name: string; amount: number; date?: string }) => {
      const res = await api.post('/super-admin/costs', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      closeModal();
    },
  });

  // Update Cost Mutation
  const updateCostMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; amount: number; date?: string } }) => {
      const res = await api.put(`/super-admin/costs/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      closeModal();
    },
  });

  // Delete Cost Mutation
  const deleteCostMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/super-admin/costs/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const openAddModal = () => {
    setEditingCost(null);
    setCostName('');
    setCostAmount('');
    setCostDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const openEditModal = (cost: Cost) => {
    setEditingCost(cost);
    setCostName(cost.name);
    setCostAmount(cost.amount.toString());
    setCostDate(new Date(cost.date).toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCost(null);
    setCostName('');
    setCostAmount('');
    setCostDate('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!costName || !costAmount) return;

    const payload = {
      name: costName,
      amount: Number(costAmount),
      date: costDate,
    };

    if (editingCost) {
      updateCostMutation.mutate({ id: editingCost._id, data: payload });
    } else {
      addCostMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this cost item?')) {
      deleteCostMutation.mutate(id);
    }
  };

  const isLoading = statsLoading || costsLoading;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Upper Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Platform Overview</h2>
          <p className="text-sm text-slate-400">Real-time SaaS billing metrics and platform expenses</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-3 rounded-xl shadow-lg shadow-indigo-600/10 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <Plus className="w-5 h-5" />
          <span>Add Cost</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            
            {/* Total Restaurants */}
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-xl flex flex-col gap-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Restaurants</span>
                <Store className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-white">{stats?.totalRestaurants || 0}</p>
                <p className="text-[10px] text-slate-500 mt-1">Total onboarded stores</p>
              </div>
            </div>

            {/* Total Revenue (Monthly Fee) */}
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-xl flex flex-col gap-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Profit</span>
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-white">${stats?.totalProfit.toLocaleString() || 0}</p>
                <p className="text-[10px] text-slate-500 mt-1">Sum of subscription fees</p>
              </div>
            </div>

            {/* Total Cost */}
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-xl flex flex-col gap-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Cost</span>
                <TrendingDown className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-white">${stats?.totalCost.toLocaleString() || 0}</p>
                <p className="text-[10px] text-slate-500 mt-1">Platform operating costs</p>
              </div>
            </div>

            {/* Net Profit */}
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-xl flex flex-col gap-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Net Profit</span>
                <DollarSign className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className={`text-3xl font-extrabold ${stats && stats.netProfit >= 0 ? 'text-white' : 'text-red-400'}`}>
                  ${stats?.netProfit.toLocaleString() || 0}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Net profit margins</p>
              </div>
            </div>

            {/* Visitors */}
            <div className="p-6 rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-xl flex flex-col gap-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Visitors</span>
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-white">{stats?.totalVisitors.toLocaleString() || 0}</p>
                <p className="text-[10px] text-slate-500 mt-1">Total page view traffic</p>
              </div>
            </div>

          </div>

          {/* Cost History list */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/20 backdrop-blur-xl overflow-hidden">
            <div className="p-6 border-b border-slate-900 flex justify-between items-center bg-slate-900/10">
              <h3 className="font-bold text-lg text-white">Cost History</h3>
              <span className="text-xs font-mono px-3 py-1 bg-slate-800 text-slate-400 rounded-full">
                {costs?.length || 0} Logged Costs
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-4 pl-6">Cost Name</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-sm text-slate-300">
                  {costs && costs.length > 0 ? (
                    costs.map((cost) => (
                      <tr key={cost._id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-4 pl-6 font-medium text-white">{cost.name}</td>
                        <td className="p-4 font-mono font-semibold text-rose-400">${cost.amount.toLocaleString()}</td>
                        <td className="p-4 text-slate-400 flex items-center gap-1.5 mt-1.5 border-none">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span>{new Date(cost.date).toLocaleDateString()}</span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(cost)}
                              className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(cost._id)}
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
                      <td colSpan={4} className="p-8 text-center text-slate-500 font-medium">
                        No expenses logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal Popup - Add/Edit Cost */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl glass-card overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <h3 className="font-extrabold text-lg text-white">
                {editingCost ? 'Edit Cost Item' : 'Add Cost Item'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Cost Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Server Hosting"
                  value={costName}
                  onChange={(e) => setCostName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Cost Amount ($)
                </label>
                <input
                  type="number"
                  required
                  min={0.01}
                  step="any"
                  placeholder="e.g. 150"
                  value={costAmount}
                  onChange={(e) => setCostAmount(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Expense Date
                </label>
                <input
                  type="date"
                  required
                  value={costDate}
                  onChange={(e) => setCostDate(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold px-5 py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addCostMutation.isPending || updateCostMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-3 rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  {addCostMutation.isPending || updateCostMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Save Cost</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
