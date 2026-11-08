"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Globe,
  Truck,
  Bot,
  Bell,
  Shield,
  Save,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { fetchFromBackend, postToBackend } from "@/lib/api";
import { useCurrency, compressImageFile } from "@/lib/currency";

interface CompanyPolicyRule {
  id: string;
  title: string;
  detail: string;
}

const DEFAULT_COMPANY_RULES: CompanyPolicyRule[] = [
  {
    id: "rule_1",
    title: "Damaged Return & Lot Clearance Rule",
    detail:
      "Every returned parcel must be inspected before restocking. Only intact products return to main stock; damaged items must be logged in the Damaged Lot Ledger.",
  },
  {
    id: "rule_2",
    title: "Delivery Cost & Free Shipping Policy",
    detail:
      "Customer always pays courier delivery cost (Inside/Outside City) unless an official promotional campaign code (FREEDEL) is active.",
  },
  {
    id: "rule_3",
    title: "Staff Discount & Refund Authorization Rule",
    detail:
      "Moderators and support staff cannot issue manual discounts above 10% or delete confirmed orders without Main Admin approval.",
  },
];

export default function SettingsPage() {
  const { code, changeCurrency } = useCurrency();

  const [activeTab, setActiveTab] = useState<
    "general" | "regional" | "courier" | "ai" | "notifications" | "security"
  >("general");

  // 1. General & Brand State
  const [storeName, setStoreName] = useState("My Business Store");
  const [legalName, setLegalName] = useState("Synvora IT");
  const [ownerName, setOwnerName] = useState("Md Esrafil Hossen");
  const [industry, setIndustry] = useState("E-Commerce & Retail Fashion");
  const [binTaxId, setBinTaxId] = useState("");
  const [supportEmail, setSupportEmail] = useState("contact@synvorait.com");
  const [hotlinePhone, setHotlinePhone] = useState("+8801700000000");
  const [websiteUrl, setWebsiteUrl] = useState("https://www.synvorait.com");
  const [warehouseAddress, setWarehouseAddress] = useState("Dhaka, Bangladesh");
  const [logoUrl, setLogoUrl] = useState("");

  // 2. Regional, Currency & VAT State
  const [primaryCountry, setPrimaryCountry] = useState("Bangladesh");
  const [defaultCurrency, setDefaultCurrency] = useState("BDT");
  const [timezone, setTimezone] = useState("Asia/Dhaka (GMT+06:00)");
  const [vatPercentage, setVatPercentage] = useState("0");
  const [invoicePrefix, setInvoicePrefix] = useState("#SYN-");
  const [fiscalYearStart, setFiscalYearStart] = useState("January");

  // 3. Order & Courier Rules State
  const [defaultCourier, setDefaultCourier] = useState("Pathao Courier");
  const [insideCityFee, setInsideCityFee] = useState("60");
  const [suburbanFee, setSuburbanFee] = useState("100");
  const [outsideCityFee, setOutsideCityFee] = useState("120");
  const [buyerPaysDelivery, setBuyerPaysDelivery] = useState(true);
  const [autoInspectReturns, setAutoInspectReturns] = useState(true);

  // 4. AI & Social Automation State
  const [aiEngineModel, setAiEngineModel] = useState("Gemini 2.5 Pro + Multilingual Commerce");
  const [aiLanguageSupport, setAiLanguageSupport] = useState(
    "Bengali, Banglish, English, Hindi & Arabic"
  );
  const [aiGreeting, setAiGreeting] = useState(
    "Assalamu Alaikum! Welcome to our official store. Which product, size, and color would you like to order today?"
  );
  const [autoCommentOfferText, setAutoCommentOfferText] = useState(
    "Thank you for liking/commenting on our post! Check your inbox for our special promotional price and instant order link."
  );
  const [humanHandoffKeywords, setHumanHandoffKeywords] = useState(
    "human, agent, manager, call, মানুষ, কথা বলতে চাই"
  );

  // 5. Notifications & Alerts (Emergency & Sensitive Owner Alerts ONLY!)
  const [ownerEmergencyPhone, setOwnerEmergencyPhone] = useState("+8801700000000");
  const [ownerAlertEmail, setOwnerAlertEmail] = useState("admin@synvorait.com");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [alertOnOutOfStock, setAlertOnOutOfStock] = useState(true);
  const [alertOnDamagedReturn, setAlertOnDamagedReturn] = useState(true);
  const [alertOnSystemOrSecurityIssue, setAlertOnSystemOrSecurityIssue] = useState(true);
  const [alertOnHighValueOrder, setAlertOnHighValueOrder] = useState(true);
  const [muteRegularSocialChatNotifications, setMuteRegularSocialChatNotifications] =
    useState(true);

  // 6. Security, Access & Company Rules State
  const [adminCurrentPassword, setAdminCurrentPassword] = useState("");
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [requireAdminForDeleteOrRefund, setRequireAdminForDeleteOrRefund] = useState(true);
  const [companyRules, setCompanyRules] = useState<CompanyPolicyRule[]>(DEFAULT_COMPANY_RULES);
  const [newRuleTitle, setNewRuleTitle] = useState("");
  const [newRuleDetail, setNewRuleDetail] = useState("");

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("synvora_brand_profile_v2");
      if (saved) {
        const p = JSON.parse(saved);
        if (p.storeName) setStoreName(p.storeName);
        if (p.legalName) setLegalName(p.legalName);
        if (p.ownerName) setOwnerName(p.ownerName);
        if (p.industry) setIndustry(p.industry);
        if (p.binTaxId) setBinTaxId(p.binTaxId);
        if (p.supportEmail) setSupportEmail(p.supportEmail);
        if (p.hotlinePhone) setHotlinePhone(p.hotlinePhone);
        if (p.websiteUrl) setWebsiteUrl(p.websiteUrl);
        if (p.warehouseAddress) setWarehouseAddress(p.warehouseAddress);
        if (p.logoUrl) setLogoUrl(p.logoUrl);

        if (p.primaryCountry) setPrimaryCountry(p.primaryCountry);
        if (p.defaultCurrency) setDefaultCurrency(p.defaultCurrency);
        if (p.timezone) setTimezone(p.timezone);
        if (p.vatPercentage) setVatPercentage(p.vatPercentage);
        if (p.invoicePrefix) setInvoicePrefix(p.invoicePrefix);

        if (p.defaultCourier) setDefaultCourier(p.defaultCourier);
        if (p.insideCityFee) setInsideCityFee(p.insideCityFee);
        if (p.suburbanFee) setSuburbanFee(p.suburbanFee);
        if (p.outsideCityFee) setOutsideCityFee(p.outsideCityFee);

        if (p.aiGreeting) setAiGreeting(p.aiGreeting);
        if (p.autoCommentOfferText) setAutoCommentOfferText(p.autoCommentOfferText);
        if (p.ownerEmergencyPhone) setOwnerEmergencyPhone(p.ownerEmergencyPhone);
        if (p.lowStockThreshold) setLowStockThreshold(p.lowStockThreshold);
        if (Array.isArray(p.companyRules) && p.companyRules.length > 0) {
          setCompanyRules(p.companyRules);
        }
      }
    } catch {}

    fetchFromBackend("/settings/")
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          const b = res[0]?.advanced_settings?.brand_profile_v2;
          if (b) {
            if (b.storeName) setStoreName(b.storeName);
            if (b.ownerName) setOwnerName(b.ownerName);
            if (b.logoUrl) setLogoUrl(b.logoUrl);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (defaultCurrency && defaultCurrency !== code) {
      changeCurrency(defaultCurrency);
    }

    const profileObj = {
      storeName: storeName.trim() || "My Business Store",
      legalName: legalName.trim(),
      ownerName: ownerName.trim() || "Business Owner",
      ownerRole: "Admin User",
      industry,
      binTaxId,
      supportEmail,
      hotlinePhone,
      websiteUrl,
      warehouseAddress,
      logoUrl,
      primaryCountry,
      defaultCurrency,
      timezone,
      vatPercentage,
      invoicePrefix,
      fiscalYearStart,
      defaultCourier,
      insideCityFee,
      suburbanFee,
      outsideCityFee,
      buyerPaysDelivery,
      autoInspectReturns,
      aiEngineModel,
      aiLanguageSupport,
      aiGreeting,
      autoCommentOfferText,
      humanHandoffKeywords,
      ownerEmergencyPhone,
      ownerAlertEmail,
      lowStockThreshold,
      alertOnOutOfStock,
      alertOnDamagedReturn,
      alertOnSystemOrSecurityIssue,
      alertOnHighValueOrder,
      muteRegularSocialChatNotifications,
      requireAdminForDeleteOrRefund,
      companyRules,
    };

    localStorage.setItem("synvora_brand_profile_v2", JSON.stringify(profileObj));
    window.dispatchEvent(new Event("synvora_brand_updated"));

    try {
      await postToBackend("/settings/", {
        business_name: profileObj.storeName,
        advanced_settings: {
          brand_profile_v2: profileObj,
        },
      });
    } catch {}

    showToast("Settings saved and synced across your store!");
  };

  const handleAddCompanyRule = () => {
    if (!newRuleTitle.trim() || !newRuleDetail.trim()) {
      showToast("Please enter both a Rule Title and Rule Description.");
      return;
    }
    const created: CompanyPolicyRule = {
      id: `rule_${Date.now()}`,
      title: newRuleTitle.trim(),
      detail: newRuleDetail.trim(),
    };
    const updated = [...companyRules, created];
    setCompanyRules(updated);
    setNewRuleTitle("");
    setNewRuleDetail("");
    showToast("New company policy rule added! Click Save to persist.");
  };

  const handleDeleteRule = (id: string) => {
    setCompanyRules(companyRules.filter((r) => r.id !== id));
  };

  const initials =
    storeName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "MB";

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Workspace &amp; Business Store Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure your brand identity, regional currency &amp; VAT, courier rules, AI templates, emergency owner alerts, and company rules.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSaveSettings()}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm transition cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Save All Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left 6 Tabs */}
        <div className="md:col-span-4 lg:col-span-3 space-y-1.5 text-xs">
          {[
            {
              id: "general",
              title: "General & Brand",
              sub: "Store Name, Logo & Address",
              icon: Building2,
            },
            {
              id: "regional",
              title: "Regional, Currency & VAT",
              sub: "BDT/USD, Timezone & Invoices",
              icon: Globe,
            },
            {
              id: "courier",
              title: "Order & Courier Rules",
              sub: "Delivery Rates & COD",
              icon: Truck,
            },
            {
              id: "ai",
              title: "AI & Social Automation",
              sub: "Auto-DM Greeting Template",
              icon: Bot,
            },
            {
              id: "notifications",
              title: "Notifications & Alerts",
              sub: "Emergency Stock & System Alerts",
              icon: Bell,
            },
            {
              id: "security",
              title: "Security & Company Rules",
              sub: "Policies, Password & Protection",
              icon: Shield,
            },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as typeof activeTab)}
                className={`w-full p-3.5 rounded-2xl text-left flex items-start gap-3 transition cursor-pointer ${
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80"
                }`}
              >
                <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <div className="font-extrabold">{t.title}</div>
                  <div
                    className={`text-[10px] mt-0.5 ${
                      active ? "text-blue-100" : "text-slate-400"
                    }`}
                  >
                    {t.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Content Card */}
        <div className="md:col-span-8 lg:col-span-9 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
            {/* =========================================================
                TAB 1: GENERAL & BRAND IDENTITY
               ========================================================= */}
            {activeTab === "general" && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      1. General Business &amp; Brand Identity
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      This store name and logo appear on your top bar, customer invoices, courier slips, and checkout page.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={storeName}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-base flex items-center justify-center">
                        {initials}
                      </div>
                    )}
                    <label className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const compressed = await compressImageFile(file);
                          setLogoUrl(compressed);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Public Brand / Store Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Owner / Admin Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Registered Company / Legal Name
                    </label>
                    <input
                      type="text"
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Business Industry / Category
                    </label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900"
                    >
                      <option value="E-Commerce & Retail Fashion">
                        E-Commerce &amp; Retail Fashion
                      </option>
                      <option value="Footwear & Shoes Brand">Footwear &amp; Shoes Brand</option>
                      <option value="Electronics & Gadgets">Electronics &amp; Gadgets</option>
                      <option value="Cosmetics & Beauty">Cosmetics &amp; Beauty</option>
                      <option value="IT & Software Agency">IT &amp; Software Agency</option>
                      <option value="Multi-Vendor General Store">
                        Multi-Vendor General Store
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Official Customer Support Email
                    </label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Hotline / WhatsApp Business Number
                    </label>
                    <input
                      type="text"
                      value={hotlinePhone}
                      onChange={(e) => setHotlinePhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Official Business Website URL
                    </label>
                    <input
                      type="text"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Trade License / BIN ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={binTaxId}
                      onChange={(e) => setBinTaxId(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Primary Warehouse / Pickup Address (Used by Pathao, Steadfast &amp; DHL Riders)
                  </label>
                  <input
                    type="text"
                    value={warehouseAddress}
                    onChange={(e) => setWarehouseAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
                  />
                </div>
              </>
            )}

            {/* =========================================================
                TAB 2: REGIONAL, CURRENCY & VAT (No Delivery Rules Here!)
               ========================================================= */}
            {activeTab === "regional" && (
              <>
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-base font-extrabold text-slate-900">
                    2. Regional, Home Currency, Timezone &amp; VAT / Tax Configuration
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Set your primary operating country, currency symbol, invoice numbering format, and VAT/Tax rate.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Primary Operating Country *
                    </label>
                    <select
                      value={primaryCountry}
                      onChange={(e) => setPrimaryCountry(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900"
                    >
                      <option value="Bangladesh">🇧🇩 Bangladesh</option>
                      <option value="United States">🇺🇸 United States</option>
                      <option value="United Kingdom">🇬🇧 United Kingdom</option>
                      <option value="European Union">🇪🇺 European Union</option>
                      <option value="United Arab Emirates">🇦🇪 United Arab Emirates (Dubai)</option>
                      <option value="Saudi Arabia">🇸🇦 Saudi Arabia</option>
                      <option value="India">🇮🇳 India</option>
                      <option value="Singapore">🇸🇬 Singapore</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Default Store &amp; Accounting Currency *
                    </label>
                    <select
                      value={defaultCurrency}
                      onChange={(e) => setDefaultCurrency(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900"
                    >
                      <option value="BDT">৳ BDT — Bangladeshi Taka</option>
                      <option value="USD">$ USD — US Dollar</option>
                      <option value="EUR">€ EUR — Euro</option>
                      <option value="GBP">£ GBP — British Pound</option>
                      <option value="AED">AED — UAE Dirham</option>
                      <option value="SAR">SAR — Saudi Riyal</option>
                      <option value="INR">₹ INR — Indian Rupee</option>
                      <option value="SGD">S$ SGD — Singapore Dollar</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Workspace Timezone
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900"
                    >
                      <option value="Asia/Dhaka (GMT+06:00)">Asia/Dhaka (GMT+06:00)</option>
                      <option value="Asia/Dubai (GMT+04:00)">Asia/Dubai (GMT+04:00)</option>
                      <option value="Europe/London (GMT+00:00)">Europe/London (GMT+00:00)</option>
                      <option value="America/New_York (GMT-05:00)">
                        America/New_York (GMT-05:00)
                      </option>
                      <option value="Asia/Singapore (GMT+08:00)">
                        Asia/Singapore (GMT+08:00)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Default VAT / Sales Tax Percentage (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={vatPercentage}
                      onChange={(e) => setVatPercentage(e.target.value)}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Official Order &amp; Invoice Prefix
                    </label>
                    <input
                      type="text"
                      value={invoicePrefix}
                      onChange={(e) => setInvoicePrefix(e.target.value)}
                      placeholder="#SYN-"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Accounting Fiscal Year Start Month
                    </label>
                    <select
                      value={fiscalYearStart}
                      onChange={(e) => setFiscalYearStart(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900"
                    >
                      <option value="January">January — December</option>
                      <option value="July">July — June (Bangladesh Fiscal Year)</option>
                      <option value="April">April — March</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* =========================================================
                TAB 3: ORDER & COURIER RULES
               ========================================================= */}
            {activeTab === "courier" && (
              <>
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-base font-extrabold text-slate-900">
                    3. Order, Delivery Charge &amp; Courier Dispatch Rules
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure customer-paid delivery fees for Inside City, Suburban, and Outside City couriers.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Default Courier Partner
                    </label>
                    <select
                      value={defaultCourier}
                      onChange={(e) => setDefaultCourier(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900"
                    >
                      <option value="Pathao Courier">Pathao Courier</option>
                      <option value="Steadfast Courier">Steadfast Courier</option>
                      <option value="RedX Logistics">RedX Logistics</option>
                      <option value="Paperfly / Sundarban">Paperfly / Sundarban</option>
                      <option value="DHL / FedEx International">DHL / FedEx International</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Inside City / Metro Delivery Charge (Paid by Buyer)
                    </label>
                    <input
                      type="number"
                      value={insideCityFee}
                      onChange={(e) => setInsideCityFee(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Suburban / Express Delivery Charge (Paid by Buyer)
                    </label>
                    <input
                      type="number"
                      value={suburbanFee}
                      onChange={(e) => setSuburbanFee(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Outside City / Nationwide Delivery Charge (Paid by Buyer)
                    </label>
                    <input
                      type="number"
                      value={outsideCityFee}
                      onChange={(e) => setOutsideCityFee(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={buyerPaysDelivery}
                      onChange={(e) => setBuyerPaysDelivery(e.target.checked)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-extrabold text-slate-900">
                        Customer Always Pays Delivery Cost (Unless Free Delivery Promo Code is Used)
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Adds the courier delivery fee to the buyer&apos;s bill on both Online Payment and Cash on Delivery orders.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoInspectReturns}
                      onChange={(e) => setAutoInspectReturns(e.target.checked)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-extrabold text-slate-900">
                        Require 3-Way Condition Check on Returned Products (Good vs. Damaged Lot Sale)
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Prevents damaged returned items from entering fresh stock and calculates exact net loss in Analytics &amp; P&amp;L.
                      </p>
                    </div>
                  </label>
                </div>
              </>
            )}

            {/* =========================================================
                TAB 4: AI & SOCIAL AUTOMATION
               ========================================================= */}
            {activeTab === "ai" && (
              <>
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-base font-extrabold text-slate-900">
                    4. 24/7 AI Chatbot &amp; Social Comment/Like Auto-DM Settings
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure how your AI Assistant replies to customers on Facebook, Instagram, WhatsApp, TikTok, and your Storefront.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Active AI Commerce Engine
                    </label>
                    <select
                      value={aiEngineModel}
                      onChange={(e) => setAiEngineModel(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900"
                    >
                      <option value="Gemini 2.5 Pro + Multilingual Commerce">
                        Gemini 2.5 Pro + Multilingual Commerce
                      </option>
                      <option value="OpenAI GPT-4o Omni Commerce">
                        OpenAI GPT-4o Omni Commerce
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Supported Customer Languages
                    </label>
                    <input
                      type="text"
                      value={aiLanguageSupport}
                      onChange={(e) => setAiLanguageSupport(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    24/7 AI Welcome &amp; Product Inquiry Reply Template
                  </label>
                  <textarea
                    rows={3}
                    value={aiGreeting}
                    onChange={(e) => setAiGreeting(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Auto-Offer Message When Someone Likes, Comments, or Shares a Social Post
                  </label>
                  <textarea
                    rows={3}
                    value={autoCommentOfferText}
                    onChange={(e) => setAutoCommentOfferText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Keywords That Automatically Transfer Chat from AI to Human Agent
                  </label>
                  <input
                    type="text"
                    value={humanHandoffKeywords}
                    onChange={(e) => setHumanHandoffKeywords(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900"
                  />
                </div>
              </>
            )}

            {/* =========================================================
                TAB 5: NOTIFICATIONS & ALERTS (CRITICAL OWNER ALERTS ONLY!)
               ========================================================= */}
            {activeTab === "notifications" && (
              <>
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-base font-extrabold text-slate-900">
                    5. Owner Emergency &amp; Sensitive Business Alerts
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Only critical alerts (Out of Stock, Damaged Returns, System/Security Issues) are sent to the Owner. Regular customer Facebook/Instagram chat messages are handled by the Inbox &amp; AI without spamming your phone.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-950">
                    <strong>Smart Anti-Spam Filter Active:</strong> Routine customer comments and messages on Facebook/Instagram/WhatsApp will <strong>NEVER</strong> clutter the Owner&apos;s emergency notification bar.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Owner Emergency WhatsApp / SMS No *
                    </label>
                    <input
                      type="text"
                      value={ownerEmergencyPhone}
                      onChange={(e) => setOwnerEmergencyPhone(e.target.value)}
                      placeholder="+88017XXXXXXXX"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Owner Emergency Email *
                    </label>
                    <input
                      type="email"
                      value={ownerAlertEmail}
                      onChange={(e) => setOwnerAlertEmail(e.target.value)}
                      placeholder="owner@synvorait.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Low Stock Emergency Threshold (Pcs)
                    </label>
                    <input
                      type="number"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <div>
                      <div className="font-extrabold text-slate-900">
                        1. Out-of-Stock &amp; Low Inventory Emergency Alert
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Notify Owner immediately when any product stock reaches 0 or drops below {lowStockThreshold} pcs.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={alertOnOutOfStock}
                      onChange={(e) => setAlertOnOutOfStock(e.target.checked)}
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <div>
                      <div className="font-extrabold text-slate-900">
                        2. Damaged Product Return &amp; P&amp;L Loss Alert
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Notify Owner when a returned product is marked Damaged or Write-Off in Fulfillment.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={alertOnDamagedReturn}
                      onChange={(e) => setAlertOnDamagedReturn(e.target.checked)}
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <div>
                      <div className="font-extrabold text-slate-900">
                        3. Software System Health, Payment &amp; Security Alert
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Notify Owner if any courier connection fails or an unauthorized staff action is attempted.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={alertOnSystemOrSecurityIssue}
                      onChange={(e) => setAlertOnSystemOrSecurityIssue(e.target.checked)}
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <div>
                      <div className="font-extrabold text-slate-900">
                        4. Mute Routine Facebook / Instagram / WhatsApp Chat Messages from Owner Bell
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Keeps regular buyer chats inside Unified Inbox so the Owner is never spammed.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={muteRegularSocialChatNotifications}
                      onChange={(e) =>
                        setMuteRegularSocialChatNotifications(e.target.checked)
                      }
                    />
                  </label>
                </div>
              </>
            )}

            {/* =========================================================
                TAB 6: SECURITY, ACCESS & COMPANY RULES
               ========================================================= */}
            {activeTab === "security" && (
              <>
                <div className="pb-4 border-b border-slate-100">
                  <h2 className="text-base font-extrabold text-slate-900">
                    6. Company Operational Rules, Policies &amp; Admin Security
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define your company&apos;s official rules for products, returns, and staff, and manage your Admin password.
                  </p>
                </div>

                {/* Company Rules Section */}
                <div className="space-y-3">
                  <label className="block font-extrabold text-slate-800">
                    Your Company Operational &amp; Product Rules (Visible to All Staff):
                  </label>

                  <div className="space-y-2.5">
                    {companyRules.map((r, idx) => (
                      <div
                        key={r.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="font-extrabold text-slate-900">
                            Rule #{idx + 1}: {r.title}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                            {r.detail}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(r.id)}
                          className="text-slate-400 hover:text-rose-600 shrink-0 cursor-pointer"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add New Company Rule Box */}
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-white space-y-3">
                    <div className="font-extrabold text-slate-800">
                      + Add New Company Rule / Policy
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newRuleTitle}
                        onChange={(e) => setNewRuleTitle(e.target.value)}
                        placeholder="Rule Title (e.g. Footwear Size Exchange Policy)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={newRuleDetail}
                        onChange={(e) => setNewRuleDetail(e.target.value)}
                        placeholder="Rule Details (e.g. Exchange allowed within 3 days if unworn)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCompanyRule}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Company Rule
                    </button>
                  </div>
                </div>

                {/* Admin Password & Protection */}
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div className="font-extrabold text-slate-900">
                    Admin Password &amp; Staff Action Lock
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Current Admin Password
                      </label>
                      <input
                        type="password"
                        value={adminCurrentPassword}
                        onChange={(e) => setAdminCurrentPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        New Admin Password
                      </label>
                      <input
                        type="password"
                        value={adminNewPassword}
                        onChange={(e) => setAdminNewPassword(e.target.value)}
                        placeholder="Enter new strong password"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireAdminForDeleteOrRefund}
                      onChange={(e) => setRequireAdminForDeleteOrRefund(e.target.checked)}
                    />
                    <span>
                      Require Main Admin Approval Before Deleting Products, Orders, or Issuing Refunds
                    </span>
                  </label>
                </div>
              </>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-sm transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Save Settings &amp; Rules
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}