"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Truck,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  X,
} from "lucide-react";
import { fetchFromBackend, postToBackend } from "@/lib/api";
import { useCurrency } from "@/lib/currency";

interface GatewayConfig {
  id: string;
  category: "wallet" | "bank" | "courier";
  title: string;
  regionLabel: string;
  badgeColor: string;
  enabled: boolean;
  // Simple Client-Friendly Fields
  accountNumberOrPhone: string;
  accountHolderName: string;
  accountTypeOrBankName: string;
  branchOrPickupAddress: string;
  loginPassword?: string;
  insideCityDeliveryFee: number;
  outsideCityDeliveryFee: number;
  portalUrl: string;
  lastUpdated: string;
}

const DEFAULT_GATEWAYS: GatewayConfig[] = [
  // 1. Mobile Banking (bKash / Nagad / Rocket)
  {
    id: "pay_bkash",
    category: "wallet",
    title: "bKash (Merchant / Personal)",
    regionLabel: "Bangladesh • Mobile Banking",
    badgeColor: "bg-pink-600 text-white",
    enabled: false,
    accountNumberOrPhone: "",
    accountHolderName: "",
    accountTypeOrBankName: "bKash Merchant Account",
    branchOrPickupAddress: "",
    insideCityDeliveryFee: 0,
    outsideCityDeliveryFee: 0,
    portalUrl: "https://www.bkash.com",
    lastUpdated: "Not set yet",
  },
  {
    id: "pay_nagad_rocket",
    category: "wallet",
    title: "Nagad & Rocket",
    regionLabel: "Bangladesh • Mobile Banking",
    badgeColor: "bg-orange-600 text-white",
    enabled: false,
    accountNumberOrPhone: "",
    accountHolderName: "",
    accountTypeOrBankName: "Nagad Merchant / Personal",
    branchOrPickupAddress: "",
    insideCityDeliveryFee: 0,
    outsideCityDeliveryFee: 0,
    portalUrl: "https://nagad.com.bd",
    lastUpdated: "Not set yet",
  },

  // 2. Commercial Banks (City Bank, DBBL, BRAC Bank, etc.)
  {
    id: "pay_city_dbbl",
    category: "bank",
    title: "City Bank / Dutch-Bangla Bank (DBBL)",
    regionLabel: "Bangladesh • Bank Account & Card Transfer",
    badgeColor: "bg-blue-700 text-white",
    enabled: false,
    accountNumberOrPhone: "",
    accountHolderName: "",
    accountTypeOrBankName: "City Bank PLC",
    branchOrPickupAddress: "Gulshan Branch, Dhaka",
    insideCityDeliveryFee: 0,
    outsideCityDeliveryFee: 0,
    portalUrl: "https://www.thecitybank.com",
    lastUpdated: "Not set yet",
  },
  {
    id: "pay_brac_islami",
    category: "bank",
    title: "BRAC Bank / Islami Bank / Global Cards",
    regionLabel: "Bangladesh & Global • Visa / Mastercard / Bank",
    badgeColor: "bg-indigo-600 text-white",
    enabled: false,
    accountNumberOrPhone: "",
    accountHolderName: "",
    accountTypeOrBankName: "BRAC Bank PLC",
    branchOrPickupAddress: "Main Branch",
    insideCityDeliveryFee: 0,
    outsideCityDeliveryFee: 0,
    portalUrl: "https://www.bracbank.com",
    lastUpdated: "Not set yet",
  },

  // 3. Courier Merchant Accounts (Pathao, Steadfast, RedX, DHL)
  {
    id: "cour_pathao",
    category: "courier",
    title: "Pathao Courier",
    regionLabel: "Bangladesh • Nationwide Home Delivery & COD",
    badgeColor: "bg-rose-600 text-white",
    enabled: false,
    accountNumberOrPhone: "",
    accountHolderName: "",
    accountTypeOrBankName: "Pathao Merchant Account",
    branchOrPickupAddress: "",
    loginPassword: "",
    insideCityDeliveryFee: 60,
    outsideCityDeliveryFee: 120,
    portalUrl: "https://merchant.pathao.com",
    lastUpdated: "Not logged in",
  },
  {
    id: "cour_steadfast",
    category: "courier",
    title: "Steadfast Courier",
    regionLabel: "Bangladesh • Fast COD & Parcel Booking",
    badgeColor: "bg-emerald-600 text-white",
    enabled: false,
    accountNumberOrPhone: "",
    accountHolderName: "",
    accountTypeOrBankName: "Steadfast Merchant Account",
    branchOrPickupAddress: "",
    loginPassword: "",
    insideCityDeliveryFee: 60,
    outsideCityDeliveryFee: 120,
    portalUrl: "https://steadfast.com.bd",
    lastUpdated: "Not logged in",
  },
  {
    id: "cour_redx",
    category: "courier",
    title: "RedX & Paperfly Courier",
    regionLabel: "Bangladesh • 64 Districts Doorstep Delivery",
    badgeColor: "bg-red-700 text-white",
    enabled: false,
    accountNumberOrPhone: "",
    accountHolderName: "",
    accountTypeOrBankName: "RedX Merchant Account",
    branchOrPickupAddress: "",
    loginPassword: "",
    insideCityDeliveryFee: 65,
    outsideCityDeliveryFee: 125,
    portalUrl: "https://redx.com.bd",
    lastUpdated: "Not logged in",
  },
  {
    id: "cour_dhl",
    category: "courier",
    title: "DHL, FedEx & Sundarban Courier",
    regionLabel: "International & Domestic Express Shipping",
    badgeColor: "bg-amber-600 text-white",
    enabled: false,
    accountNumberOrPhone: "",
    accountHolderName: "",
    accountTypeOrBankName: "Express Courier Account",
    branchOrPickupAddress: "",
    loginPassword: "",
    insideCityDeliveryFee: 100,
    outsideCityDeliveryFee: 200,
    portalUrl: "https://www.dhl.com",
    lastUpdated: "Not logged in",
  },
];

