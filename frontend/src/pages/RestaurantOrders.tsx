import React, { useState, useEffect } from 'react';
import api from '../api';
import { Order } from '../types';
import { 
  Search, 
  ShoppingBag, 
  Printer, 
  X, 
  Check, 
  AlertTriangle,
  Calendar,
  Clock,
  User,
  Phone,
  Hash,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Trash2
} from 'lucide-react';

export const RestaurantOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'pending' | 'accepted' | 'cancelled'>('pending');
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Status counts (fetched for badge display)
  const [counts, setCounts] = useState({ pending: 0, accepted: 0, cancelled: 0 });

  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Discount Modal State
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountNote, setDiscountNote] = useState('');
  const [discountError, setDiscountError] = useState<string | null>(null);

  // Clear data Modal State
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  // Branding states for receipt header
  const [brandingLogo, setBrandingLogo] = useState('');
  const [restaurantName, setRestaurantName] = useState('');

  const fetchBranding = async () => {
    try {
      const res = await api.get('/restaurant/settings');
      setBrandingLogo(res.data.logo || '');
      // Get restaurant info
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        const detailsRes = await api.get(`/auth/restaurant/${u.restaurantSlug}`);
        setRestaurantName(detailsRes.data.name);
      }
    } catch (err) {
      console.error('Failed to load branding for receipts', err);
    }
  };

  const fetchCounts = async () => {
    try {
      const pRes = await api.get('/restaurant/orders?status=pending&limit=1');
      const aRes = await api.get('/restaurant/orders?status=accepted&limit=1');
      const cRes = await api.get('/restaurant/orders?status=cancelled&limit=1');
      setCounts({
        pending: pRes.data.totalCount || 0,
        accepted: aRes.data.totalCount || 0,
        cancelled: cRes.data.totalCount || 0,
      });
    } catch (err) {
      console.error('Failed to load status counts', err);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/restaurant/orders?status=${status}&search=${encodeURIComponent(search)}&page=${page}&limit=10`
      );
      setOrders(res.data.orders);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.totalCount);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setPage(1);
      fetchOrders();
      fetchCounts();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, status]);

  useEffect(() => {
    fetchOrders();
    fetchCounts();
  }, [page]);

  const handleUpdateStatus = async (orderId: string, targetStatus: 'accepted' | 'cancelled') => {
    try {
      await api.put(`/restaurant/orders/${orderId}/status`, { status: targetStatus });
      setDetailModalOpen(false);
      setSelectedOrder(null);
      fetchOrders();
      fetchCounts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleAcceptWithDiscount = async (e?: React.FormEvent, skip: boolean = false) => {
    if (e) e.preventDefault();
    if (!selectedOrder) return;

    const discountVal = skip ? 0 : Number(discountAmount) || 0;
    
    // Validation
    if (discountVal < 0) {
      setDiscountError('Discount cannot be negative');
      return;
    }
    if (discountVal > selectedOrder.subtotal) {
      setDiscountError(`Discount cannot exceed the order subtotal (৳${selectedOrder.subtotal.toFixed(2)})`);
      return;
    }

    try {
      await api.put(`/restaurant/orders/${selectedOrder._id}/status`, {
        status: 'accepted',
        discountAmount: discountVal,
        discountNote: skip ? '' : discountNote
      });
      setDiscountModalOpen(false);
      setDetailModalOpen(false);
      setSelectedOrder(null);
      fetchOrders();
      fetchCounts();
    } catch (err: any) {
      setDiscountError(err.response?.data?.message || 'Failed to accept order');
    }
  };

  const handleClearOrders = async () => {
    setClearLoading(true);
    try {
      await api.delete(`/restaurant/orders?status=${status}`);
      setClearConfirmOpen(false);
      setPage(1);
      fetchOrders();
      fetchCounts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to clear orders');
    } finally {
      setClearLoading(false);
    }
  };

  // Professional Monospace POS Printing Layout
  const handlePrint = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const logoHtml = brandingLogo 
      ? `<img src="http://localhost:5000${brandingLogo}" style="max-height: 45px; object-fit: contain; margin-bottom: 5px;" />` 
      : '';

    const customerReceipt = `
      <div style="font-family: monospace; font-size: 12px; width: 80mm; max-width: 80mm; padding: 5px; color: #000; background: #fff;">
        <div style="text-align: center; margin-bottom: 10px;">
          ${logoHtml}
          <h3 style="margin: 0 0 2px 0; font-size: 15px; font-weight: bold;">${restaurantName}</h3>
          <p style="margin: 2px 0; font-size: 11px;">Customer Copy</p>
        </div>
        <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />
        <p style="margin: 4px 0;"><b>Order ID:</b> ${order.orderId}</p>
        <p style="margin: 4px 0;"><b>Date:</b> ${new Date(order.createdAt).toLocaleDateString()}</p>
        <p style="margin: 4px 0;"><b>Time:</b> ${new Date(order.createdAt).toLocaleTimeString()}</p>
        <p style="margin: 4px 0;"><b>Table:</b> ${order.tableNumber}</p>
        <p style="margin: 4px 0;"><b>Customer:</b> ${order.fullName}</p>
        <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />
        <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px dashed #000; text-align: left;">
              <th style="padding-bottom: 5px; font-weight: bold;">Item</th>
              <th style="text-align: center; padding-bottom: 5px; font-weight: bold;">Qty</th>
              <th style="text-align: right; padding-bottom: 5px; font-weight: bold;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td style="padding: 4px 0; vertical-align: top;">
                  ${item.name}
                  ${item.variantName ? `<br/><span style="font-size: 10px; color: #333;">(${item.variantName})</span>` : ''}
                </td>
                <td style="text-align: center; padding: 4px 0; vertical-align: top;">${item.quantity}</td>
                <td style="text-align: right; padding: 4px 0; vertical-align: top;">৳${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />
        <div style="display: flex; justify-content: space-between; margin: 4px 0;">
          <span>Subtotal:</span>
          <span>৳${order.subtotal.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 4px 0;">
          <span>VAT:</span>
          <span>৳${order.vat.toFixed(2)}</span>
        </div>
        ${order.discountAmount !== undefined && order.discountAmount > 0 ? `
        <div style="display: flex; justify-content: space-between; margin: 4px 0; color: #b91c1c;">
          <span>Discount:</span>
          <span>-৳${order.discountAmount.toFixed(2)}</span>
        </div>
        ` : ''}
        <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />
        <div style="display: flex; justify-content: space-between; margin: 6px 0; font-weight: bold; font-size: 13px;">
          <span>Final Total:</span>
          <span>৳${order.grandTotal.toFixed(2)}</span>
        </div>
        ${order.discountNote ? `
        <div style="font-size: 10px; font-style: italic; margin-top: 4px; text-align: right;">
          Note: ${order.discountNote}
        </div>
        ` : ''}
        <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />
        <div style="text-align: center; margin-top: 10px; font-size: 11px;">
          Thank you for dining with us!<br/>
          Please visit again.
        </div>
      </div>
    `;

    const kitchenReceipt = `
      <div style="font-family: monospace; font-size: 12px; width: 80mm; max-width: 80mm; padding: 5px; color: #000; background: #fff;">
        <div style="text-align: center; margin-bottom: 10px;">
          ${logoHtml}
          <h3 style="margin: 0 0 2px 0; font-size: 15px; font-weight: bold;">KITCHEN ORDER</h3>
        </div>
        <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />
        <p style="margin: 4px 0; font-size: 14px; font-weight: bold;"><b>Table:</b> ${order.tableNumber}</p>
        <p style="margin: 4px 0;"><b>Order ID:</b> ${order.orderId}</p>
        <p style="margin: 4px 0;"><b>Time:</b> ${new Date(order.createdAt).toLocaleTimeString()}</p>
        <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />
        <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px dashed #000; text-align: left;">
              <th style="padding-bottom: 5px; font-weight: bold; font-size: 13px;">Item</th>
              <th style="text-align: center; padding-bottom: 5px; font-weight: bold; font-size: 13px;">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td style="padding: 6px 0; font-size: 14px; font-weight: bold; vertical-align: top;">
                  ${item.name}
                  ${item.variantName ? `<br/><span style="font-size: 11px; font-weight: normal; color: #000;">(${item.variantName})</span>` : ''}
                </td>
                <td style="text-align: center; padding: 6px 0; font-size: 15px; font-weight: bold; vertical-align: top;">${item.quantity}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />
      </div>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Receipts - ${order.orderId}</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .page-break { page-break-after: always; break-after: page; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${customerReceipt}
          <div class="page-break"></div>
          ${kitchenReceipt}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header Search, Status tabs & Clear button */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by ID, Customer, Phone, Table..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all font-sans"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 bg-slate-900/40 border border-slate-900 p-1.5 rounded-2xl overflow-x-auto">
          {(['pending', 'accepted', 'cancelled'] as const).map((tab) => {
            const count = counts[tab];
            const isActive = status === tab;
            return (
              <button
                key={tab}
                onClick={() => setStatus(tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="capitalize">{tab}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                    isActive ? 'bg-slate-950 text-amber-500' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Clear Data Trigger */}
        {orders.length > 0 && (
          <button
            onClick={() => setClearConfirmOpen(true)}
            className="flex items-center justify-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white font-bold py-2.5 px-5 rounded-xl transition-all text-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear {status.charAt(0).toUpperCase() + status.slice(1)} Orders</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-slate-900/40 border border-slate-900 rounded-3xl overflow-hidden backdrop-blur-xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-slate-500">
              <ClipboardList className="w-8 h-8" />
            </div>
            <p className="text-slate-400 font-sans text-sm">No {status} orders found.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Customer Details</th>
                    <th className="px-6 py-4">Table</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Placed At</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 font-sans text-sm">
                  {orders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-amber-500">{ord.orderId}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-200">{ord.fullName}</p>
                          <p className="text-xs text-slate-500">{ord.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block bg-slate-800 border border-slate-700 text-slate-300 font-semibold px-2 py-0.5 rounded text-xs">
                          {ord.tableNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-200">৳{ord.grandTotal.toFixed(2)}</td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        <div className="flex flex-col">
                          <span>{new Date(ord.createdAt).toLocaleDateString()}</span>
                          <span className="text-[10px] text-slate-500">{new Date(ord.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedOrder(ord);
                            setDetailModalOpen(true);
                          }}
                          className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 font-semibold text-xs rounded-xl transition-all active:scale-[0.97]"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-900 bg-slate-950/20 flex items-center justify-between gap-4">
                <span className="text-xs text-slate-500 font-sans">
                  Showing Page {page} of {totalPages} ({totalCount} orders)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    className="p-1.5 rounded-lg border border-slate-850 bg-slate-950 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-1.5 rounded-lg border border-slate-850 bg-slate-950 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Details Popup Modal */}
      {detailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setDetailModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden z-10 glass-card max-h-[85vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-amber-500" />
                <span className="font-mono font-bold text-white text-sm">{selectedOrder.orderId}</span>
              </div>
              <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="p-6 overflow-y-auto space-y-5 flex-grow font-sans text-xs">
              
              {/* Customer summary */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 border border-slate-850 rounded-2xl">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Customer</span>
                  <div className="flex items-center gap-1.5 text-slate-200">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-bold">{selectedOrder.fullName}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Phone</span>
                  <div className="flex items-center gap-1.5 text-slate-200">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-mono">{selectedOrder.phone}</span>
                  </div>
                </div>
                <div className="space-y-1 mt-2">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Table Number</span>
                  <span className="inline-block bg-slate-800 border border-slate-700 text-slate-200 px-2 py-0.5 rounded font-bold">
                    {selectedOrder.tableNumber}
                  </span>
                </div>
                <div className="space-y-1 mt-2">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Placed On</span>
                  <div className="text-slate-400 flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(selectedOrder.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order Items</span>
                <div className="space-y-2 border border-slate-850 bg-slate-950/20 rounded-2xl p-4">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-start py-2 border-b border-slate-900/60 last:border-0 last:pb-0">
                      <div className="space-y-1 max-w-[280px]">
                        <p className="font-bold text-slate-200">{item.name}</p>
                        {item.variantName && (
                          <span className="text-[10px] text-slate-500 font-semibold">({item.variantName})</span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-6 font-mono text-right flex-shrink-0">
                        <span className="text-slate-400">{item.quantity} x ৳{item.price.toFixed(2)}</span>
                        <span className="font-bold text-slate-200">৳{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}

                  {/* Pricing footer */}
                  <div className="border-t border-slate-900/60 pt-3 mt-2 space-y-1.5 font-mono text-slate-400">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>৳{selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT</span>
                      <span>৳{selectedOrder.vat.toFixed(2)}</span>
                    </div>
                    {selectedOrder.discountAmount !== undefined && selectedOrder.discountAmount > 0 && (
                      <div className="flex justify-between text-rose-400">
                        <span>Discount</span>
                        <span>-৳{selectedOrder.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-900/60 pt-2.5 text-sm text-white font-extrabold">
                      <span>Grand Total</span>
                      <span className="text-amber-500">৳{selectedOrder.grandTotal.toFixed(2)}</span>
                    </div>
                    {selectedOrder.discountNote && (
                      <div className="text-[10px] text-slate-500 font-sans italic mt-1.5 text-right">
                        Note: {selectedOrder.discountNote}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions footer */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-850 flex items-center justify-between gap-3">
              <button
                onClick={() => handlePrint(selectedOrder)}
                className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 font-bold py-2.5 px-5 rounded-xl transition-all active:scale-[0.98]"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => {
                      setDiscountAmount('');
                      setDiscountNote('');
                      setDiscountError(null);
                      setDiscountModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 px-5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-amber-500/10"
                  >
                    <Check className="w-4 h-4" />
                    <span>Accept</span>
                  </button>
                )}

                {(selectedOrder.status === 'pending' || selectedOrder.status === 'accepted') && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder._id, 'cancelled')}
                    className="flex items-center justify-center gap-1 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-600 text-rose-400 hover:text-white font-bold py-2.5 px-5 rounded-xl transition-all active:scale-[0.98]"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear selected status modal */}
      {clearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setClearConfirmOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10 glass-card">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white">Clear {status} Orders?</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-sans max-w-xs mx-auto">
                  Are you sure you want to delete all <span className="font-semibold text-slate-200">"{status}"</span> order records permanently? 
                  This action will only delete {status} orders and cannot be undone. Product Analysis analytics will remain intact.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setClearConfirmOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-850 hover:bg-slate-850 text-slate-300 font-semibold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={clearLoading}
                  onClick={handleClearOrders}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/10 flex items-center justify-center gap-1.5"
                >
                  {clearLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>Yes, Clear Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Discount Popup Modal */}
      {discountModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setDiscountModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10 glass-card">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <h3 className="font-bold text-white text-sm">Apply Order Discount</h3>
              <button onClick={() => setDiscountModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleAcceptWithDiscount(e, false)} className="p-6 space-y-4">
              
              {/* Order Total (Read Only) */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Order Total (Before Discount)
                </label>
                <div className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-200 font-mono">
                  ৳{(selectedOrder.subtotal + selectedOrder.vat).toFixed(2)}
                </div>
              </div>

              {/* Discount Amount */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Discount Amount (৳)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedOrder.subtotal}
                  placeholder="e.g. 150"
                  value={discountAmount}
                  onChange={(e) => {
                    setDiscountAmount(e.target.value);
                    setDiscountError(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-mono"
                  autoFocus
                />
              </div>

              {/* Optional Note */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Optional Note
                </label>
                <textarea
                  placeholder="e.g. Special customer discount or campaign code"
                  value={discountNote}
                  onChange={(e) => setDiscountNote(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-sans resize-none"
                />
              </div>

              {/* Validation Error */}
              {discountError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-sans">
                  {discountError}
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleAcceptWithDiscount(undefined, true)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
                >
                  Skip Discount
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  Confirm & Accept
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
