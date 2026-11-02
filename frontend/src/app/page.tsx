'use client';

/**
 * @file app/page.tsx
 * @description Master Overview Dashboard featuring 4 Reporting Period tabs
 * (1 day, 7 days, 30 days, 90 days) while preserving the exact layout, KPIs,
 * Revenue Trend chart, Channel split, AI Business Brief, Recent Orders, Low Stock Alerts,
 * Top Products, and Recent Activity feed.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  ArrowUpRight,
  ArrowDownRight,
  Info,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Package,
  Clock,
} from 'lucide-react';

// ============================================================================
// SAMPLE DATA BY REPORTING PERIOD (1d, 7d, 30d, 90d)
// ============================================================================

const PERIOD_DATA = {
  '1d': {
    subtitle: 'Sample performance snapshot for Oct 29, 2026 (1 day), compared with the previous day.',
    chartSubtitle: 'Hourly net revenue, Oct 29, 2026',
    kpis: {
      netRevenue: '$5,910',
      revChange: '+8.2%',
      revUp: true,
      revSub: '$246 per hour on average',
      orders: '94',
      ordChange: '+6.8%',
      ordUp: true,
      ordSub: 'Average order value $62.87',
      returnRate: '5.3%',
      retChange: '-0.5 pts',
      retUp: true,
      retSub: '5 returned orders today',
      marketingSpend: '$1,095',
      mktChange: '+7.1%',
      mktUp: true,
      mktSub: '5.4x net revenue per dollar of spend',
    },
    channels: [
      { name: 'Web store', amount: '$2,482', color: 'bg-blue-600', pct: 42 },
      { name: 'Marketplace', amount: '$1,477', color: 'bg-indigo-500', pct: 25 },
      { name: 'Retail POS', amount: '$886', color: 'bg-emerald-500', pct: 15 },
      { name: 'Wholesale portal', amount: '$650', color: 'bg-amber-500', pct: 11 },
      { name: 'Social shop', amount: '$415', color: 'bg-purple-500', pct: 7 },
    ],
    chart: [
      { date: '00:00', current: 420, previous: 390 },
      { date: '04:00', current: 580, previous: 510 },
      { date: '08:00', current: 940, previous: 860 },
      { date: '12:00', current: 1320, previous: 1190 },
      { date: '16:00', current: 1410, previous: 1280 },
      { date: '20:00', current: 1240, previous: 1230 },
    ],
  },
  '7d': {
    subtitle: 'Sample performance snapshot for Oct 23 to Oct 29, 2026, compared with the previous 7 days.',
    chartSubtitle: 'Daily net revenue, Oct 23 to Oct 29, 2026',
    kpis: {
      netRevenue: '$39,428',
      revChange: '+6.4%',
      revUp: true,
      revSub: '$5,633 per day on average',
      orders: '630',
      ordChange: '+4.8%',
      ordUp: true,
      ordSub: 'Average order value $62.58',
      returnRate: '6.0%',
      retChange: '-0.2 pts',
      retUp: true,
      retSub: '38 returned orders',
      marketingSpend: '$7,541',
      mktChange: '+9.4%',
      mktUp: true,
      mktSub: '5.2x net revenue per dollar of spend',
    },
    channels: [
      { name: 'Web store', amount: '$16,560', color: 'bg-blue-600', pct: 42 },
      { name: 'Marketplace', amount: '$9,857', color: 'bg-indigo-500', pct: 25 },
      { name: 'Retail POS', amount: '$5,914', color: 'bg-emerald-500', pct: 15 },
      { name: 'Wholesale portal', amount: '$4,337', color: 'bg-amber-500', pct: 11 },
      { name: 'Social shop', amount: '$2,760', color: 'bg-purple-500', pct: 7 },
    ],
    chart: [
      { date: 'Oct 23', current: 5120, previous: 4800 },
      { date: 'Oct 24', current: 5890, previous: 5100 },
      { date: 'Oct 25', current: 5420, previous: 5300 },
      { date: 'Oct 26', current: 6150, previous: 5450 },
      { date: 'Oct 27', current: 5340, previous: 5200 },
      { date: 'Oct 28', current: 5790, previous: 5500 },
      { date: 'Oct 29', current: 5718, previous: 5690 },
    ],
  },
  '30d': {
    subtitle: 'Sample performance snapshot for Sep 30 to Oct 29, 2026, compared with the previous 30 days.',
    chartSubtitle: 'Daily net revenue, Sep 30 to Oct 29, 2026',
    kpis: {
      netRevenue: '$166,676',
      revChange: '+5.8%',
      revUp: true,
      revSub: '$5,556 per day on average',
      orders: '2,673',
      ordChange: '+3.8%',
      ordUp: true,
      ordSub: 'Average order value $62.36',
      returnRate: '5.8%',
      retChange: '-0.3 pts',
      retUp: true,
      retSub: '156 returned orders',
      marketingSpend: '$31,838',
      mktChange: '+11.2%',
      mktUp: true,
      mktSub: '5.2x net revenue per dollar of spend',
    },
    channels: [
      { name: 'Web store', amount: '$69,984', color: 'bg-blue-600', pct: 42 },
      { name: 'Marketplace', amount: '$41,669', color: 'bg-indigo-500', pct: 25 },
      { name: 'Retail POS', amount: '$25,001', color: 'bg-emerald-500', pct: 15 },
      { name: 'Wholesale portal', amount: '$18,334', color: 'bg-amber-500', pct: 11 },
      { name: 'Social shop', amount: '$11,688', color: 'bg-purple-500', pct: 7 },
    ],
    chart: [
      { date: 'Sep 30', current: 4950, previous: 4700 },
      { date: 'Oct 03', current: 5420, previous: 5100 },
      { date: 'Oct 06', current: 5180, previous: 4950 },
      { date: 'Oct 09', current: 6120, previous: 5300 },
      { date: 'Oct 12', current: 5540, previous: 5250 },
      { date: 'Oct 15', current: 5890, previous: 5400 },
      { date: 'Oct 18', current: 5210, previous: 5600 },
      { date: 'Oct 21', current: 6340, previous: 5500 },
      { date: 'Oct 25', current: 5780, previous: 5450 },
      { date: 'Oct 29', current: 5910, previous: 5690 },
    ],
  },
  '90d': {
    subtitle: 'Sample performance snapshot for Aug 1 to Oct 29, 2026, compared with the previous 90 days.',
    chartSubtitle: 'Daily net revenue, Aug 1 to Oct 29, 2026',
    kpis: {
      netRevenue: '$477,958',
      revChange: '+12.5%',
      revUp: true,
      revSub: '$5,311 per day on average',
      orders: '7,697',
      ordChange: '+9.9%',
      ordUp: true,
      ordSub: 'Average order value $62.10',
      returnRate: '5.9%',
      retChange: '-0.4 pts',
      retUp: true,
      retSub: '455 returned orders',
      marketingSpend: '$88,904',
      mktChange: '+20.2%',
      mktUp: true,
      mktSub: '5.4x net revenue per dollar of spend',
    },
    channels: [
      { name: 'Web store', amount: '$195,963', color: 'bg-blue-600', pct: 41 },
      { name: 'Marketplace', amount: '$133,828', color: 'bg-indigo-500', pct: 28 },
      { name: 'Retail POS', amount: '$71,694', color: 'bg-emerald-500', pct: 15 },
      { name: 'Wholesale portal', amount: '$47,796', color: 'bg-amber-500', pct: 10 },
      { name: 'Social shop', amount: '$28,677', color: 'bg-purple-500', pct: 6 },
    ],
    chart: [
      { date: 'Aug 01', current: 4600, previous: 4200 },
      { date: 'Aug 15', current: 5100, previous: 4550 },
      { date: 'Aug 31', current: 5480, previous: 4900 },
      { date: 'Sep 15', current: 5290, previous: 5050 },
      { date: 'Sep 29', current: 5820, previous: 5200 },
      { date: 'Oct 14', current: 6150, previous: 5400 },
      { date: 'Oct 29', current: 5910, previous: 5580 },
    ],
  },
};

const ALL_SAMPLE_ORDERS = [
  { id: '#SV-48291', customer: 'Maya Chen', channel: 'Web store', placed: 'Oct 29, 09:42', status: 'Shipped', statusStyle: 'bg-blue-50 text-blue-700', total: '$168.40' },
  { id: '#SV-48289', customer: 'Oliver Grant', channel: 'Marketplace', placed: 'Oct 29, 08:17', status: 'Payment review', statusStyle: 'bg-amber-50 text-amber-700', total: '$172.60' },
  { id: '#SV-48286', customer: 'Priya Nair', channel: 'Wholesale portal', placed: 'Oct 28, 17:08', status: 'Processing', statusStyle: 'bg-indigo-50 text-indigo-700', total: '$1,555.20' },
  { id: '#SV-48283', customer: 'Lucas Meyer', channel: 'Retail POS', placed: 'Oct 28, 13:26', status: 'Delivered', statusStyle: 'bg-emerald-50 text-emerald-700', total: '$112.52' },
  { id: '#SV-48282', customer: 'Sofia Rossi', channel: 'Social shop', placed: 'Oct 28, 11:04', status: 'Backordered', statusStyle: 'bg-rose-50 text-rose-700', total: '$218.40' },
  { id: '#SV-48279', customer: 'Daniel Okoye', channel: 'Web store', placed: 'Oct 27, 19:45', status: 'Delivered', statusStyle: 'bg-emerald-50 text-emerald-700', total: '$196.64' },
  { id: '#SV-48276', customer: 'Hannah Becker', channel: 'Marketplace', placed: 'Oct 27, 14:12', status: 'Refund requested', statusStyle: 'bg-rose-50 text-rose-700', total: '$133.60' },
  { id: '#SV-48272', customer: 'Mateo Alvarez', channel: 'Web store', placed: 'Oct 26, 20:51', status: 'Processing', statusStyle: 'bg-indigo-50 text-indigo-700', total: '$276.40' },
  { id: '#SV-48269', customer: 'Aisha Rahman', channel: 'Social shop', placed: 'Oct 26, 16:08', status: 'Shipped', statusStyle: 'bg-blue-50 text-blue-700', total: '$71.75' },
  { id: '#SV-48265', customer: 'Ethan Brooks', channel: 'Retail POS', placed: 'Oct 26, 10:33', status: 'Delivered', statusStyle: 'bg-emerald-50 text-emerald-700', total: '$117.72' },
  { id: '#SV-48261', customer: 'Karim Lindqvist', channel: 'Wholesale portal', placed: 'Oct 25, 18:20', status: 'Delivered', statusStyle: 'bg-emerald-50 text-emerald-700', total: '$2,304.05' },
  { id: '#SV-48258', customer: 'Noah Fischer', channel: 'Marketplace', placed: 'Oct 25, 12:10', status: 'Shipped', statusStyle: 'bg-blue-50 text-blue-700', total: '$155.62' },
];

const INITIAL_ALERTS = [
  { id: 'ALT-1', name: 'Trail Runner Jacket, Size M', sku: 'SKU TRJ-M-BLK • 18 units on hand', days: 'About 3 days', reorder: 40 },
  { id: 'ALT-2', name: 'Summit Wool Beanie, Charcoal', sku: 'SKU SWB-CHR • 26 units on hand', days: 'About 4 days', reorder: 45 },
  { id: 'ALT-3', name: 'Insulated Bottle 750 ml, Slate', sku: 'SKU IB-750-SLT • 32 units on hand', days: 'About 5 days', reorder: 50 },
  { id: 'ALT-4', name: 'Trekking Poles, Pair, Carbon', sku: 'SKU TPP-CRB • 21 units on hand', days: 'About 6 days', reorder: 30 },
];

const TOP_PRODUCTS = [
  { rank: 1, name: 'Trail Runner Jacket', sku: 'TRJ-M-BLK', revenue: 64526, units: 742, share: '13.5% of revenue', pct: 100 },
  { rank: 2, name: 'Merino Base Layer', sku: 'MBL-S-NVY', revenue: 53810, units: 807, share: '11.3% of revenue', pct: 84 },
  { rank: 3, name: 'Alpine Daypack 24L', sku: 'ADP-24-OLV', revenue: 45884, units: 478, share: '9.6% of revenue', pct: 72 },
  { rank: 4, name: 'Insulated Bottle 750 ml', sku: 'IB-750-SLT', revenue: 41580, units: 1299, share: '8.7% of revenue', pct: 65 },
  { rank: 5, name: 'Summit Wool Beanie', sku: 'SWB-CHR', revenue: 32879, units: 1174, share: '6.9% of revenue', pct: 52 },
];

const RECENT_ACTIVITY = [
  { title: 'Order #SV-48291 marked as shipped', sub: '4m ago, sample', color: 'bg-blue-500' },
  { title: 'Trail Runner Jacket (Size M) fell below its reorder point', sub: '28m ago, sample', color: 'bg-amber-500' },
  { title: 'Refund requested on order #SV-48276', sub: '1h ago, sample', color: 'bg-rose-500' },
  { title: 'Autumn Layers campaign budget increased by 15%', sub: '3h ago, sample', color: 'bg-emerald-500' },
  { title: 'Wholesale account application received', sub: '5h ago, sample', color: 'bg-indigo-500' },
  { title: 'Weekly sales summary generated', sub: 'Yesterday, sample', color: 'bg-slate-400' },
];

export default function OverviewPage() {
  const [period, setPeriod] = useState<'1d' | '7d' | '30d' | '90d'>('30d');
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);
  const [productSort, setProductSort] = useState<'revenue' | 'units'>('revenue');

  const currentData = PERIOD_DATA[period];
  const displayedOrders = showAllOrders ? ALL_SAMPLE_ORDERS : ALL_SAMPLE_ORDERS.slice(0, 6);

  const sortedProducts = [...TOP_PRODUCTS].sort((a, b) =>
    productSort === 'revenue' ? b.revenue - a.revenue : b.units - a.units
  );

  const toggleAcknowledge = (id: string) => {
    if (acknowledgedIds.includes(id)) {
      setAcknowledgedIds(acknowledgedIds.filter((item) => item !== id));
    } else {
      setAcknowledgedIds([...acknowledgedIds, id]);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* =====================================================================
          1. PAGE HEADER & REPORTING PERIOD SWITCHER (1 day, 7 days, 30 days, 90 days)
      ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
          <p className="text-xs text-slate-500 mt-1">{currentData.subtitle}</p>
          <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md bg-slate-100 text-[11px] text-slate-600 font-medium">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Illustrative demo data. Live store, courier & social APIs ready for backend binding.</span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <span className="text-xs text-slate-500 font-medium">Reporting period</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs font-semibold shadow-2xs">
            {[
              { id: '1d', label: '1 day' },
              { id: '7d', label: '7 days' },
              { id: '30d', label: '30 days' },
              { id: '90d', label: '90 days' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id as '1d' | '7d' | '30d' | '90d')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  period === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. TOP 4 KPI SUMMARY CARDS
      ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="text-xs font-medium text-slate-500">Net Revenue</div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">
            {currentData.kpis.netRevenue}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
              <ArrowUpRight className="w-3 h-3" /> {currentData.kpis.revChange}
            </span>
            <span className="text-slate-400">vs previous period</span>
          </div>
          <div className="text-[11px] text-slate-400 pt-1">{currentData.kpis.revSub}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="text-xs font-medium text-slate-500">Orders</div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">
            {currentData.kpis.orders}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
              <ArrowUpRight className="w-3 h-3" /> {currentData.kpis.ordChange}
            </span>
            <span className="text-slate-400">vs previous period</span>
          </div>
          <div className="text-[11px] text-slate-400 pt-1">{currentData.kpis.ordSub}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="text-xs font-medium text-slate-500">Return Rate</div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">
            {currentData.kpis.returnRate}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
              <ArrowDownRight className="w-3 h-3" /> {currentData.kpis.retChange}
            </span>
            <span className="text-slate-400">vs previous period</span>
          </div>
          <div className="text-[11px] text-slate-400 pt-1">{currentData.kpis.retSub}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <div className="text-xs font-medium text-slate-500">Marketing Spend</div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">
            {currentData.kpis.marketingSpend}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
              <ArrowUpRight className="w-3 h-3" /> {currentData.kpis.mktChange}
            </span>
            <span className="text-slate-400">vs previous period</span>
          </div>
          <div className="text-[11px] text-slate-400 pt-1">{currentData.kpis.mktSub}</div>
        </div>
      </div>

      {/* =====================================================================
          3. REVENUE TREND CHART + AI BUSINESS BRIEF
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Revenue Trend</h2>
                <p className="text-xs text-slate-500">{currentData.chartSubtitle}</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-2.5 h-0.5 bg-indigo-600 inline-block" /> This period
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-0.5 border-b border-dashed border-slate-400 inline-block" /> Previous period
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentData.chart} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={(v) => `$${(v / 1000).toFixed(1)}K`}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px', borderColor: '#e2e8f0' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="previous"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    fill="none"
                    strokeWidth={1.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="current"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">Revenue by channel</span>
              <span className="text-slate-400">Sample split</span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
              {currentData.channels.map((ch) => (
                <div
                  key={ch.name}
                  style={{ width: `${ch.pct}%` }}
                  className={`${ch.color} h-full first:rounded-l-full last:rounded-r-full`}
                  title={`${ch.name}: ${ch.amount}`}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
              {currentData.channels.map((ch) => (
                <div key={ch.name} className="text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className={`w-2 h-2 rounded-full ${ch.color}`} />
                    <span className="truncate">{ch.name}</span>
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5 pl-3.5">{ch.amount}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">AI Business Brief</h2>
              <p className="text-xs text-slate-500">Generated from the sample data on this page</p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              Illustrative
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-2.5 text-xs text-slate-800">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              Over the selected period, net revenue is up <strong>{currentData.kpis.revChange}</strong>, and{' '}
              <strong>4 products</strong> need a restock review.
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Net revenue is ahead of the previous period
              </div>
              <p className="text-slate-600 leading-relaxed">
                {currentData.kpis.netRevenue} against previous baseline, a {currentData.kpis.revChange} increase.
              </p>
              <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded">
                <strong>Suggested next step:</strong> Compare the trend lines to see which days moved the total.
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Ad efficiency is slipping
              </div>
              <p className="text-slate-600 leading-relaxed">
                Each $1 of marketing spend maps to $5.24 of net revenue, against $5.53 in the previous period.
              </p>
              <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded">
                <strong>Suggested next step:</strong> Review spend by campaign before changing budgets.
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-rose-500" /> 4 products are running low
              </div>
              <p className="text-slate-600 leading-relaxed">
                Trail Runner Jacket, Size M has about 3 days of cover at its sample sell-through rate.
              </p>
              <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded">
                <strong>Suggested next step:</strong> Check reorder quantities for the flagged products.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          4. RECENT ORDERS TABLE + LOW STOCK ALERTS
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Orders</h2>
              <p className="text-xs text-slate-500">Sample orders across all channels. Select an order number for details.</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Needs attention 3
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                  <th className="py-2.5 pr-3">Order</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Placed</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 pl-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 pr-3 font-bold text-blue-600">
                      <Link href="/orders">{ord.id}</Link>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900">{ord.customer}</td>
                    <td className="py-3 px-3 text-slate-500">{ord.channel}</td>
                    <td className="py-3 px-3 text-slate-400">{ord.placed}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${ord.statusStyle}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 pl-3 text-right font-bold text-slate-900">{ord.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAllOrders(!showAllOrders)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              {showAllOrders ? 'Show fewer orders' : `Show all ${ALL_SAMPLE_ORDERS.length} sample orders`}
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Low Stock Alerts</h2>
            <p className="text-xs text-slate-500">
              {INITIAL_ALERTS.length - acknowledgedIds.length} open, {acknowledgedIds.length} acknowledged. Sample inventory data.
            </p>
          </div>

          <div className="space-y-3">
            {INITIAL_ALERTS.map((alert) => {
              const isAck = acknowledgedIds.includes(alert.id);
              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border transition space-y-2 ${
                    isAck ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{alert.name}</div>
                      <div className="text-[11px] text-slate-400">{alert.sku}</div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                      {alert.days}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-2/5 h-full bg-amber-500 rounded-full" />
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-400">Reorder point: {alert.reorder} units.</span>
                    <button
                      type="button"
                      onClick={() => toggleAcknowledge(alert.id)}
                      className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-100 font-semibold text-slate-700 cursor-pointer"
                    >
                      {isAck ? 'Acknowledged ✓' : 'Acknowledge'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =====================================================================
          5. TOP PRODUCTS (REVENUE / UNITS TOGGLE) + RECENT ACTIVITY
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Top Products</h2>
              <p className="text-xs text-slate-500">Sample best sellers for the selected period</p>
            </div>

            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setProductSort('revenue')}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${
                  productSort === 'revenue' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Revenue
              </button>
              <button
                type="button"
                onClick={() => setProductSort('units')}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${
                  productSort === 'units' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Units
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {sortedProducts.map((prod, idx) => (
              <div key={prod.sku} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-900">{prod.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {productSort === 'revenue'
                      ? `$${prod.revenue.toLocaleString()}`
                      : `${prod.units.toLocaleString()} units`}
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${prod.pct}%` }}
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 pl-7">
                  <span>
                    {prod.sku} • {prod.units.toLocaleString()} units
                  </span>
                  <span>{prod.share}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
            <p className="text-xs text-slate-500">Sample events, not real account activity</p>
          </div>

          <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
            {RECENT_ACTIVITY.map((act, i) => (
              <div key={i} className="relative pl-6 text-xs space-y-0.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${act.color} ring-4 ring-white absolute left-1 top-1`}
                />
                <div className="font-semibold text-slate-800">{act.title}</div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {act.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}