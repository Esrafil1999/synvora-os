'use client';

/**
 * @file automations/page.tsx
 * @description Social Comment-to-DM & Click Trigger Automations.
 * Locked on Starter Plan; automatically unlocks on Pro or Enterprise Plan!
 */

import React, { useState } from 'react';
import LockedFeatureGate from '@/components/LockedFeatureGate';
import { Zap, Plus } from 'lucide-react';

export default function AutomationsPage() {
  const [rules, setRules] = useState([
    { id: 1, trigger: 'User comments "PRICE" or "INFO" on Facebook/IG Post', action: 'Send Instant DM with Product Checkout Link', sent: 1420, active: true },
    { id: 2, trigger: 'User clicks on Promotional Banner / Bio Link', action: 'Send Welcome Discount Code (SYN15) in Messenger', sent: 640, active: true },
    { id: 3, trigger: 'New Follower on Instagram / Facebook Page', action: 'Send Automated Brand Greeting & Catalog Link', sent: 890, active: true },
  ]);

  return (
    <LockedFeatureGate
      title="Unlock Social Comment-to-DM & Click Automations"
      description="Automatically send instant direct messages with product checkout links whenever a user comments on, follows, or clicks your social posts."
      requiredPlan="Pro"
      benefits={[
        'Instant auto-DM when customers comment keywords like "PRICE" or "INFO" on Facebook/Instagram.',
        'Automated follow-up messages when a user clicks your promotional post or bio link.',
        'Abandoned cart recovery reminders via WhatsApp and Messenger.',
      ]}
    >
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-500" /> Social Comment-to-DM & Click Automations
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage automated Messenger and Instagram DM triggers when customers interact with your posts.
            </p>
          </div>
          <button
            onClick={() =>
              setRules([
                ...rules,
                { id: Date.now(), trigger: 'Customer comments "ORDER" on Video Reel', action: 'Send Instant One-Click COD Checkout Form', sent: 0, active: true },
              ])
            }
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Automation Rule
          </button>
        </div>

        <div className="space-y-3">
          {rules.map((r) => (
            <div key={r.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
              <div className="space-y-1">
                <div className="font-bold text-slate-900">WHEN: {r.trigger}</div>
                <div className="text-blue-600 font-semibold">THEN: {r.action}</div>
              </div>
              <div className="text-right space-y-1">
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                  ● Active ({r.sent} DMs Sent)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </LockedFeatureGate>
  );
}