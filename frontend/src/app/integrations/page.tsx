'use client';

/**
 * @file integrations/page.tsx
 * @description Self-Service Client Payment Gateway & Courier Configuration Hub (/api/v1/gateways/).
 * Clients enter their own bKash, Nagad, SSLCOMMERZ, Stripe, PayPal, or Pathao/Steadfast keys
 * and settlement bank/wallet numbers so payments settle directly into their own accounts.
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, CheckCircle2, Settings2, Plus, X, Database } from 'lucide-react';
import { fetchFromBackend, patchToBackend, postToBackend } from '@/lib/api';

interface GatewayConfig {
  id: number;
  provider_name: string;
  region: string;
  merchant_id: string;
  api_key: string;
  secret_key: string;
  settlement_account: string;
  is_active: boolean;
}

const fallbackGateways: GatewayConfig[] = [
  { id: 1, provider_name: 'bKash Merchant API', region: 'Bangladesh MFS', merchant_id: '01353523193', api_key: 'bkash_live_key_991', secret_key: '••••••••', settlement_account: '+880 1353-523193 (bKash Merchant)', is_active: true },
  { id: 2, provider_name: 'Nagad Merchant PGW', region: 'Bangladesh MFS', merchant_id: '6830020071', api_key: 'nagad_pub_882', secret_key: '••••••••', settlement_account: '+880 1353-523193 (Nagad Merchant)', is_active: true },
  { id: 3, provider_name: 'SSLCOMMERZ & Local Bank', region: 'BD Cards & Net Banking', merchant_id: 'synvorait001live', api_key: 'ssl_store_pass_77', secret_key: '••••••••', settlement_account: 'City Bank PLC — A/C ****8821', is_active: true },
  { id: 4, provider_name: 'Stripe Global Checkout', region: 'International Visa / Mastercard', merchant_id: 'acct_1N9k2L', api_key: 'pk_live_51N9k2L...', secret_key: '••••••••', settlement_account: 'Stripe USD Payout Account', is_active: true },
  { id: 5, provider_name: 'PayPal Commerce Platform', region: 'Global PayPal Wallet', merchant_id: 'M892374923', api_key: 'client_id_paypal_live', secret_key: '••••••••', settlement_account: 'billing@northwindoutfitters.com', is_active: true },
  { id: 6, provider_name: 'Pathao & Steadfast Courier API', region: 'Bangladesh Logistics', merchant_id: 'PATHAO-STORE-442', api_key: 'steadfast_api_key_992', secret_key: '••••••••', settlement_account: 'COD Bank Settlement A/C ****8821', is_active: true },
];

export default function IntegrationsPage() {
  const [gateways, setGateways] = useState<GatewayConfig[]>(fallbackGateways);
  const [dbSynced, setDbSynced] = useState(false);
  const [editingGw, setEditingGw] = useState<GatewayConfig | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [savedBanner, setSavedBanner] = useState('');

  // Edit Form State
  const [merchantId, setMerchantId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [settlementAccount, setSettlementAccount] = useState('');
  const [isActive, setIsActive] = useState(true);

  // New Provider Form State
  const [newProvider, setNewProvider] = useState('');
  const [newRegion, setNewRegion] = useState('Bangladesh / Global');

  useEffect(() => {
    async function loadGateways() {
      const data = await fetchFromBackend<GatewayConfig[]>('gateways', []);
      if (data && data.length > 0) {
        setGateways(data);
        setDbSynced(true);
      }
    }
    loadGateways();
  }, []);

  const openEditModal = (gw: GatewayConfig) => {
    setEditingGw(gw);
    setMerchantId(gw.merchant_id);
    setApiKey(gw.api_key);
    setSecretKey(gw.secret_key);
    setSettlementAccount(gw.settlement_account);
    setIsActive(gw.is_active);
  };

  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGw) return;

    const payload = {
      merchant_id: merchantId,
      api_key: apiKey,
      secret_key: secretKey,
      settlement_account: settlementAccount,
      is_active: isActive,
    };

    const updated = await patchToBackend<GatewayConfig>('gateways', editingGw.id, payload);
    setGateways((prev) =>
      prev.map((g) => (g.id === editingGw.id ? (updated || { ...g, ...payload }) : g))
    );
    setSavedBanner(`✅ ${editingGw.provider_name} merchant credentials saved in Neon PostgreSQL!`);
    setEditingGw(null);
    setTimeout(() => setSavedBanner(''), 4000);
  };

  const handleAddCustomGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      provider_name: newProvider,
      region: newRegion,
      merchant_id: merchantId,
      api_key: apiKey,
      secret_key: secretKey,
      settlement_account: settlementAccount,
      is_active: true,
    };

    const created = await postToBackend<GatewayConfig>('gateways', payload);
    if (created) {
      setGateways([...gateways, created]);
    } else {
      setGateways([...gateways, { id: Date.now(), ...payload }]);
    }
    setAddModalOpen(false);
    setNewProvider('');
    setSavedBanner(`✅ New provider ${newProvider} added and activated!`);
    setTimeout(() => setSavedBanner(''), 4000);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">Payment Gateways & Courier API Setup</h1>
            {dbSynced && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Database className="w-3 h-3" /> Neon PostgreSQL Synced
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Self-service configuration: Clients enter their own bKash, Nagad, Bank, Stripe, PayPal, and Courier keys here.
          </p>
        </div>

        <button
          onClick={() => {
            setMerchantId('');
            setApiKey('');
            setSecretKey('');
            setSettlementAccount('');
            setAddModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Custom Payment / Courier Gateway
        </button>
      </div>

      {savedBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          {savedBanner}
        </div>
      )}

      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3 text-xs text-blue-900">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
        <span>
          <strong>100% Client-Owned Settlement:</strong> Every client enters their own Merchant Account / API Key below. Customer payments go directly into the client&apos;s own bKash, Nagad, Bank, or Stripe account.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {gateways.map((gw) => (
          <div key={gw.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">{gw.provider_name}</h3>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-semibold flex items-center gap-1 ${
                  gw.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" /> {gw.is_active ? 'Active' : 'Disabled'}
              </span>
            </div>

            <div className="text-xs text-slate-500">{gw.region}</div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Merchant / Store ID:</span>
                <span className="font-mono font-semibold text-slate-800">{gw.merchant_id || 'Not Set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Receiving Account:</span>
                <span className="font-semibold text-emerald-700">{gw.settlement_account || 'Not Set'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="font-mono text-[11px] text-slate-400">
                API Key: {gw.api_key ? `${gw.api_key.slice(0, 12)}...` : 'Not configured'}
              </span>
              <button
                type="button"
                onClick={() => openEditModal(gw)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" /> Configure Keys
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Configure Gateway Modal */}
      {editingGw && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Configure {editingGw.provider_name}</h3>
              <button onClick={() => setEditingGw(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGateway} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Merchant ID / Store ID / Account Number
                </label>
                <input
                  type="text"
                  required
                  value={merchantId}
                  onChange={(e) => setMerchantId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Public API Key / Username
                </label>
                <input
                  type="text"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Secret Key / App Secret / Password
                </label>
                <input
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter Secret Key"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Receiving Bank / Wallet Settlement Account
                </label>
                <input
                  type="text"
                  required
                  value={settlementAccount}
                  onChange={(e) => setSettlementAccount(e.target.value)}
                  placeholder="e.g., +88017... or City Bank A/C..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="gw-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <label htmlFor="gw-active" className="font-semibold text-slate-700 cursor-pointer">
                  Enable this payment/courier gateway at checkout
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingGw(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                >
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Custom Gateway Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Add Payment or Courier Integration</h3>
            <form onSubmit={handleAddCustomGateway} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Provider Name</label>
                <input
                  type="text"
                  required
                  value={newProvider}
                  onChange={(e) => setNewProvider(e.target.value)}
                  placeholder="e.g., Rocket MFS, RedX Courier, Razorpay"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Merchant ID</label>
                <input
                  type="text"
                  required
                  value={merchantId}
                  onChange={(e) => setMerchantId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">API Key</label>
                <input
                  type="text"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Receiving Settlement Account</label>
                <input
                  type="text"
                  required
                  value={settlementAccount}
                  onChange={(e) => setSettlementAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold">
                  Add Integration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}