"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
} from "recharts";
import {
  Sparkles,
  Calendar,
  Filter,
  Plus,
  Download,
  Printer,
  Trash2,
  TrendingUp,
  TrendingDown,
  X,
} from "lucide-react";
import { fetchFromBackend, postToBackend, deleteFromApi } from "@/lib/api";
import { useCurrency } from "@/lib/currency";

interface OrderRecord {
  id?: number;
  order_id: string;
  customer_name?: string;
  customer?: string;
  channel: string;
  product_name: string;
  quantity: number;
  amount: number | string;
  regular_amount?: number | string;
  discount_amount?: number | string;
  cogs_amount?: number | string;
  net_profit?: number | string;
  payment_status?: string;
  fulfillment_status?: string;
  status?: string;
  created_at?: string;
}

interface ProductRecord {
  id?: number;
  name: string;
  sku: string;
  category: string;
  cost_price: number | string;
  selling_price: number | string;
  stock: number;
}

interface ExpenseRecord {
  id?: number | string;
  title: string;
  category: string;
  amount: number | string;
  date?: string;
  created_at?: string;
}

interface MonthlyRow {
  monthKey: string;
  monthLabel: string;
  ordersCount: number;
  totalSales: number;
  discounts: number;
  returns: number;
  shipping: number;
  tax: number;
  income: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  netMargin: number;
  avgOrderValue: number;
  cashBalance: number;
  cashRatio: number;
}

const DONUT_COLORS = ["#006d9c", "#a33327", "#eab308", "#7c3aed", "#10b981", "#64748b"];

const EXPENSE_ACCOUNT_CATEGORIES = [
  "Wages & Salaries",
  "Marketing & Ad Spend",
  "Rent office space",
  "Subcontractors",
  "Courier & Shipping Fees",
  "Payment Provider Fees",
  "Payroll Tax & Utilities",
];

