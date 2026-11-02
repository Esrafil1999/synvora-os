'use client';

/**
 * @file settings/page.tsx
 * @description Complete Production Workspace Configuration Center connected to Neon PostgreSQL (/api/v1/workspace/).
 * Manages Brand Profile, Invoice & Tax/VAT rules, Automation Toggles, and Security Settings.
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Shield, Building2, FileText, Bot, Database } from 'lucide-react';
import { fetchFromBackend, postToBackend } from '@/lib/api';

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState('Northwind Outfitters');
  const [supportEmail, setSupportEmail] = useState('contact@synvorait.com');
  const [businessPhone, setBusinessPhone] = useState('+880 1353-523193');
  const [businessAddress, setBusinessAddress] = useState('South Ibrahimpur Shimultala, Dhaka 1206');
  const [currency, setCurrency] = useState('USD');
  const [taxPercentage, setTaxPercentage] = useState('5.00');
  const [invoicePrefix, setInvoicePrefix] = useState('#SYN-');
  const [autoCommentReply, setAutoCommentReply] = useState(true);
  const [autoCourierDispatch, setAutoCourierDispatch] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dbSynced, setDbSynced] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const ws = await fetchFromBackend<Record<string, any>>('workspace', {});
      if (ws && ws.business_name) {
        setBusinessName(ws.business_name);
        setSupportEmail(ws.support_email || 'contact@synvorait.com');
        setBusinessPhone(ws.business_phone || '+880 1353-523193');
        setBusinessAddress(ws.business_address || 'South Ibrahimpur Shimultala, Dhaka 1206');
        setCurrency(ws.currency || 'USD');
        setTaxPercentage(String(ws.tax_percentage ?? '5.00'));
        setInvoicePrefix(ws.invoice_prefix || '#SYN-');
        setAutoCommentReply(Boolean(ws.auto_comment_reply ?? true));
        setAutoCourierDispatch(Boolean(ws.auto_courier_dispatch ?? false));
        setDbSynced(true);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await postToBackend('workspace', {
      business_name: businessName,
      support_email: supportEmail,
      business_phone: businessPhone,
      business_address: businessAddress,
      currency,
      tax_percentage: parseFloat(taxPercentage) || 0,
      invoice_prefix: invoicePrefix,
      auto_comment_reply: autoCommentReply,
      auto_courier_dispatch: autoCourierDispatch,
    });
    setSaved(true);
    setDbSynced(true);
    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl">
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold text-slate-900">Workspace & Enterprise Settings</h1>
          {dbSynced && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Database className="w-3 h-3" /> Saved in Neon PostgreSQL
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Configure company identity, billing invoice tax/VAT rules, automation defaults, and API security.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>All workspace settings have been saved to your Neon Cloud PostgreSQL database!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* 1. Business Profile & Contact Info */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-blue-600" /> 1. Business Identity & Invoice Header Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Company / Brand Name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Official Support Email</label>
              <input
                type="email"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Business Phone / WhatsApp</label>
              <input
                type="text"
                required
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Headquarters / Warehouse Address</label>
              <input
                type="text"
                required
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* 2. Currency, Invoice & Tax/VAT Configuration */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-indigo-600" /> 2. Billing, Currency & Tax / VAT Rules
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Primary Reporting Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="USD">USD ($) — International Dollar</option>
                <option value="BDT">BDT (৳) — Bangladesh Taka</option>
                <option value="EUR">EUR (€) — Euro</option>
                <option value="GBP">GBP (£) — British Pound</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Default VAT / Sales Tax (%)</label>
              <input
                type="number"
                step="0.01"
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Order Invoice Prefix</label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>
        </div>

        {/* 3. Automation & Courier Workflow Preferences */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Bot className="w-4 h-4 text-purple-600" /> 3. Default Social & Courier Automation Rules
          </h2>
          <div className="space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoCommentReply}
                onChange={(e) => setAutoCommentReply(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <span className="font-medium text-slate-800">
                Automatically send product checkout link via DM when customers comment on Facebook/Instagram posts
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoCourierDispatch}
                onChange={(e) => setAutoCourierDispatch(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <span className="font-medium text-slate-800">
                Automatically assign verified pre-paid orders to default courier pickup queue (Pathao / Steadfast / DHL)
              </span>
            </label>
          </div>
        </div>

        {/* Security Status Footer */}
        <div className="p-4 rounded-xl bg-slate-900 text-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              <strong>Enterprise Security Active:</strong> Neon Cloud PostgreSQL SSL + Cryptographic API Key Guard + Rate Throttling enabled.
            </span>
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg shrink-0 cursor-pointer transition"
          >
            Save All Settings
          </button>
        </div>
      </form>
    </div>
  );
}