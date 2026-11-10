"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Sparkles, Globe, Lock, Store, ArrowRight, Check } from "lucide-react";

export default function SaaSLoginAndSignupPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("register");

  const [loginEmail, setLoginEmail] = useState("owner@synvorait.com");
  const [loginPassword, setLoginPassword] = useState("");

  const [ownerName, setOwnerName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCurrency, setCountryCurrency] = useState("USD");
  const [industry, setIndustry] = useState("E-Commerce & Retail Fashion");
  const [selectedPlan, setSelectedPlan] = useState<"growth_pro" | "starter_free">("growth_pro");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("synvora_auth_session_v1", JSON.stringify({ email: loginEmail, loggedInAt: new Date().toISOString() }));
    router.push("/");
  };

  const handleRegisterWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanStore = storeName.trim() || "My Business Store";
    const cleanOwner = ownerName.trim() || "Store Owner";

    const brandProfile = {
      storeName: cleanStore,
      ownerName: cleanOwner,
      companyName: cleanStore,
      industry,
      supportEmail: email.trim(),
      hotlinePhone: phone.trim(),
      currency: countryCurrency,
    };
    localStorage.setItem("synvora_brand_profile_v2", JSON.stringify(brandProfile));

    const trialEnds = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);
    const subData = {
      planId: selectedPlan,
      planName: selectedPlan === "growth_pro" ? "Growth Pro" : "Starter Cloud",
      status: selectedPlan === "growth_pro" ? "15-Day Free Trial" : "Free Forever",
      trialEndsAt: selectedPlan === "growth_pro" ? trialEnds : undefined,
      activatedAt: new Date().toISOString().slice(0, 10),
      method: selectedPlan === "growth_pro" ? "15-Day Free Pro Trial" : "Free Forever Tier",
      amountPaid: "$0.00",
      invoiceId: `SYN-TRIAL-${Math.floor(100000 + Math.random() * 900000)}`,
      companyName: cleanStore,
      buyerEmail: email.trim(),
    };
    localStorage.setItem("synvora_saas_subscription_v1", JSON.stringify(subData));
    localStorage.setItem("synvora_auth_session_v1", JSON.stringify({ email: email.trim(), loggedInAt: new Date().toISOString() }));

    window.dispatchEvent(new Event("storage"));
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-5xl py-6 text-slate-900">
      <div className="grid grid-cols-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-12">
        {/* Left Global SaaS Pitch */}
        <div className="flex flex-col justify-between bg-slate-900 p-8 text-white lg:col-span-5">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300">
              <Globe className="h-3.5 w-3.5" /> SYNVORA OS • Global SaaS Cloud
            </span>
            <h1 className="mt-4 text-2xl font-extrabold leading-tight">
              Launch Your All-in-One Social Commerce & POS OS
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              Manage Orders, Inventory, Facebook/Instagram/WhatsApp/TikTok AI Inbox, Fulfillment, and Live 12-Month P&L from one workspace.
            </p>

            <ul className="mt-6 space-y-3 text-xs text-slate-200">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> 15-Day Full Pro Trial (No Credit Card Required)</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Free Forever Starter Plan Available</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Global Cards, PayPal + Bangladesh bKash/Nagad</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Instant Storefront (/store) & Webhook Sync</li>
            </ul>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-800/70 p-4 text-xs">
            <p className="font-bold text-emerald-400">Want to buy a paid plan directly?</p>
            <p className="mt-1 text-slate-300">View all international & Bangladesh pricing tiers on our Billing hub.</p>
            <Link href="/billing" className="mt-3 inline-flex items-center gap-1 font-bold text-blue-400 hover:underline">
              View Plans & Pricing <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Sign-Up / Login Form */}
        <div className="p-8 lg:col-span-7">
          <div className="mb-6 flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-lg py-2.5 transition ${mode === "register" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600"}`}
            >
              Start 15-Day Free Trial / Sign Up
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg py-2.5 transition ${mode === "login" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600"}`}
            >
              Sign In to Workspace
            </button>
          </div>

          {mode === "register" ? (
            <form onSubmit={handleRegisterWorkspace} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Your Full Name *</label>
                  <input type="text" required value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Md Esrafil Hossen" className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Business / Store Name *</label>
                  <input type="text" required value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="My Business Store" className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Business Email *</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@company.com" className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Phone / WhatsApp *</label>
                  <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+88017XXXXXXXX / +1..." className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Country & Currency *</label>
                  <select value={countryCurrency} onChange={(e) => setCountryCurrency(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-semibold">
                    <option value="USD">International / USA ($ USD)</option>
                    <option value="BDT">Bangladesh (৳ BDT)</option>
                    <option value="EUR">Europe (€ EUR)</option>
                    <option value="GBP">United Kingdom (£ GBP)</option>
                    <option value="AED">UAE / Dubai (AED)</option>
                    <option value="SAR">Saudi Arabia (SAR)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-bold text-slate-700">Business Industry *</label>
                  <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-semibold">
                    <option value="Footwear & Shoes">Footwear & Shoes</option>
                    <option value="E-Commerce & Retail Fashion">Apparel & Fashion</option>
                    <option value="Electronics & Gadgets">Electronics & Gadgets</option>
                    <option value="Cosmetics & Beauty">Cosmetics & Beauty</option>
                    <option value="Multi-Branch Retail POS">Multi-Branch Retail POS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Select Starting Plan *</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("growth_pro")}
                    className={`rounded-xl border p-3 text-left ${selectedPlan === "growth_pro" ? "border-2 border-blue-600 bg-blue-50/50" : "border-slate-200"}`}
                  >
                    <p className="font-extrabold text-slate-900">Growth Pro (15-Day Free)</p>
                    <p className="mt-0.5 text-[11px] text-emerald-600">All Pro features unlocked for 15 days</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("starter_free")}
                    className={`rounded-xl border p-3 text-left ${selectedPlan === "starter_free" ? "border-2 border-blue-600 bg-blue-50/50" : "border-slate-200"}`}
                  >
                    <p className="font-extrabold text-slate-900">Starter Cloud ($0)</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">Free forever basic store plan</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">Create Workspace Password *</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              </div>

              <button type="submit" className="w-full rounded-xl bg-blue-600 py-3 text-xs font-extrabold text-white shadow-xs hover:bg-blue-500">
                {selectedPlan === "growth_pro" ? "Create Workspace & Start 15-Day Free Pro Trial →" : "Create Free Forever Workspace →"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-bold text-slate-700">Workspace Email *</label>
                <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              </div>
              <div>
                <label className="mb-1 block font-bold text-slate-700">Password *</label>
                <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              </div>
              <button type="submit" className="w-full rounded-xl bg-slate-900 py-3 text-xs font-extrabold text-white hover:bg-slate-800">
                Sign In to SYNVORA OS →
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}