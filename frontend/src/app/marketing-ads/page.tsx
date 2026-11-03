'use client';

/**
 * @file marketing-ads/page.tsx
 * @description Enterprise Multi-Channel Ad Campaign Manager & Post Booster.
 * Allows merchants in any industry to select a product, target audience, daily budget,
 * and AI Stop-Loss protection to run ads across Meta (FB/IG), TikTok, and Google.
 */

import React, { useState } from 'react';
import LockedFeatureGate from '@/components/LockedFeatureGate';
import {
  Megaphone,
  Plus,
  TrendingUp,
  DollarSign,
  Target,
  Power,
  AlertTriangle,
  CheckCircle2,
  X,
  Rocket,
} from 'lucide-react';

interface AdCampaign {
  id: number;
  name: string;
  industryCategory: string;
  promotedProduct: string;
  network: 'Facebook & Instagram' | 'TikTok Ads' | 'Google Shopping Ads';
  objective: 'Direct Inbox Messages (DM)' | 'Website Checkout Conversions' | 'Video Views & Reach';
  targetLocation: string;
  dailyBudget: number;
  totalSpend: number;
  attributedRevenue: number;
  ordersGenerated: number;
  aiStopLossEnabled: boolean;
  status: 'Active' | 'Paused';
}

const initialCampaigns: AdCampaign[] = [
  {
    id: 1,
    name: 'Bike LED Fog Light & Helmet Conversion Boost',
    industryCategory: 'Auto & Bike Parts',
    promotedProduct: 'Yamaha R15 V4 LED Fog Light Kit',
    network: 'Facebook & Instagram',
    objective: 'Direct Inbox Messages (DM)',
    targetLocation: 'Dhaka, Chattogram & Sylhet (Age 18-38)',
    dailyBudget: 25,
    totalSpend: 310,
    attributedRevenue: 1674,
    ordersGenerated: 37,
    aiStopLossEnabled: true,
    status: 'Active',
  },
  {
    id: 2,
    name: 'Orthopedic Running Shoes Viral Video Ad',
    industryCategory: 'Footwear & Shoes',
    promotedProduct: 'Orthopedic Running Sneaker',
    network: 'TikTok Ads',
    objective: 'Website Checkout Conversions',
    targetLocation: 'Nationwide Bangladesh & Global',
    dailyBudget: 20,
    totalSpend: 180,
    attributedRevenue: 920,
    ordersGenerated: 16,
    aiStopLossEnabled: true,
    status: 'Active',
  },
  {
    id: 3,
    name: 'Digital BP Monitor Healthcare Awareness Ad',
    industryCategory: 'Pharmacy & Medical',
    promotedProduct: 'Omron Digital Blood Pressure Monitor',
    network: 'Facebook & Instagram',
    objective: 'Direct Inbox Messages (DM)',
    targetLocation: 'All Metro Cities (Age 30-65)',
    dailyBudget: 15,
    totalSpend: 120,
    attributedRevenue: 660,
    ordersGenerated: 12,
    aiStopLossEnabled: true,
    status: 'Active',
  },
  {
    id: 4,
    name: 'Everyday Canvas Tote Retargeting',
    industryCategory: 'Fashion & Apparel',
    promotedProduct: 'Everyday Canvas Tote',
    network: 'Facebook & Instagram',
    objective: 'Website Checkout Conversions',
    targetLocation: 'United States & UK',
    dailyBudget: 30,
    totalSpend: 150,
    attributedRevenue: 110,
    ordersGenerated: 2,
    aiStopLossEnabled: true,
    status: 'Paused',
  },
];

