'use client';

/**
 * @file billing/page.tsx
 * @description Live Subscription Plan Manager & AI Credit Top-Up Checkout connected to Neon PostgreSQL (/api/v1/workspace/).
 * Switching between Starter, Pro, and Enterprise dynamically locks/unlocks Pro & Enterprise pages across the app!
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Coins, CreditCard, Lock, Unlock, X, Database, Key } from 'lucide-react';
import { fetchFromBackend, postToBackend } from '@/lib/api';

interface WorkspaceData {
  active_plan: string;
  ai_credits_remaining: number;
  ai_credits_limit: number;
  custom_ai_provider: string;
  custom_ai_api_key: string;
}

export default function BillingPage() {
  const [activePlan, setActivePlan] = useState('Starter');
  const [aiCredits, setAiCredits] = useState(850);
  const [aiLimit, setAiLimit] = useState(1000);
  const [customAiKey, setCustomAiKey] = useState('');
  const [customAiProvider, setCustomAiProvider] = useState('Google Gemini');
  const [purchasedMsg, setPurchasedMsg] = useState('');

  // Checkout Modal State
  const [checkoutPlan, setCheckoutPlan] = useState<{ id: string; name: string; price: string } | null>(null);
  const [creditPackModal, setCreditPackModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState({ credits: 2500, price: '$10' });
  const [paymentMethod, setPaymentMethod] = useState('bKash / Nagad Instant Pay');

  useEffect(() => {
    async function loadWorkspace() {
      const ws = await fetchFromBackend<WorkspaceData>('workspace', {
        active_plan: 'Starter',
        ai_credits_remaining: 850,
        ai_credits_limit: 1000,
        custom_ai_provider: 'Google Gemini',
        custom_ai_api_key: '',
      });
      if (ws) {
        setActivePlan(ws.active_plan || 'Starter');
        setAiCredits(ws.ai_credits_remaining ?? 850);
        setAiLimit(ws.ai_credits_limit ?? 1000);
        setCustomAiProvider(ws.custom_ai_provider || 'Google Gemini');
        setCustomAiKey(ws.custom_ai_api_key || '');
        localStorage.setItem('synvora-active-plan', ws.active_plan || 'Starter');
      }
    }
    loadWorkspace();
  }, []);

  const handleConfirmPlanUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutPlan) return;

    const updated = await postToBackend<WorkspaceData>('workspace', {
      active_plan: checkoutPlan.id,
    });

    const newPlan = updated?.active_plan || checkoutPlan.id;
    setActivePlan(newPlan);
    localStorage.setItem('synvora-active-plan', newPlan);
    window.dispatchEvent(new Event('synvora-plan-updated'));

    setPurchasedMsg(
      `🎉 Successfully activated ${checkoutPlan.name} (${newPlan} Tier) via ${paymentMethod}! Locked ${newPlan} modules are now unlocked!`
    );
    setCheckoutPlan(null);
    setTimeout(() => setPurchasedMsg(''), 6000);
  };

  const handleConfirmCreditPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await postToBackend<WorkspaceData>('workspace', {
      add_ai_credits: selectedPack.credits,
    });

    if (updated) {
      setAiCredits(updated.ai_credits_remaining);
      setAiLimit(updated.ai_credits_limit);
    } else {
      setAiCredits((c) => c + selectedPack.credits);
      setAiLimit((l) => l + selectedPack.credits);
    }

    window.dispatchEvent(new Event('synvora-plan-updated'));
    setPurchasedMsg(
      `⚡ Added +${selectedPack.credits.toLocaleString()} AI Copilot Credits to your workspace balance via ${paymentMethod}!`
    );
    setCreditPackModal(false);
    setTimeout(() => setPurchasedMsg(''), 5000);
  };

  const handleSaveCustomAiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    await postToBackend('workspace', {
      custom_ai_provider: customAiProvider,
      custom_ai_api_key: customAiKey,
    });
    setPurchasedMsg(`✅ Your personal ${customAiProvider} API Key has been linked for direct billing!`);
    setTimeout(() => setPurchasedMsg(''), 4000);
  };

  const plans = [
    {
      id: 'Starter',
      name: 'Starter Commerce',
      price: '$29 / month',
      desc: 'Essential order, product, and basic social publishing for growing businesses.',
      unlockedModules: [
        'Overview, Orders, Products, Inventory & Fulfillment',
        'Customers CRM & Unified Social Inbox',
        'Social Studio Multi-Channel Publisher & P&L Analytics',
      ],
      lockedModules: [
        'Marketing & Ads Manager (Locked — Requires Pro)',
        'Comment-to-DM Automations (Locked — Requires Pro)',
        'Team & Roles RBAC (Locked — Requires Enterprise)',
      ],
    },
    {
      id: 'Pro',
      name: 'Pro Automation & Ads',
      price: '$79 / month',
      desc: 'Unlocks Marketing & Ads Manager and Social Comment-to-DM Automations.',
      unlockedModules: [
        'Everything in Starter Plan',
        'UNLOCKED: Marketing & Ads Campaign Manager',
        'UNLOCKED: Social Comment-to-DM & Click Automations',
        'AI Business Copilot + 1,000 Monthly AI Credits',
      ],
      lockedModules: ['Team & Roles RBAC (Locked — Requires Enterprise)'],
    },
    {
      id: 'Enterprise',
      name: 'Enterprise OS (All Unlocked)',
      price: '$199 / month',
      desc: 'Unlocks 100% of all modules including Multi-Staff Team & Role Permissions.',
      unlockedModules: [
        'Everything in Starter & Pro Plans',
        'UNLOCKED: Multi-Staff Team & Role Permissions (RBAC)',
        'Unlimited Custom Storefront & ERP Webhooks',
        'Dedicated Account Manager & Priority Support',
      ],
      lockedModules: [],
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">Subscription Plans & AI Credit Billing</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Active Tier: {activePlan} Plan
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Switch between Starter, Pro, and Enterprise plans to test live feature unlocking across the sidebar.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 px-4 py-2 rounded-xl text-xs">
          <Coins className="w-4 h-4 text-purple-600" />
          <span>AI Credits Balance:</span>
          <strong className="text-purple-900">
            {aiCredits.toLocaleString()} / {aiLimit.toLocaleString()}
          </strong>
        </div>
      </div>

      {purchasedMsg && (
        <div className="p-4 bg-emerald-950 text-emerald-200 border border-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{purchasedMsg}</span>
        </div>
      )}

      {/* Subscription Tiers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {plans.map((p) => {
          const isCurrent = activePlan === p.id;
          return (
            <div
              key={p.id}
              className={`bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-between space-y-5 ${
                isCurrent ? 'border-blue-600 ring-2 ring-blue-500/15' : 'border-slate-200'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">{p.name}</h2>
                  {isCurrent && (
                    <span className="text-[10px] bg-blue-600 text-white px-2.5 py-0.5 rounded-full font-bold">
                      Active Plan
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold text-slate-900">{p.price}</div>
                <p className="text-xs text-slate-500">{p.desc}</p>

                <div className="pt-3 space-y-2 border-t border-slate-100">
                  <div className="text-[10px] font-bold uppercase text-emerald-700">Unlocked Access:</div>
                  {p.unlockedModules.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-800">
                      <Unlock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}

                  {p.lockedModules.length > 0 && (
                    <>
                      <div className="text-[10px] font-bold uppercase text-amber-600 pt-2">
                        Locked on this tier:
                      </div>
                      {p.lockedModules.map((lf, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                          <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{lf}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCheckoutPlan({ id: p.id, name: p.name, price: p.price })}
                className={`w-full py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isCurrent
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isCurrent ? `Current Active Tier (${p.id})` : `Select & Activate ${p.id} Plan`}
              </button>
            </div>
          );
        })}
      </div>

      {/* AI Credit Top-Up & Bring Your Own API Key (BYOK) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-linear-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-xl flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="text-sm font-bold flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" /> Option 1: Buy Instant AI Copilot Credit Packs
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Clients can purchase pre-packaged AI credits directly from you via bKash, Nagad, or Card to use AI Caption Writing, Banner Design, and Daily Profit Audits.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setSelectedPack({ credits: 2500, price: '$10' });
                setCreditPackModal(true);
              }}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-lg cursor-pointer transition"
            >
              Buy 2,500 Credits ($10)
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedPack({ credits: 10000, price: '$30' });
                setCreditPackModal(true);
              }}
              className="bg-white/15 hover:bg-white/25 text-white font-semibold text-xs px-4 py-2.5 rounded-lg cursor-pointer transition"
            >
              Buy 10,000 Credits ($30)
            </button>
          </div>
        </div>

        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" /> Option 2: Client Self-Billed AI API Key (Zero Cost to You)
          </div>
          <p className="text-xs text-slate-500">
            Clients can also paste their own personal Google Gemini or OpenAI API key so AI usage is billed directly to their own Google/OpenAI account.
          </p>
          <form onSubmit={handleSaveCustomAiKey} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs pt-1">
            <select
              value={customAiProvider}
              onChange={(e) => setCustomAiProvider(e.target.value)}
              className="sm:col-span-4 px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="Google Gemini">Google Gemini API</option>
              <option value="OpenAI GPT-4o">OpenAI GPT-4o API</option>
            </select>
            <input
              type="password"
              value={customAiKey}
              onChange={(e) => setCustomAiKey(e.target.value)}
              placeholder="Paste AIzaSy... or sk-... API Key"
              className="sm:col-span-5 px-3 py-2 border border-slate-300 rounded-lg font-mono"
            />
            <button
              type="submit"
              className="sm:col-span-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3 py-2 rounded-lg cursor-pointer"
            >
              Save API Key
            </button>
          </form>
        </div>
      </div>

      {/* Plan Upgrade Payment Checkout Modal */}
      {checkoutPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Activate {checkoutPlan.name}</h3>
              <button onClick={() => setCheckoutPlan(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmPlanUpgrade} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="font-semibold text-slate-700">Selected Tier: {checkoutPlan.id}</span>
                <span className="text-sm font-bold text-blue-600">{checkoutPlan.price}</span>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">Select Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="bKash / Nagad Instant Pay">bKash / Nagad Instant Pay</option>
                  <option value="Visa / Mastercard (SSLCOMMERZ / Stripe)">Visa / Mastercard (Stripe / SSLCOMMERZ)</option>
                  <option value="PayPal Wallet">PayPal Wallet</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg cursor-pointer"
              >
                Confirm Payment & Unlock {checkoutPlan.id} Features
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI Credit Pack Checkout Modal */}
      {creditPackModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Top-Up AI Copilot Credits</h3>
              <button onClick={() => setCreditPackModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmCreditPurchase} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-lg bg-purple-50 border border-purple-200 flex justify-between items-center">
                <span className="font-semibold text-purple-900">
                  +{selectedPack.credits.toLocaleString()} AI Credits Pack
                </span>
                <span className="text-sm font-bold text-purple-700">{selectedPack.price}</span>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">Select Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="bKash / Nagad Instant Pay">bKash / Nagad Instant Pay</option>
                  <option value="Visa / Mastercard">Visa / Mastercard</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg cursor-pointer"
              >
                Pay {selectedPack.price} & Add Credits Immediately
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}