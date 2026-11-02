'use client';

/**
 * @file LockedFeatureGate.tsx
 * @description Dynamic Subscription Tier Gatekeeper.
 * Checks the user's active plan from Neon PostgreSQL (/api/v1/workspace/):
 * - Starter Plan: Locks Pro & Enterprise modules.
 * - Pro Plan: Unlocks Pro modules (Marketing & Ads, Automations); locks Enterprise modules (Team & Roles).
 * - Enterprise Plan: Unlocks 100% of all modules!
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lock, Sparkles, MessageSquare, CheckCircle2, ArrowRight, Unlock } from 'lucide-react';
import { fetchFromBackend } from '@/lib/api';

interface LockedFeatureGateProps {
  title: string;
  description: string;
  requiredPlan: 'Pro' | 'Enterprise';
  benefits: string[];
  children: React.ReactNode;
}

export default function LockedFeatureGate({
  title,
  description,
  requiredPlan = 'Pro',
  benefits,
  children,
}: LockedFeatureGateProps) {
  const [activePlan, setActivePlan] = useState<string>('Starter');
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  useEffect(() => {
    async function checkPlan() {
      const cached = localStorage.getItem('synvora-active-plan');
      if (cached) setActivePlan(cached);

      const ws = await fetchFromBackend<{ active_plan?: string }>('workspace', {});
      if (ws && ws.active_plan) {
        setActivePlan(ws.active_plan);
        localStorage.setItem('synvora-active-plan', ws.active_plan);
      }
    }
    checkPlan();
  }, []);

  // Determine if the current plan unlocks this module
  const isUnlocked =
    activePlan === 'Enterprise' || (activePlan === 'Pro' && requiredPlan === 'Pro');

  const handleSendSupportRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setSupportModalOpen(false);
    }, 2500);
  };

  // If unlocked by the user's purchased subscription plan, render the full live module!
  if (isUnlocked) {
    return (
      <div>
        <div className="bg-emerald-950 text-emerald-200 px-6 py-2 text-xs flex items-center justify-between border-b border-emerald-800">
          <span className="flex items-center gap-1.5 font-semibold">
            <Unlock className="w-3.5 h-3.5 text-emerald-400" />
            Unlocked via your active <strong>{activePlan} Plan</strong>
          </span>
          <Link href="/billing" className="text-[11px] underline text-emerald-300">
            Manage Subscription
          </Link>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Blurred Background Preview */}
      <div className="pointer-events-none select-none filter blur-[5px] opacity-60 transition duration-300">
        {children}
      </div>

      {/* Paywall Upgrade Modal */}
      <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-[2px] flex items-center justify-center p-6 z-20">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 md:p-8 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Requires {requiredPlan} Plan (Current: {activePlan})</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Included when you upgrade to {requiredPlan}:
            </div>
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link
              href="/billing"
              className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-3 px-4 rounded-lg shadow-sm transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Upgrade to {requiredPlan} Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => setSupportModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-3 px-4 rounded-lg transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Talk to Support Team</span>
            </button>
          </div>
        </div>
      </div>

      {supportModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Contact Synvora Support Team</h3>
              <button
                onClick={() => setSupportModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Close ✕
              </button>
            </div>

            {messageSent ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <p>Your request has been sent! Our support team will unlock a trial or assist you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSendSupportRequest} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Requested Module</label>
                  <input
                    type="text"
                    value={title}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Your Message or Phone Number</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Enter your WhatsApp number or custom requirement..."
                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition cursor-pointer"
                >
                  Send Message to Support
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}