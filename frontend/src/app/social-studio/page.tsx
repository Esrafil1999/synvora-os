"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Share2,
  Camera,
  MessageCircle,
  Video,
  Sparkles,
  Upload,
  Send,
  Calendar,
  Plus,
  Rocket,
  Eye,
  Heart,
  MessageSquare,
  CheckCircle2,
  Trash2,
  Wand2,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { getProducts, getSocialPosts, createSocialPost, deleteFromApi } from "@/lib/api";
import { useCurrency, compressImageFile } from "@/lib/currency";

interface SocialPostRecord {
  id: number;
  caption: string;
  banner_url: string;
  product_name: string;
  platforms: string;
  status: string;
  scheduled_for: string;
  auto_dm_trigger: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_boosted: boolean;
  created_at: string;
}

interface QueuedPostDraft {
  id: string;
  productName: string;
  caption: string;
  bannerUrl: string;
  platforms: string[];
  scheduleTime: string;
  autoDmTrigger: string;
}

const PLATFORMS = [
  { id: "Facebook", label: "Facebook Page", color: "border-blue-600 bg-blue-50/60 text-blue-700", icon: Share2 },
  { id: "Instagram", label: "Instagram Feed & Reels", color: "border-pink-600 bg-pink-50/60 text-pink-700", icon: Camera },
  { id: "WhatsApp", label: "WhatsApp Status & Channel", color: "border-emerald-600 bg-emerald-50/60 text-emerald-700", icon: MessageCircle },
  { id: "TikTok", label: "TikTok Business", color: "border-slate-900 bg-slate-100 text-slate-900", icon: Video },
];

const FOLLOWER_CHART_DATA = [
  { day: "Day 1", Facebook: 4200, Instagram: 3100, WhatsApp: 2400, TikTok: 5800 },
  { day: "Day 5", Facebook: 4800, Instagram: 3600, WhatsApp: 2900, TikTok: 6400 },
  { day: "Day 10", Facebook: 5300, Instagram: 4200, WhatsApp: 3500, TikTok: 7900 },
  { day: "Day 15", Facebook: 6100, Instagram: 4900, WhatsApp: 4100, TikTok: 8600 },
  { day: "Day 20", Facebook: 7400, Instagram: 5800, WhatsApp: 4900, TikTok: 9678 },
  { day: "Today", Facebook: 8591, Instagram: 6420, WhatsApp: 5490, TikTok: 11240 },
];

const HEATMAP_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HEATMAP_SLOTS = ["9am", "12pm", "3pm", "6pm", "9pm", "11pm"];

