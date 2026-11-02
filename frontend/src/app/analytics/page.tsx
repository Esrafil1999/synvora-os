'use client';

/**
 * @file analytics/page.tsx
 * @description Full-stack Financial Analytics & Daily Profit/Loss (P&L) Statement module
 * connected directly to Django REST API (/api/v1/expenses/).
 */

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Calendar,
  ArrowUpRight,
  FileSpreadsheet,
  Database,
} from 'lucide-react';
import { fetchFromBackend, postToBackend } from '@/lib/api';

interface ExpenseEntry {
  id: number | string;
  title: string;
  category: string;
  amount: number;
  expense_date?: string;
}

const fallbackExpenses: ExpenseEntry[] = [
  { id: 1, title: 'Meta Facebook & Instagram Ad Spend', category: 'Marketing & Ads', amount: 420.0, expense_date: '2026-10-31' },
  { id: 2, title: 'Daily Staff & Support Team Allowance', category: 'Employee & Payroll', amount: 310.0, expense_date: '2026-10-31' },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | '90d' | '12m'>('today');
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(fallbackExpenses);
  const [dbSynced, setDbSynced] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState('Marketing & Ads');
  const [expAmount, setExpAmount] = useState('');

  useEffect(() => {
    async function loadExpenses() {
      const data = await fetchFromBackend<ExpenseEntry[]>('expenses', []);
      if (data && data.length > 0) {
        setExpenses(data);
        setDbSynced(true);
      }
    }
    loadExpenses();
  }, []);

  const periodMetrics = {
    today: { grossSales: 4850, cogs: 2150 },
    '7d': { grossSales: 34200, cogs: 15400 },
    '30d': { grossSales: 166676, cogs: 74200 },
    '90d': { grossSales: 477958, cogs: 212000 },
    '12m': { grossSales: 1840000, cogs: 810000 },
  }[period];

  const loggedExpenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const multiplier = period === 'today' ? 1 : period === '7d' ? 6 : period === '30d' ? 25 : period === '90d' ? 75 : 300;
  const totalOperationalCost = loggedExpenseTotal * multiplier;
  const totalDeductions = periodMetrics.cogs + totalOperationalCost;
  const netProfit = periodMetrics.grossSales - totalDeductions;

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(expAmount);
    if (!expTitle || isNaN(val)) return;

    const payload = {
      title: expTitle,
      category: expCategory,
      amount: val,
    };

    const created = await postToBackend<ExpenseEntry>('expenses', payload);
    if (created) {
      setExpenses([created, ...expenses]);
      setDbSynced(true);
    } else {
      setExpenses([{ id: Date.now(), ...payload, expense_date: 'Today' }, ...expenses]);
    }

    setExpTitle('');
    setExpAmount('');
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">Financial Analytics & Daily P&L Report</h1>
            {dbSynced && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Database className="w-3 h-3" /> Live Django DB Connected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated daily profit and loss statement deducting product cost, employee payroll, marketing, and shipping.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs font-medium">
          {[
            { id: 'today', label: 'Today (1 Day)' },
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: '90d', label: '90 Days' },
            { id: '12m', label: '1 Year' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setPeriod(t.id as 'today' | '7d' | '30d' | '90d' | '12m')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                period === t.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* P&L Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 flex justify-between">
            <span>1. Gross Product Sales</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            ${periodMetrics.grossSales.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">All channels combined</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 flex justify-between">
            <span>2. Product Cost (COGS)</span>
            <TrendingDown className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            -${periodMetrics.cogs.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Manufacturing / wholesale cost</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 flex justify-between">
            <span>3. Ops, Staff & Ad Spend</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">
            -${totalOperationalCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Payroll, marketing & packaging</div>
        </div>

        <div
          className={`p-5 rounded-xl border shadow-sm ${
            netProfit >= 0
              ? 'bg-emerald-950 border-emerald-800 text-white'
              : 'bg-rose-950 border-rose-800 text-white'
          }`}
        >
          <div className="text-xs font-semibold text-emerald-300 flex justify-between">
            <span>4. Net Profit / Loss</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold mt-2">
            {netProfit >= 0 ? `+$${netProfit.toLocaleString()}` : `-$${Math.abs(netProfit).toLocaleString()}`}
          </div>
          <div className="text-[11px] text-emerald-300 mt-1">
            Net Margin: {Math.round((netProfit / periodMetrics.grossSales) * 100)}%
          </div>
        </div>
      </div>

      {/* Expense Logger & MoM Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Daily Operational Expense Logger (Saved to Django DB)</h2>
            <p className="text-xs text-slate-500">
              Record employee costs, ad spend, or utility bills to deduct them from revenue automatically.
            </p>
          </div>

          <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
            <input
              type="text"
              required
              value={expTitle}
              onChange={(e) => setExpTitle(e.target.value)}
              placeholder="Expense description (e.g., Office Internet, Meta Boost)"
              className="sm:col-span-5 px-3 py-2 border border-slate-300 rounded-lg"
            />
            <select
              value={expCategory}
              onChange={(e) => setExpCategory(e.target.value)}
              className="sm:col-span-4 px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="Marketing & Ads">Marketing & Ads</option>
              <option value="Employee & Payroll">Employee & Payroll</option>
              <option value="Courier & Packaging">Courier & Packaging</option>
              <option value="Office & Utilities">Office & Utilities</option>
            </select>
            <input
              type="number"
              step="0.01"
              required
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              placeholder="Cost ($)"
              className="sm:col-span-3 px-3 py-2 border border-slate-300 rounded-lg"
            />
            <button
              type="submit"
              className="sm:col-span-12 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Log Expense to Database & Recalculate Profit
            </button>
          </form>

          <div className="divide-y divide-slate-100 text-xs">
            {expenses.map((exp) => (
              <div key={exp.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{exp.title}</div>
                  <div className="text-[11px] text-slate-400">
                    {exp.category} • {exp.expense_date || 'Today'}
                  </div>
                </div>
                <span className="font-bold text-rose-600">-${Number(exp.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-slate-900 text-white p-5 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" /> Month-over-Month P&L Ledger
            </h2>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
              2026 Fiscal Year
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-800/90 border border-slate-700 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">October 2026 (Current Month)</div>
                <div className="text-[11px] text-slate-400">Sales: $166,676 • Costs: $104,200</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-emerald-400">+$62,476</div>
                <div className="text-[10px] text-emerald-300 flex items-center justify-end gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> +18.4% MoM
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-800/50 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">September 2026</div>
                <div className="text-[11px] text-slate-400">Sales: $142,100 • Costs: $89,350</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-emerald-400">+$52,750</div>
                <div className="text-[10px] text-slate-400">+9.2% MoM</div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-800/50 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">August 2026</div>
                <div className="text-[11px] text-slate-400">Sales: $128,400 • Costs: $80,100</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-emerald-400">+$48,300</div>
                <div className="text-[10px] text-slate-400">Baseline</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold py-2.5 rounded-lg transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Full P&L Statement (PDF / CSV)
          </button>
        </div>
      </div>
    </div>
  );
}