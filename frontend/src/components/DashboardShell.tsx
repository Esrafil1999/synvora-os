'use client';

/**
 * @file DashboardShell.tsx
 * @description Master layout featuring interactive Workspace Switcher, Global Search Shortcut Palette,
 * Notifications Popover, Profile Menu with Login/Admin links, and Light/Dark Mode Engine.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  ShieldCheck,
  CreditCard,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Sparkles,
  Sun,
  Moon,
  Check,
  LogOut,
  Database,
} from 'lucide-react';

const WORKSPACES = [
  { name: 'Northwind Outfitters', sub: 'Outdoor gear & apparel', code: 'NO' },
  { name: 'Harbor & Co. Home', sub: 'Home goods & ceramics', code: 'HC' },
  { name: 'Lumen Skincare', sub: 'Direct-to-consumer beauty', code: 'LS' },
];

const navGroups = [
  {
    label: 'Core Commerce',
    items: [
      { name: 'Overview', href: '/', icon: LayoutDashboard, badge: 'Live' },
      { name: 'Orders', href: '/orders', icon: ShoppingCart, badge: 'Live' },
      { name: 'Products', href: '/products', icon: Package, badge: 'Live' },
      { name: 'Inventory', href: '/inventory', icon: Boxes, badge: 'Live' },
      { name: 'Fulfillment', href: '/fulfillment', icon: Truck, badge: 'Live' },
      { name: 'Customers', href: '/customers', icon: Users, badge: 'Live' },
    ],
  },
  {
    label: 'Engage & Social',
    items: [
      { name: 'Unified Inbox', href: '/unified-inbox', icon: MessageSquare, badge: 'Live' },
      { name: 'Social Studio', href: '/social-studio', icon: Share2, badge: 'Live' },
      { name: 'Marketing & Ads', href: '/marketing-ads', icon: Megaphone, badge: 'Pro' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { name: 'Analytics & P&L', href: '/analytics', icon: BarChart3, badge: 'Live' },
      { name: 'Automations', href: '/automations', icon: Zap, badge: 'Pro' },
      { name: 'AI Copilot', href: '/ai-copilot', icon: Bot, badge: 'AI' },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { name: 'Channels', href: '/channels', icon: Globe, badge: 'Live' },
      { name: 'Integrations', href: '/integrations', icon: Plug, badge: 'Live' },
      { name: 'Team & Roles', href: '/team-roles', icon: ShieldCheck, badge: 'Pro' },
      { name: 'Billing', href: '/billing', icon: CreditCard, badge: 'Live' },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState(WORKSPACES[0]);
  const [wsOpen, setWsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('synvora-theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('synvora-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('synvora-theme', 'light');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans transition-colors duration-200">
      {/* Left Navigation Sidebar */}
      <aside className="w-64 bg-[#0B0F19] text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
        <div className="p-4 flex items-center gap-3 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
            S
          </div>
          <div>
            <div className="font-bold text-white tracking-wider text-sm flex items-center gap-1.5">
              SYNVORA <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">OS</span>
            </div>
            <div className="text-[11px] text-slate-400">Commerce & Social Suite</div>
          </div>
        </div>

        {/* Workspace Switcher */}
        <div className="p-3 border-b border-slate-800/80 relative">
          <button
            type="button"
            onClick={() => setWsOpen(!wsOpen)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-left transition cursor-pointer"
          >
            <div>
              <div className="text-xs font-semibold text-white">{activeWorkspace.name}</div>
              <div className="text-[10px] text-emerald-400">● {activeWorkspace.sub}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {wsOpen && (
            <div className="absolute left-3 right-3 top-16 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Workspaces
              </div>
              {WORKSPACES.map((w) => (
                <button
                  key={w.name}
                  type="button"
                  onClick={() => {
                    setActiveWorkspace(w);
                    setWsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-800 text-left text-xs transition"
                >
                  <div>
                    <div className="font-semibold text-white">{w.name}</div>
                    <div className="text-[10px] text-slate-400">{w.sub}</div>
                  </div>
                  {activeWorkspace.name === w.name && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            isActive
                              ? 'bg-blue-700 text-white'
                              : item.badge === 'Pro'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : item.badge === 'AI'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* AI Credits Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> AI Credits
            </span>
            <span className="text-white font-semibold">850 / 1,000</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="w-[85%] h-full bg-linear-to-r from-blue-500 to-purple-500 rounded-full" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 relative z-30">
          <div className="relative w-96 max-w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchText}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search orders, customers, modules... (Ctrl+K)"
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />

            {searchFocused && (
              <div className="absolute left-0 right-0 top-11 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 space-y-1 text-xs">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Navigation Shortcuts
                </div>
                {[
                  { name: 'Overview', sub: 'Executive performance snapshot', href: '/' },
                  { name: 'Orders', sub: 'Track, review and fulfill orders', href: '/orders' },
                  { name: 'Social Studio', sub: 'Multi-channel post composer & scheduler', href: '/social-studio' },
                  { name: 'Analytics & P&L', sub: 'Daily profit & loss calculator', href: '/analytics' },
                  { name: 'Super Admin Portal', sub: 'Database & system health center', href: '/admin' },
                ].map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onMouseDown={() => router.push(s.href)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 text-left"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{s.name}</div>
                      <div className="text-[11px] text-slate-400">{s.sub}</div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">Module</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden lg:inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              Neon Cloud PostgreSQL Active
            </span>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              {darkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-600" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setProfileOpen(false);
                }}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 relative cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span className="w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center absolute -top-0.5 -right-0.5">
                  3
                </span>
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-11 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900">Notifications</span>
                    <button onClick={() => setNotifOpen(false)} className="text-[11px] text-blue-600 font-semibold">
                      Mark all as read
                    </button>
                  </div>
                  <div className="space-y-2.5 divide-y divide-slate-100">
                    <div className="pt-1">
                      <div className="font-semibold text-slate-800">Fulfillment queue updated</div>
                      <div className="text-[11px] text-slate-500">12 orders are waiting to ship.</div>
                    </div>
                    <div className="pt-2">
                      <div className="font-semibold text-slate-800">Low stock: Trail Runner Jacket, M</div>
                      <div className="text-[11px] text-slate-500">14 units remaining in Neon PostgreSQL.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown with Admin & Login Links */}
            <div className="relative pl-3 border-l border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2.5 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  AM
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-800 leading-none">Avery Morgan</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Enterprise Admin</div>
                </div>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-11 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 space-y-1.5 text-xs">
                  <div className="border-b border-slate-100 pb-2 mb-1">
                    <div className="font-bold text-slate-900">Avery Morgan</div>
                    <div className="text-[11px] text-slate-400">admin@synvorait.com</div>
                  </div>
                  <Link
                    href="/admin"
                    onClick={() => setProfileOpen(false)}
                    className="block px-2.5 py-1.5 rounded hover:bg-slate-50 text-blue-600 font-semibold"
                  >
                    Super Admin Control Center
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="block px-2.5 py-1.5 rounded hover:bg-slate-50 text-slate-700 font-medium"
                  >
                    Workspace Settings
                  </Link>
                  <Link
                    href="/billing"
                    onClick={() => setProfileOpen(false)}
                    className="block px-2.5 py-1.5 rounded hover:bg-slate-50 text-slate-700 font-medium"
                  >
                    Billing & Plans
                  </Link>
                  <div className="border-t border-slate-100 pt-1.5 mt-1">
                    <Link
                      href="/login"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-rose-50 text-rose-600 font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out / Switch Account
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}