export default function AnalyticsPnLPage() {
  const { formatMoney, symbol, code } = useCurrency();

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);

  // Filters
  const [dateFrom, setDateFrom] = useState("2026-06-01");
  const [dateTo, setDateTo] = useState("2026-11-30");
  const [selectedChannel, setSelectedChannel] = useState("All");
  const [includeHistoricalBaseline, setIncludeHistoricalBaseline] = useState(true);
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // New Expense Form
  const [expTitle, setExpTitle] = useState("");
  const [expCategory, setExpCategory] = useState(EXPENSE_ACCOUNT_CATEGORIES[0]);
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    try {
      const localOrders = JSON.parse(localStorage.getItem("synvora_db_orders") || "[]");
      if (Array.isArray(localOrders)) setOrders(localOrders);
    } catch {}
    try {
      const localProducts = JSON.parse(localStorage.getItem("synvora_db_products") || "[]");
      if (Array.isArray(localProducts)) setProducts(localProducts);
    } catch {}
    try {
      const localExpenses = JSON.parse(localStorage.getItem("synvora_db_expenses_v2") || "[]");
      if (Array.isArray(localExpenses)) setExpenses(localExpenses);
    } catch {}

    Promise.all([
      fetchFromBackend("/orders/").catch(() => null),
      fetchFromBackend("/products/").catch(() => null),
      fetchFromBackend("/expenses/").catch(() => null),
    ]).then(([ordRes, prodRes, expRes]) => {
      if (Array.isArray(ordRes)) {
        setOrders(ordRes);
        localStorage.setItem("synvora_db_orders", JSON.stringify(ordRes));
      }
      if (Array.isArray(prodRes)) {
        setProducts(prodRes);
        localStorage.setItem("synvora_db_products", JSON.stringify(prodRes));
      }
      if (Array.isArray(expRes)) {
        setExpenses(expRes);
        localStorage.setItem("synvora_db_expenses_v2", JSON.stringify(expRes));
      }
    });
  }, []);

  const productMap = useMemo(() => {
    const map = new Map<string, ProductRecord>();
    products.forEach((p) => {
      if (p.name) {
        map.set(p.name.toLowerCase().trim(), p);
      }
    });
    return map;
  }, [products]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (selectedChannel !== "All") {
        const ch = (o.channel || "").toLowerCase();
        if (!ch.includes(selectedChannel.toLowerCase())) return false;
      }
      if (o.created_at) {
        const d = o.created_at.slice(0, 10);
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
      }
      return true;
    });
  }, [orders, selectedChannel, dateFrom, dateTo]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const d = (e.date || e.created_at || "").slice(0, 10);
      if (d) {
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
      }
      return true;
    });
  }, [expenses, dateFrom, dateTo]);

  const monthlyData: MonthlyRow[] = useMemo(() => {
    const monthsMeta = [
      { key: "2026-06", label: "Jun '26" },
      { key: "2026-07", label: "Jul '26" },
      { key: "2026-08", label: "Aug '26" },
      { key: "2026-09", label: "Sep '26" },
      { key: "2026-10", label: "Oct '26" },
      { key: "2026-11", label: "Nov '26" },
    ];

    const baselineByMonth: Record<
      string,
      {
        ordersCount: number;
        totalSales: number;
        discounts: number;
        returns: number;
        shipping: number;
        tax: number;
        cogs: number;
        operatingExpenses: number;
      }
    > = {
      "2026-06": {
        ordersCount: 74,
        totalSales: 131105,
        discounts: 17283,
        returns: 14412,
        shipping: 970,
        tax: 1192,
        cogs: 62700,
        operatingExpenses: 35652,
      },
      "2026-07": {
        ordersCount: 89,
        totalSales: 130858,
        discounts: 14229,
        returns: 17596,
        shipping: 1063,
        tax: 1219,
        cogs: 59800,
        operatingExpenses: 32489,
      },
      "2026-08": {
        ordersCount: 87,
        totalSales: 146614,
        discounts: 20389,
        returns: 14158,
        shipping: 1015,
        tax: 1847,
        cogs: 64580,
        operatingExpenses: 34238,
      },
      "2026-09": {
        ordersCount: 109,
        totalSales: 187427,
        discounts: 22263,
        returns: 18485,
        shipping: 1392,
        tax: 2237,
        cogs: 75750,
        operatingExpenses: 38631,
      },
      "2026-10": {
        ordersCount: 138,
        totalSales: 255538,
        discounts: 32903,
        returns: 22834,
        shipping: 1883,
        tax: 4827,
        cogs: 80500,
        operatingExpenses: 45105,
      },
      "2026-11": {
        ordersCount: 0,
        totalSales: 0,
        discounts: 0,
        returns: 0,
        shipping: 0,
        tax: 0,
        cogs: 0,
        operatingExpenses: 0,
      },
    };

    let runningCash = includeHistoricalBaseline ? 240000 : 50000;

    return monthsMeta.map((m) => {
      const base = includeHistoricalBaseline
        ? baselineByMonth[m.key]
        : {
            ordersCount: 0,
            totalSales: 0,
            discounts: 0,
            returns: 0,
            shipping: 0,
            tax: 0,
            cogs: 0,
            operatingExpenses: 0,
          };

      const monthOrders = filteredOrders.filter((o) => {
        const mKey = o.created_at ? o.created_at.slice(0, 7) : "2026-11";
        return mKey === m.key;
      });

      const monthExpenses = filteredExpenses.filter((e) => {
        const rawDate = e.date || e.created_at || "";
        const mKey = rawDate ? rawDate.slice(0, 7) : "2026-11";
        return mKey === m.key;
      });

      let liveSales = 0;
      let liveDiscounts = 0;
      let liveReturns = 0;
      let liveShipping = 0;
      let liveCogs = 0;
      let liveOrdersCount = 0;

      monthOrders.forEach((o) => {
        const amt = Number(o.amount) || 0;
        const reg = Number(o.regular_amount) || amt;
        const disc = Number(o.discount_amount) || Math.max(0, reg - amt);
        const qty = Number(o.quantity) || 1;
        const statusStr = `${o.fulfillment_status || ""} ${o.payment_status || ""} ${
          o.status || ""
        }`.toLowerCase();
        const isReturnedOrCancelled =
          statusStr.includes("return") ||
          statusStr.includes("cancel") ||
          statusStr.includes("refund");

        const matchedProd = productMap.get((o.product_name || "").toLowerCase().trim());
        const unitCost = matchedProd ? Number(matchedProd.cost_price) || 0 : 0;
        const orderCogs = Number(o.cogs_amount) || unitCost * qty;

        liveSales += reg;
        liveDiscounts += disc;

        if (isReturnedOrCancelled) {
          liveReturns += amt;
        } else {
          liveOrdersCount += 1;
          liveCogs += orderCogs;
          if (!String(o.channel || "").toLowerCase().includes("outlet")) {
            liveShipping += 80;
          }
        }
      });

      const liveOpsExp = monthExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

      const ordersCount = base.ordersCount + liveOrdersCount;
      const totalSales = base.totalSales + liveSales;
      const discounts = base.discounts + liveDiscounts;
      const returns = base.returns + liveReturns;
      const shipping = base.shipping + liveShipping;
      const tax = base.tax + Math.round(liveSales * 0.015);

      const income = Math.max(0, totalSales - discounts - returns + shipping + tax);
      const cogs = base.cogs + liveCogs;
      const grossProfit = income - cogs;
      const operatingExpenses = base.operatingExpenses + liveOpsExp;
      const netProfit = grossProfit - operatingExpenses;
      const netMargin = income > 0 ? (netProfit / income) * 100 : 0;
      const avgOrderValue = ordersCount > 0 ? totalSales / ordersCount : 0;

      runningCash = Math.max(10000, runningCash + netProfit);
      const totalLiabilitiesOrExp = Math.max(1, cogs + operatingExpenses);
      const cashRatio = Number((runningCash / totalLiabilitiesOrExp).toFixed(2));

      return {
        monthKey: m.key,
        monthLabel: m.label,
        ordersCount,
        totalSales,
        discounts,
        returns,
        shipping,
        tax,
        income,
        cogs,
        grossProfit,
        operatingExpenses,
        netProfit,
        netMargin,
        avgOrderValue,
        cashBalance: runningCash,
        cashRatio,
      };
    });
  }, [filteredOrders, filteredExpenses, productMap, includeHistoricalBaseline]);

  const totals = useMemo(() => {
    const sum = monthlyData.reduce(
      (acc, r) => ({
        ordersCount: acc.ordersCount + r.ordersCount,
        totalSales: acc.totalSales + r.totalSales,
        discounts: acc.discounts + r.discounts,
        returns: acc.returns + r.returns,
        shipping: acc.shipping + r.shipping,
        tax: acc.tax + r.tax,
        income: acc.income + r.income,
        cogs: acc.cogs + r.cogs,
        grossProfit: acc.grossProfit + r.grossProfit,
        operatingExpenses: acc.operatingExpenses + r.operatingExpenses,
        netProfit: acc.netProfit + r.netProfit,
      }),
      {
        ordersCount: 0,
        totalSales: 0,
        discounts: 0,
        returns: 0,
        shipping: 0,
        tax: 0,
        income: 0,
        cogs: 0,
        grossProfit: 0,
        operatingExpenses: 0,
        netProfit: 0,
      }
    );
    const totalExpensesAll = sum.cogs + sum.operatingExpenses;
    const avgOrderValue = sum.ordersCount > 0 ? sum.totalSales / sum.ordersCount : 0;
    const netMargin = sum.income > 0 ? (sum.netProfit / sum.income) * 100 : 0;
    return { ...sum, totalExpensesAll, avgOrderValue, netMargin };
  }, [monthlyData]);

  const salesByProductData = useMemo(() => {
    const catTotals: Record<string, number> = {};

    filteredOrders.forEach((o) => {
      const matched = productMap.get((o.product_name || "").toLowerCase().trim());
      const cat = matched?.category || o.product_name || "General Merchandise";
      catTotals[cat] = (catTotals[cat] || 0) + (Number(o.amount) || 0);
    });

    if (includeHistoricalBaseline) {
      catTotals["Apparel & Fashion"] = (catTotals["Apparel & Fashion"] || 0) + 425000;
      catTotals["Footwear & Shoes"] = (catTotals["Footwear & Shoes"] || 0) + 265000;
      catTotals["Accessories & Gadgets"] = (catTotals["Accessories & Gadgets"] || 0) + 135000;
      catTotals["Other Categories"] = (catTotals["Other Categories"] || 0) + 67000;
    }

    const entries = Object.entries(catTotals)
      .map(([name, value]) => ({ name, value }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);

    return entries.length > 0 ? entries : [{ name: "No Sales Yet", value: 1 }];
  }, [filteredOrders, productMap, includeHistoricalBaseline]);

  const incomeByAccountData = useMemo(() => {
    let productSalesIncome = 0;
    let outletPosIncome = 0;
    let socialCommerceIncome = 0;

    filteredOrders.forEach((o) => {
      const amt = Number(o.amount) || 0;
      const ch = (o.channel || "").toLowerCase();
      if (ch.includes("outlet") || ch.includes("pos")) {
        outletPosIncome += amt;
      } else if (
        ch.includes("facebook") ||
        ch.includes("instagram") ||
        ch.includes("whatsapp") ||
        ch.includes("tiktok")
      ) {
        socialCommerceIncome += amt;
      } else {
        productSalesIncome += amt;
      }
    });

    if (includeHistoricalBaseline) {
      productSalesIncome += 520000;
      socialCommerceIncome += 310000;
      outletPosIncome += 145000;
    }

    const list = [
      { name: "Sales of Product Income", value: productSalesIncome },
      { name: "Social Commerce (FB/IG/WA/TT)", value: socialCommerceIncome },
      { name: "Physical Outlet / POS", value: outletPosIncome },
      { name: "Shipping & Delivery Recovery", value: totals.shipping },
    ].filter((x) => x.value > 0);

    return list.length > 0 ? list : [{ name: "Sales of Product Income", value: 1 }];
  }, [filteredOrders, includeHistoricalBaseline, totals.shipping]);

  const expensesByAccountRows = useMemo(() => {
    const map: Record<string, number> = {
      "Cost of Goods Sold (COGS)": totals.cogs,
      "Wages & Salaries": includeHistoricalBaseline ? 88000 : 0,
      "Subcontractors": includeHistoricalBaseline ? 42000 : 0,
      "Rent office space": includeHistoricalBaseline ? 35000 : 0,
      "Marketing & Ad Spend": includeHistoricalBaseline ? 24500 : 0,
      "Payroll Tax & Utilities": includeHistoricalBaseline ? 11300 : 0,
      "Payment Provider Fees": includeHistoricalBaseline ? 3500 : 0,
    };

    filteredExpenses.forEach((e) => {
      const cat = e.category || "Operating Expense";
      map[cat] = (map[cat] || 0) + (Number(e.amount) || 0);
    });

    return Object.entries(map)
      .map(([accountName, amount]) => ({ accountName, amount }))
      .filter((r) => r.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [totals.cogs, filteredExpenses, includeHistoricalBaseline]);

  const expensesTableGrandTotal = useMemo(
    () => expensesByAccountRows.reduce((acc, r) => acc + r.amount, 0),
    [expensesByAccountRows]
  );

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(expAmount);
    if (!expTitle.trim() || !numericAmount || numericAmount <= 0) {
      triggerToast("Please enter an expense description and valid amount.");
      return;
    }

    const newExp: ExpenseRecord = {
      id: Date.now(),
      title: expTitle.trim(),
      category: expCategory,
      amount: numericAmount,
      date: expDate,
      created_at: new Date(expDate).toISOString(),
    };

    const nextList = [newExp, ...expenses];
    setExpenses(nextList);
    localStorage.setItem("synvora_db_expenses_v2", JSON.stringify(nextList));

    try {
      await postToBackend("/expenses/", {
        title: newExp.title,
        category: newExp.category,
        amount: newExp.amount,
      });
    } catch {}

    setExpTitle("");
    setExpAmount("");
    setShowExpenseModal(false);
    triggerToast(`Expense "${newExp.title}" logged and P&L recalculated!`);
  };

  const handleDeleteExpense = async (id?: number | string) => {
    if (id === undefined) return;
    const nextList = expenses.filter((e) => e.id !== id);
    setExpenses(nextList);
    localStorage.setItem("synvora_db_expenses_v2", JSON.stringify(nextList));
    try {
      await deleteFromApi(`/expenses/${id}/`);
    } catch {}
    triggerToast("Expense entry removed and P&L updated.");
  };

  const handleExportPnLCsv = () => {
    const headers = [
      "Month",
      "Total Sales",
      "Discounts",
      "Returns",
      "Shipping",
      "Tax",
      "Income",
      "COGS",
      "Gross Profit",
      "Operating Expenses",
      "Net Profit (Loss)",
      "Net Margin (%)",
    ];

    const rows = [...monthlyData].reverse().map((r) => [
      r.monthKey,
      r.totalSales.toFixed(2),
      (-r.discounts).toFixed(2),
      (-r.returns).toFixed(2),
      r.shipping.toFixed(2),
      r.tax.toFixed(2),
      r.income.toFixed(2),
      (-r.cogs).toFixed(2),
      r.grossProfit.toFixed(2),
      (-r.operatingExpenses).toFixed(2),
      r.netProfit.toFixed(2),
      `${r.netMargin.toFixed(2)}%`,
    ]);

    rows.push([
      "Grand total",
      totals.totalSales.toFixed(2),
      (-totals.discounts).toFixed(2),
      (-totals.returns).toFixed(2),
      totals.shipping.toFixed(2),
      totals.tax.toFixed(2),
      totals.income.toFixed(2),
      (-totals.cogs).toFixed(2),
      totals.grossProfit.toFixed(2),
      (-totals.operatingExpenses).toFixed(2),
      totals.netProfit.toFixed(2),
      `${totals.netMargin.toFixed(2)}%`,
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.map((v) => `"${v}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Synvora_Financial_PnL_Statement_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast("Full 12-column P&L financial statement exported to CSV!");
  };

  // Dedicated Clean A4 Landscape Official P&L PDF / Print Generator (Zero Sidebar!)
  const handlePrintOfficialPnLReport = () => {
    const win = window.open("", "_blank", "width=1120,height=820");
    if (!win) return;

    const expenseRowsHtml = expensesByAccountRows
      .map(
        (r) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${r.accountName}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">${formatMoney(
            r.amount
          )}</td>
        </tr>`
      )
      .join("");

    const monthlyRowsHtml = [...monthlyData]
      .reverse()
      .map(
        (r) => `
        <tr>
          <td style="padding:8px;border:1px solid #cbd5e1;font-weight:700;">${r.monthKey}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;">${formatMoney(r.totalSales)}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;">-${formatMoney(r.discounts)}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;">-${formatMoney(r.returns)}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;">${formatMoney(r.shipping)}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;">${formatMoney(r.tax)}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;font-weight:700;">${formatMoney(
            r.income
          )}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;">-${formatMoney(r.cogs)}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;font-weight:700;">${formatMoney(
            r.grossProfit
          )}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;">-${formatMoney(
            r.operatingExpenses
          )}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;font-weight:800;color:${
            r.netProfit >= 0 ? "#047857" : "#be123c"
          };">${formatMoney(r.netProfit)}</td>
          <td style="padding:8px;border:1px solid #cbd5e1;font-weight:700;">${r.netMargin.toFixed(
            2
          )}%</td>
        </tr>`
      )
      .join("");

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Official Financial P&L Statement — Synvora OS</title>
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 20px; background: #ffffff; }
            h1 { margin: 0; font-size: 20px; }
            .sub { font-size: 12px; color: #475569; margin-top: 4px; }
            .kpi-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; margin: 18px 0; }
            .kpi-box { border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px; background: #f8fafc; }
            .kpi-label { font-size: 11px; color: #64748b; }
            .kpi-val { font-size: 14px; font-weight: 800; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
            th { background: #0f172a; color: #ffffff; padding: 8px; text-align: left; border: 1px solid #0f172a; }
            .section-title { font-size: 14px; font-weight: 800; margin-top: 22px; margin-bottom: 6px; }
          </style>
        </head>
        <body>
          <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:12px;">
            <div>
              <h1>Official Financial Analytics &amp; Profit/Loss (P&amp;L) Statement</h1>
              <div class="sub">Period: ${dateFrom} to ${dateTo} • Channel: ${selectedChannel} • Currency: ${code} (${symbol})</div>
            </div>
            <div style="text-align:right;font-size:12px;">
              <strong>Generated:</strong> ${new Date().toLocaleDateString()}<br/>
              <span>Synvora Commerce Accounting</span>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-box"><div class="kpi-label">Total Sales</div><div class="kpi-val">${formatMoney(
              totals.totalSales
            )}</div></div>
            <div class="kpi-box"><div class="kpi-label">Orders Count</div><div class="kpi-val">${
              totals.ordersCount
            }</div></div>
            <div class="kpi-box"><div class="kpi-label">Avg Order Value</div><div class="kpi-val">${formatMoney(
              totals.avgOrderValue
            )}</div></div>
            <div class="kpi-box"><div class="kpi-label">Net Income</div><div class="kpi-val">${formatMoney(
              totals.income
            )}</div></div>
            <div class="kpi-box"><div class="kpi-label">Total Expenses</div><div class="kpi-val">${formatMoney(
              totals.totalExpensesAll
            )}</div></div>
            <div class="kpi-box"><div class="kpi-label">Net Profit (Loss)</div><div class="kpi-val">${formatMoney(
              totals.netProfit
            )}</div></div>
            <div class="kpi-box"><div class="kpi-label">Net Margin</div><div class="kpi-val">${totals.netMargin.toFixed(
              2
            )}%</div></div>
          </div>

          <div class="section-title">1. Month-over-Month Profit &amp; Loss (P&amp;L) Statement</div>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Total Sales</th>
                <th>Discounts</th>
                <th>Returns</th>
                <th>Shipping</th>
                <th>Tax</th>
                <th>Income</th>
                <th>COGS</th>
                <th>Gross Profit</th>
                <th>Operating Expenses</th>
                <th>Net Profit (Loss)</th>
                <th>Net Margin</th>
              </tr>
            </thead>
            <tbody>
              ${monthlyRowsHtml}
              <tr style="background:#f1f5f9;font-weight:800;">
                <td style="padding:8px;border:1px solid #cbd5e1;">Grand Total</td>
                <td style="padding:8px;border:1px solid #cbd5e1;">${formatMoney(
                  totals.totalSales
                )}</td>
                <td style="padding:8px;border:1px solid #cbd5e1;">-${formatMoney(
                  totals.discounts
                )}</td>
                <td style="padding:8px;border:1px solid #cbd5e1;">-${formatMoney(
                  totals.returns
                )}</td>
                <td style="padding:8px;border:1px solid #cbd5e1;">${formatMoney(
                  totals.shipping
                )}</td>
                <td style="padding:8px;border:1px solid #cbd5e1;">${formatMoney(
                  totals.tax
                )}</td>
                <td style="padding:8px;border:1px solid #cbd5e1;">${formatMoney(
                  totals.income
                )}</td>
                <td style="padding:8px;border:1px solid #cbd5e1;">-${formatMoney(
                  totals.cogs
                )}</td>
                <td style="padding:8px;border:1px solid #cbd5e1;">${formatMoney(
                  totals.grossProfit
                )}</td>
                <td style="padding:8px;border:1px solid #cbd5e1;">-${formatMoney(
                  totals.operatingExpenses
                )}</td>
                <td style="padding:8px;border:1px solid #cbd5e1;">${formatMoney(
                  totals.netProfit
                )}</td>
                <td style="padding:8px;border:1px solid #cbd5e1;">${totals.netMargin.toFixed(
                  2
                )}%</td>
              </tr>
            </tbody>
          </table>

          <div class="section-title">2. Expenses Breakdown by Account</div>
          <table style="max-width:520px;">
            <thead>
              <tr>
                <th>Account Name</th>
                <th style="text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${expenseRowsHtml}
              <tr style="background:#f1f5f9;font-weight:800;">
                <td style="padding:8px 12px;">Grand Total Expenses</td>
                <td style="padding:8px 12px;text-align:right;">${formatMoney(
                  expensesTableGrandTotal
                )}</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 300);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-slate-50/60 min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Top Executive Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Financial Analytics, Revenue &amp; P&amp;L Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-4xl">
              Combine omnichannel store sales with operational financials to track how store performance translates into profit. Monitor orders, average order value, income by account, COGS, cash balance, and net margin month over month.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowExpenseModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Log Expense
            </button>

            <button
              type="button"
              onClick={handleExportPnLCsv}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export P&amp;L CSV
            </button>

            <button
              type="button"
              onClick={handlePrintOfficialPnLReport}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>

            <button
              type="button"
              onClick={() => setShowAiInsights(!showAiInsights)}
              className="px-4 py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              AI Insights
            </button>
          </div>
        </div>

        {/* Filter Bar & Currency Note */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              ● Live Store Accounting
            </span>
            <button
              type="button"
              onClick={() => setIncludeHistoricalBaseline(!includeHistoricalBaseline)}
              className={`px-3 py-1 rounded-lg font-semibold border transition cursor-pointer ${
                includeHistoricalBaseline
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {includeHistoricalBaseline
                ? "Showing: Live DB + 6-Month Benchmark"
                : "Showing: 100% Raw Live DB Only"}
            </button>
            <span className="text-slate-400 hidden sm:inline">|</span>
            <span className="text-slate-600 font-medium">
              * All amounts on this dashboard are shown in home currency ({code} {symbol})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-transparent text-slate-700 font-medium focus:outline-none"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-transparent text-slate-700 font-medium focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All">All Channels</option>
                <option value="Website">Website Storefront</option>
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="TikTok">TikTok</option>
                <option value="Outlet">Physical Outlet / POS</option>
              </select>
            </div>
          </div>
        </div>

        {/* Collapsible AI CFO Financial Insights Drawer */}
        {showAiInsights && (
          <div className="p-5 rounded-2xl bg-linear-to-r from-purple-950 via-indigo-950 to-slate-900 text-white border border-purple-700/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-300" />
                <h3 className="text-sm font-bold text-purple-200">
                  AI CFO Executive Profit &amp; Margin Diagnosis
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAiInsights(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Close ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <p className="text-purple-300 font-bold">1. Net Profit Efficiency</p>
                <p className="text-slate-200 leading-relaxed">
                  Your current Net Margin is{" "}
                  <strong>{totals.netMargin.toFixed(1)}%</strong> with Net Profit of{" "}
                  <strong>{formatMoney(totals.netProfit)}</strong>. Maintaining COGS below 35% of gross revenue keeps unit economics healthy.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <p className="text-emerald-300 font-bold">2. Discount &amp; Return Leakage</p>
                <p className="text-slate-200 leading-relaxed">
                  Promotional discounts totaled{" "}
                  <strong>{formatMoney(totals.discounts)}</strong> and returns totaled{" "}
                  <strong>{formatMoney(totals.returns)}</strong>. Converting returned items via Inventory Auto-Restock recovers 100% of product COGS.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <p className="text-amber-300 font-bold">3. Average Order Value (AOV) Growth</p>
                <p className="text-slate-200 leading-relaxed">
                  Across <strong>{totals.ordersCount}</strong> orders, your AOV is{" "}
                  <strong>{formatMoney(totals.avgOrderValue)}</strong>. Bundling complementary items in Unified Inbox &amp; Store Checkout can lift AOV by 18–25%.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ROW 1: 7 Executive KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-1.5">
          <p className="text-xs font-medium text-slate-500">Total Sales</p>
          <p className="text-xl font-extrabold text-slate-900 truncate">
            {formatMoney(totals.totalSales)}
          </p>
          <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 24.6%
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-1.5">
          <p className="text-xs font-medium text-slate-500">Orders count</p>
          <p className="text-xl font-extrabold text-slate-900">
            {totals.ordersCount.toLocaleString()}
          </p>
          <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 16.0%
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-1.5">
          <p className="text-xs font-medium text-slate-500">Avg Order Value</p>
          <p className="text-xl font-extrabold text-slate-900 truncate">
            {formatMoney(totals.avgOrderValue)}
          </p>
          <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 8.3%
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-1.5">
          <p className="text-xs font-medium text-slate-500">Income</p>
          <p className="text-xl font-extrabold text-slate-900 truncate">
            {formatMoney(totals.income)}
          </p>
          <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 14.2%
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-1.5">
          <p className="text-xs font-medium text-slate-500">Expenses</p>
          <p className="text-xl font-extrabold text-slate-900 truncate">
            {formatMoney(totals.totalExpensesAll)}
          </p>
          <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> -1.3%
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-1.5">
          <p className="text-xs font-medium text-slate-500">Net Profit (Loss)</p>
          <p
            className={`text-xl font-extrabold truncate ${
              totals.netProfit >= 0 ? "text-slate-900" : "text-rose-600"
            }`}
          >
            {formatMoney(totals.netProfit)}
          </p>
          <p
            className={`text-[11px] font-semibold flex items-center gap-1 ${
              totals.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            <TrendingUp className="w-3 h-3" /> {totals.netProfit >= 0 ? "+18.4%" : "Loss"}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-1.5">
          <p className="text-xs font-medium text-slate-500">Net Margin</p>
          <p className="text-xl font-extrabold text-slate-900">
            {totals.netMargin.toFixed(1)}%
          </p>
          <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 4.4%
          </p>
        </div>
      </div>

      {/* ROW 2: Total Sales Bar Chart + Income vs Expenses vs Net Profit Grouped Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#00a8e8]" />
              <h2 className="text-sm font-bold text-slate-800">Total Sales</h2>
            </div>
            <span className="text-xs text-slate-400">Monthly Gross Sales</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barSize={42}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${symbol}${(Number(v || 0) / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(val) => [formatMoney(Number(val ?? 0)), "Total Sales"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="totalSales" fill="#00a8e8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00a8e8]" /> Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#a8a29e]" /> Expenses
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2ea44f]" /> Net Profit (Loss)
              </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${symbol}${(Number(v || 0) / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(val, name) => [formatMoney(Number(val ?? 0)), String(name ?? "")]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="income" name="Income" fill="#00a8e8" radius={[3, 3, 0, 0]} />
                <Bar
                  dataKey="operatingExpenses"
                  name="Expenses"
                  fill="#a8a29e"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="netProfit"
                  name="Net Profit (Loss)"
                  fill="#2ea44f"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 3: Sales by Product Donut + Income by Account Donut + Expenses by Account Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Sales by Product</h2>
            <span className="text-xs text-slate-400">Category Share</span>
          </div>
          <div className="h-60 w-full flex items-center">
            <div className="w-3/5 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByProductData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={82}
                    paddingAngle={2}
                  >
                    {salesByProductData.map((_, idx) => (
                      <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => formatMoney(Number(val ?? 0))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-2/5 space-y-2 pl-2">
              {salesByProductData.slice(0, 5).map((item, idx) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                  />
                  <span className="text-slate-700 font-medium truncate" title={item.name}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Income by Account</h2>
            <span className="text-xs text-slate-400">Revenue Stream</span>
          </div>
          <div className="h-60 w-full flex items-center">
            <div className="w-3/5 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeByAccountData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={82}
                    paddingAngle={2}
                  >
                    {incomeByAccountData.map((_, idx) => (
                      <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => formatMoney(Number(val ?? 0))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-2/5 space-y-2 pl-2">
              {incomeByAccountData.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                  />
                  <span className="text-slate-700 font-medium truncate" title={item.name}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-900">Expenses by Account</h2>
            <button
              type="button"
              onClick={() => setShowExpenseModal(true)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              + Add Expense
            </button>
          </div>

          <div className="overflow-y-auto max-h-48 border-t border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-600">
                  <th className="py-2.5 pr-2">Account name</th>
                  <th className="py-2.5 text-right">Expenses ↓</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {expensesByAccountRows.map((row) => (
                  <tr key={row.accountName} className="hover:bg-slate-50/80">
                    <td className="py-2.5 pr-2 text-slate-700 font-medium">
                      {row.accountName}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-slate-900">
                      {formatMoney(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-3 mt-2 border-t-2 border-slate-200 flex items-center justify-between text-xs font-extrabold text-slate-900">
            <span>Grand total</span>
            <span>{formatMoney(expensesTableGrandTotal)}</span>
          </div>
        </div>
      </div>

      {/* ROW 4: Two Combo Charts (Orders Count + AOV Line) & (Cash Balance + Cash Ratio Line) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-5 text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2ea44f]" /> Orders count
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-[#9a3412]" /> Avg Order Value
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${symbol}${Number(v || 0).toFixed(0)}`}
                />
                <Tooltip
                  formatter={(val, name) =>
                    String(name) === "Avg Order Value"
                      ? [formatMoney(Number(val ?? 0)), String(name)]
                      : [Number(val ?? 0), String(name ?? "")]
                  }
                />
                <Bar
                  yAxisId="left"
                  dataKey="ordersCount"
                  name="Orders count"
                  fill="#2ea44f"
                  barSize={42}
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgOrderValue"
                  name="Avg Order Value"
                  stroke="#9a3412"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#9a3412" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-5 text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00a8e8]" /> Cash Balance
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-[#9a3412]" /> Cash Ratio
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${symbol}${(Number(v || 0) / 1000).toFixed(0)}K`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val, name) =>
                    String(name) === "Cash Balance"
                      ? [formatMoney(Number(val ?? 0)), String(name)]
                      : [Number(val ?? 0), String(name ?? "")]
                  }
                />
                <Bar
                  yAxisId="left"
                  dataKey="cashBalance"
                  name="Cash Balance"
                  fill="#00a8e8"
                  barSize={42}
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cashRatio"
                  name="Cash Ratio"
                  stroke="#9a3412"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#9a3412" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ROW 5: Full 12-Column Heatmap Monthly P&L Financial Statement Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Month-over-Month Profit &amp; Loss (P&amp;L) Financial Statement
            </h2>
            <p className="text-xs text-slate-500">
              Complete breakdown of Sales, Discounts, Returns, Shipping, Tax, Income, COGS, Gross Profit, Operating Expenses, and Net Margin.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportPnLCsv}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            ↓ Download Statement (CSV)
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-275">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700">
                <th className="py-3 px-3.5">Month ↓</th>
                <th className="py-3 px-3.5">Total Sales</th>
                <th className="py-3 px-3.5">Discounts</th>
                <th className="py-3 px-3.5">Returns</th>
                <th className="py-3 px-3.5">Shipping</th>
                <th className="py-3 px-3.5">Tax</th>
                <th className="py-3 px-3.5">Income</th>
                <th className="py-3 px-3.5">COGS</th>
                <th className="py-3 px-3.5">Gross Profit</th>
                <th className="py-3 px-3.5">Operating Expens...</th>
                <th className="py-3 px-3.5">Net Profit (Loss)</th>
                <th className="py-3 px-3.5">Net Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 text-xs">
              {[...monthlyData].reverse().map((row) => (
                <tr key={row.monthKey} className="hover:brightness-95 transition">
                  <td className="py-3 px-3.5 font-semibold text-slate-800 bg-white">
                    {row.monthKey}
                  </td>
                  <td className="py-3 px-3.5 font-medium text-slate-900 bg-purple-100/60">
                    {formatMoney(row.totalSales)}
                  </td>
                  <td className="py-3 px-3.5 font-medium text-slate-800 bg-sky-100/60">
                    -{formatMoney(row.discounts)}
                  </td>
                  <td className="py-3 px-3.5 font-medium text-slate-800 bg-emerald-100/50">
                    -{formatMoney(row.returns)}
                  </td>
                  <td className="py-3 px-3.5 font-medium text-slate-800 bg-slate-100/80">
                    {formatMoney(row.shipping)}
                  </td>
                  <td className="py-3 px-3.5 font-medium text-slate-800 bg-teal-100/50">
                    {formatMoney(row.tax)}
                  </td>
                  <td className="py-3 px-3.5 font-semibold text-slate-900 bg-purple-200/50">
                    {formatMoney(row.income)}
                  </td>
                  <td className="py-3 px-3.5 font-medium text-slate-800 bg-sky-100/70">
                    -{formatMoney(row.cogs)}
                  </td>
                  <td className="py-3 px-3.5 font-semibold text-slate-900 bg-emerald-100/70">
                    {formatMoney(row.grossProfit)}
                  </td>
                  <td className="py-3 px-3.5 font-medium text-slate-800 bg-slate-100">
                    -{formatMoney(row.operatingExpenses)}
                  </td>
                  <td
                    className={`py-3 px-3.5 font-bold ${
                      row.netProfit >= 0
                        ? "text-emerald-950 bg-emerald-200/60"
                        : "text-rose-900 bg-rose-100"
                    }`}
                  >
                    {formatMoney(row.netProfit)}
                  </td>
                  <td className="py-3 px-3.5 font-semibold text-slate-900 bg-purple-200/50">
                    {row.netMargin.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-white text-xs font-extrabold text-slate-900">
                <td className="py-3.5 px-3.5">Grand total</td>
                <td className="py-3.5 px-3.5">{formatMoney(totals.totalSales)}</td>
                <td className="py-3.5 px-3.5">-{formatMoney(totals.discounts)}</td>
                <td className="py-3.5 px-3.5">-{formatMoney(totals.returns)}</td>
                <td className="py-3.5 px-3.5">{formatMoney(totals.shipping)}</td>
                <td className="py-3.5 px-3.5">{formatMoney(totals.tax)}</td>
                <td className="py-3.5 px-3.5">{formatMoney(totals.income)}</td>
                <td className="py-3.5 px-3.5">-{formatMoney(totals.cogs)}</td>
                <td className="py-3.5 px-3.5">{formatMoney(totals.grossProfit)}</td>
                <td className="py-3.5 px-3.5">-{formatMoney(totals.operatingExpenses)}</td>
                <td className="py-3.5 px-3.5">{formatMoney(totals.netProfit)}</td>
                <td className="py-3.5 px-3.5">{totals.netMargin.toFixed(2)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal: Log Operational Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Log Operational / Business Expense</h3>
                <p className="text-xs text-slate-400">
                  Automatically updates Expenses by Account &amp; Monthly P&amp;L Statement
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g., November Staff Salary, Office Rent, Facebook Campaign"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Category *
                  </label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {EXPENSE_ACCOUNT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount ({symbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    placeholder="5000"
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Expense Date
                </label>
                <input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition cursor-pointer"
              >
                + Save Expense &amp; Update P&amp;L
              </button>

              {expenses.length > 0 && (
                <div className="pt-4 border-t border-slate-200 space-y-2 max-h-44 overflow-y-auto">
                  <p className="text-xs font-bold text-slate-600">Recent Logged Expenses:</p>
                  {expenses.slice(0, 8).map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">{item.title}</span>
                        <span className="text-slate-400 ml-2">({item.category})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-600">
                          -{formatMoney(Number(item.amount) || 0)}
                        </span>
                        {item.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(item.id)}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}