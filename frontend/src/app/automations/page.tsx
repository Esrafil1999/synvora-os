"use client";

import React, { useState, useEffect } from "react";
import LockedFeatureGate from "@/components/LockedFeatureGate";
import { getProducts } from "@/lib/api";
import {
  Zap,
  Plus,
  ShoppingBag,
  Trash2,
  Bot,
  UserCheck,
} from "lucide-react";

interface AutomationRule {
  id: string;
  productOrCategory: string;
  channel: string;
  triggerType: string;
  keyword: string;
  replyMessage: string;
  attachOrderButton: boolean;
  aiCollectOrderInChat: boolean;
  humanFallback: boolean;
  active: boolean;
}

export default function AutomationsPage() {
  const [catalogProducts, setCatalogProducts] = useState<{ id: number; name: string }[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);

  const [productOrCategory, setProductOrCategory] = useState("");
  const [channel, setChannel] = useState("Facebook & Instagram");
  const [triggerType, setTriggerType] = useState("Post Comment -> Auto Inbox DM");
  const [keyword, setKeyword] = useState("PRICE, ORDER, PP");
  const [replyMessage, setReplyMessage] = useState(
    "Hello! Thank you for your interest. You can click the 'Order Now' button below to order directly, or reply with your Name, Phone Number, and Address and our AI will confirm your order!"
  );
  const [attachOrderButton, setAttachOrderButton] = useState(true);
  const [aiCollectOrderInChat, setAiCollectOrderInChat] = useState(true);
  const [humanFallback, setHumanFallback] = useState(true);

  useEffect(() => {
    async function load() {
      const prods = await getProducts();
      if (Array.isArray(prods)) {
        setCatalogProducts(prods);
      }
    }
    load();
  }, []);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productOrCategory.trim() || !replyMessage.trim()) return;
    const newRule: AutomationRule = {
      id: Date.now().toString(),
      productOrCategory: productOrCategory.trim(),
      channel,
      triggerType,
      keyword: keyword.trim() || "ANY",
      replyMessage: replyMessage.trim(),
      attachOrderButton,
      aiCollectOrderInChat,
      humanFallback,
      active: true,
    };
    setRules((prev) => [newRule, ...prev]);
    setProductOrCategory("");
  };

  return (
    <LockedFeatureGate
      requiredPlan="Pro"
      featureTitle="Social & Order Automations"
      featureDescription="Create custom Comment-to-DM rules, attach instant 'Order Now' buttons, and let AI collect customer orders automatically."
    >
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Custom Product &amp; Order Automations
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Type your own product or category name, set auto-reply rules, attach the direct &quot;Order Now&quot; button, or let AI take orders in chat.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddRule}
            className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
          >
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" /> Create Custom Automation Rule
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Product or Category Name (Type Your Own or Pick from Catalog) *
              </label>
              <input
                type="text"
                list="merchant-catalog-list"
                required
                value={productOrCategory}
                onChange={(e) => setProductOrCategory(e.target.value)}
                placeholder="Type your product or category name here..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
              <datalist id="merchant-catalog-list">
                {catalogProducts.map((p) => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Platform / Channel</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="Facebook & Instagram">Facebook &amp; Instagram</option>
                  <option value="WhatsApp Business">WhatsApp Business</option>
                  <option value="TikTok Business">TikTok Business</option>
                  <option value="All Connected Channels">All Connected Channels</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">When Customer Does</label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="Post Comment -> Auto Inbox DM">Comments on Post / Ad &rarr; Auto DM</option>
                  <option value="Ad Click -> Instant Greeting">Clicks Ad &rarr; Instant Order Greeting</option>
                  <option value="Direct Inbox Message">Sends Direct Inbox Message</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Trigger Keywords (Type Your Own Keywords)
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. PRICE, ORDER, DETAILS, BUY"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Automated Reply Message (Type Your Own Message) *
              </label>
              <textarea
                rows={3}
                required
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Write the message your customer will receive..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="font-extrabold text-slate-800">
                How Should the Customer Order from This Automation?
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={attachOrderButton}
                  onChange={(e) => setAttachOrderButton(e.target.checked)}
                />
                <span className="font-semibold text-slate-700">
                  1. Attach Direct &quot;Order Now&quot; Self-Checkout Button (/store) inside message
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiCollectOrderInChat}
                  onChange={(e) => setAiCollectOrderInChat(e.target.checked)}
                />
                <span className="font-semibold text-slate-700">
                  2. Enable AI Assistant to ask for Name, Phone &amp; Address and auto-create order in chat
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={humanFallback}
                  onChange={(e) => setHumanFallback(e.target.checked)}
                />
                <span className="font-semibold text-slate-700">
                  3. Automatically transfer to Human Agent if customer asks for human help
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-xs transition cursor-pointer"
            >
              Save Custom Automation Rule
            </button>
          </form>

          <div className="lg:col-span-6 space-y-5">
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">
                Live Customer Inbox Preview ({productOrCategory || "Your Product"})
              </div>
              <div className="bg-slate-800/90 rounded-2xl p-4 space-y-3 text-xs">
                <p className="text-slate-200 leading-relaxed">{replyMessage}</p>
                {attachOrderButton && (
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-extrabold text-xs">
                      <ShoppingBag className="w-3.5 h-3.5" /> Order Now (Self-Checkout Form)
                    </span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700 text-[11px] text-slate-300">
                  {aiCollectOrderInChat && (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                      <Bot className="w-3.5 h-3.5" /> AI Auto-Order Enabled
                    </span>
                  )}
                  {humanFallback && (
                    <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                      <UserCheck className="w-3.5 h-3.5" /> Human Agent Handoff Ready
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600" /> Your Active Automation Rules ({rules.length})
              </h3>
              {rules.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  No automation rules added yet. Type your own product name on the left and click &quot;Save Custom Automation Rule&quot;.
                </p>
              ) : (
                <div className="space-y-3">
                  {rules.map((r) => (
                    <div key={r.id} className="p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-sm text-slate-900">{r.productOrCategory}</span>
                          <span className="ml-2 text-xs text-slate-500">({r.channel})</span>
                        </div>
                        <button
                          onClick={() => setRules((prev) => prev.filter((item) => item.id !== r.id))}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-slate-600">{r.replyMessage}</div>
                      <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          Keywords: {r.keyword}
                        </span>
                        {r.attachOrderButton && (
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                            ✓ Includes &quot;Order Now&quot; Button
                          </span>
                        )}
                        {r.aiCollectOrderInChat && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                            ✓ AI Auto-Order
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </LockedFeatureGate>
  );
}