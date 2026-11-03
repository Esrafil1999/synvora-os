"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
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
  ShieldCheck,
  CreditCard,
  Settings,
  Search,
  Bell,
  Moon,
  Sun,
  ChevronDown,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { GLOBAL_CURRENCIES, useCurrency } from "@/lib/currency";
import { getWorkspaceConfig } from "@/lib/api";

const NAV_SECTIONS = [
  {
    title: "CORE COMMERCE",
    items: [
      { name: "Overview", href: "/", icon: LayoutDashboard, badge: "Live" },
      { name: "Orders", href: "/orders", icon: ShoppingBag, badge: "Live" },
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
      { name: "Marketing & Ads", href: "/marketing-ads", icon: Megaphone, badge: "Pro" },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      { name: "Analytics & P&L", href: "/analytics", icon: BarChart3, badge: "Live" },
      { name: "Automations", href: "/automations", icon: Zap, badge: "Pro" },
      { name: "AI Copilot", href: "/ai-copilot", icon: Bot, badge: "AI" },
    ],
  },
  {
    title: "WORKSPACE",
    items: [
      { name: "Channels", href: "/channels", icon: Globe, badge: "Live" },
      { name: "Integrations", href: "/integrations", icon: Plug, badge: "Live" },
      { name: "Team & Roles", href: "/team-roles", icon: ShieldCheck, badge: "Pro" },
      { name: "Billing", href: "/billing", icon: CreditCard, badge: "Live" },
      { name: "Settings", href: "/settings", icon: Settings, badge: "" },
    ],
  },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currency, changeCurrency } = useCurrency();
  const [darkMode, setDarkMode] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("My Business Store");
  const [aiCredits, setAiCredits] = useState({ remaining: 4200, total: 5000 });

  useEffect(() => {
    const savedTheme = localStorage.getItem("synvora_theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
    async function loadWs() {
      const ws = await getWorkspaceConfig();
      if (ws) {
        if (ws.workspace_name) setWorkspaceName(String(ws.workspace_name));
        if (ws.ai_credits_remaining !== undefined) {
          setAiCredits({
            remaining: Number(ws.ai_credits_remaining),
            total: Number(ws.ai_credits_total || 5000),
          });
        }
      }
    }
    loadWs();
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("synvora_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("synvora_theme", "light");
    }
  };

  if (pathname === "/store" || pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="h-screen overflow-hidden flex bg-slate-50 text-slate-900">
      {/* Fixed Full-Height Left Sidebar — Never stretches with right-side page content */}
      <aside className="w-60 h-screen bg-slate-950 text-slate-200 flex flex-col justify-between shrink-0 border-r border-slate-800 select-none overflow-hidden">
        {/* Top Brand + Store Switcher */}
        <div className="shrink-0">
          <div className="px-4 py-3.5 flex items-center gap-3 border-b border-slate-800/80">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-sm shadow-sm">
              S
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-wide text-white">SYNVORA</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  OS
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Commerce &amp; Social Suite</p>
            </div>
          </div>

          <div className="px-3 py-2.5 border-b border-slate-800/80">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate">{workspaceName}</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {currency.country} ({currency.symbol})
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>
          </div>
        </div>

        {/* Navigation Links — Compact & Clean */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-3">
          {NAV_SECTIONS.map((sec) => (
            <div key={sec.title} className="space-y-0.5">
              <div className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                {sec.title}
              </div>
              {sec.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    prefetch={true}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      active
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" />
                      {item.name}
                    </span>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          active
                            ? "bg-white/20 text-white"
                            : item.badge === "Pro"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : item.badge === "AI"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
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

        {/* Pinned Bottom AI Credits Footer — Always stays locked at bottom of sidebar */}
        <div className="shrink-0 p-3 border-t border-slate-800 bg-slate-900/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> AI Credits
            </span>
            <span className="text-white font-extrabold">
              {aiCredits.remaining.toLocaleString()} / {aiCredits.total.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-indigo-500 to-purple-500 rounded-full"
              style={{
                width: `${Math.min(100, Math.round((aiCredits.remaining / aiCredits.total) * 100))}%`,
              }}
            />
          </div>
        </div>
      </aside>

      {/* Right Column: Fixed Header + Independently Scrollable Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-14 shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 z-20">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2" />
            <input
              type="text"
              placeholder="Search orders, products, customers..."
              className="w-full pl-10 pr-4 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/store"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-extrabold transition"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Customer Order Page
            </Link>

            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <select
                value={currency.code}
                onChange={(e) => changeCurrency(e.target.value)}
                aria-label="Select Market Currency"
                className="bg-transparent text-xs font-extrabold text-slate-800 focus:outline-none cursor-pointer"
              >
                {GLOBAL_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{darkMode ? "Light" : "Dark"}</span>
            </button>

            <button className="relative p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600">
              <Bell className="w-4 h-4" />
            </button>

            <Link href="/settings" className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">
                {workspaceName.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-extrabold text-slate-900 leading-none">{workspaceName}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Business Owner</div>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}