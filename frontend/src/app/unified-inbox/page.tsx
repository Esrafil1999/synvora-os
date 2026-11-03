"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  getProducts,
  getOrders,
  getCustomers,
  createCustomer,
  createOrder,
  getWorkspaceConfig,
  updateWorkspaceConfig,
} from "@/lib/api";
import { useCurrency, printIsolatedOrderSlip } from "@/lib/currency";
import {
  MessageSquare,
  Send,
  Bot,
  UserCheck,
  Search,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Phone,
  MapPin,
  Mail,
  Heart,
  Share2,
  MessageCircle,
  Plus,
  Printer,
  Clock,
  Tag,
  UserPlus,
} from "lucide-react";

interface ChatMessageItem {
  id: string;
  sender: "customer" | "ai" | "human" | "system";
  text: string;
  time: string;
}

interface InboxConversation {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  channel: "Facebook" | "Instagram" | "WhatsApp" | "TikTok";
  triggerType: "Direct Message" | "Post Comment" | "Liked Post" | "Shared Post";
  mode: "ai" | "human";
  status: "open" | "closed";
  hasPurchased: boolean;
  ordersCount: number;
  totalSpent: number;
  lastOrderId?: string;
  messages: ChatMessageItem[];
  updatedAt: string;
}

export default function UnifiedInboxPage() {
  const { formatMoney, symbol } = useCurrency();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [products, setProducts] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([]);
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>("");

  // Left Filter Rail State (Matches Reference Image 1)
  const [folderFilter, setFolderFilter] = useState<
    "all" | "ai" | "human" | "leads_no_purchase" | "buyers" | "social_triggers"
  >("all");
  const [channelFilter, setChannelFilter] = useState<
    "All" | "Facebook" | "Instagram" | "WhatsApp" | "TikTok"
  >("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Center Composer State (Matches Reference Image 2)
  const [composerTab, setComposerTab] = useState<"chat" | "promo" | "simulate_customer">("chat");
  const [messageInput, setMessageInput] = useState("");

  // Right Panel: Instant Order POS Builder State (Connected to Live Products DB!)
  const [posProductId, setPosProductId] = useState<string>("");
  const [posSize, setPosSize] = useState<string>("L");
  const [posColor, setPosColor] = useState<string>("");
  const [posQty, setPosQty] = useState<string>("1");
  const [posPayment, setPosPayment] = useState<string>("COD");
  const [orderBanner, setOrderBanner] = useState<string>("");

  // New Incoming Lead / Social Trigger Modal
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simName, setSimName] = useState("");
  const [simPhone, setSimPhone] = useState("");
  const [simAddress, setSimAddress] = useState("Dhaka");
  const [simChannel, setSimChannel] = useState<"Facebook" | "Instagram" | "WhatsApp" | "TikTok">("Facebook");
  const [simTrigger, setSimTrigger] = useState<
    "Direct Message" | "Post Comment" | "Liked Post" | "Shared Post"
  >("Direct Message");
  const [simInitialText, setSimInitialText] = useState("");

  const loadInboxAndDatabase = async () => {
    const [prodData, ordData, custData, wsData] = await Promise.all([
      getProducts(),
      getOrders(),
      getCustomers(),
      getWorkspaceConfig(),
    ]);

    const prodList = Array.isArray(prodData) ? prodData : [];
    const ordList = Array.isArray(ordData) ? ordData : [];
    const custList = Array.isArray(custData) ? custData : [];

    setProducts(prodList);
    setOrders(ordList);

    if (prodList.length > 0 && !posProductId) {
      const first = prodList[0];
      setPosProductId(String(first.id));
      const sz = (first.available_sizes || "L").split(",")[0].trim();
      setPosSize(sz || "L");
      const cl = (first.available_colors || "Standard").split(",")[0].trim();
      setPosColor(cl || "Standard");
    }

    // Build conversations from saved workspace threads + database customers & orders
    const savedThreads: InboxConversation[] = Array.isArray(wsData?.inbox_threads)
      ? wsData.inbox_threads
      : [];

    const mergedMap = new Map<string, InboxConversation>();
    for (const t of savedThreads) {
      mergedMap.set(t.id, t);
    }

    // Ensure every customer from database is represented in Unified Inbox
    for (const c of custList) {
      const phoneKey = String(c.phone && c.phone !== "N/A" ? c.phone : c.name).toLowerCase().trim();
      if (!phoneKey) continue;
      const convId = `conv_${phoneKey.replace(/[^a-z0-9]/g, "")}`;

      const custOrders = ordList.filter(
        (o) =>
          o.status !== "Cancelled" &&
          (String(o.customer_phone || "").toLowerCase() === phoneKey ||
            String(o.customer || "").toLowerCase() === String(c.name || "").toLowerCase())
      );
      const ordCount = Math.max(Number(c.orders_count || 0), custOrders.length);
      const totalSpent = Math.max(
        Number(c.total_spent || 0),
        custOrders.reduce((s, o) => s + Number(o.amount || 0), 0)
      );
      const lastOrd = custOrders[0];

      const chRaw = String(c.channel || "Facebook");
      const chNormalized: "Facebook" | "Instagram" | "WhatsApp" | "TikTok" = chRaw
        .toLowerCase()
        .includes("instagram")
        ? "Instagram"
        : chRaw.toLowerCase().includes("whatsapp")
        ? "WhatsApp"
        : chRaw.toLowerCase().includes("tiktok")
        ? "TikTok"
        : "Facebook";

      if (!mergedMap.has(convId)) {
        const sampleProdName = prodList[0]?.name || "our collection";
        mergedMap.set(convId, {
          id: convId,
          customerName: String(c.name || "Customer"),
          customerPhone: String(c.phone || "N/A"),
          customerEmail: String(c.email || ""),
          customerAddress: String(c.address || "Dhaka"),
          channel: chNormalized,
          triggerType: "Direct Message",
          mode: "ai",
          status: "open",
          hasPurchased: ordCount > 0,
          ordersCount: ordCount,
          totalSpent,
          lastOrderId: lastOrd?.order_id,
          updatedAt: "Recent",
          messages: [
            {
              id: "m1",
              sender: "customer",
              text: `Hi! I want to know more about ${sampleProdName}.`,
              time: "10:30 AM",
            },
            {
              id: "m2",
              sender: "ai",
              text: `Hello ${c.name}! Welcome to our store. ${sampleProdName} is available in stock! You can order directly here or click "Contact Human Agent" if you want to speak with our team.`,
              time: "10:30 AM",
            },
          ],
        });
      } else {
        const existing = mergedMap.get(convId)!;
        existing.hasPurchased = ordCount > 0;
        existing.ordersCount = ordCount;
        existing.totalSpent = totalSpent;
        if (lastOrd?.order_id) existing.lastOrderId = lastOrd.order_id;
      }
    }

    const finalConversations = Array.from(mergedMap.values());
    setConversations(finalConversations);
    if (finalConversations.length > 0 && !selectedConvId) {
      setSelectedConvId(finalConversations[0].id);
    }
  };

  useEffect(() => {
    loadInboxAndDatabase();
  }, []);

  const persistConversations = async (nextList: InboxConversation[]) => {
    setConversations(nextList);
    await updateWorkspaceConfig({ inbox_threads: nextList });
  };

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === selectedConvId) || conversations[0] || null,
    [conversations, selectedConvId]
  );

  const selectedPosProduct = useMemo(
    () => products.find((p) => String(p.id) === posProductId) || null,
    [products, posProductId]
  );

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (channelFilter !== "All" && c.channel !== channelFilter) return false;
      if (folderFilter === "ai" && c.mode !== "ai") return false;
      if (folderFilter === "human" && c.mode !== "human") return false;
      if (folderFilter === "leads_no_purchase" && c.hasPurchased) return false;
      if (folderFilter === "buyers" && !c.hasPurchased) return false;
      if (
        folderFilter === "social_triggers" &&
        c.triggerType === "Direct Message"
      ) {
        return false;
      }

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        c.customerName.toLowerCase().includes(q) ||
        c.customerPhone.toLowerCase().includes(q) ||
        c.channel.toLowerCase().includes(q)
      );
    });
  }, [conversations, channelFilter, folderFilter, searchQuery]);

  // Generate automated AI reply using live products from database
  const generateSmartAiReply = (buyerText: string, conv: InboxConversation): { reply: string; switchToHuman: boolean } => {
    const lower = buyerText.toLowerCase();
    if (
      lower.includes("human") ||
      lower.includes("agent") ||
      lower.includes("manager") ||
      lower.includes("call") ||
      lower.includes("মানুষ") ||
      lower.includes("কথা বলতে চাই")
    ) {
      return {
        reply: `Connecting you to a Human Sales Agent right now! One of our team members has been assigned to your chat.`,
        switchToHuman: true,
      };
    }

    const matchedProd = products.find(
      (p) =>
        lower.includes(String(p.name).toLowerCase()) ||
        lower.includes(String(p.category).toLowerCase()) ||
        lower.includes(String(p.sku).toLowerCase())
    );

    if (matchedProd) {
      return {
        reply: `Yes, ${conv.customerName}! "${matchedProd.name}" (Code: ${matchedProd.sku}) is in stock at ${formatMoney(
          matchedProd.effective_price
        )}. Available Sizes: [${matchedProd.available_sizes || "Standard"}], Colors: [${
          matchedProd.available_colors || "Standard"
        }]. Reply with your Size, Color & Address to order, or type "Human Agent" to speak with our staff!`,
        switchToHuman: false,
      };
    }

    const catalogList =
      products.length > 0
        ? products
            .slice(0, 3)
            .map((p) => `${p.name} (${formatMoney(p.effective_price)})`)
            .join(", ")
        : "our latest products";

    return {
      reply: `Thank you for messaging us, ${conv.customerName}! Currently available in stock: ${catalogList}. Special promotional offer is active! Tell me which product & size you want, or click "Contact Human Agent" anytime to talk to our representative.`,
      switchToHuman: false,
    };
  };

  // Handle sending message from center composer (as Human Agent, Promo Broadcast, or Simulated Customer)
  const handleSendComposerMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !messageInput.trim()) return;
    const text = messageInput.trim();
    setMessageInput("");
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (composerTab === "simulate_customer") {
      // Simulate the customer messaging in from Facebook/IG/WhatsApp/TikTok
      const customerMsg: ChatMessageItem = {
        id: `m_${Date.now()}`,
        sender: "customer",
        text,
        time: nowTime,
      };

      const updatedMessages = [...activeConv.messages, customerMsg];
      let nextMode = activeConv.mode;

      if (activeConv.mode === "ai") {
        const aiResult = generateSmartAiReply(text, activeConv);
        if (aiResult.switchToHuman) {
          nextMode = "human";
          updatedMessages.push({
            id: `sys_${Date.now() + 1}`,
            sender: "system",
            text: "Customer requested a Human Agent. Chat transferred to Human Support Queue.",
            time: nowTime,
          });
        }
        updatedMessages.push({
          id: `ai_${Date.now() + 2}`,
          sender: "ai",
          text: aiResult.reply,
          time: nowTime,
        });
      }

      const nextList = conversations.map((c) =>
        c.id === activeConv.id
          ? { ...c, mode: nextMode, messages: updatedMessages, updatedAt: "Just Now" }
          : c
      );
      await persistConversations(nextList);
      return;
    }

    // Sent by Human Agent or Promotional Offer
    const agentMsg: ChatMessageItem = {
      id: `m_${Date.now()}`,
      sender: "human",
      text: composerTab === "promo" ? `🎉 [SPECIAL OFFER]: ${text}` : text,
      time: nowTime,
    };

    const nextList = conversations.map((c) =>
      c.id === activeConv.id
        ? { ...c, messages: [...c.messages, agentMsg], updatedAt: "Just Now" }
        : c
    );
    await persistConversations(nextList);
  };

  // Simulate New Incoming Lead (Direct Message, Post Comment, Like, or Share) -> Auto-saves to Customer CRM!
  const handleCreateSimulatedLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simName.trim() || !simPhone.trim()) return;

    // 1. Save Lead to PostgreSQL Customer table with orders_count = 0 (Messaged / No Purchase Yet!)
    await createCustomer({
      name: simName.trim(),
      phone: simPhone.trim(),
      address: simAddress.trim() || "Dhaka",
      channel: `${simChannel} (${simTrigger})`,
      orders_count: 0,
      total_spent: 0,
    });

    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const firstProd = products[0];
    const prodHighlight = firstProd
      ? `${firstProd.name} (${formatMoney(firstProd.effective_price)})`
      : "our new arrival collection";

    const actionText =
      simTrigger === "Liked Post"
        ? `❤️ Liked your ${simChannel} post`
        : simTrigger === "Shared Post"
        ? `🔁 Shared your ${simChannel} post`
        : simTrigger === "Post Comment"
        ? `💬 Commented on your ${simChannel} post: "${simInitialText || "Price please?"}"`
        : simInitialText || "Hello! I saw your page and want details.";

    const autoPromoReply =
      simTrigger === "Liked Post" || simTrigger === "Shared Post"
        ? `Hello ${simName.trim()}! Thank you for ${
            simTrigger === "Liked Post" ? "liking" : "sharing"
          } our post on ${simChannel}! 🎉 Here is an exclusive promotional offer on ${prodHighlight}. Reply here to order or type "Human Agent" to chat with our team!`
        : `Hello ${simName.trim()}! Thank you for reaching out on ${simChannel}. ${prodHighlight} is available in stock! Reply with your Size & Color to order automatically, or click "Contact Human Agent" to speak with our representative.`;

    const newConv: InboxConversation = {
      id: `conv_${Date.now()}`,
      customerName: simName.trim(),
      customerPhone: simPhone.trim(),
      customerEmail: "",
      customerAddress: simAddress.trim() || "Dhaka",
      channel: simChannel,
      triggerType: simTrigger,
      mode: "ai",
      status: "open",
      hasPurchased: false,
      ordersCount: 0,
      totalSpent: 0,
      updatedAt: "Just Now",
      messages: [
        {
          id: `m1_${Date.now()}`,
          sender: "customer",
          text: actionText,
          time: nowTime,
        },
        {
          id: `m2_${Date.now()}`,
          sender: "ai",
          text: autoPromoReply,
          time: nowTime,
        },
      ],
    };

    const nextList = [newConv, ...conversations];
    await persistConversations(nextList);
    setSelectedConvId(newConv.id);
    setSimName("");
    setSimPhone("");
    setSimInitialText("");
    setShowSimulateModal(false);
  };

  // Instant 1-Click POS Order Creation from Right Panel -> Syncs to Orders, Deducts Stock & Marks Buyer in CRM!
  const handleCreateInChatOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !selectedPosProduct) return;

    const qty = Math.max(1, parseInt(posQty, 10) || 1);
    const created = await createOrder({
      product_id: selectedPosProduct.id,
      product_name: selectedPosProduct.name,
      product_sku: selectedPosProduct.sku,
      selected_size: posSize,
      selected_color: posColor || "Standard",
      quantity: qty,
      customer: activeConv.customerName,
      customer_phone: activeConv.customerPhone,
      delivery_address: activeConv.customerAddress,
      channel: `${activeConv.channel} Inbox`,
      order_source_type: activeConv.mode === "human" ? "Human Agent Inbox POS" : "AI Inbox Auto-Order",
      payment: posPayment,
      status: "Confirmed",
    });

    if (created) {
      const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const confirmMsg: ChatMessageItem = {
        id: `ord_${Date.now()}`,
        sender: "system",
        text: `✓ Order Confirmed (${created.order_id})! ${qty}x ${selectedPosProduct.name} (Size: ${posSize}, Color: ${
          posColor || "Standard"
        }) — Total: ${formatMoney(created.amount)} (${posPayment}). Inventory deducted & synced to CRM!`,
        time: nowTime,
      };

      const nextList = conversations.map((c) =>
        c.id === activeConv.id
          ? {
              ...c,
              hasPurchased: true,
              ordersCount: c.ordersCount + 1,
              totalSpent: c.totalSpent + Number(created.amount || 0),
              lastOrderId: created.order_id,
              messages: [...c.messages, confirmMsg],
              updatedAt: "Just Now",
            }
          : c
      );

      await persistConversations(nextList);
      setOrderBanner(`Order ${created.order_id} saved to database & stock deducted!`);
      setTimeout(() => setOrderBanner(""), 4000);
      loadInboxAndDatabase();
    }
  };

  const counts = useMemo(() => {
    return {
      all: conversations.length,
      ai: conversations.filter((c) => c.mode === "ai").length,
      human: conversations.filter((c) => c.mode === "human").length,
      noPurchase: conversations.filter((c) => !c.hasPurchased).length,
      buyers: conversations.filter((c) => c.hasPurchased).length,
      fb: conversations.filter((c) => c.channel === "Facebook").length,
      ig: conversations.filter((c) => c.channel === "Instagram").length,
      wa: conversations.filter((c) => c.channel === "WhatsApp").length,
      tt: conversations.filter((c) => c.channel === "TikTok").length,
    };
  }, [conversations]);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Sub-Header Bar */}
      <div className="h-14 shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-extrabold text-slate-900">
            Unified Omnichannel Inbox &amp; AI Auto-DM Center
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Synced with Customers &amp; Orders DB
          </span>
        </div>

        <button
          onClick={() => setShowSimulateModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-xs transition cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" /> + New Incoming DM / Comment / Like / Share
        </button>
      </div>

      {/* Main 4-Column Inbox Workspace (Matches Reference Images 1 & 2) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* COLUMN 1: Left Folder & Channel Rail (Matches Reference Image 1) */}
        <div className="w-52 shrink-0 bg-white border-r border-slate-200 p-3.5 flex flex-col justify-between overflow-y-auto text-xs">
          <div className="space-y-5">
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                Inbox Views
              </div>
              {[
                { id: "all", label: "All Conversations", count: counts.all },
                { id: "ai", label: "AI Auto-Handling", count: counts.ai },
                { id: "human", label: "Human Agent Queue", count: counts.human },
                { id: "leads_no_purchase", label: "Messaged (No Purchase)", count: counts.noPurchase },
                { id: "buyers", label: "Purchased Buyers", count: counts.buyers },
                { id: "social_triggers", label: "Like / Comment / Share", count: conversations.filter((c) => c.triggerType !== "Direct Message").length },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFolderFilter(f.id as typeof folderFilter)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl font-bold transition cursor-pointer ${
                    folderFilter === f.id
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="truncate">{f.label}</span>
                  <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-slate-100 text-slate-700 font-extrabold">
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Channels Filter (Facebook, Instagram, WhatsApp, TikTok) */}
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                Channels
              </div>
              {(
                [
                  { id: "All", label: "All Channels", dot: "bg-slate-400", cnt: counts.all },
                  { id: "Facebook", label: "Facebook Messenger", dot: "bg-blue-600", cnt: counts.fb },
                  { id: "Instagram", label: "Instagram DM", dot: "bg-pink-600", cnt: counts.ig },
                  { id: "WhatsApp", label: "WhatsApp Business", dot: "bg-emerald-500", cnt: counts.wa },
                  { id: "TikTok", label: "TikTok Inbox", dot: "bg-slate-900", cnt: counts.tt },
                ] as const
              ).map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setChannelFilter(ch.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl font-bold transition cursor-pointer ${
                    channelFilter === ch.id
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${ch.dot}`} />
                    <span className="truncate">{ch.label}</span>
                  </span>
                  <span className="text-[10px] opacity-80">{ch.cnt}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 space-y-1">
            <div className="text-[11px] font-extrabold text-indigo-950 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Auto-Lead Sync
            </div>
            <p className="text-[10px] text-indigo-800 leading-relaxed">
              Every person who messages, likes, comments, or shares is saved in your Customers CRM database automatically.
            </p>
          </div>
        </div>

        {/* COLUMN 2: Messages / Conversation List (Matches Reference Image 1 & 2) */}
        <div className="w-72 shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-slate-900">Messages</span>
              <span className="text-[11px] font-bold text-slate-400">
                {filteredConversations.length} threads
              </span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search message or buyer..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No conversations in this filter. Click &quot;+ New Incoming DM&quot; above to test!
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const active = activeConv?.id === conv.id;
                const lastMsg = conv.messages[conv.messages.length - 1];
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`p-3.5 cursor-pointer transition ${
                      active ? "bg-indigo-50/70 border-l-4 border-indigo-600" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                          {conv.customerName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs text-slate-900 truncate">
                            {conv.customerName}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                                conv.channel === "Facebook"
                                  ? "bg-blue-50 text-blue-700"
                                  : conv.channel === "Instagram"
                                  ? "bg-pink-50 text-pink-700"
                                  : conv.channel === "WhatsApp"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-200 text-slate-800"
                              }`}
                            >
                              {conv.channel}
                            </span>
                            <span className="text-[9px] font-semibold text-slate-500">
                              • {conv.triggerType}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{conv.updatedAt}</span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-2">
                      {lastMsg ? lastMsg.text : "No messages yet"}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          conv.hasPurchased
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {conv.hasPurchased
                          ? `✓ Ordered (${conv.ordersCount})`
                          : "Messaged Only (No Purchase)"}
                      </span>

                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          conv.mode === "human"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-indigo-100 text-indigo-800"
                        }`}
                      >
                        {conv.mode === "human" ? "Human Agent" : "AI Bot"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 3: Center Chat Stream & AI / Human Controller (Matches Reference Image 2) */}
        <div className="flex-1 flex flex-col bg-slate-50/60 min-w-0 overflow-hidden">
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="h-14 shrink-0 bg-white border-b border-slate-200 px-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="font-extrabold text-sm text-slate-900 truncate">
                    {activeConv.customerName}
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-700">
                    {activeConv.channel} • {activeConv.triggerType}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Switch between AI Automation vs Human Agent */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextMode = activeConv.mode === "ai" ? "human" : "ai";
                      const sysNote: ChatMessageItem = {
                        id: `sys_${Date.now()}`,
                        sender: "system",
                        text:
                          nextMode === "human"
                            ? "Human Agent took over this conversation."
                            : "Switched back to AI Automated Assistant.",
                        time: new Date().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        }),
                      };
                      const nextList = conversations.map((c) =>
                        c.id === activeConv.id
                          ? { ...c, mode: nextMode, messages: [...c.messages, sysNote] }
                          : c
                      );
                      persistConversations(nextList);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                      activeConv.mode === "human"
                        ? "bg-amber-500 text-white"
                        : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    }`}
                  >
                    {activeConv.mode === "human" ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" /> Human Agent Active (Switch to AI)
                      </>
                    ) : (
                      <>
                        <Bot className="w-3.5 h-3.5" /> AI Auto-Bot Active (Switch to Human)
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Chat Messages Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
                {activeConv.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.sender === "customer"
                        ? "items-start"
                        : m.sender === "system"
                        ? "items-center"
                        : "items-end"
                    }`}
                  >
                    {m.sender === "system" ? (
                      <div className="px-3.5 py-1.5 rounded-full bg-slate-200/80 text-slate-700 text-[11px] font-bold">
                        {m.text}
                      </div>
                    ) : (
                      <div className="max-w-[78%] space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 px-1">
                          {m.sender === "customer" ? (
                            <span>{activeConv.customerName}</span>
                          ) : m.sender === "ai" ? (
                            <span className="text-indigo-600 flex items-center gap-1">
                              <Bot className="w-3 h-3" /> AI Automation Bot
                            </span>
                          ) : (
                            <span className="text-emerald-700 flex items-center gap-1">
                              <UserCheck className="w-3 h-3" /> Human Sales Agent
                            </span>
                          )}
                          <span>• {m.time}</span>
                        </div>
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs ${
                            m.sender === "customer"
                              ? "bg-white border border-slate-200 text-slate-800"
                              : m.sender === "ai"
                              ? "bg-indigo-600 text-white"
                              : "bg-emerald-600 text-white"
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom Chat Composer (Matches Reference Image 2 — No ugly scrollbar!) */}
              <div className="shrink-0 bg-white border-t border-slate-200 p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-1 text-xs font-extrabold">
                    <button
                      type="button"
                      onClick={() => setComposerTab("chat")}
                      className={`pb-1 transition cursor-pointer ${
                        composerTab === "chat"
                          ? "text-emerald-600 border-b-2 border-emerald-600"
                          : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      Reply as Human Agent
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposerTab("promo")}
                      className={`pb-1 transition cursor-pointer ${
                        composerTab === "promo"
                          ? "text-indigo-600 border-b-2 border-indigo-600"
                          : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      Send Promotional Offer
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposerTab("simulate_customer")}
                      className={`pb-1 transition cursor-pointer ${
                        composerTab === "simulate_customer"
                          ? "text-orange-600 border-b-2 border-orange-600"
                          : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      Test as Customer (See AI Auto-Reply)
                    </button>
                  </div>

                  {/* Clean Wrapped Smart Reply Pills — Zero Horizontal Scrollbar */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Yes, available in stock!",
                      "Please share your Size, Color & Address.",
                      "40% OFF New Arrival Offer is live!",
                    ].map((quick) => (
                      <button
                        key={quick}
                        type="button"
                        onClick={() => setMessageInput(quick)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition cursor-pointer"
                      >
                        {quick}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSendComposerMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={
                      composerTab === "simulate_customer"
                        ? "Type a message as the customer (e.g. 'Price?' or 'I need a human agent')..."
                        : composerTab === "promo"
                        ? "Write a promotional offer message to send to this customer..."
                        : "Type your reply as a Human Agent..."
                    }
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Select a conversation on the left
            </div>
          )}
        </div>

        {/* COLUMN 4: Right Customer Information, Last Order & Instant POS Panel (Matches Reference Image 2) */}
        {activeConv && (
          <div className="w-80 shrink-0 bg-white border-l border-slate-200 p-4 overflow-y-auto space-y-4 text-xs">
            {/* Customer Profile Summary */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                {activeConv.customerName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-sm text-slate-900 truncate">
                  {activeConv.customerName}
                </div>
                <div className="text-[11px] text-indigo-600 font-semibold">
                  {activeConv.channel} ({activeConv.triggerType})
                </div>
              </div>
            </div>

            {/* Customer Information Box (Matches Reference Image 2) */}
            <div className="p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <div className="font-extrabold text-slate-900">Customer Information</div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{activeConv.customerPhone}</span>
              </div>
              {activeConv.customerEmail && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{activeConv.customerEmail}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{activeConv.customerAddress}</span>
              </div>
              <div className="pt-1">
                <span
                  className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                    activeConv.hasPurchased
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  {activeConv.hasPurchased
                    ? `✓ Verified Buyer (${activeConv.ordersCount} Orders • ${formatMoney(activeConv.totalSpent)})`
                    : "Messaged Lead — 0 Purchases in CRM"}
                </span>
              </div>
            </div>

            {/* Instant Chat-to-Order POS Builder (Connected to Real Database Products!) */}
            <form
              onSubmit={handleCreateInChatOrder}
              className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" /> Instant Order Builder
                </span>
                <span className="text-[10px] font-bold text-emerald-600">DB Synced</span>
              </div>

              {orderBanner && (
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  {orderBanner}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Select Product from Your Catalog
                </label>
                <select
                  value={posProductId}
                  onChange={(e) => {
                    setPosProductId(e.target.value);
                    const found = products.find((p) => String(p.id) === e.target.value);
                    if (found) {
                      setPosSize((found.available_sizes || "L").split(",")[0].trim());
                      setPosColor((found.available_colors || "Standard").split(",")[0].trim());
                    }
                  }}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name} ({p.sku}) — {formatMoney(p.effective_price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Size</label>
                  <input
                    type="text"
                    value={posSize}
                    onChange={(e) => setPosSize(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Color</label>
                  <input
                    type="text"
                    value={posColor}
                    onChange={(e) => setPosColor(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={posQty}
                    onChange={(e) => setPosQty(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white font-extrabold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                  Payment Method
                </label>
                <select
                  value={posPayment}
                  onChange={(e) => setPosPayment(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                >
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="Paid (Mobile Wallet)">Paid (bKash / Nagad / Wallet)</option>
                  <option value="Paid (Online Bank)">Paid (Bank / Card)</option>
                </select>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-600">Total Bill:</span>
                <span className="text-sm font-extrabold text-indigo-700">
                  {formatMoney(
                    Number(selectedPosProduct?.effective_price || 0) *
                      Math.max(1, parseInt(posQty, 10) || 1)
                  )}
                </span>
              </div>

              <button
                type="submit"
                disabled={!selectedPosProduct}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition cursor-pointer"
              >
                Confirm Order &amp; Sync to DB
              </button>
            </form>

            {/* Customer Summary Footer (Matches Reference Image 2) */}
            <div className="p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 font-bold">Lifetime Value</span>
              <span className="text-sm font-extrabold text-slate-900">
                {formatMoney(activeConv.totalSpent)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Simulate Incoming Message / Comment / Like / Share Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900">
                Simulate Incoming Social Message / Like / Comment / Share
              </h2>
              <button
                onClick={() => setShowSimulateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSimulatedLead} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Channel *</label>
                  <select
                    value={simChannel}
                    onChange={(e) => setSimChannel(e.target.value as typeof simChannel)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
                  >
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="TikTok">TikTok</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Interaction Type *</label>
                  <select
                    value={simTrigger}
                    onChange={(e) => setSimTrigger(e.target.value as typeof simTrigger)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
                  >
                    <option value="Direct Message">Direct Message (DM)</option>
                    <option value="Post Comment">Commented on Post</option>
                    <option value="Liked Post">Liked Post (Auto-Promo)</option>
                    <option value="Shared Post">Shared Post (Auto-Promo)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Person Name *</label>
                  <input
                    type="text"
                    required
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    placeholder="e.g. Sabbir Hossain"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone / Handle *</label>
                  <input
                    type="text"
                    required
                    value={simPhone}
                    onChange={(e) => setSimPhone(e.target.value)}
                    placeholder="e.g. 017XXXXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Message or Comment Text (Optional)
                </label>
                <input
                  type="text"
                  value={simInitialText}
                  onChange={(e) => setSimInitialText(e.target.value)}
                  placeholder="e.g. Price koto? / I want to order"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                This person will be automatically added to your <strong>Customers CRM</strong> under{" "}
                <strong>&quot;Messaged Only (No Purchase)&quot;</strong> and receive an automated promotional reply!
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-extrabold cursor-pointer"
                >
                  Trigger Automation &amp; Save to CRM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}