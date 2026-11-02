'use client';

/**
 * @file inventory/page.tsx
 * @description Live Warehouse Stock Control connected to Neon Cloud PostgreSQL (/api/v1/products/).
 * Allows instant 1-click restocking that updates the cloud database in real time.
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Plus, Database } from 'lucide-react';
import { fetchFromBackend, patchToBackend } from '@/lib/api';

interface StockProduct {
  id: number | string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  reorder_point?: number;
}

export default function InventoryPage() {
  const [items, setItems] = useState<StockProduct[]>([]);
  const [dbSynced, setDbSynced] = useState(false);

  useEffect(() => {
    async function loadStock() {
      const data = await fetchFromBackend<StockProduct[]>('products', []);
      if (data && data.length > 0) {
        setItems(data);
        setDbSynced(true);
      }
    }
    loadStock();
  }, []);

  const handleQuickRestock = async (item: StockProduct) => {
    const newStock = Number(item.stock) + 20;
    const updated = await patchToBackend<StockProduct>('products', item.id, {
      stock: newStock,
    });

    setItems((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, stock: updated ? updated.stock : newStock } : p))
    );
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold text-slate-900">Inventory & Warehouse Stock Control</h1>
          {dbSynced && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Database className="w-3 h-3" /> Neon Cloud PostgreSQL Synced
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Monitor real-time stock quantities from your cloud PostgreSQL database and trigger instant restocks.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <th className="py-3 px-4">SKU</th>
              <th className="py-3 px-4">Product Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Available Units</th>
              <th className="py-3 px-4">Stock Status</th>
              <th className="py-3 px-4 text-right">Quick Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const reorder = item.reorder_point || 15;
              return (
                <tr key={item.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono text-slate-500">{item.sku}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                  <td className="py-3 px-4 text-slate-600">{item.category}</td>
                  <td className="py-3 px-4 font-bold">{item.stock} units</td>
                  <td className="py-3 px-4">
                    {item.stock <= reorder ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" /> Reorder Needed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Healthy Stock
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleQuickRestock(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Restock +20 Units
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}