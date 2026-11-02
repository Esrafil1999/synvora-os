'use client';

/**
 * @file marketing-ads/page.tsx
 * @description Meta, TikTok & Google Ad Campaign Manager.
 * Locked on Starter Plan; automatically unlocks when user upgrades to Pro or Enterprise Plan!
 */

import React, { useState } from 'react';
import LockedFeatureGate from '@/components/LockedFeatureGate';
import { Megaphone, Plus, CheckCircle2 } from 'lucide-react';

export default function MarketingAdsPage() {
  const [campaigns, setCampaigns] = useState([
    { id: 1, name: 'Autumn Jacket Conversion Boost', platform: 'Facebook & Instagram', budget: '$450', spend: '$310', roas: '5.4x', status: 'Active' },
    { id: 2, name: 'TikTok Viral Reel Promotion', platform: 'TikTok Ads', budget: '$200', spend: '$140', roas: '4.1x', status: 'Active' },
    { id: 3, name: 'Everyday Canvas Tote Retargeting', platform: 'Meta Ads', budget: '$150', spend: '$150', roas: '0.8x (Paused by AI)', status: 'Paused' },
  ]);

  return (
    <LockedFeatureGate
      title="Unlock Multi-Channel Ad Manager & Auto-Boost"
      description="Launch, manage, and optimize Facebook, Instagram, and TikTok ad campaigns directly from Synvora OS."
      requiredPlan="Pro"
      benefits={[
        'One-click post boosting across Facebook, Instagram, and TikTok simultaneously.',
        'Real-time Return on Ad Spend (ROAS) linked directly to your daily P&L report.',
        'Automated AI stop-loss rules that pause unprofitable ads automatically.',
      ]}
    >
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-blue-600" /> Multi-Channel Ad Campaign Manager
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage Meta, Instagram, and TikTok ad spend and track real-time ROAS.
            </p>
          </div>
          <button
            onClick={() =>
              setCampaigns([
                { id: Date.now(), name: 'New Flash Sale Boost Campaign', platform: 'Facebook & IG', budget: '$300', spend: '$0', roas: 'New', status: 'Active' },
                ...campaigns,
              ])
            }
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Launch New Ad Campaign
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Campaign Name</th>
                <th className="py-3 px-4">Network</th>
                <th className="py-3 px-4">Budget</th>
                <th className="py-3 px-4">Spend</th>
                <th className="py-3 px-4">ROAS</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                  <td className="py-3 px-4">{c.platform}</td>
                  <td className="py-3 px-4">{c.budget}</td>
                  <td className="py-3 px-4 font-semibold">{c.spend}</td>
                  <td className="py-3 px-4 font-bold text-emerald-600">{c.roas}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </LockedFeatureGate>
  );
}