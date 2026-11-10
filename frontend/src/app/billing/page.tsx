"use client";

import React, { useState, useEffect } from "react";
import {
  Check, Sparkles, ShieldCheck, CreditCard, Globe, Clock,
  Printer, ArrowRight, Lock, Smartphone, Building2, X, Award,
} from "lucide-react";

interface PlanItem {
  id: string;
  name: string;
  badge: string;
  usdPrice: number;
  trialDays: number;
  desc: string;
  features: string[];
  popular?: boolean;
}

const SAAS_PLANS: PlanItem[] = [
  {
    id: "starter_free",
    name: "Starter Cloud",
    badge: "Free Forever",
    usdPrice: 0,
    trialDays: 0,
    desc: "For new entrepreneurs starting their first online store.",
    features: [
      "Up to 25 Products & 50 Orders / mo",
      "Public Customer Order Page (/store)",
      "Basic POS & Order Slip Printing",
      "1 Admin User Account",
      "Standard Store Overview",
    ],
  },
  {
    id: "growth_pro",
    name: "Growth Pro",
    badge: "15-Day Free Trial",
    usdPrice: 49,
    trialDays: 15,
    popular: true,
    desc: "Full omnichannel social commerce & live P&L automation.",
    features: [
      "15 Days 100% Free Pro Access",
      "Unlimited Products & Orders",
      "Facebook, Instagram, WhatsApp & TikTok Sync",
      "24/7 AI Bot + Human Agent Unified Inbox",
      "Full Financial Analytics & 12-Month P&L",
      "3-Way Return & Damage Inspection",
    ],
  },
  {
    id: "business_scale",
    name: "Business Scale",
    badge: "15-Day Free Trial",
    usdPrice: 99,
    trialDays: 15,
    desc: "For growing brands with staff teams & external websites.",
    features: [
      "Everything in Growth Pro + 15-Day Free Trial",
      "Multi-Staff Team & Role Permissions",
      "WooCommerce, Shopify & Custom Webhooks",
      "Marketing & Ad Spend P&L Auto-Sync",
      "5,000 Monthly AI Copilot Credits",
      "Priority Courier API Integration",
    ],
  },
  {
    id: "enterprise_global",
    name: "Enterprise Global",
    badge: "All-In-One VIP",
    usdPrice: 199,
    trialDays: 15,
    desc: "Unlimited multi-branch operations & dedicated cloud SLA.",
    features: [
      "Unlimited Multi-Country Stores & Outlets",
      "Unlimited Staff Accounts & AI Credits",
      "Custom White-Label Domain Setup",
      "Dedicated Account Manager & 24/7 SLA",
      "Custom ERP & Accounting Exports",
      "Enterprise Security & Audit Logs",
    ],
  },
];

const MARKETS = [
  { code: "USD", label: "International / USA ($ USD)", symbol: "$", rate: 1, isBD: false },
  { code: "BDT", label: "Bangladesh (৳ BDT - bKash/Nagad/Card)", symbol: "৳", rate: 100, isBD: true },
  { code: "EUR", label: "Europe (€ EUR)", symbol: "€", rate: 0.92, isBD: false },
  { code: "GBP", label: "United Kingdom (£ GBP)", symbol: "£", rate: 0.79, isBD: false },
  { code: "AED", label: "UAE / Dubai (AED)", symbol: "AED ", rate: 3.67, isBD: false },
  { code: "SAR", label: "Saudi Arabia (SAR)", symbol: "SAR ", rate: 3.75, isBD: false },
  { code: "SGD", label: "Singapore (S$ SGD)", symbol: "S$", rate: 1.35, isBD: false },
];