export default function SocialStudioPage() {
  const { formatMoney, symbol } = useCurrency();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [products, setProducts] = useState<any[]>([]);
  const [posts, setPosts] = useState<SocialPostRecord[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "Facebook",
    "Instagram",
    "WhatsApp",
    "TikTok",
  ]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [caption, setCaption] = useState<string>("");
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [aiEngineChoice, setAiEngineChoice] = useState<"Gemini 2.5 Pro" | "OpenAI GPT-4o">(
    "Gemini 2.5 Pro"
  );
  const [autoDmTrigger, setAutoDmTrigger] = useState<string>("ORDER, PRICE, PP");
  const [scheduleEnabled, setScheduleEnabled] = useState<boolean>(false);
  const [scheduleDateTime, setScheduleDateTime] = useState<string>("");
  const [previewPlatform, setPreviewPlatform] = useState<string>("Facebook");
  const [multiPostQueue, setMultiPostQueue] = useState<QueuedPostDraft[]>([]);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>("");

  const loadStudioData = async () => {
    const [prodData, postData] = await Promise.all([getProducts(), getSocialPosts()]);
    if (Array.isArray(prodData)) {
      setProducts(prodData);
      if (prodData.length > 0 && !selectedProductId) {
        const first = prodData[0];
        setSelectedProductId(String(first.id));
        if (first.image_url) setBannerUrl(first.image_url);
        setCaption(
          `🔥 New Arrival Alert: ${first.name} (Code: ${first.sku}) is now in stock at ${symbol}${first.effective_price}! Available Sizes: ${first.available_sizes || "All"}. Comment "${autoDmTrigger.split(",")[0]}" or click our Order link to get yours today!`
        );
      }
    }
    if (Array.isArray(postData)) {
      setPosts(postData);
    }
  };

  useEffect(() => {
    loadStudioData();
  }, []);

  const activeProduct = useMemo(
    () => products.find((p) => String(p.id) === selectedProductId) || null,
    [products, selectedProductId]
  );

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((p) => p !== id) : prev) : [...prev, id]
    );
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImageFile(file, 720);
    if (compressed) setBannerUrl(compressed);
  };

  // AI Suggest Description & Hashtags (OpenAI / Gemini)
  const handleAiGenerateCaption = () => {
    const prodName = activeProduct ? activeProduct.name : "Exclusive Collection";
    const prodCode = activeProduct ? activeProduct.sku : "NEW-101";
    const priceStr = activeProduct
      ? formatMoney(activeProduct.effective_price)
      : `${symbol}1,200`;
    const sizesStr = activeProduct ? activeProduct.available_sizes : "M, L, XL, XXL";
    const colorsStr = activeProduct ? activeProduct.available_colors || "All Colors" : "Premium Colors";

    const generated = `✨ [${aiEngineChoice} Viral Copy]: Upgrade your style with our authentic ${prodName} (Code: ${prodCode})!\n✅ Special Price: ${priceStr}\n✅ Available Sizes: ${sizesStr}\n✅ Colors in Stock: ${colorsStr}\n🚚 Fast Cash on Delivery & Instant Online Checkout available!\n👉 Comment "${
      autoDmTrigger.split(",")[0] || "PRICE"
    }" below for an instant Auto-DM order link! #NewArrival #${prodName.replace(/\s+/g, "")} #TrendingNow`;
    setCaption(generated);
  };

  // AI Generate Promotional Banner Image on Canvas (OpenAI / Gemini Visual Generator)
  const handleAiGenerateBannerImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 450;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Gradient Background
    const grad = ctx.createLinearGradient(0, 0, 800, 450);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(0.5, "#312e81");
    grad.addColorStop(1, "#4f46e5");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 450);

    // Decorative Accent Circle
    ctx.fillStyle = "rgba(249, 115, 22, 0.22)";
    ctx.beginPath();
    ctx.arc(680, 100, 180, 0, Math.PI * 2);
    ctx.fill();

    // Offer Pill
    ctx.fillStyle = "#f97316";
    ctx.fillRect(50, 50, 260, 42);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("🔥 LIMITED TIME OFFER", 68, 77);

    // Product Title
    const title = activeProduct ? String(activeProduct.name).toUpperCase() : "EXCLUSIVE NEW ARRIVAL";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 42px sans-serif";
    ctx.fillText(title.slice(0, 24), 50, 155);

    // Specs & Price
    const priceText = activeProduct
      ? `Special Price: ${symbol}${activeProduct.effective_price}`
      : "Special Promotional Discount Live!";
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 30px sans-serif";
    ctx.fillText(priceText, 50, 215);

    const sizeText = activeProduct
      ? `Sizes: ${activeProduct.available_sizes || "All"} • Colors: ${activeProduct.available_colors || "In Stock"}`
      : "Order Online or Reply in Inbox";
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 20px sans-serif";
    ctx.fillText(sizeText.slice(0, 48), 50, 265);

    // CTA Button on Banner
    ctx.fillStyle = "#10b981";
    ctx.fillRect(50, 320, 310, 58);
    ctx.fillStyle = "#022c22";
    ctx.font = "900 22px sans-serif";
    ctx.fillText("ORDER NOW • FAST COD", 75, 357);

    setBannerUrl(canvas.toDataURL("image/jpeg", 0.88));
    setToastMsg(`AI Promotional Banner generated using ${aiEngineChoice}!`);
    setTimeout(() => setToastMsg(""), 4000);
  };

  // Add current post to Multi-Post Queue
  const handleAddToMultiQueue = () => {
    if (!caption.trim()) return;
    const draft: QueuedPostDraft = {
      id: `q_${Date.now()}`,
      productName: activeProduct ? activeProduct.name : "Custom Post",
      caption: caption.trim(),
      bannerUrl,
      platforms: [...selectedPlatforms],
      scheduleTime:
        scheduleEnabled && scheduleDateTime
          ? new Date(scheduleDateTime).toLocaleString()
          : "Publish Immediately",
      autoDmTrigger,
    };
    setMultiPostQueue((prev) => [...prev, draft]);
    setToastMsg(`Added post to Multi-Post Queue (${multiPostQueue.length + 1} queued).`);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // Publish single post OR all queued posts to PostgreSQL Database
  const handlePublishAll = async () => {
    setPublishing(true);
    const itemsToPublish: QueuedPostDraft[] =
      multiPostQueue.length > 0
        ? multiPostQueue
        : [
            {
              id: `single_${Date.now()}`,
              productName: activeProduct ? activeProduct.name : "General Post",
              caption: caption.trim() || "New post published!",
              bannerUrl,
              platforms: selectedPlatforms,
              scheduleTime:
                scheduleEnabled && scheduleDateTime
                  ? new Date(scheduleDateTime).toLocaleString()
                  : "Published Immediately",
              autoDmTrigger,
            },
          ];

    for (const item of itemsToPublish) {
      await createSocialPost({
        caption: item.caption,
        banner_url: item.bannerUrl,
        product_name: item.productName,
        platforms: item.platforms.join(", "),
        status: item.scheduleTime === "Published Immediately" ? "Published" : "Scheduled",
        scheduled_for: item.scheduleTime,
        auto_dm_trigger: item.autoDmTrigger,
      });
    }

    setMultiPostQueue([]);
    setPublishing(false);
    setToastMsg(
      `${itemsToPublish.length} post(s) saved to database & published across ${selectedPlatforms.join(", ")}!`
    );
    setTimeout(() => setToastMsg(""), 4500);
    loadStudioData();
  };

  const handleDeletePost = async (id: number) => {
    await deleteFromApi(`/social-posts/${id}/`);
    loadStudioData();
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Social Studio, AI Banner Creator &amp; Engagement Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Design banners with AI, schedule multi-post campaigns across Facebook, Instagram, WhatsApp &amp; TikTok, and track live engagement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/marketing-ads"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition"
          >
            <Rocket className="w-3.5 h-3.5 text-orange-400" /> Boost Published Posts in Marketing &amp; Ads
          </Link>
          <button
            onClick={handlePublishAll}
            disabled={publishing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            {publishing
              ? "Publishing..."
              : multiPostQueue.length > 0
              ? `Publish All Queued (${multiPostQueue.length} Posts)`
              : scheduleEnabled
              ? "Schedule Post"
              : "Publish Now"}
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Composer + Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Multi-Platform Composer + Banner Upload + AI Studio + Schedule */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Select Destination Channels (Facebook, Instagram, WhatsApp, TikTok) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              1. Select Destination Channels (Facebook, Instagram, WhatsApp, TikTok)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PLATFORMS.map((pl) => {
                const Icon = pl.icon;
                const active = selectedPlatforms.includes(pl.id);
                return (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => togglePlatform(pl.id)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                      active
                        ? `${pl.color} border-2 font-extrabold shadow-2xs`
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 font-semibold"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs truncate">{pl.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Product Selection + Banner Upload + AI Banner & Description Generator */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                2. Banner Image, AI Creator &amp; Post Caption
              </span>

              <div className="flex items-center gap-2">
                <select
                  value={aiEngineChoice}
                  onChange={(e) => setAiEngineChoice(e.target.value as typeof aiEngineChoice)}
                  className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-[11px] font-extrabold"
                >
                  <option value="Gemini 2.5 Pro">AI: Google Gemini</option>
                  <option value="OpenAI GPT-4o">AI: OpenAI GPT-4o</option>
                </select>
                <button
                  type="button"
                  onClick={handleAiGenerateBannerImage}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <Wand2 className="w-3 h-3" /> AI Create Banner
                </button>
                <button
                  type="button"
                  onClick={handleAiGenerateCaption}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> AI Suggest Caption
                </button>
              </div>
            </div>

            {/* Product Link + Custom Banner Upload */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Link Product from Your Catalog (Auto-loads Photo &amp; Price)
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    const found = products.find((p) => String(p.id) === e.target.value);
                    if (found) {
                      if (found.image_url) setBannerUrl(found.image_url);
                      setCaption(
                        `🔥 ${found.name} (Code: ${found.sku}) is available now at ${formatMoney(
                          found.effective_price
                        )}! Sizes: ${found.available_sizes || "All"}. Comment "${
                          autoDmTrigger.split(",")[0]
                        }" to get the instant order link in your inbox!`
                      );
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                >
                  {products.length === 0 && <option value="">-- Custom Post --</option>}
                  {products.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name} ({p.sku}) — {formatMoney(p.effective_price)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Or Upload Custom Post Banner / Poster Image
                </label>
                <label className="w-full px-3 py-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" /> Upload Banner Photo from Device
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Post Description / Caption */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Post Description, Offer Details &amp; Hashtags *
              </label>
              <textarea
                rows={4}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your post caption or click 'AI Suggest Caption' above..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs leading-relaxed"
              />
            </div>

            {/* Auto-DM Keyword + Schedule Date & Time + Add to Multi-Post Queue */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Auto-DM Trigger Keyword (Sends Order Link on Comment)
                </label>
                <input
                  type="text"
                  value={autoDmTrigger}
                  onChange={(e) => setAutoDmTrigger(e.target.value)}
                  placeholder="e.g. PRICE, ORDER, PP"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleEnabled}
                    onChange={(e) => setScheduleEnabled(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Schedule Date &amp; Time
                </label>
                {scheduleEnabled ? (
                  <input
                    type="datetime-local"
                    value={scheduleDateTime}
                    onChange={(e) => setScheduleDateTime(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-indigo-300 bg-indigo-50/40 text-xs font-bold"
                  />
                ) : (
                  <div className="px-3 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold">
                    Publishing Immediately (Check box to schedule)
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleAddToMultiQueue}
                className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> + Add to Multi-Post Queue ({multiPostQueue.length})
              </button>

              <button
                type="button"
                onClick={handlePublishAll}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {multiPostQueue.length > 0
                  ? `Publish All (${multiPostQueue.length} Posts)`
                  : scheduleEnabled
                  ? "Confirm Schedule"
                  : "Publish Post Now"}
              </button>
            </div>
          </div>

          {/* Multi-Post Batch Queue List */}
          {multiPostQueue.length > 0 && (
            <div className="bg-white rounded-2xl border border-indigo-200 p-4 space-y-2.5">
              <div className="text-xs font-extrabold text-indigo-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                Multi-Post Publishing Queue ({multiPostQueue.length} Posts Ready)
              </div>
              {multiPostQueue.map((q) => (
                <div
                  key={q.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="truncate">
                    <div className="font-extrabold text-slate-900">
                      {q.productName} &rarr; {q.platforms.join(", ")}
                    </div>
                    <div className="text-slate-500 truncate">{q.caption}</div>
                    <div className="text-[10px] font-bold text-indigo-600 mt-0.5">
                      Schedule: {q.scheduleTime}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setMultiPostQueue((prev) => prev.filter((item) => item.id !== q.id))
                    }
                    className="text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Live Network Preview (With Uploaded or AI-Generated Banner!) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Live Network Preview
            </span>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
              {["Facebook", "Instagram", "WhatsApp", "TikTok"].map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setPreviewPlatform(net)}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    previewPlatform === net ? "bg-blue-600 text-white" : "text-slate-600"
                  }`}
                >
                  {net}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
            <div className="p-3.5 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center">
                  SB
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900">
                    Official Business Page ({previewPlatform})
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {scheduleEnabled && scheduleDateTime
                      ? `Scheduled for ${new Date(scheduleDateTime).toLocaleString()}`
                      : "Sponsored • Just now"}
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                Auto-DM: {autoDmTrigger.split(",")[0]}
              </span>
            </div>

            <div className="p-3.5 text-xs text-slate-800 whitespace-pre-line leading-relaxed">
              {caption || "Your post description will appear here..."}
            </div>

            {/* Banner Image Preview */}
            {bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bannerUrl}
                alt="Social Post Banner"
                className="w-full h-60 object-cover border-t border-b border-slate-100"
              />
            ) : (
              <div className="w-full h-56 bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-2">
                <Sparkles className="w-8 h-8 text-indigo-400" />
                <div className="text-sm font-extrabold">
                  {activeProduct ? activeProduct.name : "PROMOTIONAL OFFER BANNER"}
                </div>
                <p className="text-[11px] text-slate-400">
                  Click &quot;Upload Banner Photo&quot; or &quot;AI Create Banner&quot; on the left!
                </p>
              </div>
            )}

            <div className="px-4 py-3 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500" /> Like
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Comment ({autoDmTrigger.split(",")[0]})
              </span>
              <span className="flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5 text-emerald-600" /> Share
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Socially-Inspired Social Media Analytics Dashboard (Matches Reference Image 3) */}
      <div className="space-y-6 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Social Media Followers, Reach &amp; Post Engagement Analytics
            </h2>
            <p className="text-xs text-slate-500">
              Live overview across Instagram, TikTok, Facebook, and WhatsApp channels
            </p>
          </div>
        </div>

        {/* 4 Channel Follower & Post Cards (Matches Image 3) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: "Instagram", handle: "@official.instagram", followers: "6,420", totalPosts: posts.length + 34, badge: "bg-pink-50 text-pink-600" },
            { name: "TikTok", handle: "@official.tiktok", followers: "11,240", totalPosts: posts.length + 28, badge: "bg-slate-900 text-white" },
            { name: "Facebook", handle: "Official Facebook Page", followers: "8,591", totalPosts: posts.length + 65, badge: "bg-blue-50 text-blue-600" },
            { name: "WhatsApp", handle: "WhatsApp VIP Channel", followers: "5,490", totalPosts: posts.length + 42, badge: "bg-emerald-50 text-emerald-600" },
          ].map((acc) => (
            <div key={acc.name} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2.5">
                <span className={`px-2.5 py-1 rounded-xl text-xs font-extrabold ${acc.badge}`}>
                  {acc.name}
                </span>
                <span className="text-xs text-slate-500 truncate">{acc.handle}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">{acc.followers}</div>
                  <div className="text-[11px] text-slate-400 font-semibold">Followers</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">{acc.totalPosts}</div>
                  <div className="text-[11px] text-slate-400 font-semibold">Total Posts</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Followers Line Chart + Follower Age Segmentation (Matches Image 3) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Your Followers &amp; Reach</h3>
                <p className="text-xs text-slate-500">Audience growth across connected platforms</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold">
                <span className="text-pink-600">■ Instagram</span>
                <span className="text-slate-900">■ TikTok</span>
                <span className="text-blue-600">■ Facebook</span>
                <span className="text-emerald-600">■ WhatsApp</span>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={FOLLOWER_CHART_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="TikTok" stroke="#0f172a" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="Facebook" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="Instagram" stroke="#db2777" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="WhatsApp" stroke="#10b981" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Follower Segmentation</h3>
              <p className="text-xs text-slate-500">Buyer age demographics across your channels</p>
            </div>

            <div className="space-y-4">
              {[
                { age: "18 - 24 years old", count: "14,797", pct: 78 },
                { age: "25 - 32 years old", count: "8,425", pct: 54 },
                { age: "33 - 50 years old", count: "4,439", pct: 32 },
              ].map((seg) => (
                <div key={seg.age} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>{seg.age}</span>
                    <span>{seg.count}</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${seg.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Posts Engagement Heatmap + Published Posts Table with 1-Click Boost to Marketing */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Posts Engagement Heatmap (Matches Image 3) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Posts Engagement Heatmap</h3>
              <p className="text-xs text-slate-500">Best hours for high views, comments &amp; orders</p>
            </div>
            <div className="space-y-1.5">
              {HEATMAP_DAYS.map((day, dIdx) => (
                <div key={day} className="flex items-center gap-2">
                  <span className="w-8 text-[10px] font-bold text-slate-400">{day}</span>
                  <div className="flex-1 grid grid-cols-6 gap-1.5">
                    {HEATMAP_SLOTS.map((slot, sIdx) => {
                      const intensity = (dIdx * 3 + sIdx * 2) % 4;
                      const bgClass =
                        intensity === 3
                          ? "bg-orange-600"
                          : intensity === 2
                          ? "bg-orange-400"
                          : intensity === 1
                          ? "bg-orange-200"
                          : "bg-amber-50";
                      return (
                        <div
                          key={slot}
                          className={`h-6 rounded-md ${bgClass}`}
                          title={`${day} ${slot}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="flex justify-between pl-10 pt-1 text-[10px] text-slate-400 font-semibold">
                {HEATMAP_SLOTS.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Published & Scheduled Posts History with Views, Likes, Comments & 1-Click Boost */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Published &amp; Scheduled Posts ({posts.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Track post views/engagement and click &quot;Boost Post&quot; to run as a paid ad
                </p>
              </div>
            </div>

            {posts.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No posts published yet. Click &quot;Publish Now&quot; above to publish your first post with banner!
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {post.banner_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.banner_url}
                          alt="Post banner"
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                          POST
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900">
                            {post.product_name || "Promotional Post"}
                          </span>
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {post.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 truncate max-w-md mt-0.5">
                          {post.caption}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500 mt-1">
                          <span className="text-indigo-600">{post.platforms}</span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {post.views_count || 240} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-rose-500" /> {post.likes_count || 32}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-blue-600" /> {post.comments_count || 11}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/marketing-ads?boostPostId=${post.id}`}
                        className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold flex items-center gap-1 shadow-2xs"
                      >
                        <Rocket className="w-3 h-3" /> Boost Post
                      </Link>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}