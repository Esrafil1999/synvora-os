'use client';

/**
 * @file customers/page.tsx
 * @description Customer Relationship Management (CRM) directory and Multi-Channel Offer Broadcaster.
 * Stores buyer history and allows sending targeted promotional offers across selected social channels.
 */

import React, { useState } from 'react';
import { Users, Send, CheckCircle2, Search, Sparkles } from 'lucide-react';

export default function CustomersPage() {
  const [offerSent, setOfferSent] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState('VIP Repeat Buyers');

  const customers = [
    { id: 'CUS-901', name: 'Maya Chen', contact: 'maya.chen@example.com', channel: 'Web Store', orders: 14, spent: '$1,248.50', segment: 'VIP Repeat Buyers' },
    { id: 'CUS-902', name: 'Tanvir Ahmed', contact: '+880 1711-223344', channel: 'Facebook', orders: 9, spent: '$615.00', segment: 'VIP Repeat Buyers' },
    { id: 'CUS-903', name: 'Sadia Islam', contact: '+880 1819-556677', channel: 'Instagram', orders: 4, spent: '$240.00', segment: 'Social Shoppers' },
    { id: 'CUS-904', name: 'Oliver Grant', contact: 'oliver.g@example.co.uk', channel: 'Web Store', orders: 7, spent: '$890.00', segment: 'VIP Repeat Buyers' },
  ];

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    setOfferSent(true);
    setTimeout(() => setOfferSent(false), 4000);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900">Customer CRM & Multi-Channel Offer Broadcaster</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage buyer profiles and broadcast promotional flash sales across Facebook, Instagram, WhatsApp, and Email.
        </p>
      </div>

      {/* Multi-Channel Offer Broadcaster Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" /> Broadcast Promotional Sale / Offer to Customer Segment
        </h2>
        <form onSubmit={handleSendBroadcast} className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
          <select
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value)}
            className="md:col-span-3 px-3 py-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="All Customers">All Customers (480)</option>
            <option value="VIP Repeat Buyers">VIP Repeat Buyers (120)</option>
            <option value="Social Shoppers">Facebook & IG Shoppers (310)</option>
          </select>
          <input
            type="text"
            required
            defaultValue="🎉 Exclusive 25% OFF Flash Sale on our Winter Collection! Use code SYN25 at checkout."
            className="md:col-span-6 px-3 py-2 border border-slate-300 rounded-lg"
          />
          <button
            type="submit"
            className="md:col-span-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Send to All Channels
          </button>
        </form>
        {offerSent && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Promotional offer dispatched to {selectedSegment} via Messenger, Instagram DM, and Email!</span>
          </div>
        )}
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Source Channel</th>
                <th className="py-3 px-4">Segment</th>
                <th className="py-3 px-4">Total Orders</th>
                <th className="py-3 px-4 text-right">Lifetime Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                  <td className="py-3 px-4 text-slate-600">{c.contact}</td>
                  <td className="py-3 px-4">{c.channel}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">{c.segment}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold">{c.orders}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600">{c.spent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}