export default function MarketingAdsPage() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(initialCampaigns);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Campaign Builder Wizard State
  const [name, setName] = useState('');
  const [industryCategory, setIndustryCategory] = useState('Auto & Bike Parts');
  const [promotedProduct, setPromotedProduct] = useState('');
  const [network, setNetwork] = useState<AdCampaign['network']>('Facebook & Instagram');
  const [objective, setObjective] = useState<AdCampaign['objective']>('Direct Inbox Messages (DM)');
  const [targetLocation, setTargetLocation] = useState('Dhaka & All Bangladesh (Age 18-45)');
  const [dailyBudget, setDailyBudget] = useState('20');
  const [aiStopLoss, setAiStopLoss] = useState(true);

  const handleLaunchCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    const budgetNum = parseFloat(dailyBudget) || 20;
    const newCamp: AdCampaign = {
      id: Date.now(),
      name,
      industryCategory,
      promotedProduct,
      network,
      objective,
      targetLocation,
      dailyBudget: budgetNum,
      totalSpend: budgetNum,
      attributedRevenue: budgetNum * 4.5,
      ordersGenerated: Math.max(1, Math.round(budgetNum / 5)),
      aiStopLossEnabled: aiStopLoss,
      status: 'Active',
    };
    setCampaigns([newCamp, ...campaigns]);
    setWizardOpen(false);
    setName('');
    setPromotedProduct('');
  };

  const toggleStatus = (id: number) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: c.status === 'Active' ? 'Paused' : 'Active' } : c
      )
    );
  };

  const totalSpend = campaigns.reduce((s, c) => s + c.totalSpend, 0);
  const totalRev = campaigns.reduce((s, c) => s + c.attributedRevenue, 0);
  const totalOrders = campaigns.reduce((s, c) => s + c.ordersGenerated, 0);
  const avgRoas = totalSpend > 0 ? (totalRev / totalSpend).toFixed(2) : '0.00';

  return (
    <LockedFeatureGate
      title="Unlock Multi-Channel Ad Campaign Manager & Auto-Boost"
      description="Launch, manage, and optimize Facebook, Instagram, TikTok, and Google ad campaigns for any product directly from Synvora OS."
      requiredPlan="Pro"
      benefits={[
        'Step-by-step Ad Campaign Builder Wizard for any product category.',
        'Real-time Return on Ad Spend (ROAS) & Cost Per Order tracking.',
        'Automated AI Stop-Loss protection that pauses losing ads automatically.',
      ]}
    >
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-blue-600" /> Multi-Channel Ad Campaign Manager & Booster
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Run targeted ads on Facebook, Instagram, TikTok & Google for any product with AI Stop-Loss protection.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setWizardOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-sm cursor-pointer shrink-0"
          >
            <Rocket className="w-4 h-4" /> + Create & Boost New Ad Campaign
          </button>
        </div>

        {/* 4 Ad Performance KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-500 font-semibold">Total Ad Spend</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">${totalSpend.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-1">Across Meta & TikTok Ads</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-500 font-semibold">Ad-Attributed Revenue</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">${totalRev.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-1">Direct sales from ads</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-500 font-semibold">Return on Ad Spend (ROAS)</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{avgRoas}x</div>
            <div className="text-[11px] text-slate-400 mt-1">${avgRoas} earned per $1 spent</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-500 font-semibold">Total Ad Orders Generated</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalOrders} Orders</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Avg Cost/Order: ${(totalSpend / Math.max(1, totalOrders)).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Active & Paused Ad Campaigns</h2>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold">
              ● AI Stop-Loss Protection Enabled
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Campaign & Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Network & Goal</th>
                  <th className="py-3 px-4">Target Audience</th>
                  <th className="py-3 px-4">Daily Budget</th>
                  <th className="py-3 px-4">Spend / Rev</th>
                  <th className="py-3 px-4">ROAS</th>
                  <th className="py-3 px-4 text-right">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((c) => {
                  const roas = c.totalSpend > 0 ? c.attributedRevenue / c.totalSpend : 0;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-500">Product: {c.promotedProduct}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[11px]">
                          {c.industryCategory}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{c.network}</div>
                        <div className="text-[11px] text-slate-400">{c.objective}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{c.targetLocation}</td>
                      <td className="py-3.5 px-4 font-semibold">${c.dailyBudget}/day</td>
                      <td className="py-3.5 px-4">
                        <div className="text-rose-600 font-medium">Spend: ${c.totalSpend}</div>
                        <div className="text-emerald-600 font-bold">Sales: ${c.attributedRevenue}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold ${
                            roas >= 2 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {roas.toFixed(1)}x ({c.ordersGenerated} orders)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => toggleStatus(c.id)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold text-[11px] cursor-pointer ${
                            c.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{c.status}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Step-by-Step Ad Campaign Builder Wizard Modal */}
        {wizardOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Launch New Multi-Channel Ad Campaign
                </h3>
                <button onClick={() => setWizardOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleLaunchCampaign} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Campaign Title</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Eid Footwear Sale Boost / Bike Parts Promo"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Business / Product Category</label>
                    <select
                      value={industryCategory}
                      onChange={(e) => setIndustryCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Auto & Bike Parts">Auto & Bike Parts</option>
                      <option value="Footwear & Shoes">Footwear & Shoes</option>
                      <option value="Pharmacy & Medical">Pharmacy & Medical</option>
                      <option value="Fashion & Apparel">Fashion & Apparel</option>
                      <option value="Electronics & Gadgets">Electronics & Gadgets</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Product to Promote</label>
                    <input
                      type="text"
                      required
                      value={promotedProduct}
                      onChange={(e) => setPromotedProduct(e.target.value)}
                      placeholder="Enter Product Name / SKU"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Ad Platform</label>
                    <select
                      value={network}
                      onChange={(e) => setNetwork(e.target.value as AdCampaign['network'])}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Facebook & Instagram">Facebook & Instagram (Meta Ads)</option>
                      <option value="TikTok Ads">TikTok Business Ads</option>
                      <option value="Google Shopping Ads">Google Shopping & Search Ads</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Campaign Goal</label>
                    <select
                      value={objective}
                      onChange={(e) => setObjective(e.target.value as AdCampaign['objective'])}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Direct Inbox Messages (DM)">Direct Inbox Messages (DM Orders)</option>
                      <option value="Website Checkout Conversions">Website Checkout Conversions</option>
                      <option value="Video Views & Reach">Video Views & Brand Reach</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Target Location & Age</label>
                    <input
                      type="text"
                      required
                      value={targetLocation}
                      onChange={(e) => setTargetLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Daily Budget ($)</label>
                    <input
                      type="number"
                      min="5"
                      required
                      value={dailyBudget}
                      onChange={(e) => setDailyBudget(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiStopLoss}
                    onChange={(e) => setAiStopLoss(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <span className="text-amber-900 font-medium">
                    <strong>AI Stop-Loss Protection:</strong> Automatically pause this campaign if ad spend exceeds profit margin without orders.
                  </span>
                </label>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setWizardOpen(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                  >
                    Launch Ad Campaign Now
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </LockedFeatureGate>
  );
}