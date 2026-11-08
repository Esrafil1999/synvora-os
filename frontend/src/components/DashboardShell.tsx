"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Truck,
  Users,
  MessageSquare,
  Share2,
  Megaphone,
  BarChart3,
  Zap,
  Bot,
  Globe,
  Plug,
  Shield,
  CreditCard,
  Settings,
  Search,
  Bell,
  Moon,
  Sun,
  ExternalLink,
  ChevronDown,
  LogOut,
  UserPlus,
  Store,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { useCurrency } from "@/lib/currency";
import { getProducts, getOrders } from "@/lib/api";

const MARKET_LIST = [
  { code: "BDT", label: "Bangladesh (৳ BDT)" },
  { code: "USD", label: "United States ($ USD)" },
  { code: "EUR", label: "Europe (€ EUR)" },
  { code: "GBP", label: "United Kingdom (£ GBP)" },
  { code: "AED", label: "UAE (AED)" },
  { code: "SAR", label: "Saudi Arabia (SAR)" },
  { code: "INR", label: "India (₹ INR)" },
  { code: "SGD", label: "Singapore (S$ SGD)" },
  { code: "CNY", label: "China (¥ CNY)" },
];

interface CriticalAlertItem {
  id: string;
  type: "stock" | "return" | "security";
  title: string;
  description: string;
  href: string;
  time: string;
  severity: "critical" | "warning" | "info";
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { code, symbol, currency, changeCurrency, formatMoney } = useCurrency();

  const [darkMode, setDarkMode] = useState(false);
  const [storeName, setStoreName] = useState("My Business Store");
  const [ownerName, setOwnerName] = useState("Business Owner");
  const [ownerRole, setOwnerRole] = useState("Admin User");
  const [storeLogo, setStoreLogo] = useState("");

  // Dropdown states
  const [showStoreMenu, setShowStoreMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showQuickRenameModal, setShowQuickRenameModal] = useState(false);
  const [tempStoreName, setTempStoreName] = useState("");
  const [tempOwnerName, setTempOwnerName] = useState("");

  // Live Critical Owner Alerts (Stock Depletion, Returns/Damage, System Security)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [liveProducts, setLiveProducts] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);

  const loadBrandIdentityAndAlerts = () => {
    try {
      const savedBrand = localStorage.getItem("synvora_brand_profile_v2");
      if (savedBrand) {
        const parsed = JSON.parse(savedBrand);
        if (parsed.storeName) setStoreName(parsed.storeName);
        if (parsed.ownerName) setOwnerName(parsed.ownerName);
        if (parsed.ownerRole) setOwnerRole(parsed.ownerRole);
        if (parsed.logoUrl) setStoreLogo(parsed.logoUrl);
      }
      const savedDark = localStorage.getItem("synvora_dark_mode") === "true";
      setDarkMode(savedDark);
    } catch {}

    Promise.all([getProducts().catch(() => []), getOrders().catch(() => [])]).then(
      ([prodRes, ordRes]) => {
        if (Array.isArray(prodRes)) setLiveProducts(prodRes);
        if (Array.isArray(ordRes)) setLiveOrders(ordRes);
      }
    );
  };

