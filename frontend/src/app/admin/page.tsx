'use client';

/**
 * @file app/admin/page.tsx
 * @description Built-in Super Admin Portal accessible directly at http://localhost:3000/admin.
 * Displays live database table counts, system health, and quick management controls
 * connected to the Django REST backend.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Database,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { fetchFromBackend } from '@/lib/api';

interface PnlSummary {
  gross_sales: number;
  product_cogs: number;
  operational_expenses: number;
  net_profit: number;
  total_orders: number;
  low_stock_count: number;
}

export default function AdminPortalPage() {
  const [summary, setSummary] = useState<PnlSummary>({
    gross_sales: 253.0,
    product_cogs: 140.0,
    operational_expenses: 420.0,
    net_profit: -307.0,
    total_orders: 2,
    low_stock_count: 2,
  });
  const [connected, setConnected] = useState(false);

  const loadAdminStats = async () => {
    const data = await fetchFromBackend<PnlSummary>('pnl-summary', summary);
    if (data) {
      setSummary(data);
      setConnected(true);
    }
  };

  useEffect(() => {
    loadAdminStats();
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">SYNVORA Super Admin Control Center</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Unified database administration, API health monitoring, and system records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAdminStats}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh DB Stats
          </button>
          <a
            href="http://127.0.0.1:8000/admin/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
          >
            <span>Open Raw Django DB Admin</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Live Database Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold flex justify-between">
            <span>Database Status</span>
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-600 mt-2">
            {connected ? '● Connected (Django 6.1)' : '● Local Fallback Mode'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Port 8000 REST API Active</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold flex justify-between">
            <span>DB Recorded Orders</span>
            <ShoppingCart className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary.total_orders}</div>
          <div className="text-[11px] text-slate-400 mt-1">Gross DB Sales: ${summary.gross_sales}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold flex justify-between">
            <span>Low Stock SKUs in DB</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{summary.low_stock_count}</div>
          <div className="text-[11px] text-slate-400 mt-1">Below reorder threshold</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-semibold flex justify-between">
            <span>DB Logged Expenses</span>
            <DollarSign className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">${summary.operational_expenses}</div>
          <div className="text-[11px] text-slate-400 mt-1">COGS: ${summary.product_cogs}</div>
        </div>
      </div>

      {/* Database Tables Quick Access */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900">
          Database Models & API Endpoints
        </div>
        <div className="divide-y divide-slate-100 text-xs">
          {[
            { name: 'Products Catalog Table', endpoint: 'http://127.0.0.1:8000/api/v1/products/', appRoute: '/products' },
            { name: 'Orders & Billing Table', endpoint: 'http://127.0.0.1:8000/api/v1/orders/', appRoute: '/orders' },
            { name: 'Daily Operational Expenses Table', endpoint: 'http://127.0.0.1:8000/api/v1/expenses/', appRoute: '/analytics' },
            { name: 'Customer CRM Directory Table', endpoint: 'http://127.0.0.1:8000/api/v1/customers/', appRoute: '/customers' },
            { name: 'Social Media Scheduled Posts Table', endpoint: 'http://127.0.0.1:8000/api/v1/social-posts/', appRoute: '/social-studio' },
          ].map((tbl) => (
            <div key={tbl.name} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-bold text-slate-900">{tbl.name}</div>
                <div className="text-[11px] font-mono text-slate-400">{tbl.endpoint}</div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={tbl.endpoint}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
                >
                  View JSON API
                </a>
                <a
                  href={tbl.appRoute}
                  className="px-3 py-1.5 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
                >
                  Manage in UI
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}