export default function BillingSubscriptionPage() {
  const [marketCode, setMarketCode] = useState<string>("USD");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const [activeSub, setActiveSub] = useState<{
    planId: string;
    planName: string;
    status: "Free Forever" | "15-Day Free Trial" | "Active Paid";
    trialEndsAt?: string;
    activatedAt: string;
    method: string;
    amountPaid: string;
    invoiceId: string;
    companyName: string;
    buyerEmail: string;
  }>({
    planId: "growth_pro",
    planName: "Growth Pro",
    status: "15-Day Free Trial",
    trialEndsAt: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    activatedAt: new Date().toISOString().slice(0, 10),
    method: "15-Day Free Pro Trial",
    amountPaid: "$0.00 (Trial)",
    invoiceId: "INV-SYN-202601",
    companyName: "My Business Store",
    buyerEmail: "owner@synvorait.com",
  });

  const [checkoutPlan, setCheckoutPlan] = useState<PlanItem | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<"trial" | "buy">("buy");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState<string>("International Card (Visa / Mastercard / Amex)");
  const [companyName, setCompanyName] = useState<string>("My Business Store");
  const [buyerEmail, setBuyerEmail] = useState<string>("contact@synvorait.com");
  const [accountOrCard, setAccountOrCard] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [pinOrCvv, setPinOrCvv] = useState<string>("");
  const [receiptModal, setReceiptModal] = useState<boolean>(false);

  const currentMarket = MARKETS.find((m) => m.code === marketCode) || MARKETS[0];

  useEffect(() => {
    const saved = localStorage.getItem("synvora_saas_subscription_v1");
    if (saved) {
      try { setActiveSub(JSON.parse(saved)); } catch {}
    }
  }, []);

  const formatPlanPrice = (usd: number) => {
    if (usd === 0) return `${currentMarket.symbol}0`;
    const finalUsd = billingCycle === "yearly" ? Math.round(usd * 0.8) : usd;
    const converted = Math.round(finalUsd * currentMarket.rate);
    return `${currentMarket.symbol}${converted.toLocaleString()}`;
  };

  const openPlanAction = (plan: PlanItem, mode: "trial" | "buy") => {
    setCheckoutPlan(plan);
    setCheckoutMode(mode);
    setStep(1);
    setAccountOrCard("");
    setOtpCode("");
    setPinOrCvv("");
    if (currentMarket.isBD) {
      setPaymentMethod("bKash Merchant Checkout");
    } else {
      setPaymentMethod("International Card (Visa / Mastercard / Amex)");
    }
  };

  const handleConfirmSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutPlan) return;

    if (checkoutMode === "buy" && step === 1) {
      setStep(2);
      return;
    }
    if (checkoutMode === "buy" && step === 2) {
      setStep(3);
      return;
    }

    const isTrial = checkoutMode === "trial" || checkoutPlan.usdPrice === 0;
    const trialEnd = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);
    const priceStr = isTrial ? `${currentMarket.symbol}0.00` : formatPlanPrice(checkoutPlan.usdPrice);

    const updatedSub = {
      planId: checkoutPlan.id,
      planName: checkoutPlan.name,
      status: (checkoutPlan.usdPrice === 0
        ? "Free Forever"
        : isTrial
        ? "15-Day Free Trial"
        : "Active Paid") as "Free Forever" | "15-Day Free Trial" | "Active Paid",
      trialEndsAt: isTrial && checkoutPlan.usdPrice > 0 ? trialEnd : undefined,
      activatedAt: new Date().toISOString().slice(0, 10),
      method: isTrial ? (checkoutPlan.usdPrice === 0 ? "Free Forever Tier" : "15-Day Free Pro Trial") : paymentMethod,
      amountPaid: priceStr,
      invoiceId: `SYN-SUB-${Math.floor(100000 + Math.random() * 900000)}`,
      companyName: companyName.trim() || "My Business Store",
      buyerEmail: buyerEmail.trim() || "owner@synvorait.com",
    };

    setActiveSub(updatedSub);
    localStorage.setItem("synvora_saas_subscription_v1", JSON.stringify(updatedSub));
    setCheckoutPlan(null);
    setReceiptModal(true);
  };

  const daysRemaining = activeSub.trialEndsAt
    ? Math.max(1, Math.ceil((new Date(activeSub.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <div className="space-y-6 pb-12 text-slate-900">
      {/* Top SaaS Subscription Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                <Globe className="h-3.5 w-3.5" /> SYNVORA OS — Global SaaS Licensing & Billing
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                ● Active Plan: {activeSub.planName} ({activeSub.status})
              </span>
              {activeSub.status === "15-Day Free Trial" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                  <Clock className="h-3.5 w-3.5" /> {daysRemaining} Days Left in Free Pro Trial (Ends {activeSub.trialEndsAt})
                </span>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
              Choose Your SYNVORA OS Plan — Start with a 15-Day Free Pro Trial
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              International clients pay via Visa, Mastercard, Amex, PayPal, or Apple Pay. Bangladesh clients get additional bKash, Nagad & Local Bank Card options.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={marketCode}
              onChange={(e) => setMarketCode(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800"
            >
              {MARKETS.map((m) => (
                <option key={m.code} value={m.code}>{m.label}</option>
              ))}
            </select>

            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-bold">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-lg px-3 py-1.5 ${billingCycle === "monthly" ? "bg-slate-900 text-white" : "text-slate-600"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`rounded-lg px-3 py-1.5 ${billingCycle === "yearly" ? "bg-blue-600 text-white" : "text-slate-600"}`}
              >
                Yearly (Save 20%)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pricing Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {SAAS_PLANS.map((plan) => {
          const isCurrent = activeSub.planId === plan.id;
          return (
            <div
              key={plan.id}
              className={`flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-xs transition ${
                plan.popular ? "border-2 border-blue-600 ring-4 ring-blue-50" : "border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    plan.usdPrice === 0 ? "bg-slate-100 text-slate-700" : "bg-blue-50 text-blue-700"
                  }`}>
                    {plan.badge}
                  </span>
                  {plan.popular && (
                    <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                      MOST POPULAR
                    </span>
                  )}
                </div>

                <h2 className="mt-3 text-lg font-extrabold text-slate-900">{plan.name}</h2>
                <p className="mt-1 text-xs text-slate-500">{plan.desc}</p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {formatPlanPrice(plan.usdPrice)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {plan.usdPrice === 0 ? "/ forever" : "/ month"}
                  </span>
                </div>
                {plan.trialDays > 0 && (
                  <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                    ✓ Includes {plan.trialDays}-Day Free Full Pro Trial
                  </p>
                )}

                <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-xs text-slate-700">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 space-y-2 pt-4">
                {plan.usdPrice === 0 ? (
                  <button
                    onClick={() => openPlanAction(plan, "trial")}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50"
                  >
                    {isCurrent ? "✓ Active Free Plan" : "Activate Starter Free"}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => openPlanAction(plan, "trial")}
                      className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500"
                    >
                      Start 15-Day Free Trial ({currentMarket.symbol}0 Today)
                    </button>
                    <button
                      onClick={() => openPlanAction(plan, "buy")}
                      className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
                    >
                      Subscribe Now ({formatPlanPrice(plan.usdPrice)}/mo)
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Regional Payment Methods Info Card */}
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:grid-cols-2">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">International SaaS Checkout (Worldwide)</h3>
            <p className="mt-1 text-xs text-slate-500">
              Supports Visa, Mastercard, American Express, PayPal Global, Apple Pay, Google Pay, and Stripe / Lemon Squeezy in USD, EUR, GBP, AED, SAR & SGD.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Bangladesh Local Checkout (BDT ৳)</h3>
            <p className="mt-1 text-xs text-slate-500">
              When Bangladesh (BDT ৳) is selected, clients can pay via bKash, Nagad, and Local Bank Cards (City Bank, DBBL, BRAC Bank, EBL) with instant 3-step OTP verification.
            </p>
          </div>
        </div>
      </div>

      {/* Checkout & 15-Day Trial Activation Modal */}
      {checkoutPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-slate-900 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase text-blue-600">
                  {checkoutMode === "trial" ? "Instant 15-Day Free Trial" : `Step ${step} of 3 • Official SaaS Checkout`}
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {checkoutPlan.name} — {checkoutMode === "trial" ? `${ currentMarket.symbol }0 for 15 Days` : `${formatPlanPrice(checkoutPlan.usdPrice)} / mo`}
                </h3>
              </div>
              <button onClick={() => setCheckoutPlan(null)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleConfirmSubscription} className="space-y-3 text-xs">
              {step === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="mb-1 block font-bold">Business / Store Name *</label>
                      <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                    </div>
                    <div>
                      <label className="mb-1 block font-bold">Owner Email *</label>
                      <input type="email" required value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
                    </div>
                  </div>

                  {checkoutMode === "buy" && (
                    <>
                      <div>
                        <label className="mb-1 block font-bold">
                          Select Payment Method ({currentMarket.isBD ? "Bangladesh BDT" : `International ${currentMarket.code}`}) *
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold"
                        >
                          {currentMarket.isBD ? (
                            <>
                              <option value="bKash Merchant Checkout">bKash Mobile Banking (Bangladesh)</option>
                              <option value="Nagad Instant PGW">Nagad Mobile Banking (Bangladesh)</option>
                              <option value="Bangladesh Local Bank Card (City / DBBL / BRAC)">Local Bank Card (City Bank / DBBL / BRAC / EBL)</option>
                              <option value="International Card (Visa / Mastercard / Amex)">International Visa / Mastercard / Amex</option>
                            </>
                          ) : (
                            <>
                              <option value="International Card (Visa / Mastercard / Amex)">International Card (Visa / Mastercard / Amex)</option>
                              <option value="PayPal Global Express">PayPal Global Checkout</option>
                              <option value="Apple Pay / Google Pay">Apple Pay / Google Pay</option>
                              <option value="Paddle / Lemon Squeezy Global">Paddle / Lemon Squeezy SaaS Billing</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block font-bold">
                          {paymentMethod.includes("bKash") || paymentMethod.includes("Nagad")
                            ? "Enter bKash / Nagad Wallet Number *"
                            : "Card Number / PayPal Account *"}
                        </label>
                        <input
                          type="text"
                          required
                          value={accountOrCard}
                          onChange={(e) => setAccountOrCard(e.target.value)}
                          placeholder={paymentMethod.includes("bKash") || paymentMethod.includes("Nagad") ? "017XXXXXXXX" : "4532 •••• •••• 8891"}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {checkoutMode === "buy" && step === 2 && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                  <p className="font-bold text-blue-900">Step 2: 6-Digit Verification OTP</p>
                  <p className="mt-1 text-slate-600">Enter the 6-digit verification code sent to your registered phone/email for {paymentMethod}.</p>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-Digit OTP (e.g. 482910)"
                    className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-center text-sm font-bold tracking-widest"
                  />
                </div>
              )}

              {checkoutMode === "buy" && step === 3 && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <p className="font-bold text-emerald-900">Step 3: Confirm Security PIN / CVV</p>
                  <p className="mt-1 text-slate-600">Authorize {formatPlanPrice(checkoutPlan.usdPrice)} for {checkoutPlan.name} via {paymentMethod}.</p>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    value={pinOrCvv}
                    onChange={(e) => setPinOrCvv(e.target.value)}
                    placeholder="Enter PIN or Card CVV"
                    className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-center text-sm font-bold tracking-widest"
                  />
                </div>
              )}

              <button type="submit" className="mt-2 w-full rounded-xl bg-blue-600 py-3 text-xs font-extrabold text-white hover:bg-blue-500">
                {checkoutMode === "trial"
                  ? "Activate 15-Day Free Pro Trial Now"
                  : step < 3
                  ? "Proceed to Next Verification Step →"
                  : `Confirm & Pay ${formatPlanPrice(checkoutPlan.usdPrice)}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Official Subscription Invoice Modal */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-600">✓ OFFICIAL SAAS LICENSE ACTIVATED</span>
                <h3 className="text-base font-extrabold">SYNVORA OS Subscription Receipt</h3>
              </div>
              <button onClick={() => setReceiptModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="my-4 space-y-2 rounded-xl bg-slate-50 p-4 text-xs">
              <div className="flex justify-between"><span>Invoice ID:</span><strong>{activeSub.invoiceId}</strong></div>
              <div className="flex justify-between"><span>Workspace:</span><strong>{activeSub.companyName}</strong></div>
              <div className="flex justify-between"><span>Email:</span><strong>{activeSub.buyerEmail}</strong></div>
              <div className="flex justify-between"><span>Activated Plan:</span><strong>{activeSub.planName} ({activeSub.status})</strong></div>
              <div className="flex justify-between"><span>Payment Method:</span><strong>{activeSub.method}</strong></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm"><span>Total Paid:</span><strong className="text-emerald-600">{activeSub.amountPaid}</strong></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white">Print / Save PDF</button>
              <button onClick={() => setReceiptModal(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}