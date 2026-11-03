"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  Send,
  Upload,
  Plus,
  Search,
  Download,
  Sparkles,
  CheckCircle2,
  ShoppingBag,
  Trash2,
  Megaphone,
  Image as ImageIcon,
} from "lucide-react";
import { getCustomers, getOrders, createCustomer, deleteCustomer } from "@/lib/api";
import { useCurrency, compressImageFile } from "@/lib/currency";

interface UnifiedCustomerProfile {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  channel: string;
  ordersCount: number;
  itemsBoughtCount: number;
  purchasedProductsSummary: string;
  totalSpent: number;
  lastOrderDate: string;
  status: "Accepted" | "VIP Repeat" | "Messaged (No Purchase)";
  progressPct: number;
}

interface BroadcastCampaignRecord {
  id: string;
  title: string;
  description: string;
  bannerImage: string;
  segment: string;
  channels: string;
  recipientCount: number;
  sentAt: string;
}

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#3b82f6"];

export default function CustomersPage() {
  const { formatMoney, symbol } = useCurrency();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rawCustomers, setRawCustomers] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rawOrders, setRawOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewFilter, setViewFilter] = useState<"all" | "vip" | "no_purchase" | "outlet">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>([]);

  const [targetSegment, setTargetSegment] = useState("All Customers & Messaged Leads");
  const [offerTitle, setOfferTitle] = useState("40% OFF New Arrival Collection!");
  const [offerDescription, setOfferDescription] = useState(
    "Exclusive 40% OFF Flash Sale on our newest arrivals! Visit our store or reply to order now."
  );
  const [offerBannerUrl, setOfferBannerUrl] = useState<string>("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    "Facebook & Instagram DM",
    "WhatsApp",
    "SMS / Email",
  ]);
  const [broadcastSuccessMsg, setBroadcastSuccessMsg] = useState("");
  const [sentCampaigns, setSentCampaigns] = useState<BroadcastCampaignRecord[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");
  const [newCustChannel, setNewCustChannel] = useState("Facebook DM");
  const [newCustHasPurchased, setNewCustHasPurchased] = useState(false);

  const loadCrmData = async () => {
    setLoading(true);
    const [custData, ordData] = await Promise.all([getCustomers(), getOrders()]);
    if (Array.isArray(custData)) setRawCustomers(custData);
    if (Array.isArray(ordData)) setRawOrders(ordData);
    setLoading(false);
  };

  useEffect(() => {
    loadCrmData();
  }, []);

  const unifiedCustomers = useMemo<UnifiedCustomerProfile[]>(() => {
    const map = new Map<string, UnifiedCustomerProfile>();

    for (const c of rawCustomers) {
      const key = String(c.phone && c.phone !== "N/A" ? c.phone : c.name)
        .toLowerCase()
        .trim();
      if (!key) continue;
      const spent = Number(c.total_spent || 0);
      const ordCount = Number(c.orders_count ?? 0);
      const hasBought = ordCount > 0 && spent > 0;

      map.set(key, {
        id: Number(c.id),
        name: String(c.name || "Customer"),
        phone: String(c.phone || "N/A"),
        email: String(c.email || ""),
        address: String(c.address || ""),
        channel: String(c.channel || "Facebook DM"),
        ordersCount: hasBought ? ordCount : 0,
        itemsBoughtCount: hasBought ? ordCount : 0,
        purchasedProductsSummary: hasBought
          ? `${ordCount} ${ordCount > 1 ? "Products" : "Product"}`
          : "0 Products (Messaged / Lead Only)",
        totalSpent: spent,
        lastOrderDate: c.created_at
          ? new Date(c.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "Recent",
        status: !hasBought
          ? "Messaged (No Purchase)"
          : ordCount >= 2
          ? "VIP Repeat"
          : "Accepted",
        progressPct: !hasBought ? 15 : Math.min(100, Math.max(35, ordCount * 28)),
      });
    }

    const orderGrouped = new Map<
      string,
      {
        id: number;
        name: string;
        phone: string;
        address: string;
        channel: string;
        ordersCount: number;
        itemsCount: number;
        productNames: Set<string>;
        totalSpent: number;
        latestDate: string;
      }
    >();

    for (const o of rawOrders) {
      if (o.status === "Cancelled" || o.status === "Returned") continue;
      const cName = String(o.customer || o.customer_name || "Customer").trim();
      const cPhone = String(o.customer_phone || "").trim();
      const key = (cPhone && cPhone !== "N/A" ? cPhone : cName).toLowerCase();
      if (!key) continue;

      const qty = Math.max(1, Number(o.quantity || 1));
      const amt = Number(o.amount || 0);
      const pName = String(o.product_name || "Order Item");
      const dtStr = o.created_at
        ? new Date(o.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Today";

      const existing = orderGrouped.get(key);
      if (existing) {
        existing.ordersCount += 1;
        existing.itemsCount += qty;
        existing.productNames.add(pName);
        existing.totalSpent += amt;
      } else {
        orderGrouped.set(key, {
          id: Number(o.id),
          name: cName,
          phone: cPhone || "N/A",
          address: String(o.delivery_address || ""),
          channel: String(o.channel || "Online Store"),
          ordersCount: 1,
          itemsCount: qty,
          productNames: new Set([pName]),
          totalSpent: amt,
          latestDate: dtStr,
        });
      }
    }

    for (const [key, grp] of orderGrouped.entries()) {
      const prodList = Array.from(grp.productNames).join(", ");
      const summary = `${grp.itemsCount} ${grp.itemsCount > 1 ? "Products" : "Product"} (${prodList})`;
      const existingCust = map.get(key);
      if (existingCust) {
        existingCust.ordersCount = grp.ordersCount;
        existingCust.itemsBoughtCount = grp.itemsCount;
        existingCust.purchasedProductsSummary = summary;
        existingCust.totalSpent = grp.totalSpent;
        existingCust.lastOrderDate = grp.latestDate;
        existingCust.status = grp.ordersCount >= 2 ? "VIP Repeat" : "Accepted";
        existingCust.progressPct = Math.min(100, Math.max(35, grp.ordersCount * 28));
      } else {
        map.set(key, {
          id: grp.id,
          name: grp.name,
          phone: grp.phone,
          email: "",
          address: grp.address,
          channel: grp.channel,
          ordersCount: grp.ordersCount,
          itemsBoughtCount: grp.itemsCount,
          purchasedProductsSummary: summary,
          totalSpent: grp.totalSpent,
          lastOrderDate: grp.latestDate,
          status: grp.ordersCount >= 2 ? "VIP Repeat" : "Accepted",
          progressPct: Math.min(100, Math.max(35, grp.ordersCount * 28)),
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [rawCustomers, rawOrders]);

  const filteredCustomers = useMemo(() => {
    return unifiedCustomers.filter((c) => {
      if (viewFilter === "vip" && c.ordersCount < 2) return false;
      if (viewFilter === "no_purchase" && c.ordersCount > 0) return false;
      if (viewFilter === "outlet" && !c.channel.toLowerCase().includes("outlet")) {
        return false;
      }
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.purchasedProductsSummary.toLowerCase().includes(q) ||
        c.channel.toLowerCase().includes(q)
      );
    });
  }, [unifiedCustomers, viewFilter, searchQuery]);

  const analyticsData = useMemo(() => {
    const totalCustomers = unifiedCustomers.length;
    const noPurchaseCount = unifiedCustomers.filter((c) => c.ordersCount === 0).length;
    const totalProductsBought = unifiedCustomers.reduce(
      (s, c) => s + c.itemsBoughtCount,
      0
    );
    const totalCustomerRevenue = unifiedCustomers.reduce(
      (s, c) => s + c.totalSpent,
      0
    );

    const channelTotals: Record<string, number> = {};
    for (const c of unifiedCustomers) {
      const ch = c.channel || "Online Store";
      channelTotals[ch] = (channelTotals[ch] || 0) + Math.max(100, c.totalSpent);
    }

    const pieData = Object.entries(channelTotals).map(([name, value]) => ({
      name,
      value: Math.round(value),
    }));

    if (pieData.length === 0) {
      pieData.push(
        { name: "Facebook & IG", value: 45 },
        { name: "Direct Checkout", value: 35 },
        { name: "Outlet POS", value: 20 }
      );
    }

    const barData = unifiedCustomers.slice(0, 6).map((c) => ({
      name: c.name.split(" ")[0],
      spent: Math.round(c.totalSpent),
    }));

    return {
      totalCustomers,
      noPurchaseCount,
      totalProductsBought,
      totalCustomerRevenue,
      pieData,
      barData,
    };
  }, [unifiedCustomers]);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImageFile(file, 680);
    if (compressed) setOfferBannerUrl(compressed);
  };

  const toggleBroadcastChannel = (ch: string) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((item) => item !== ch) : [...prev, ch]
    );
  };

  const handleSendOfferBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerTitle.trim() || !offerDescription.trim()) return;

    const recipientCount =
      selectedCustomerIds.length > 0
        ? selectedCustomerIds.length
        : targetSegment.includes("No Purchase")
        ? analyticsData.noPurchaseCount
        : unifiedCustomers.length;

    const newCampaign: BroadcastCampaignRecord = {
      id: Date.now().toString(),
      title: offerTitle.trim(),
      description: offerDescription.trim(),
      bannerImage: offerBannerUrl,
      segment:
        selectedCustomerIds.length > 0
          ? `Selected Customers (${selectedCustomerIds.length})`
          : targetSegment,
      channels: selectedChannels.join(", ") || "All Channels",
      recipientCount: Math.max(1, recipientCount),
      sentAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setSentCampaigns((prev) => [newCampaign, ...prev]);
    setBroadcastSuccessMsg(
      `Promotional Banner & Offer ("${newCampaign.title}") sent to ${newCampaign.recipientCount} recipient(s) via ${newCampaign.channels}!`
    );
    setTimeout(() => setBroadcastSuccessMsg(""), 5000);
  };

  const handleManualCustomerCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) return;
    const created = await createCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      email: newCustEmail.trim(),
      address: newCustAddress.trim(),
      channel: newCustChannel,
      orders_count: newCustHasPurchased ? 1 : 0,
      total_spent: 0,
    });
    if (created) {
      setNewCustName("");
      setNewCustPhone("");
      setNewCustEmail("");
      setNewCustAddress("");
      setShowAddModal(false);
      loadCrmData();
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    if (!confirm("Remove this customer profile?")) return;
    await deleteCustomer(id);
    loadCrmData();
  };

  const exportCustomersCsv = () => {
    const headers = [
      "Customer Name",
      "Phone",
      "Address",
      "Source Channel",
      "Purchased Products",
      "Total Orders",
      "Lifetime Spent",
      "Status",
    ];
    const rows = filteredCustomers.map((c) => [
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.address}"`,
      `"${c.channel}"`,
      `"${c.purchasedProductsSummary}"`,
      String(c.ordersCount),
      String(c.totalSpent),
      c.status,
    ]);
    const csv = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "synvora_customers_crm.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Customer CRM, Leads &amp; Promotional Banner Broadcaster
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tracks both verified buyers and people who messaged/commented/liked without purchasing yet.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCustomersCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Customer / Lead
          </button>
        </div>
      </div>

      {/* Zelora Top Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-3 flex flex-col justify-between gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Total Buyers &amp; Leads</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {analyticsData.totalCustomers}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700">
                {analyticsData.noPurchaseCount} No-Purchase Leads
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Synced with Orders &amp; Unified Inbox
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Total Products Purchased</span>
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {analyticsData.totalProductsBought}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700">
                Units Sold
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Across all active buyers
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500">Total Customer Revenue Overview</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-extrabold text-slate-900">
                {formatMoney(analyticsData.totalCustomerRevenue)}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                Live DB
              </span>
            </div>
          </div>

          <div className="h-36 w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.barData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="spent" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-900">
              Total Sales &amp; Channel Statistics
            </span>
            <span className="text-[11px] font-bold text-slate-400">Live Ring</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 my-auto py-2">
            <div className="relative h-40 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.pieData}
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {analyticsData.pieData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-xs font-black text-slate-900">
                  {formatMoney(analyticsData.totalCustomerRevenue)}
                </span>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full mt-0.5">
                  Total LTV
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {analyticsData.pieData.slice(0, 4).map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600 font-semibold truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                    />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="font-extrabold text-slate-900">
                    {symbol}
                    {item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Promotional Offer Banner + Description Broadcaster */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-extrabold text-slate-900">
              Broadcast Promotional Offer Banner &amp; Description to Customers / Leads
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            Target buyers OR people who only messaged/commented without buying yet!
          </span>
        </div>

        {broadcastSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{broadcastSuccessMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleSendOfferBroadcast} className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Customer / Lead Segment
                </label>
                <select
                  value={targetSegment}
                  onChange={(e) => setTargetSegment(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                >
                  <option value="All Customers & Messaged Leads">
                    All Customers &amp; Messaged Leads ({unifiedCustomers.length})
                  </option>
                  <option value="Messaged Only — No Purchase Yet">
                    Messaged / Commented Only — No Purchase Yet ({analyticsData.noPurchaseCount})
                  </option>
                  <option value="VIP Repeat Buyers">
                    VIP Repeat Buyers ({unifiedCustomers.filter((c) => c.ordersCount >= 2).length})
                  </option>
                  <option value="Outlet POS Customers">
                    Physical Outlet POS Customers
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Offer Headline / Title *
                </label>
                <input
                  type="text"
                  required
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  placeholder="e.g. 40% OFF New Arrival Collection!"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {offerBannerUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={offerBannerUrl}
                    alt="Offer Banner"
                    className="w-14 h-14 rounded-xl object-cover border border-indigo-300 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-white border border-dashed border-indigo-300 flex items-center justify-center text-indigo-400 shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-extrabold text-slate-800">
                    Upload Promotional Offer Banner Image (e.g. 40% OFF Poster)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Sent together with your offer description below
                  </p>
                </div>
              </div>
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold cursor-pointer shrink-0">
                <Upload className="w-3.5 h-3.5" /> Choose Banner Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Promotional Offer Description &amp; Promo Code *
              </label>
              <textarea
                rows={3}
                required
                value={offerDescription}
                onChange={(e) => setOfferDescription(e.target.value)}
                placeholder="Write your offer details, discount %, product highlights, and order link..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {["Facebook & Instagram DM", "WhatsApp", "TikTok DM", "SMS / Email"].map((ch) => (
                  <label key={ch} className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedChannels.includes(ch)}
                      onChange={() => toggleBroadcastChannel(ch)}
                      className="rounded text-indigo-600"
                    />
                    <span>{ch}</span>
                  </label>
                ))}
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Send Banner &amp; Offer
              </button>
            </div>
          </form>

          {/* Right: Live Banner + Description Preview */}
          <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-[11px] text-indigo-300 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5" /> Live Banner &amp; Offer Preview
              </span>
              <span className="truncate max-w-36">{targetSegment}</span>
            </div>

            <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
              {offerBannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={offerBannerUrl}
                  alt="Promotional Banner Preview"
                  className="w-full h-36 object-cover"
                />
              ) : (
                <div className="w-full h-28 bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 flex flex-col items-center justify-center p-4 text-center">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold uppercase mb-1">
                    Special Promotional Banner
                  </span>
                  <div className="text-base font-black text-white">{offerTitle}</div>
                </div>
              )}
              <div className="p-3.5 space-y-2 text-xs">
                <div className="font-extrabold text-white text-sm">{offerTitle}</div>
                <p className="text-slate-300 leading-relaxed text-[11px]">{offerDescription}</p>
                <div className="pt-1">
                  <span className="inline-block px-3 py-1.5 rounded-lg bg-orange-500 text-white font-extrabold text-[11px]">
                    Shop Offer Now &rarr;
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Movements Table with "Messaged (No Purchase)" Filter Tab */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Customer Movements &amp; Inbox Leads</h2>
            <p className="text-xs text-slate-500">
              Includes both verified buyers and people who only messaged, liked, commented, or shared without buying yet
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {[
                { id: "all", label: `View all (${unifiedCustomers.length})` },
                {
                  id: "no_purchase",
                  label: `Messaged Only — No Purchase (${analyticsData.noPurchaseCount})`,
                },
                { id: "vip", label: "VIP Repeat" },
                { id: "outlet", label: "Outlet Buyers" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setViewFilter(t.id as typeof viewFilter)}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    viewFilter === t.id
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer, phone, product..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 pl-5 pr-2 w-8">
                  <input
                    type="checkbox"
                    checked={
                      filteredCustomers.length > 0 &&
                      selectedCustomerIds.length === filteredCustomers.length
                    }
                    onChange={(e) =>
                      setSelectedCustomerIds(
                        e.target.checked ? filteredCustomers.map((c) => c.id) : []
                      )
                    }
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="py-3.5 px-4">Overview (Customer &amp; Contact)</th>
                <th className="py-3.5 px-4">Purchased Product / Activity</th>
                <th className="py-3.5 px-4">Progress</th>
                <th className="py-3.5 px-4">Date &amp; Channel</th>
                <th className="py-3.5 px-4">Lifetime Spent</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Syncing customers from database...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center space-y-2">
                    <Users className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="text-sm font-bold text-slate-800">
                      No Records in This Tab
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const isSelected = selectedCustomerIds.includes(cust.id);
                  return (
                    <tr
                      key={cust.id}
                      className={`transition ${
                        isSelected ? "bg-indigo-50/40" : "hover:bg-slate-50/90"
                      }`}
                    >
                      <td className="py-4 pl-5 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            setSelectedCustomerIds((prev) =>
                              prev.includes(cust.id)
                                ? prev.filter((id) => id !== cust.id)
                                : [...prev, cust.id]
                            )
                          }
                          className="rounded border-slate-300"
                        />
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-linear-to-br from-indigo-600 to-blue-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                            {cust.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-sm">
                              {cust.name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {cust.phone} {cust.address ? `• ${cust.address}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">
                          {cust.purchasedProductsSummary}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {cust.ordersCount > 0 ? `${cust.ordersCount} Order(s)` : "Messaged in Inbox (0 Orders)"}
                        </div>
                      </td>

                      <td className="py-4 px-4 w-44">
                        <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-600 mb-1">
                          <span>{cust.ordersCount > 0 ? "Buyer Score" : "Lead Stage"}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                            {cust.progressPct}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              cust.ordersCount > 0 ? "bg-lime-500" : "bg-amber-400"
                            }`}
                            style={{ width: `${cust.progressPct}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800">{cust.lastOrderDate}</div>
                        <div className="text-[11px] text-indigo-600 font-semibold">
                          {cust.channel}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-extrabold text-emerald-700 text-sm">
                        {formatMoney(cust.totalSpent)}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-extrabold ${
                            cust.status === "VIP Repeat"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : cust.status === "Messaged (No Purchase)"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {cust.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleDeleteCustomer(cust.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer / Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-extrabold text-slate-900">
                Add Customer or Messaged Lead to CRM
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualCustomerCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="e.g. 017XXXXXXXX"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Address / Location</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="House, Road, City"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Source Channel</label>
                <select
                  value={newCustChannel}
                  onChange={(e) => setNewCustChannel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Facebook DM">Facebook DM</option>
                  <option value="Instagram DM">Instagram DM</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Outlet POS">Outlet POS</option>
                </select>
              </div>
              <label className="flex items-center gap-2 pt-1 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={newCustHasPurchased}
                  onChange={(e) => setNewCustHasPurchased(e.target.checked)}
                />
                <span>Has already purchased a product (Uncheck if Messaged Only / No Purchase)</span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-extrabold cursor-pointer"
                >
                  Save to CRM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}