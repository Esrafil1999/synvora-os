'use client';

/**
 * @file unified-inbox/page.tsx
 * @description Omnichannel customer messaging inbox combining Facebook Messenger,
 * Instagram DMs, TikTok comments, and WhatsApp inquiries into one unified console.
 */

import React, { useState } from 'react';
import { Send, Bot, CheckCircle2, ShoppingBag } from 'lucide-react';

export default function UnifiedInboxPage() {
  const [reply, setReply] = useState('');
  const [chatLog, setChatLog] = useState([
    { sender: 'customer', text: 'Hi! I just clicked on your Trail Runner Jacket post. Is Size M available for Cash on Delivery in Dhaka?' },
    { sender: 'bot', text: '⚡ [Auto-DM Triggered]: Hello Tanvir! Yes, Trail Runner Jacket (Size M) is in stock for $89.00. We offer 24h Pathao Courier Cash on Delivery across Dhaka!' },
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setChatLog([...chatLog, { sender: 'agent', text: reply }]);
    setReply('');
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900">Unified Social & Customer Inbox</h1>
        <p className="text-xs text-slate-500 mt-1">
          Respond to Facebook comments, Messenger DMs, Instagram inquiries, and create instant orders from chat.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-120">
        {/* Conversation List (4 Cols) */}
        <div className="lg:col-span-4 border-r border-slate-200 divide-y divide-slate-100 overflow-y-auto">
          <div className="p-4 bg-blue-50/60 cursor-pointer">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-900">Tanvir Ahmed</span>
              <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded">Facebook DM</span>
            </div>
            <p className="text-xs text-slate-600 truncate mt-1">Is Size M available for Cash on Delivery?</p>
          </div>
          <div className="p-4 hover:bg-slate-50 cursor-pointer">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-900">Sadia Islam</span>
              <span className="text-[10px] bg-pink-600 text-white px-1.5 py-0.5 rounded">Instagram</span>
            </div>
            <p className="text-xs text-slate-500 truncate mt-1">Commented &quot;PRICE&quot; on your Reel</p>
          </div>
        </div>

        {/* Active Chat Thread (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between p-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-900">Tanvir Ahmed • Facebook Messenger</div>
              <div className="text-[11px] text-emerald-600 flex items-center gap-1">
                <Bot className="w-3.5 h-3.5" /> Auto-Reply Bot Active
              </div>
            </div>
            <button className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" /> Create Order in 1-Click
            </button>
          </div>

          <div className="flex-1 py-4 overflow-y-auto space-y-3 text-xs">
            {chatLog.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl max-w-[80%] ${
                  m.sender === 'customer'
                    ? 'bg-slate-100 text-slate-800'
                    : m.sender === 'bot'
                    ? 'bg-purple-50 border border-purple-200 text-purple-900 ml-auto'
                    : 'bg-blue-600 text-white ml-auto'
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="pt-3 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply or send a payment link..."
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}