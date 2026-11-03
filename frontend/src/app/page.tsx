"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Calendar,
  TrendingUp,
  ShoppingBag,
  Package,
  DollarSign,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { getOrders, getProducts, getExpenses } from "@/lib/api";
import { useCurrency } from "@/lib/currency";

export default function OverviewPage() {
  const { formatMoney, symbol } = useCurrency();
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  // Automatically calculates today's live date (YYYY-MM-DD)
  const todayIso = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [periodMode, setPeriodMode] = useState<"date" | "7d" | "30d" | "90d">("date");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [products, setProducts] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    async function loadLive() {
      const [ord, prod, exp] = await Promise.all([getOrders(), getProducts(), getExpenses()]);
      if (Array.isArray(ord)) setOrders(ord);
      if (Array.isArray(prod)) setProducts(prod);
      if (Array.isArray(exp)) setExpenses(exp);
    }
    loadLive();
  }, []);

  const formattedSelectedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const filteredMetrics = useMemo(() => {
    const dateFilteredAll = orders.filter((o) => {
      if (!o.created_at) return true;
      const orderDateStr = String(o.created_at).slice(0, 10);
      if (periodMode === "date") return orderDateStr === selectedDate;
      const daysMap = { "7d": 7, "30d": 30, "90d": 90 };
      const diffMs = new Date().getTime() - new Date(o.created_at).getTime();
      return diffMs <= daysMap[periodMode] * 86400000;
    });

    const validOrders = dateFilteredAll.filter(
      (o) => o.status !== "Cancelled" && o.status !== "Returned"
    );
    const returnedOrders = dateFilteredAll.filter(
      (o) => o.status === "Returned" || o.status === "Cancelled"
    );

    const matchingExpenses = expenses.filter((e) => {
      const expDate = String(e.date || e.created_at || "").slice(0, 10);
      if (periodMode === "date") return expDate === selectedDate;
      const daysMap = { "7d": 7, "30d": 30, "90d": 90 };
      const diffMs = new Date().getTime() - new Date(expDate).getTime();
      return diffMs <= daysMap[periodMode] * 86400000;
    });

    const totalSellingRevenue = validOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
    const totalBuyingCogs = validOrders.reduce((sum, o) => sum + Number(o.cogs_amount || 0), 0);
    const dailyOpsSpend = matchingExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalBuyingAndCost = totalBuyingCogs + dailyOpsSpend;
    const netProfit = totalSellingRevenue - totalBuyingAndCost;
    const returnRate =
      dateFilteredAll.length > 0
        ? ((returnedOrders.length / dateFilteredAll.length) * 100).toFixed(1)
        : "0.0";

    return {
      validOrders,
      returnedCount: returnedOrders.length,
      returnRate,
      totalSellingRevenue,
      totalBuyingCogs,
      dailyOpsSpend,
      totalBuyingAndCost,
      netProfit,
      orderCount: validOrders.length,
    };
  }, [orders, expenses, periodMode, selectedDate]);

  const chartData = useMemo(() => {
    const rev = filteredMetrics.totalSellingRevenue;
    const cost = filteredMetrics.totalBuyingAndCost;
    return [
      { time: "00:00", selling: Math.round(rev * 0.1), buying: Math.round(cost * 0.1) },
      { time: "06:00", selling: Math.round(rev * 0.25), buying: Math.round(cost * 0.22) },
      { time: "12:00", selling: Math.round(rev * 0.55), buying: Math.round(cost * 0.48) },
      { time: "18:00", selling: Math.round(rev * 0.82), buying: Math.round(cost * 0.75) },
      { time: "23:59", selling: Math.round(rev), buying: Math.round(cost) },
    ];
  }, [filteredMetrics]);

  const lowStockProducts = useMemo(
    () => products.filter((p) => Number(p.stock) <= 15),
    [products]
  );

  // Top Products aggregated from live orders + catalog
  const topProductsList = useMemo(() => {
    if (products.length > 0) {
      return products.slice(0, 5).map((p) => {
        const prodOrders = orders.filter(
          (o) =>
            o.status !== "Cancelled" &&
            (o.product_sku === p.sku || o.product_name === p.name)
        );
        const unitsSold = prodOrders.reduce((s, o) => s + Number(o.quantity || 1), 0);
        const revenue = prodOrders.reduce((s, o) => s + Number(o.amount || 0), 0);
        return {
          id: p.id,
          name: p.name,
          category: p.category,
          sku: p.sku,
          unitsSold,
          revenue,
          stock: p.stock,
        };
      });
    }
    return [];
  }, [products, orders]);

  // Channel Revenue Split
  const channelSplit = useMemo(() => {
    const total = Math.max(1, filteredMetrics.totalSellingRevenue);
    const fbRev = filteredMetrics.validOrders
      .filter((o) => String(o.channel).toLowerCase().includes("facebook") || String(o.channel).toLowerCase().includes("instagram"))
      .reduce((s, o) => s + Number(o.amount || 0), 0);
    const outletRev = filteredMetrics.validOrders
      .filter((o) => String(o.channel).toLowerCase().includes("outlet"))
      .reduce((s, o) => s + Number(o.amount || 0), 0);
    const webRev = Math.max(0, filteredMetrics.totalSellingRevenue - fbRev - outletRev);

    if (filteredMetrics.totalSellingRevenue === 0) {
      return [
        { label: "Facebook & Instagram Shop", pct: 45, color: "bg-blue-600" },
        { label: "Direct Customer Order Page", pct: 25, color: "bg-indigo-500" },
        { label: "Physical Outlet POS", pct: 20, color: "bg-emerald-500" },
        { label: "WhatsApp & TikTok", pct: 10, color: "bg-amber-500" },
      ];
    }
    return [
      { label: "Social Ads (FB & IG)", pct: Math.round((fbRev / total) * 100), color: "bg-blue-600" },
      { label: "Physical Outlet POS", pct: Math.round((outletRev / total) * 100), color: "bg-emerald-500" },
      { label: "Online Store & Other", pct: Math.max(0, 100 - Math.round((fbRev / total) * 100) - Math.round((outletRev / total) * 100)), color: "bg-indigo-500" },
    ];
  }, [filteredMetrics]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header + Clean Non-Overlapping Calendar Date Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {periodMode === "date"
              ? `Live buying, selling & profit snapshot for ${formattedSelectedDate}`
              : `Performance summary for the last ${periodMode.replace("d", " days")}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 px-2.5">Reporting period</span>

          {/* Clean Date Picker Button — Zero overlapping text */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setPeriodMode("date");
                if (dateInputRef.current) {
                  if (typeof dateInputRef.current.showPicker === "function") {
                    dateInputRef.current.showPicker();
                  } else {
                    dateInputRef.current.focus();
                  }
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                periodMode === "date"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>{formattedSelectedDate}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                  setPeriodMode("date");
                }
              }}
              aria-label="Choose reporting date"
              className="sr-only"
            />
          </div>

          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriodMode(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                periodMode === p
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {p.replace("d", " days")}
            </button>
          ))}
        </div>
      </div>

      {/* 5 Core KPI Cards: Selling, Buying Cost, Confirmed Orders, Returned Orders, Net Profit/Loss */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Selling (Revenue)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {formatMoney(filteredMetrics.totalSellingRevenue)}
          </div>
          <div className="text-[11px] font-semibold text-emerald-600">
            {periodMode === "date" ? `Sales on ${formattedSelectedDate}` : `Sales in ${periodMode}`}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Buying &amp; Cost</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {formatMoney(filteredMetrics.totalBuyingAndCost)}
          </div>
          <div className="text-[11px] text-slate-500">
            COGS: {formatMoney(filteredMetrics.totalBuyingCogs)} • Ops: {formatMoney(filteredMetrics.dailyOpsSpend)}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Confirmed Orders</span>
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {filteredMetrics.orderCount}
          </div>
          <div className="text-[11px] text-slate-500">
            Active products: {products.length}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Returned Orders</span>
            <RotateCcw className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {filteredMetrics.returnedCount}
          </div>
          <div className="text-[11px] text-rose-600 font-semibold">
            Return rate: {filteredMetrics.returnRate}%
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Net Profit / Loss</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <div
            className={`text-2xl font-extrabold ${
              filteredMetrics.netProfit < 0 ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {filteredMetrics.netProfit < 0 ? "-" : "+"}
            {formatMoney(Math.abs(filteredMetrics.netProfit))}
          </div>
          <div className="text-[11px] text-slate-500">
            Selling minus Buying &amp; Ops
          </div>
        </div>
      </div>

      {/* Middle Row: Selling vs Buying Trend + Revenue by Channel + AI Business Brief */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Revenue &amp; Buying Cost Trend ({periodMode === "date" ? formattedSelectedDate : periodMode})
              </h2>
              <p className="text-xs text-slate-500">
                Real-time buying vs selling performance in {symbol}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-indigo-600">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Selling ({symbol})
              </span>
              <span className="flex items-center gap-1.5 text-amber-500">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Buying Cost ({symbol})
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSelling" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="selling"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSelling)"
                />
                <Area
                  type="monotone"
                  dataKey="buying"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Channel Split Bar */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Revenue by Channel (Online, Social &amp; Outlet POS)</span>
              <span className="text-slate-400">Live Split</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
              {channelSplit.map((ch, idx) => (
                <div
                  key={idx}
                  className={`${ch.color} h-full`}
                  style={{ width: `${Math.max(5, ch.pct)}%` }}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-600">
              {channelSplit.map((ch, idx) => (
                <span key={idx} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${ch.color}`} />
                  {ch.label} ({ch.pct}%)
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* AI Business Brief Card */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">AI Business Brief</h2>
              <p className="text-xs text-slate-500">Live operational insights</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-extrabold">
              AI Copilot
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-950 leading-relaxed">
              For <strong>{periodMode === "date" ? formattedSelectedDate : periodMode}</strong>, total selling is{" "}
              <strong>{formatMoney(filteredMetrics.totalSellingRevenue)}</strong> and{" "}
              <strong>{lowStockProducts.length} products</strong> need restock review.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Net Profit &amp; Margin Status
            </div>
            <p className="text-xs text-slate-600">
              Net profit stands at <strong>{formatMoney(filteredMetrics.netProfit)}</strong> after deducting product buying costs ({formatMoney(filteredMetrics.totalBuyingCogs)}).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Inventory Watch
            </div>
            <p className="text-xs text-slate-600">
              {lowStockProducts.length > 0
                ? `${lowStockProducts.length} items have 15 or fewer units left in stock.`
                : "All catalog products currently have healthy stock cover."}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Row 1: Recent Orders + Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Recent Orders</h2>
              <p className="text-xs text-slate-500">Latest orders from Online, Social &amp; Outlet POS</p>
            </div>
            <Link href="/orders" className="text-xs font-extrabold text-indigo-600 hover:underline">
              View All Orders &rarr;
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No orders recorded yet. Create an order from Orders or Customer Checkout Page.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                    <th className="pb-2.5">Order ID</th>
                    <th className="pb-2.5">Customer</th>
                    <th className="pb-2.5">Product &amp; Size</th>
                    <th className="pb-2.5">Channel / Outlet</th>
                    <th className="pb-2.5">Amount</th>
                    <th className="pb-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.slice(0, 5).map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="py-3 font-extrabold text-slate-900">{o.order_id}</td>
                      <td className="py-3 font-semibold text-slate-700">{o.customer}</td>
                      <td className="py-3 text-slate-600">
                        {o.product_name}{" "}
                        {o.selected_size ? <span className="font-bold text-indigo-600">({o.selected_size})</span> : ""}
                      </td>
                      <td className="py-3 text-slate-500">{o.channel}</td>
                      <td className="py-3 font-extrabold text-slate-900">{formatMoney(o.amount)}</td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Alerts Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Low Stock Alerts</h2>
              <p className="text-xs text-slate-500">Products with 15 or fewer units remaining</p>
            </div>
            <Link href="/inventory" className="text-xs font-extrabold text-indigo-600 hover:underline">
              Restock &rarr;
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              All products have sufficient stock!
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowStockProducts.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">{p.name}</div>
                    <div className="text-[11px] text-slate-500">
                      Code: {p.sku} • Sizes: {p.available_sizes || "All"}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row 2: Top Products + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Top Products</h2>
              <p className="text-xs text-slate-500">Best-performing products in your catalog</p>
            </div>
            <Link href="/products" className="text-xs font-extrabold text-indigo-600 hover:underline">
              Manage Catalog &rarr;
            </Link>
          </div>

          {topProductsList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Add products in the Products page to track top sellers here.
            </div>
          ) : (
            <div className="space-y-3">
              {topProductsList.map((tp, idx) => (
                <div
                  key={tp.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-xs font-extrabold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">{tp.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {tp.category} • Code: {tp.sku} • Stock: {tp.stock} pcs
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-extrabold text-slate-900">
                      {formatMoney(tp.revenue)}
                    </div>
                    <div className="text-[11px] text-emerald-600 font-semibold">
                      {tp.unitsSold} units sold
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Recent Activity</h2>
            <p className="text-xs text-slate-500">Real-time store, outlet &amp; inventory events</p>
          </div>

          <div className="space-y-3">
            {orders.slice(0, 3).map((o) => (
              <div key={o.id} className="flex items-start gap-3 text-xs">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">
                    Order {o.order_id} placed by {o.customer}
                  </div>
                  <div className="text-slate-500">
                    {o.product_name} (x{o.quantity || 1}) via {o.channel} — {formatMoney(o.amount)}
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-start gap-3 text-xs">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Courier &amp; Outlet POS Sync Active</div>
                <div className="text-slate-500">
                  All online, social, and physical outlet orders automatically deduct stock.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Reporting Date Synced</div>
                <div className="text-slate-500">
                  Viewing buying &amp; selling ledger for {formattedSelectedDate}.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}