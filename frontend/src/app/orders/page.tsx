'use client';

/**
 * @file orders/page.tsx
 * @description Automated Multi-Channel Order Webhook Receiver & Billing Hub.
 * Receives incoming orders automatically from Website (Shopify/WooCommerce),
 * Facebook Messenger Bot, and Instagram DM Checkout without manual typing.
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Printer,
  Eye,
  X,
  Plus,
  Database,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { fetchFromBackend, postToBackend } from '@/lib/api';

export interface DbOrder {
  id: number | string;
  order_code: string;
  customer_name: string;
  phone: string;
  shipping_address: string;
  channel: string;
  payment_method: string;
  payment_status: string;
  order_status: string;
  courier_partner: string;
  total_amount: number;
  product_cost: number;
  created_at?: string;
}

const fallbackOrders: DbOrder[] = [
  {
    id: 1,
    order_code: '#SYN-48291',
    customer_name: 'Maya Chen',
    phone: '+1 (503) 555-0142',
    shipping_address: '214 Alder Lane, Portland, OR',
    channel: 'Web Store',
    payment_method: 'Stripe',
    payment_status: 'Paid',
    order_status: 'Shipped',
    courier_partner: 'DHL Express',
    total_amount: 168.0,
    product_cost: 92.0,
  },
  {
    id: 2,
    order_code: '#SYN-48290',
    customer_name: 'Tanvir Ahmed',
    phone: '+880 1711-223344',
    shipping_address: 'House 14, Road 7, Dhanmondi, Dhaka',
    channel: 'Facebook',
    payment_method: 'bKash',
    payment_status: 'Paid',
    order_status: 'Processing',
    courier_partner: 'Pathao Courier',
    total_amount: 85.0,
    product_cost: 48.0,
  },
];

// Sample incoming webhook payloads from Facebook, Instagram & Website
const INCOMING_WEBHOOK_QUEUE = [
  {
    customer_name: 'Nusrat Jahan (Auto FB Bot)',
    phone: '+880 1715-889900',
    shipping_address: 'Sector 7, Uttara, Dhaka',
    channel: 'Facebook',
    payment_method: 'bKash',
    payment_status: 'Paid',
    courier_partner: 'Pathao Courier',
    total_amount: 120.0,
    product_cost: 65.0,
  },
  {
    customer_name: 'Liam O’Connor (Website Checkout)',
    phone: '+44 7700 900077',
    shipping_address: '42 Oxford Street, London, UK',
    channel: 'Web Store',
    payment_method: 'Stripe',
    payment_status: 'Paid',
    courier_partner: 'DHL Express',
    total_amount: 210.0,
    product_cost: 110.0,
  },
  {
    customer_name: 'Farhan Sadiq (IG Reel Auto-DM)',
    phone: '+880 1812-334455',
    shipping_address: 'GEC Circle, Chattogram',
    channel: 'Instagram',
    payment_method: 'Cash on Delivery (COD)',
    payment_status: 'COD Pending',
    courier_partner: 'Steadfast Courier',
    total_amount: 95.0,
    product_cost: 50.0,
  },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<DbOrder[]>(fallbackOrders);
  const [dbSynced, setDbSynced] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<DbOrder | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [webhookIndex, setWebhookIndex] = useState(0);
  const [webhookBanner, setWebhookBanner] = useState('');

  // Manual phone/offline order state
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [channel, setChannel] = useState('Facebook');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery (COD)');
  const [courier, setCourier] = useState('Pathao Courier');
  const [totalAmount, setTotalAmount] = useState('');
  const [productCost, setProductCost] = useState('');

  const loadOrders = async () => {
    const data = await fetchFromBackend<DbOrder[]>('orders', []);
    if (data && data.length > 0) {
      setOrders(data);
      setDbSynced(true);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Simulate an automatic incoming order from Website / Facebook / Instagram Webhook
  const handleSimulateIncomingWebhook = async () => {
    const sample = INCOMING_WEBHOOK_QUEUE[webhookIndex % INCOMING_WEBHOOK_QUEUE.length];
    setWebhookIndex((i) => i + 1);

    const payload = {
      order_code: `#SYN-${Math.floor(48400 + Math.random() * 900)}`,
      ...sample,
      order_status: 'Processing',
    };

    const created = await postToBackend<DbOrder>('orders', payload);
    if (created) {
      setOrders([created, ...orders]);
      setDbSynced(true);
    } else {
      setOrders([{ id: Date.now(), ...payload }, ...orders]);
    }

    setWebhookBanner(
      `⚡ Auto-Webhook Received: New order from ${sample.customer_name} via ${sample.channel} ($${sample.total_amount}) automatically synced!`
    );
    setTimeout(() => setWebhookBanner(''), 4500);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const isCod = paymentMethod.includes('COD');
    const payload = {
      order_code: `#SYN-${Math.floor(48300 + Math.random() * 900)}`,
      customer_name: customerName,
      phone,
      shipping_address: address,
      channel,
      payment_method: paymentMethod,
      payment_status: isCod ? 'COD Pending' : 'Paid',
      order_status: 'Processing',
      courier_partner: courier,
      total_amount: parseFloat(totalAmount) || 0,
      product_cost: parseFloat(productCost) || 0,
    };

    const created = await postToBackend<DbOrder>('orders', payload);
    if (created) {
      setOrders([created, ...orders]);
      setDbSynced(true);
    } else {
      setOrders([{ id: Date.now(), ...payload }, ...orders]);
    }

    setModalOpen(false);
    setCustomerName('');
    setPhone('');
    setAddress('');
    setTotalAmount('');
    setProductCost('');
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesChannel = channelFilter === 'All' || o.channel === channelFilter;
    return matchesSearch && matchesChannel;
  });

  const totalPrepaid = orders
    .filter((o) => o.payment_status === 'Paid')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const totalCod = orders
    .filter((o) => o.payment_status !== 'Paid')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const totalNetMargin = orders.reduce(
    (sum, o) => sum + (Number(o.total_amount) - Number(o.product_cost)),
    0
  );

  return (
    <div className="p-6 md:p-8 space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">Orders & Automated Webhook Hub</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Database className="w-3 h-3" /> PostgreSQL / Django Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Orders from your Website, Facebook Bot, and Instagram DM arrive here automatically in real time via Webhooks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Webhook Simulation Button for Marketing Demos */}
          <button
            type="button"
            onClick={handleSimulateIncomingWebhook}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition cursor-pointer"
          >
            <Zap className="w-4 h-4" /> Simulate Auto-Order (FB / IG / Web Webhook)
          </button>

          {/* Manual Offline / Phone Order Button */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2.5 rounded-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Manual Phone Order
          </button>
        </div>
      </div>

      {/* Live Incoming Webhook Notification Banner */}
      {webhookBanner && (
        <div className="p-4 rounded-xl bg-emerald-950 text-emerald-200 border border-emerald-700 text-xs font-semibold flex items-center justify-between animate-pulse">
          <span>{webhookBanner}</span>
          <span className="text-[10px] bg-emerald-800 text-white px-2 py-0.5 rounded">Zero Manual Typing</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Synced Orders</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{orders.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Pre-Paid (bKash / Stripe / PayPal)</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">${totalPrepaid.toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Cash on Delivery (COD Receivable)</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">${totalCod.toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Estimated Net Order Profit</div>
          <div
            className={`text-2xl font-bold mt-1 ${
              totalNetMargin >= 0 ? 'text-blue-600' : 'text-rose-600'
            }`}
          >
            ${totalNetMargin.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filter Bar & Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID or Customer..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadOrders}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sync Now
            </button>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700"
            >
              <option value="All">All Sales Channels</option>
              <option value="Web Store">Web Store</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Courier Partner</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Order Total</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-blue-600">{order.order_code}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{order.customer_name}</div>
                    <div className="text-[11px] text-slate-400">{order.phone}</div>
                  </td>
                  <td className="py-3 px-4">{order.channel}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium ${
                        order.payment_status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {order.payment_method} ({order.payment_status})
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">{order.courier_partner}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                      {order.order_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    ${Number(order.total_amount).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Phone/POS Order Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Log Direct Phone / Walk-In Order</h3>
            <form onSubmit={handleCreateOrder} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sales Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Web Store">Web Store</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Delivery Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Order Total ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Product Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productCost}
                    onChange={(e) => setProductCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold">
                  Save Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-over Invoice Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                    Official Billing Invoice
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">{selectedOrder.order_code}</h2>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <div className="font-bold text-slate-800">{selectedOrder.customer_name}</div>
                <div className="text-slate-600">{selectedOrder.phone}</div>
                <div className="text-slate-500">{selectedOrder.shipping_address}</div>
                <div className="pt-2 text-[11px] font-semibold text-indigo-600">
                  Assigned Courier: {selectedOrder.courier_partner}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between pt-2 text-sm font-bold text-slate-900 border-t border-slate-200">
                  <span>Total Customer Bill</span>
                  <span>${Number(selectedOrder.total_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Product Cost (COGS)</span>
                  <span>-${Number(selectedOrder.product_cost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-emerald-600 pt-1">
                  <span>Net Order Profit</span>
                  <span>
                    +${(Number(selectedOrder.total_amount) - Number(selectedOrder.product_cost)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-lg transition cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Invoice Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}