  useEffect(() => {
    loadBrandIdentityAndAlerts();
    const handleStorageUpdate = () => loadBrandIdentityAndAlerts();
    window.addEventListener("synvora_brand_updated", handleStorageUpdate);
    window.addEventListener("storage", handleStorageUpdate);
    return () => {
      window.removeEventListener("synvora_brand_updated", handleStorageUpdate);
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, [pathname]);

  // Build Critical Owner Alerts (Never chat spam — ONLY Stock Out, Low Stock, Damaged Returns & System Security)
  const criticalAlerts: CriticalAlertItem[] = useMemo(() => {
    const list: CriticalAlertItem[] = [];

    // 1. Out of Stock or Low Stock Products (<= 10 units)
    liveProducts.forEach((p) => {
      const st = Number(p.stock ?? 0);
      if (st <= 0) {
        list.push({
          id: `stk_out_${p.id || p.name}`,
          type: "stock",
          title: `OUT OF STOCK: ${p.name}`,
          description: `Stock is 0 pcs (Code: ${p.sku || "N/A"}). Restock immediately to prevent lost sales.`,
          href: "/inventory",
          time: "Urgent",
          severity: "critical",
        });
      } else if (st <= 10) {
        list.push({
          id: `stk_low_${p.id || p.name}`,
          type: "stock",
          title: `Low Stock Warning: ${p.name}`,
          description: `Only ${st} pcs remaining in warehouse. Click to restock inventory.`,
          href: "/inventory",
          time: "Active",
          severity: "warning",
        });
      }
    });

    // 2. Returned or Damaged Orders Requiring Owner Attention
    liveOrders.slice(0, 15).forEach((o) => {
      const statusText = `${o.status || ""} ${o.fulfillment_status || ""}`.toLowerCase();
      if (statusText.includes("return")) {
        list.push({
          id: `ret_${o.order_id}`,
          type: "return",
          title: `Returned Parcel: ${o.order_id} (${o.product_name})`,
          description:
            o.return_condition ||
            `Order value ${formatMoney(Number(o.amount || 0))} returned. Verify stock/damage in Fulfillment.`,
          href: "/fulfillment",
          time: "Return Alert",
          severity: "warning",
        });
      }
    });

    // 3. System Health & Security Status (If no stock/return emergency exists, show verified system status)
    list.push({
      id: "sys_sec_status",
      type: "security",
      title: "System & Database Security Active",
      description:
        "Emergency stock alerts, damaged return tracking & company rules are active. Normal inbox chat messages are muted here.",
      href: "/settings",
      time: "System OK",
      severity: "info",
    });

    return list.filter((a) => !dismissedAlertIds.includes(a.id));
  }, [liveProducts, liveOrders, dismissedAlertIds, formatMoney]);

  const urgentCount = useMemo(
    () => criticalAlerts.filter((a) => a.severity !== "info").length,
    [criticalAlerts]
  );

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("synvora_dark_mode", String(next));
  };

  const handleSaveQuickRename = (e: React.FormEvent) => {
    e.preventDefault();
    const finalStore = tempStoreName.trim() || storeName;
    const finalOwner = tempOwnerName.trim() || ownerName;
    setStoreName(finalStore);
    setOwnerName(finalOwner);

    try {
      const existing = JSON.parse(localStorage.getItem("synvora_brand_profile_v2") || "{}");
      localStorage.setItem(
        "synvora_brand_profile_v2",
        JSON.stringify({
          ...existing,
          storeName: finalStore,
          ownerName: finalOwner,
        })
      );
      window.dispatchEvent(new Event("synvora_brand_updated"));
    } catch {}
    setShowQuickRenameModal(false);
  };

  if (pathname?.startsWith("/store") || pathname?.startsWith("/login")) {
    return <>{children}</>;
  }

  const initials =
    storeName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "MB";

  const navSections = [
    {
      title: "CORE COMMERCE",
      items: [
        { name: "Overview", href: "/", icon: LayoutDashboard, badge: "Live" },
        { name: "Orders", href: "/orders", icon: ShoppingCart, badge: "Live" },
        { name: "Products", href: "/products", icon: Package, badge: "Live" },
        { name: "Inventory", href: "/inventory", icon: Boxes, badge: "Live" },
        { name: "Fulfillment", href: "/fulfillment", icon: Truck, badge: "Live" },
        { name: "Customers", href: "/customers", icon: Users, badge: "Live" },
      ],
    },
    {
      title: "ENGAGE & SOCIAL",
      items: [
        { name: "Unified Inbox", href: "/unified-inbox", icon: MessageSquare, badge: "Live" },
        { name: "Social Studio", href: "/social-studio", icon: Share2, badge: "Live" },
        { name: "Marketing & Ads", href: "/marketing-ads", icon: Megaphone, badge: "Live" },
      ],
    },
    {
      title: "INTELLIGENCE",
      items: [
        { name: "Analytics & P&L", href: "/analytics", icon: BarChart3, badge: "Live" },
        { name: "Automations", href: "/automations", icon: Zap, badge: "Live" },
        { name: "AI Copilot", href: "/ai-copilot", icon: Bot, badge: "AI" },
      ],
    },
    {
      title: "WORKSPACE",
      items: [
        { name: "Channels", href: "/channels", icon: Globe, badge: "Live" },
        { name: "Integrations", href: "/integrations", icon: Plug, badge: "Live" },
        { name: "Team & Roles", href: "/team-roles", icon: Shield, badge: "Live" },
        { name: "Billing", href: "/billing", icon: CreditCard, badge: "Live" },
        { name: "Settings", href: "/settings", icon: Settings, badge: "" },
      ],
    },
  ];

  return (
    <div className="h-screen w-full overflow-hidden flex bg-slate-50 text-slate-900">
      {/* LEFT FIXED DARK SIDEBAR */}
      <aside className="w-60 h-screen shrink-0 bg-slate-950 text-slate-200 flex flex-col justify-between border-r border-slate-800 select-none">
        <div className="p-3.5 space-y-3 border-b border-slate-800/80 relative">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
              S
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-tight text-white">SYNVORA</span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                  OS
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Commerce &amp; Social Suite</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowStoreMenu(!showStoreMenu);
              setShowProfileMenu(false);
              setShowNotificationMenu(false);
            }}
            className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition cursor-pointer"
          >
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-white truncate">{storeName}</div>
              <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {currency.country} ({symbol})
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {showStoreMenu && (
            <div className="absolute left-3.5 right-3.5 top-28 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 space-y-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setTempStoreName(storeName);
                  setTempOwnerName(ownerName);
                  setShowQuickRenameModal(true);
                  setShowStoreMenu(false);
                }}
                className="w-full px-3 py-2 rounded-lg text-left text-slate-200 hover:bg-slate-800 font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-blue-400" />
                Change Store / Business Name
              </button>
              <Link
                href="/store"
                target="_blank"
                onClick={() => setShowStoreMenu(false)}
                className="w-full px-3 py-2 rounded-lg text-left text-slate-200 hover:bg-slate-800 font-semibold flex items-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                Open Customer Storefront (/store)
              </Link>
              <Link
                href="/settings"
                onClick={() => setShowStoreMenu(false)}
                className="w-full px-3 py-2 rounded-lg text-left text-slate-200 hover:bg-slate-800 font-semibold flex items-center gap-2"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                Workspace Brand Settings
              </Link>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {navSections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              <div className="px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                {sec.title}
              </div>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      active
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </span>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                          active
                            ? "bg-white/20 text-white"
                            : item.badge === "AI"
                            ? "bg-purple-500/20 text-purple-300"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom AI Credits */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              ✨ AI Credits
            </span>
            <span className="text-white font-bold">4,200 / 5,000</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full w-4/5 bg-linear-to-r from-blue-500 to-purple-500 rounded-full" />
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        <header
          className={`h-14 shrink-0 border-b px-6 flex items-center justify-between gap-4 relative z-20 ${
            darkMode
              ? "bg-slate-900 border-slate-800 text-white"
              : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search orders, products, customers..."
              className={`w-full pl-9 pr-4 py-1.5 rounded-xl border text-xs focus:outline-none ${
                darkMode
                  ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400"
                  : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            />
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/store"
              target="_blank"
              className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Customer Order Page
            </Link>

            <select
              value={code}
              onChange={(e) => changeCurrency(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
                darkMode
                  ? "bg-slate-800 border-slate-700 text-white"
                  : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            >
              {MARKET_LIST.map((m) => (
                <option key={m.code} value={m.code}>
                  🌐 {m.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={toggleDarkMode}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                darkMode
                  ? "bg-amber-500/20 border-amber-400/40 text-amber-300"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {darkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5" /> Light
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5" /> Dark
                </>
              )}
            </button>

            {/* CRITICAL OWNER NOTIFICATION BELL DROPDOWN (Never Redirects to Unified Inbox!) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowNotificationMenu(!showNotificationMenu);
                  setShowProfileMenu(false);
                  setShowStoreMenu(false);
                }}
                className={`p-2 rounded-xl border transition relative cursor-pointer ${
                  darkMode
                    ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                    : "border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
                title="Critical Owner Alerts (Stock, Returns & System)"
              >
                <Bell className="w-4 h-4" />
                {urgentCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center">
                    {urgentCount}
                  </span>
                )}
              </button>

              {showNotificationMenu && (
                <div className="absolute right-0 top-12 z-50 w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-xs text-slate-800">
                  <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-xs">
                        Owner Emergency &amp; System Alerts
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Only Low Stock, Damaged Returns &amp; Security (No Chat Spam)
                      </div>
                    </div>
                    {urgentCount > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDismissedAlertIds(criticalAlerts.map((a) => a.id))
                        }
                        className="text-[10px] font-bold text-emerald-400 hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {criticalAlerts.map((alert) => (
                      <Link
                        key={alert.id}
                        href={alert.href}
                        onClick={() => setShowNotificationMenu(false)}
                        className="p-3.5 hover:bg-slate-50 flex items-start gap-3 transition"
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            alert.severity === "critical"
                              ? "bg-rose-100 text-rose-600"
                              : alert.severity === "warning"
                              ? "bg-amber-100 text-amber-600"
                              : "bg-emerald-100 text-emerald-600"
                          }`}
                        >
                          {alert.type === "stock" ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : alert.type === "return" ? (
                            <RotateCcw className="w-4 h-4" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-slate-900 truncate">
                              {alert.title}
                            </span>
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
                                alert.severity === "critical"
                                  ? "bg-rose-50 text-rose-700"
                                  : alert.severity === "warning"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {alert.time}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            {alert.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">24/7 AI handles regular inbox chats</span>
                    <Link
                      href="/settings"
                      onClick={() => setShowNotificationMenu(false)}
                      className="font-extrabold text-blue-600 hover:underline"
                    >
                      Alert Settings →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Top-Right Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowStoreMenu(false);
                  setShowNotificationMenu(false);
                }}
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-100/60 transition cursor-pointer"
              >
                {storeLogo ? (
                  <img
                    src={storeLogo}
                    alt={storeName}
                    className="w-8 h-8 rounded-full object-cover border border-slate-300"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">
                    {initials}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <div
                    className={`text-xs font-extrabold leading-tight ${
                      darkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {storeName}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {ownerName} ({ownerRole})
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-12 z-50 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 space-y-1 text-xs text-slate-800">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="font-extrabold text-slate-900">{storeName}</div>
                    <div className="text-[11px] text-slate-500">
                      {ownerName} • {ownerRole}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTempStoreName(storeName);
                      setTempOwnerName(ownerName);
                      setShowQuickRenameModal(true);
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-slate-50 font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <Store className="w-3.5 h-3.5 text-blue-600" />
                    Edit Store &amp; Admin Name
                  </button>
                  <Link
                    href="/team-roles"
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-slate-50 font-semibold flex items-center gap-2"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                    Manage Staff &amp; Team Roles
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-slate-50 font-semibold flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-600" />
                    Brand &amp; Security Settings
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-rose-50 text-rose-600 font-bold flex items-center gap-2 border-t border-slate-100 mt-1 pt-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Login / Switch User Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main
          className={`flex-1 overflow-y-auto transition ${
            darkMode ? "bg-slate-950 invert hue-rotate-180" : "bg-slate-50"
          }`}
        >
          {children}
        </main>
      </div>

      {/* Quick Store & Owner Name Edit Modal */}
      {showQuickRenameModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-extrabold text-slate-900">
              Update Your Store &amp; Admin Name
            </h3>
            <form onSubmit={handleSaveQuickRename} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Business / Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={tempStoreName}
                  onChange={(e) => setTempStoreName(e.target.value)}
                  placeholder="e.g. Synvora IT / Apex Footwear"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Admin / Owner Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={tempOwnerName}
                  onChange={(e) => setTempOwnerName(e.target.value)}
                  placeholder="e.g. Md Esrafil Hossen"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickRenameModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-extrabold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}