export default function IntegrationsPage() {
  const { symbol } = useCurrency();
  const [gateways, setGateways] = useState<GatewayConfig[]>(DEFAULT_GATEWAYS);
  const [activeModalItem, setActiveModalItem] = useState<GatewayConfig | null>(null);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Simple Form State (Zero confusing API keys!)
  const [accountNumberOrPhone, setAccountNumberOrPhone] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountTypeOrBankName, setAccountTypeOrBankName] = useState("");
  const [branchOrPickupAddress, setBranchOrPickupAddress] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [insideFee, setInsideFee] = useState("60");
  const [outsideFee, setOutsideFee] = useState("120");

  // Add Custom Modal State
  const [customCategory, setCustomCategory] = useState<"wallet" | "bank" | "courier">("wallet");
  const [customTitle, setCustomTitle] = useState("");
  const [customNumber, setCustomNumber] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("synvora_simple_integrations_v3");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGateways(parsed);
        }
      }
    } catch {}

    fetchFromBackend("/settings/")
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          const remote = res[0]?.advanced_settings?.simple_integrations_v3;
          if (Array.isArray(remote) && remote.length > 0) {
            setGateways(remote);
            localStorage.setItem("synvora_simple_integrations_v3", JSON.stringify(remote));
          }
        }
      })
      .catch(() => {});
  }, []);

  const persistGateways = async (nextList: GatewayConfig[]) => {
    setGateways(nextList);
    localStorage.setItem("synvora_simple_integrations_v3", JSON.stringify(nextList));
    try {
      await postToBackend("/settings/", {
        business_name: "Synvora Business Store",
        advanced_settings: {
          simple_integrations_v3: nextList,
        },
      });
    } catch {}
  };

  const openSetupModal = (item: GatewayConfig) => {
    setActiveModalItem(item);
    setAccountNumberOrPhone(item.accountNumberOrPhone || "");
    setAccountHolderName(item.accountHolderName || "");
    setAccountTypeOrBankName(item.accountTypeOrBankName || "");
    setBranchOrPickupAddress(item.branchOrPickupAddress || "");
    setLoginPassword(item.loginPassword || "");
    setInsideFee(String(item.insideCityDeliveryFee || 60));
    setOutsideFee(String(item.outsideCityDeliveryFee || 120));
  };

  const handleSaveSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalItem) return;

    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const nextList = gateways.map((g) => {
      if (g.id !== activeModalItem.id) return g;
      return {
        ...g,
        enabled: true,
        accountNumberOrPhone: accountNumberOrPhone.trim(),
        accountHolderName: accountHolderName.trim(),
        accountTypeOrBankName: accountTypeOrBankName.trim() || g.accountTypeOrBankName,
        branchOrPickupAddress: branchOrPickupAddress.trim(),
        loginPassword,
        insideCityDeliveryFee: Number(insideFee) || 60,
        outsideCityDeliveryFee: Number(outsideFee) || 120,
        lastUpdated: `Connected at ${nowStr}`,
      };
    });

    await persistGateways(nextList);
    setActiveModalItem(null);
    showToast(`${activeModalItem.title} saved and activated!`);
  };

  const handleToggleStatus = async (id: string) => {
    const nextList = gateways.map((g) =>
      g.id === id ? { ...g, enabled: !g.enabled } : g
    );
    await persistGateways(nextList);
    showToast("Status updated.");
  };

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customNumber.trim()) return;
    const newItem: GatewayConfig = {
      id: `custom_${Date.now()}`,
      category: customCategory,
      title: customTitle.trim(),
      regionLabel:
        customCategory === "courier"
          ? "Custom Courier Partner"
          : "Custom Payment Account",
      badgeColor:
        customCategory === "courier" ? "bg-teal-600 text-white" : "bg-indigo-600 text-white",
      enabled: true,
      accountNumberOrPhone: customNumber.trim(),
      accountHolderName: "",
      accountTypeOrBankName: customTitle.trim(),
      branchOrPickupAddress: "Dhaka",
      insideCityDeliveryFee: 60,
      outsideCityDeliveryFee: 120,
      portalUrl: "",
      lastUpdated: "Active • Just added",
    };
    await persistGateways([...gateways, newItem]);
    setCustomTitle("");
    setCustomNumber("");
    setShowAddCustomModal(false);
    showToast(`${newItem.title} added and activated!`);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Payment Accounts (bKash, Nagad, Bank) &amp; Courier Login
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            No coding or API keys needed. Simply enter your receiving bKash/Nagad number, Bank Account details, and Pathao/Steadfast login.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddCustomModal(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Another Bank / Wallet / Courier
        </button>
      </div>

      {/* Security & Simplicity Guarantee Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950 space-y-1">
          <p className="font-extrabold">
            100% Safe &amp; Receive-Only Setup (Zero Risk to Your Bank or bKash Account):
          </p>
          <p className="text-emerald-900 leading-relaxed">
            For <strong>bKash, Nagad, Rocket &amp; Banks (City Bank, DBBL, BRAC Bank)</strong>, you only enter your <strong>Receiving Account Number</strong>—we never ask for your bKash PIN or Bank Password. Money paid by your customers goes directly into your account!
          </p>
        </div>
      </div>

      {/* SECTION 1: MOBILE BANKING & BANK ACCOUNTS */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-600" />
          1. Mobile Banking (bKash, Nagad, Rocket) &amp; Commercial Bank Accounts
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {gateways
            .filter((g) => g.category === "wallet" || g.category === "bank")
            .map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-6 border transition shadow-xs flex flex-col justify-between gap-4 ${
                  item.enabled ? "border-emerald-400" : "border-slate-200"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${item.badgeColor}`}
                      >
                        <Smartphone className="w-5 h-5" />
                      </span>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">{item.title}</h3>
                        <p className="text-xs text-slate-500">{item.regionLabel}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item.id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                        item.enabled
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.enabled ? "● Active on Checkout" : "○ Disabled"}
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Bank / Account Type:</span>
                      <span className="font-bold text-slate-900">
                        {item.accountTypeOrBankName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">
                        Receiving Number / A/C No:
                      </span>
                      <span
                        className={`font-extrabold ${
                          item.accountNumberOrPhone ? "text-emerald-700" : "text-slate-400"
                        }`}
                      >
                        {item.accountNumberOrPhone || "Not Set Yet"}
                      </span>
                    </div>
                    {item.accountHolderName && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Account Holder Name:</span>
                        <span className="font-bold text-slate-800">{item.accountHolderName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">{item.lastUpdated}</span>
                  <button
                    type="button"
                    onClick={() => openSetupModal(item)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                  >
                    {item.enabled ? "Edit Number / Bank Info" : "+ Add Number / Bank Account"}
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* SECTION 2: COURIER LOGIN */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-600" />
          2. Courier Merchant Accounts (Pathao, Steadfast, RedX, DHL)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {gateways
            .filter((g) => g.category === "courier")
            .map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-6 border transition shadow-xs flex flex-col justify-between gap-4 ${
                  item.enabled ? "border-emerald-400" : "border-slate-200"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${item.badgeColor}`}
                      >
                        <Truck className="w-5 h-5" />
                      </span>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">{item.title}</h3>
                        <p className="text-xs text-slate-500">{item.regionLabel}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item.id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                        item.enabled
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.enabled ? "● Logged In & Active" : "○ Not Connected"}
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">
                        Courier Login Phone / Email:
                      </span>
                      <span
                        className={`font-extrabold ${
                          item.accountNumberOrPhone ? "text-emerald-700" : "text-slate-400"
                        }`}
                      >
                        {item.accountNumberOrPhone || "Not Logged In"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Pickup Shop Address:</span>
                      <span className="font-bold text-slate-800">
                        {item.branchOrPickupAddress || "Not Set"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">
                        Customer Delivery Fee (Inside / Outside):
                      </span>
                      <span className="font-bold text-slate-900">
                        {symbol}
                        {item.insideCityDeliveryFee} / {symbol}
                        {item.outsideCityDeliveryFee}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">{item.lastUpdated}</span>
                    {item.portalUrl && (
                      <a
                        href={item.portalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        Open Portal <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => openSetupModal(item)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                  >
                    {item.enabled ? "Edit Courier Login" : "+ Login Courier Account"}
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* SIMPLE SETUP MODAL (NO CONFUSING API KEYS!) */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">{activeModalItem.title}</h3>
                <p className="text-xs text-slate-400">
                  {activeModalItem.category === "courier"
                    ? "Enter your Courier Merchant Login details"
                    : "Enter your Receiving Account details (Receive-Only)"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSetup} className="p-6 space-y-4 text-xs">
              {activeModalItem.category === "wallet" && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Select Wallet Type *
                    </label>
                    <select
                      value={accountTypeOrBankName}
                      onChange={(e) => setAccountTypeOrBankName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold"
                    >
                      <option value="bKash Merchant Account (Payment)">
                        bKash Merchant Account (Make Payment)
                      </option>
                      <option value="bKash Personal Account (Send Money)">
                        bKash Personal Account (Send Money)
                      </option>
                      <option value="Nagad Merchant / Personal">
                        Nagad Merchant / Personal Account
                      </option>
                      <option value="Rocket (DBBL Mobile Banking)">
                        Rocket (DBBL Mobile Banking)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Your Receiving Mobile Number (যে নাম্বারে টাকা ঢুকবে) *
                    </label>
                    <input
                      type="text"
                      required
                      value={accountNumberOrPhone}
                      onChange={(e) => setAccountNumberOrPhone(e.target.value)}
                      placeholder="e.g. 017XXXXXXXX"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Shop / Account Holder Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="e.g. Synvora IT"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
                    />
                  </div>
                </>
              )}

              {activeModalItem.category === "bank" && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Select Your Bank *
                    </label>
                    <select
                      value={accountTypeOrBankName}
                      onChange={(e) => setAccountTypeOrBankName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold"
                    >
                      <option value="City Bank PLC">City Bank PLC</option>
                      <option value="Dutch-Bangla Bank PLC (DBBL)">
                        Dutch-Bangla Bank PLC (DBBL)
                      </option>
                      <option value="BRAC Bank PLC">BRAC Bank PLC</option>
                      <option value="Islami Bank Bangladesh PLC">
                        Islami Bank Bangladesh PLC
                      </option>
                      <option value="Eastern Bank PLC (EBL)">Eastern Bank PLC (EBL)</option>
                      <option value="International Visa / Mastercard (Stripe)">
                        International Visa / Mastercard (Stripe)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Bank Account Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={accountNumberOrPhone}
                      onChange={(e) => setAccountNumberOrPhone(e.target.value)}
                      placeholder="e.g. 1502938475001"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Account Holder / Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="e.g. Synvora IT"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      value={branchOrPickupAddress}
                      onChange={(e) => setBranchOrPickupAddress(e.target.value)}
                      placeholder="e.g. Gulshan Branch, Dhaka"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
                    />
                  </div>
                </>
              )}

              {activeModalItem.category === "courier" && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Courier Merchant Login Phone or Email *
                    </label>
                    <input
                      type="text"
                      required
                      value={accountNumberOrPhone}
                      onChange={(e) => setAccountNumberOrPhone(e.target.value)}
                      placeholder="e.g. 017XXXXXXXX or merchant@synvorait.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Courier Merchant Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Pickup Shop / Warehouse Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={branchOrPickupAddress}
                      onChange={(e) => setBranchOrPickupAddress(e.target.value)}
                      placeholder="e.g. House 12, Road 5, Mirpur / Uttara, Dhaka"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Inside City Charge ({symbol})
                      </label>
                      <input
                        type="number"
                        value={insideFee}
                        onChange={(e) => setInsideFee(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Outside City Charge ({symbol})
                      </label>
                      <input
                        type="number"
                        value={outsideFee}
                        onChange={(e) => setOutsideFee(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveModalItem(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save &amp; Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CUSTOM MODAL */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">
                Add Another Bank, Wallet, or Courier
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddCustom} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Type *</label>
                <select
                  value={customCategory}
                  onChange={(e) =>
                    setCustomCategory(e.target.value as "wallet" | "bank" | "courier")
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                >
                  <option value="wallet">Mobile Banking (bKash / Nagad / Upay)</option>
                  <option value="bank">Commercial Bank Account</option>
                  <option value="courier">Courier Service</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bank / Wallet / Courier Name *
                </label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Prime Bank PLC or eCourier"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Account Number / Login Phone *
                </label>
                <input
                  type="text"
                  required
                  value={customNumber}
                  onChange={(e) => setCustomNumber(e.target.value)}
                  placeholder="e.g. 017XXXXXXXX or A/C Number"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-extrabold cursor-pointer"
                >
                  + Add Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}