import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  BarChart3, 
  Search, 
  RefreshCw, 
  Coins, 
  ShoppingBag, 
  Utensils, 
  Layers, 
  TrendingUp 
} from 'lucide-react';

interface Summary {
  dailySales: number;
  monthlySales: number;
  totalAcceptedOrders: number;
  bestSellingProduct: string;
  bestSellingVariant: string;
}

interface ProductSalesRecord {
  _id: string;
  productName: string;
  categoryName: string;
  variantName?: string;
  totalSold: number;
}

export const RestaurantAnalysis: React.FC = () => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [salesRecords, setSalesRecords] = useState<ProductSalesRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/restaurant/analytics/summary');
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to load analytics summary', err);
    }
  };

  const fetchTableData = async () => {
    setTableLoading(true);
    try {
      const res = await api.get(`/restaurant/analytics/products?search=${encodeURIComponent(search)}`);
      setSalesRecords(res.data);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load sales analysis table');
    } finally {
      setTableLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchSummary(), fetchTableData()]);
    setLoading(false);
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTableData();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const summaryCards = [
    {
      title: "Daily Sales",
      value: `$${summary?.dailySales.toFixed(2) || '0.00'}`,
      icon: <Coins className="w-6 h-6 text-emerald-400" />,
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Monthly Sales",
      value: `$${summary?.monthlySales.toFixed(2) || '0.00'}`,
      icon: <TrendingUp className="w-6 h-6 text-blue-400" />,
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Accepted Orders",
      value: summary?.totalAcceptedOrders || 0,
      icon: <ShoppingBag className="w-6 h-6 text-purple-400" />,
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Best Selling Product",
      value: summary?.bestSellingProduct || 'None',
      icon: <Utensils className="w-6 h-6 text-amber-400" />,
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Best Selling Variant",
      value: summary?.bestSellingVariant || 'None',
      icon: <Layers className="w-6 h-6 text-pink-400" />,
      bg: "bg-pink-500/10 border-pink-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Product or Category Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all font-sans"
          />
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold py-2.5 px-5 rounded-xl transition-all active:scale-[0.98] text-xs"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {summaryCards.map((card, i) => (
          <div
            key={i}
            className={`p-6 rounded-2xl border bg-slate-900/40 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] shadow-lg ${card.bg}`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {card.title}
              </span>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5">
                {card.icon}
              </div>
            </div>
            <p className="text-xl font-extrabold text-white tracking-tight leading-snug truncate max-w-full">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Product Analysis Table Card */}
      <div className="bg-slate-900/40 border border-slate-900 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="px-6 py-4 border-b border-slate-900 bg-slate-950/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-white text-sm">Product Sales Performance</span>
          </div>
        </div>

        {tableLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : salesRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-slate-500">
              <BarChart3 className="w-8 h-8" />
            </div>
            <p className="text-slate-400 font-sans text-sm">No sales records found. Accept pending orders to log sales.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Variant Option</th>
                  <th className="px-6 py-4 text-right">Total Units Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 font-sans text-sm">
                {salesRecords.map((rec) => (
                  <tr key={rec._id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-200">{rec.productName}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block bg-slate-800 border border-slate-700 text-slate-300 font-semibold px-2 py-0.5 rounded text-xs">
                        {rec.categoryName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                      {rec.variantName ? (
                        <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                          {rec.variantName}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-200">{rec.totalSold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
