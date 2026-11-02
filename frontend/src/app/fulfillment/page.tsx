'use client';

/**
 * @file fulfillment/page.tsx
 * @description Live Courier Dispatch & COD Reconciliation connected to Django Orders API.
 * Clicking "Send to Courier" updates the order status to "Shipped" in the database.
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Send, Database } from 'lucide-react';
import { fetchFromBackend, patchToBackend } from '@/lib/api';
import type { DbOrder } from '../orders/page';

export default function FulfillmentPage() {
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [dbSynced, setDbSynced] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      const data = await fetchFromBackend<DbOrder[]>('orders', []);
      if (data && data.length > 0) {
        setOrders(data);
        setDbSynced(true);
      }
    }
    loadOrders();
  }, []);

  const handleDispatch = async (order: DbOrder) => {
    const updated = await patchToBackend<DbOrder>('orders', order.id, {
      order_status: 'Shipped',
    });

    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, order_status: updated ? updated.order_status : 'Shipped' } : o))
    );
  };

  const courierPartners = [
    { name: 'Pathao Courier', region: 'Bangladesh (Domestic)', status: 'Connected', codPending: '$420.00' },
    { name: 'Steadfast Courier', region: 'Bangladesh (Nationwide)', status: 'Connected', codPending: '$315.00' },
    { name: 'DHL Express', region: 'Global (220+ Countries)', status: 'Connected', codPending: '$0.00 (Pre-paid)' },
    { name: 'FedEx International', region: 'Global Freight & Parcel', status: 'Connected', codPending: '$0.00 (Pre-paid)' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold text-slate-900">Courier Fulfillment & COD Reconciliation</h1>
          {dbSynced && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Database className="w-3 h-3" /> Live Django DB Connected
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Book parcels directly with local and international logistics carriers and update database shipment status.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {courierPartners.map((c) => (
          <div key={c.name} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">{c.name}</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold">
                ● {c.status}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">{c.region}</div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">COD Balance:</span>
              <span className="font-bold text-slate-800">{c.codPending}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">Live Order Dispatch Queue</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer & Address</th>
                <th className="py-3 px-4">Selected Carrier</th>
                <th className="py-3 px-4">Payment Settlement</th>
                <th className="py-3 px-4 text-right">Courier Dispatch Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((item) => {
                const isShipped = item.order_status === 'Shipped' || item.order_status === 'Delivered';
                return (
                  <tr key={item.id}>
                    <td className="py-3 px-4 font-bold text-blue-600">{item.order_code}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.customer_name}</div>
                      <div className="text-[11px] text-slate-400">{item.shipping_address}</div>
                    </td>
                    <td className="py-3 px-4 font-medium">{item.courier_partner}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700">{item.payment_method}</span> — $
                      {Number(item.total_amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isShipped ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-4 h-4" /> Dispatched to {item.courier_partner}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleDispatch(item)}
                          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" /> Send to Courier
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}