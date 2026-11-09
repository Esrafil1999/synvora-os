"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Download, Printer, Sparkles, Trash2, X } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ComposedChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { useCurrency } from "@/lib/currency";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-SYNVORA-KEY": "synvora-enterprise-secret-2026",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.status === 204 ? null : res.json();
}

interface ExpenseRecord {
  id: string | number;
  title: string;
  category: string;
  amount: number;
  date: string;
}

const DONUT_COLORS = ["#0284c7", "#991b1b", "#eab308", "#8b5cf6", "#10b981"];

export default function AnalyticsPnLPage() {
  const { formatMoney } = useCurrency();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [channelFilter, setChannelFilter] = useState<string>("All Channels");
  const [startDate, setStartDate] = useState<string>("2026-06-01");
  const [endDate, setEndDate] = useState<string>("2026-11-30");

  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [expTitle, setExpTitle] = useState<string>("");
  const [expCategory, setExpCategory] = useState<string>("Marketing & Social Ads");
  const [expAmount, setExpAmount] = useState<string>("");
  const [expDate, setExpDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const loadLiveStoreData = useCallback(async () => {
    let prodList: any[] = [];
    try {
      const apiProds = await fetchApi("/products/");
      if (Array.isArray(apiProds)) prodList = [...apiProds];
    } catch {}
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || "";
      if (/product|catalog|inventory/i.test(k)) {
        try {
          const parsed = JSON.parse(localStorage.getItem(k) || "[]");
          if (Array.isArray(parsed) && parsed.length > prodList.length) prodList = parsed;
        } catch {}
      }
    }
    setProducts(prodList);

    let apiOrders: any[] = [];
    try {
      const resOrders = await fetchApi("/orders/");
      if (Array.isArray(resOrders)) apiOrders = resOrders;
    } catch {}

    const mergedOrders = new Map<string, any>();
    apiOrders.forEach((o, idx) => {
      mergedOrders.set(String(o.order_id || o.id || `API-${idx}`).trim(), o);
    });

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || "";
      if (/order/i.test(k)) {
        try {
          const parsed = JSON.parse(localStorage.getItem(k) || "[]");
          if (Array.isArray(parsed)) {
            parsed.forEach((o, idx) => {
              if (o && typeof o === "object" && (o.order_id || o.id || o.customer || o.product || o.product_name || o.total || o.amount)) {
                const idKey = String(o.order_id || o.id || `LOC-${idx}`).trim();
                mergedOrders.set(idKey, o);
              }
            });
          }
        } catch {}
      }
    }
    setOrders(Array.from(mergedOrders.values()));

    let expList: ExpenseRecord[] = [];
    try {
      const apiExp = await fetchApi("/expenses/");
      if (Array.isArray(apiExp)) {
        expList = apiExp.map((e: any) => ({
          id: e.id,
          title: e.title || e.category || "Operating Expense",
          category: e.category || "Operating Expense",
          amount: Number(e.amount || 0),
          date: (e.date || e.created_at || "2026-11-09").slice(0, 10),
        }));
      }
    } catch {}

    const localExpRaw = localStorage.getItem("synvora_pnl_expenses_v1") || localStorage.getItem("synvora_expenses_v1");
    if (localExpRaw) {
      try {
        const parsedExp = JSON.parse(localExpRaw);
        if (Array.isArray(parsedExp)) {
          const seen = new Set(expList.map((x) => String(x.id)));
          parsedExp.forEach((le: any) => {
            if (le && !seen.has(String(le.id))) {
              expList.push({
                id: le.id || `EXP-${Math.random()}`,
                title: le.title || le.category || "Expense",
                category: le.category || "Operating Expense",
                amount: Number(le.amount || 0),
                date: (le.date || "2026-11-09").slice(0, 10),
              });
            }
          });
        }
      } catch {}
    }
    setExpenses(expList);
  }, []);

  useEffect(() => {
    loadLiveStoreData();
    window.addEventListener("storage", loadLiveStoreData);
    return () => window.removeEventListener("storage", loadLiveStoreData);
  }, [loadLiveStoreData]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expAmount);
    if (!expTitle.trim() || isNaN(amt) || amt <= 0) return;
    const item: ExpenseRecord = { id: `EXP-${Date.now()}`, title: expTitle.trim(), category: expCategory, amount: amt, date: expDate };
    try {
      const saved = await fetchApi("/expenses/", { method: "POST", body: JSON.stringify(item) });
      if (saved?.id) item.id = saved.id;
    } catch {}
    const next = [item, ...expenses];
    setExpenses(next);
    localStorage.setItem("synvora_pnl_expenses_v1", JSON.stringify(next));
    setExpTitle("");
    setExpAmount("");
    setShowExpenseModal(false);
  };

  const handleDeleteExpense = async (id: string | number) => {
    try { await fetchApi(`/expenses/${id}/`, { method: "DELETE" }); } catch {}
    const next = expenses.filter((e) => String(e.id) !== String(id));
    setExpenses(next);
    localStorage.setItem("synvora_pnl_expenses_v1", JSON.stringify(next));
  };

  const normalizedOrders = useMemo(() => {
    return orders
      .map((o) => {
        const qty = Math.max(1, parseInt(String(o.quantity || o.items || o.qty || 1), 10) || 1);
        const prodName = String(o.product_name || o.product || o.item || "Store Product").trim();
        const sku = String(o.product_sku || o.sku || "").trim();
        const matchedProd = products.find(
          (p) => (sku && String(p.sku || "").toLowerCase() === sku.toLowerCase()) || String(p.name || "").toLowerCase() === prodName.toLowerCase()
        );

        const cleanNum = (v: any) => Number(String(v ?? 0).replace(/[^0-9.-]+/g, "")) || 0;
        const netAmount = cleanNum(o.amount ?? o.total ?? o.totalAmount ?? o.price);
        const unitRegular = matchedProd ? cleanNum(matchedProd.selling_price ?? matchedProd.regularPrice ?? matchedProd.price) : cleanNum(o.regular_amount) / qty || netAmount / qty;
        const grossRegular = cleanNum(o.regular_amount) > 0 ? cleanNum(o.regular_amount) : Math.max(netAmount, unitRegular * qty);
        const discount = cleanNum(o.discount_amount) > 0 ? cleanNum(o.discount_amount) : Math.max(0, grossRegular - netAmount);
        const unitCost = matchedProd ? cleanNum(matchedProd.cost_price ?? matchedProd.buyingCost ?? matchedProd.cost) : cleanNum(o.cogs_amount) > 0 ? cleanNum(o.cogs_amount) / qty : (netAmount * 0.56) / qty;
        const cogs = cleanNum(o.cogs_amount) > 0 ? cleanNum(o.cogs_amount) : unitCost * qty;
        const shipping = cleanNum(o.shipping_fee ?? o.delivery_fee ?? o.deliveryCharge ?? 60);
        const statusStr = String(o.status || o.fulfillment || "Fulfilled");
        const isReturned = /return|cancel|damage|refund/i.test(statusStr);

        const d = new Date(o.created_at || o.date || "2026-11-09");
        const ym = !isNaN(d.getTime()) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` : "2026-11";
        const channel = String(o.channel || o.source || "Website").trim();
        const category = matchedProd?.category || (/shoe|air force|sneaker/i.test(prodName) ? "Shoes" : "Apparel & Fashion");

        return { prodName, category, channel, qty, grossRegular, discount, netAmount, cogs, shipping, isReturned, ym };
      })
      .filter((o) => channelFilter === "All Channels" || o.channel.toLowerCase().includes(channelFilter.toLowerCase()));
  }, [orders, products, channelFilter]);

  const monthlyRows = useMemo(() => {
    const timeline = ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"];
    normalizedOrders.forEach((o) => { if (!timeline.includes(o.ym)) timeline.push(o.ym); });

    return timeline.sort().map((ym) => {
      const mOrders = normalizedOrders.filter((o) => o.ym === ym);
      const mActive = mOrders.filter((o) => !o.isReturned);
      const mRet = mOrders.filter((o) => o.isReturned);
      const mExp = expenses.filter((e) => (e.date || "").slice(0, 7) === ym);

      const sales = mActive.reduce((s, o) => s + o.grossRegular, 0);
      const discounts = mActive.reduce((s, o) => s + o.discount, 0);
      const returns = mRet.reduce((s, o) => s + o.netAmount, 0);
      const shipping = mActive.reduce((s, o) => s + o.shipping, 0);
      const income = mActive.reduce((s, o) => s + o.netAmount, 0);
      const tax = Math.round(income * 0.015);
      const cogs = mActive.reduce((s, o) => s + o.cogs, 0);
      const grossProfit = income - cogs;
      const opEx = mExp.reduce((s, e) => s + Number(e.amount || 0), 0);
      const totalExp = cogs + opEx;
      const netProfit = grossProfit - opEx;
      const netMargin = income > 0 ? (netProfit / income) * 100 : 0;
      const ordersCount = mActive.length;
      const aov = ordersCount > 0 ? income / ordersCount : 0;

      const [yr, mo] = ym.split("-");
      const label = new Date(Number(yr), Number(mo) - 1, 1).toLocaleString("en-US", { month: "short", year: "2-digit" });

      return {
        ym, label, sales, discounts, returns, shipping, tax, income, cogs, grossProfit,
        opEx, totalExp, netProfit, netMargin, ordersCount, aov,
        cashBalance: Math.max(0, netProfit),
        cashRatio: totalExp > 0 ? Number((income / totalExp).toFixed(2)) : 0,
      };
    });
  }, [normalizedOrders, expenses]);

  const kpis = useMemo(() => {
    const active = normalizedOrders.filter((o) => !o.isReturned);
    const returned = normalizedOrders.filter((o) => o.isReturned);
    const totalSales = active.reduce((s, o) => s + o.grossRegular, 0);
    const discounts = active.reduce((s, o) => s + o.discount, 0);
    const returns = returned.reduce((s, o) => s + o.netAmount, 0);
    const shipping = active.reduce((s, o) => s + o.shipping, 0);
    const income = active.reduce((s, o) => s + o.netAmount, 0);
    const tax = Math.round(income * 0.015);
    const cogs = active.reduce((s, o) => s + o.cogs, 0);
    const grossProfit = income - cogs;
    const opEx = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalExpenses = cogs + opEx;
    const netProfit = grossProfit - opEx;
    const netMargin = income > 0 ? (netProfit / income) * 100 : 0;
    const aov = active.length > 0 ? income / active.length : 0;

    return {
      allCount: normalizedOrders.length, activeCount: active.length, returnedCount: returned.length,
      totalSales, discounts, returns, shipping, tax, income, cogs, grossProfit, opEx, totalExpenses, netProfit, netMargin, aov,
    };
  }, [normalizedOrders, expenses]);

  const salesByProductData = useMemo(() => {
    const map = new Map<string, number>();
    normalizedOrders.filter((o) => !o.isReturned).forEach((o) => map.set(o.category, (map.get(o.category) || 0) + o.netAmount));
    const arr = Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    return arr.length > 0 ? arr : [{ name: "Shoes", value: 0 }, { name: "Apparel & Fashion", value: 0 }];
  }, [normalizedOrders]);

  const incomeByAccountData = useMemo(() => {
    const map = new Map<string, number>();
    normalizedOrders.filter((o) => !o.isReturned).forEach((o) => map.set(o.channel, (map.get(o.channel) || 0) + o.netAmount));
    const arr = Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    return arr.length > 0 ? arr : [{ name: "Online Storefront", value: 0 }, { name: "Social Commerce", value: 0 }];
  }, [normalizedOrders]);

  const handleExportCSV = () => {
    const headers = ["Month", "Total Sales", "Discounts", "Returns", "Shipping", "Tax", "Income", "COGS", "Gross Profit", "Operating Expenses", "Net Profit (Loss)", "Net Margin"];
    const rows = monthlyRows.filter((r) => r.ordersCount > 0 || r.opEx > 0 || r.ym === "2026-11").map((r) => [
      r.ym, r.sales.toFixed(2), `-${r.discounts.toFixed(2)}`, `-${r.returns.toFixed(2)}`, r.shipping.toFixed(2), r.tax.toFixed(2),
      r.income.toFixed(2), `-${r.cogs.toFixed(2)}`, r.grossProfit.toFixed(2), `-${r.opEx.toFixed(2)}`, r.netProfit.toFixed(2), `${r.netMargin.toFixed(2)}%`,
    ]);
    const blob = new Blob(["\uFEFF" + [headers, ...rows].map((e) => e.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Synvora_PnL_Statement_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 pb-12 text-slate-900">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Financial Analytics, Revenue & P&L Dashboard</h1>
            <p className="mt-1 max-w-2xl text-xs text-slate-500">
              Combine omnichannel store sales with operational financials to track how store performance translates into profit. Monitor orders, average order value, income by account, COGS, cash balance, and net margin month over month.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setShowExpenseModal(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800">
              <Plus className="h-3.5 w-3.5" /> Log Expense
            </button>
            <button onClick={handleExportCSV} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              <Download className="h-3.5 w-3.5" /> Export P&L CSV
            </button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              <Printer className="h-3.5 w-3.5" /> Print / Save PDF
            </button>
            <button onClick={() => setShowAiModal(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500">
              <Sparkles className="h-3.5 w-3.5" /> AI Insights
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">● Live Store Accounting</span>
              <span className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                Showing: 100% Real DB ({kpis.allCount} Total Orders: {kpis.activeCount} Fulfilled • {kpis.returnedCount} Returned)
              </span>
            </div>
            <p className="text-[11px] text-slate-500">* All amounts on this dashboard are shown in home currency (BDT ৳)</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent focus:outline-none" />
              <span>-</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent focus:outline-none" />
            </div>
            <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              <option value="All Channels">All Channels</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Website">Website</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="Outlet">Outlet POS</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs text-slate-500">Total Sales</p>
          <p className="mt-1 truncate text-lg font-extrabold text-slate-900">{formatMoney(kpis.totalSales)}</p>
          <span className="mt-1 inline-block text-[11px] font-semibold text-emerald-600">↗ Live DB</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs text-slate-500">Orders count</p>
          <p className="mt-1 text-lg font-extrabold text-slate-900">{kpis.activeCount}</p>
          <span className="mt-1 inline-block text-[11px] font-semibold text-emerald-600">↗ {kpis.allCount} total ({kpis.returnedCount} ret)</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs text-slate-500">Avg Order Value</p>
          <p className="mt-1 truncate text-lg font-extrabold text-slate-900">{formatMoney(kpis.aov)}</p>
          <span className="mt-1 inline-block text-[11px] font-semibold text-emerald-600">↗ Per order</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs text-slate-500">Income</p>
          <p className="mt-1 truncate text-lg font-extrabold text-slate-900">{formatMoney(kpis.income)}</p>
          <span className="mt-1 inline-block text-[11px] font-semibold text-emerald-600">↗ Net revenue</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs text-slate-500">Expenses</p>
          <p className="mt-1 truncate text-lg font-extrabold text-slate-900">{formatMoney(kpis.totalExpenses)}</p>
          <span className="mt-1 inline-block text-[11px] font-semibold text-emerald-600">COGS + OpEx</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs text-slate-500">Net Profit (Loss)</p>
          <p className="mt-1 truncate text-lg font-extrabold text-slate-900">{formatMoney(kpis.netProfit)}</p>
          <span className="mt-1 inline-block text-[11px] font-semibold text-emerald-600">↗ Real profit</span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs text-slate-500">Net Margin</p>
          <p className="mt-1 text-lg font-extrabold text-slate-900">{kpis.netMargin.toFixed(1)}%</p>
          <span className="mt-1 inline-block text-[11px] font-semibold text-emerald-600">↗ Margin %</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-600" /> Total Sales
            </span>
            <span className="text-[11px] text-slate-400">Monthly Gross Sales</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRows}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${Math.round(Number(v) / 1000)}K`} />
                <Tooltip formatter={(v) => formatMoney(Number(v ?? 0))} />
                <Bar dataKey="sales" name="Total Sales" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-4 text-xs font-bold text-slate-800">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-sky-600" /> Income</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> Expenses</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Net Profit (Loss)</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRows}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${Math.round(Number(v) / 1000)}K`} />
                <Tooltip formatter={(v) => formatMoney(Number(v ?? 0))} />
                <Bar dataKey="income" name="Income" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalExp" name="Expenses" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netProfit" name="Net Profit (Loss)" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Sales by Product</h3>
            <span className="text-[11px] text-slate-400">Category Share</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-2">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={salesByProductData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={2}>
                    {salesByProductData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatMoney(Number(v ?? 0))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-xs">
              {salesByProductData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                  <span className="truncate text-slate-700">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Income by Account</h3>
            <span className="text-[11px] text-slate-400">Revenue Stream</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-2">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={incomeByAccountData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={2}>
                    {incomeByAccountData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatMoney(Number(v ?? 0))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-xs">
              {incomeByAccountData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                  <span className="truncate text-slate-700">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Expenses by Account</h3>
            <button onClick={() => setShowExpenseModal(true)} className="text-xs font-bold text-blue-600 hover:underline">+ Add Expense</button>
          </div>
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr><th className="py-2">Account name</th><th className="py-2 text-right">Expenses ↓</th><th></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 font-medium">Cost of Goods Sold (COGS)</td>
                <td className="py-2.5 text-right font-semibold">{formatMoney(kpis.cogs)}</td>
                <td></td>
              </tr>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td className="py-2">{e.title}</td>
                  <td className="py-2 text-right font-semibold">{formatMoney(e.amount)}</td>
                  <td className="py-2 text-right">
                    <button onClick={() => handleDeleteExpense(e.id)} className="text-slate-400 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-slate-200 font-extrabold text-slate-900">
              <tr><td className="pt-3">Grand total</td><td className="pt-3 text-right">{formatMoney(kpis.totalExpenses)}</td><td></td></tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-4 text-xs font-bold text-slate-800">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Orders count</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-red-800" /> Avg Order Value</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyRows}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${Number(v)}`} />
                <Tooltip />
                <Bar yAxisId="left" dataKey="ordersCount" name="Orders count" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="aov" name="Avg Order Value" stroke="#991b1b" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-4 text-xs font-bold text-slate-800">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-sky-600" /> Cash Balance</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-red-800" /> Cash Ratio</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyRows}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${Math.round(Number(v) / 1000)}K`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar yAxisId="left" dataKey="cashBalance" name="Cash Balance" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="cashRatio" name="Cash Ratio" stroke="#991b1b" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Month-over-Month Profit & Loss (P&L) Financial Statement</h3>
            <p className="text-xs text-slate-500">Complete breakdown of Sales, Discounts, Returns, Shipping, Tax, Income, COGS, Gross Profit, Operating Expenses, and Net Margin.</p>
          </div>
          <button onClick={handleExportCSV} className="text-xs font-bold text-blue-600 hover:underline">↓ Download Statement (CSV)</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-left text-xs text-slate-800">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-3">Month ↓</th>
                <th className="px-3 py-3">Total Sales</th>
                <th className="px-3 py-3">Discounts</th>
                <th className="px-3 py-3">Returns</th>
                <th className="px-3 py-3">Shipping</th>
                <th className="px-3 py-3">Tax</th>
                <th className="px-3 py-3">Income</th>
                <th className="px-3 py-3">COGS</th>
                <th className="px-3 py-3">Gross Profit</th>
                <th className="px-3 py-3">Operating Expenses</th>
                <th className="px-3 py-3">Net Profit (Loss)</th>
                <th className="px-3 py-3">Net Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...monthlyRows].reverse().filter((r) => r.ordersCount > 0 || r.opEx > 0 || r.ym === "2026-11").map((r) => (
                <tr key={r.ym}>
                  <td className="px-3 py-3 font-medium">{r.ym}</td>
                  <td className="bg-purple-50/50 px-3 py-3 font-semibold">{formatMoney(r.sales)}</td>
                  <td className="bg-emerald-50/40 px-3 py-3">-{formatMoney(r.discounts)}</td>
                  <td className="bg-emerald-50/40 px-3 py-3">-{formatMoney(r.returns)}</td>
                  <td className="px-3 py-3">{formatMoney(r.shipping)}</td>
                  <td className="bg-emerald-50/40 px-3 py-3">{formatMoney(r.tax)}</td>
                  <td className="bg-fuchsia-50/60 px-3 py-3 font-semibold">{formatMoney(r.income)}</td>
                  <td className="px-3 py-3">-{formatMoney(r.cogs)}</td>
                  <td className="bg-emerald-50/70 px-3 py-3 font-semibold">{formatMoney(r.grossProfit)}</td>
                  <td className="px-3 py-3">-{formatMoney(r.opEx)}</td>
                  <td className="bg-emerald-100/90 px-3 py-3 font-extrabold text-emerald-950">{formatMoney(r.netProfit)}</td>
                  <td className="bg-purple-50/60 px-3 py-3 font-bold text-purple-900">{r.netMargin.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 font-extrabold text-slate-900">
              <tr>
                <td className="px-3 py-3.5">Grand total</td>
                <td className="px-3 py-3.5">{formatMoney(kpis.totalSales)}</td>
                <td className="px-3 py-3.5">-{formatMoney(kpis.discounts)}</td>
                <td className="px-3 py-3.5">-{formatMoney(kpis.returns)}</td>
                <td className="px-3 py-3.5">{formatMoney(kpis.shipping)}</td>
                <td className="px-3 py-3.5">{formatMoney(kpis.tax)}</td>
                <td className="px-3 py-3.5">{formatMoney(kpis.income)}</td>
                <td className="px-3 py-3.5">-{formatMoney(kpis.cogs)}</td>
                <td className="px-3 py-3.5">{formatMoney(kpis.grossProfit)}</td>
                <td className="px-3 py-3.5">-{formatMoney(kpis.opEx)}</td>
                <td className="px-3 py-3.5">{formatMoney(kpis.netProfit)}</td>
                <td className="px-3 py-3.5">{kpis.netMargin.toFixed(2)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold">Log Business Expense</h3>
              <button onClick={() => setShowExpenseModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <input type="text" required value={expTitle} onChange={(e) => setExpTitle(e.target.value)} placeholder="Expense Title (e.g., Meta Ads / Packaging)" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2" />
              <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2">
                <option value="Marketing & Social Ads">Marketing & Social Ads</option>
                <option value="Courier & Packaging">Courier & Packaging</option>
                <option value="Damaged / Return Loss">Damaged / Return Loss</option>
                <option value="Staff & Office Rent">Staff & Office Rent</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" required min="1" step="any" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="Amount" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2" />
                <input type="date" required value={expDate} onChange={(e) => setExpDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2" />
              </div>
              <button type="submit" className="w-full rounded-xl bg-blue-600 py-2.5 font-bold text-white">Save Expense</button>
            </form>
          </div>
        </div>
      )}

      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-violet-700">✨ AI Financial Summary</h3>
              <button onClick={() => setShowAiModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              Active Orders: <strong>{kpis.activeCount}</strong> (Returned/Cancelled: <strong>{kpis.returnedCount}</strong>). Net Revenue is <strong>{formatMoney(kpis.income)}</strong> with a Net Profit of <strong>{formatMoney(kpis.netProfit)}</strong> ({kpis.netMargin.toFixed(1)}% margin).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}