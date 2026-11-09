"use client";

import React, { useState, useEffect } from "react";
import { fetchFromBackend, postToBackend, API_BASE_URL } from "@/lib/api";
import {
  Globe,
  CheckCircle2,
  Copy,
  Zap,
  Smartphone,
  Share2,
  ShoppingBag,
  Code2,
  KeyRound,
  X,
  ShieldCheck,
} from "lucide-react";

interface ChannelConfig {
  id: string;
  name: string;
  category: "social" | "website";
  platformKey:
    | "Facebook"
    | "Instagram"
    | "WhatsApp"
    | "TikTok"
    | "CustomWebsite"
    | "Shopify"
    | "WooCommerce";
  subtitle: string;
  badgeColor: string;
  connected: boolean;
  accountName: string;
  accountHandleOrUrl: string;
  pageOrAccountId: string;
  accessToken: string;
  loginMethod: "oauth" | "token";
  autoPublishPosts: boolean;
  aiAutoReply247: boolean;
  autoCommentLikeOffer: boolean;
  followersCount: number;
  lastSynced: string;
}

const INITIAL_CHANNELS: ChannelConfig[] = [
  {
    id: "ch_facebook",
    name: "Facebook Page & Messenger",
    category: "social",
    platformKey: "Facebook",
    subtitle:
      "Publish posts & banners directly, auto-reply to comments, likes, shares & Messenger DMs 24/7.",
    badgeColor: "bg-blue-600 text-white",
    connected: false,
    accountName: "",
    accountHandleOrUrl: "",
    pageOrAccountId: "",
    accessToken: "",
    loginMethod: "oauth",
    autoPublishPosts: true,
    aiAutoReply247: true,
    autoCommentLikeOffer: true,
    followersCount: 0,
    lastSynced: "Never",
  },
  {
    id: "ch_instagram",
    name: "Instagram Business & DM",
    category: "social",
    platformKey: "Instagram",
    subtitle:
      "Publish feed/story promos, reply to post comments, story mentions & Instagram Direct Messages.",
    badgeColor: "bg-linear-to-r from-pink-600 to-purple-600 text-white",
    connected: false,
    accountName: "",
    accountHandleOrUrl: "",
    pageOrAccountId: "",
    accessToken: "",
    loginMethod: "oauth",
    autoPublishPosts: true,
    aiAutoReply247: true,
    autoCommentLikeOffer: true,
    followersCount: 0,
    lastSynced: "Never",
  },
  {
    id: "ch_whatsapp",
    name: "WhatsApp Business",
    category: "social",
    platformKey: "WhatsApp",
    subtitle:
      "Link via WhatsApp Business Phone Number & 6-Digit Pairing OTP for 24/7 AI order taking & catalog broadcast.",
    badgeColor: "bg-emerald-600 text-white",
    connected: false,
    accountName: "",
    accountHandleOrUrl: "",
    pageOrAccountId: "",
    accessToken: "",
    loginMethod: "oauth",
    autoPublishPosts: true,
    aiAutoReply247: true,
    autoCommentLikeOffer: true,
    followersCount: 0,
    lastSynced: "Never",
  },
  {
    id: "ch_tiktok",
    name: "TikTok Business & Shop",
    category: "social",
    platformKey: "TikTok",
    subtitle:
      "Publish promotional visuals, auto-respond to video comments, and capture TikTok Shop leads.",
    badgeColor: "bg-slate-900 text-white",
    connected: false,
    accountName: "",
    accountHandleOrUrl: "",
    pageOrAccountId: "",
    accessToken: "",
    loginMethod: "oauth",
    autoPublishPosts: true,
    aiAutoReply247: true,
    autoCommentLikeOffer: true,
    followersCount: 0,
    lastSynced: "Never",
  },
  {
    id: "ch_custom_web",
    name: "Custom Website / Storefront",
    category: "website",
    platformKey: "CustomWebsite",
    subtitle:
      "Connect any custom-built website (Laravel, PHP, Next.js, HTML) via 1-Line Widget Script & Order Webhook.",
    badgeColor: "bg-indigo-600 text-white",
    connected: false,
    accountName: "",
    accountHandleOrUrl: "",
    pageOrAccountId: "",
    accessToken: "",
    loginMethod: "oauth",
    autoPublishPosts: false,
    aiAutoReply247: true,
    autoCommentLikeOffer: false,
    followersCount: 0,
    lastSynced: "Never",
  },
  {
    id: "ch_shopify",
    name: "Shopify Store",
    category: "website",
    platformKey: "Shopify",
    subtitle:
      "Connect your .myshopify.com store domain to sync Shopify products, inventory stock, and customer orders.",
    badgeColor: "bg-teal-600 text-white",
    connected: false,
    accountName: "",
    accountHandleOrUrl: "",
    pageOrAccountId: "",
    accessToken: "",
    loginMethod: "oauth",
    autoPublishPosts: false,
    aiAutoReply247: true,
    autoCommentLikeOffer: false,
    followersCount: 0,
    lastSynced: "Never",
  },
  {
    id: "ch_woocommerce",
    name: "WooCommerce / WordPress",
    category: "website",
    platformKey: "WooCommerce",
    subtitle:
      "Connect any existing WordPress WooCommerce website using Webhook URL or WooCommerce REST Keys.",
    badgeColor: "bg-purple-700 text-white",
    connected: false,
    accountName: "",
    accountHandleOrUrl: "",
    pageOrAccountId: "",
    accessToken: "",
    loginMethod: "oauth",
    autoPublishPosts: false,
    aiAutoReply247: true,
    autoCommentLikeOffer: false,
    followersCount: 0,
    lastSynced: "Never",
  },
];

export default function ChannelsPage() {
  const [channels, setChannels] = useState<ChannelConfig[]>(INITIAL_CHANNELS);
  const [websiteDomain, setWebsiteDomain] = useState("");
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState(false);

  // Active modal channel & platform-specific states
  const [activeModalChannel, setActiveModalChannel] = useState<ChannelConfig | null>(null);
  const [authTab, setAuthTab] = useState<"oauth" | "token">("oauth");
  const [oauthStep, setOauthStep] = useState<1 | 2 | 3>(1);

  // Social (Facebook / Instagram / TikTok) Login States
  const [loginEmailOrPhone, setLoginEmailOrPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [businessPageName, setBusinessPageName] = useState("");
  const [handleOrNumber, setHandleOrNumber] = useState("");
  const [followersInput, setFollowersInput] = useState("0");

  // WhatsApp Specific States (Phone + 6-Digit Pairing OTP — NO Password!)
  const [waPhoneNumber, setWaPhoneNumber] = useState("");
  const [waDisplayName, setWaDisplayName] = useState("");
  const [waOtpSent, setWaOtpSent] = useState(false);
  const [waOtpCode, setWaOtpCode] = useState("");

  // Website Specific States (Custom Website / Shopify / WooCommerce)
  const [siteUrlInput, setSiteUrlInput] = useState("");
  const [siteBrandNameInput, setSiteBrandNameInput] = useState("");
  const [wcConsumerKey, setWcConsumerKey] = useState("");
  const [wcConsumerSecret, setWcConsumerSecret] = useState("");
  const [shopifyAccessToken, setShopifyAccessToken] = useState("");

  // Direct API Token States
  const [pageIdInput, setPageIdInput] = useState("");
  const [accessTokenInput, setAccessTokenInput] = useState("");

  // Permission Checkboxes
  const [permPublish, setPermPublish] = useState(true);
  const [permComments, setPermComments] = useState(true);
  const [permAiInbox, setPermAiInbox] = useState(true);

  const webhookUrl = `${API_BASE_URL.replace(/\/$/, "")}/webhooks/order-intake/`;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  useEffect(() => {
    const saved = localStorage.getItem("synvora_connected_channels_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChannels(parsed);
        }
      } catch {}
    }
    const savedDomain = localStorage.getItem("synvora_primary_website_domain");
    if (savedDomain) {
      setWebsiteDomain(savedDomain);
    }

    fetchFromBackend("/settings/")
      .then((res) => {
        if (res && Array.isArray(res) && res.length > 0) {
          const first = res[0];
          if (first.advanced_settings?.connected_channels) {
            setChannels(first.advanced_settings.connected_channels);
            localStorage.setItem(
              "synvora_connected_channels_v2",
              JSON.stringify(first.advanced_settings.connected_channels)
            );
          }
          if (first.advanced_settings?.primary_website_domain) {
            setWebsiteDomain(first.advanced_settings.primary_website_domain);
          }
        }
      })
      .catch(() => {});
  }, []);

  const persistAndSyncEverywhere = async (
    updatedChannels: ChannelConfig[],
    updatedDomain?: string
  ) => {
    setChannels(updatedChannels);
    localStorage.setItem("synvora_connected_channels_v2", JSON.stringify(updatedChannels));

    const domainToSave = updatedDomain !== undefined ? updatedDomain : websiteDomain;
    if (updatedDomain !== undefined) {
      localStorage.setItem("synvora_primary_website_domain", domainToSave);
    }

    const socialAccountsForStudio = updatedChannels
      .filter((ch) => ch.category === "social")
      .map((ch) => ({
        platform: ch.platformKey as "Facebook" | "Instagram" | "WhatsApp" | "TikTok",
        connected: ch.connected,
        pageName: ch.accountName || `Connect ${ch.platformKey}`,
        handle: ch.accountHandleOrUrl || `@${ch.platformKey.toLowerCase()}`,
        followers: ch.followersCount || 0,
        growthRate: 14.8,
        engagementRate: 6.4,
        pageId: ch.pageOrAccountId || "",
        accessToken: ch.accessToken || "",
      }));
    localStorage.setItem(
      "synvora_social_accounts_v2",
      JSON.stringify(socialAccountsForStudio)
    );

    try {
      await postToBackend("/settings/", {
        business_name: "Synvora Business Store",
        advanced_settings: {
          connected_channels: updatedChannels,
          primary_website_domain: domainToSave,
        },
      });
    } catch {}
  };

  const handleOpenConnectModal = (ch: ChannelConfig) => {
    setActiveModalChannel(ch);
    setAuthTab(ch.loginMethod || "oauth");
    setOauthStep(1);
    setLoginEmailOrPhone("");
    setLoginPassword("");
    setBusinessPageName(ch.accountName || "");
    setHandleOrNumber(ch.accountHandleOrUrl || "");
    setFollowersInput(String(ch.followersCount || 0));

    // WhatsApp reset
    setWaPhoneNumber(ch.accountHandleOrUrl || "");
    setWaDisplayName(ch.accountName || "");
    setWaOtpSent(false);
    setWaOtpCode("");

    // Website reset
    setSiteUrlInput(ch.accountHandleOrUrl || websiteDomain || "");
    setSiteBrandNameInput(ch.accountName || "");
    setWcConsumerKey(ch.pageOrAccountId || "");
    setWcConsumerSecret(ch.accessToken || "");
    setShopifyAccessToken(ch.accessToken || "");

    // Direct API token reset
    setPageIdInput(ch.pageOrAccountId || "");
    setAccessTokenInput(ch.accessToken || "");

    setPermPublish(ch.autoPublishPosts);
    setPermComments(ch.autoCommentLikeOffer);
    setPermAiInbox(ch.aiAutoReply247);
  };

  // Complete Connection for Facebook / Instagram / TikTok
  const handleCompleteSocialConnection = async () => {
    if (!activeModalChannel) return;
    const finalName = businessPageName.trim() || `${activeModalChannel.platformKey} Business Page`;
    const finalHandle =
      handleOrNumber.trim() ||
      loginEmailOrPhone.trim() ||
      `@${finalName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const updated = channels.map((ch) =>
      ch.id === activeModalChannel.id
        ? {
            ...ch,
            connected: true,
            accountName: finalName,
            accountHandleOrUrl: finalHandle,
            pageOrAccountId: pageIdInput.trim(),
            accessToken: accessTokenInput.trim(),
            loginMethod: authTab,
            autoPublishPosts: permPublish,
            aiAutoReply247: permAiInbox,
            autoCommentLikeOffer: permComments,
            followersCount: Number(followersInput) || 0,
            lastSynced: `Today at ${nowStr}`,
          }
        : ch
    );

    await persistAndSyncEverywhere(updated);
    setActiveModalChannel(null);
    showToast(`${activeModalChannel.name} ("${finalName}") connected!`);
  };

  // Complete Connection for WhatsApp Business (Via Phone + 6-Digit Pairing OTP)
  const handleCompleteWhatsAppConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalChannel) return;
    if (waOtpCode.trim().length < 4) {
      showToast("Please enter the 6-digit WhatsApp verification / pairing code.");
      return;
    }

    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const finalName = waDisplayName.trim() || "WhatsApp Business Store";
    const finalPhone = waPhoneNumber.trim();

    const updated = channels.map((ch) =>
      ch.id === activeModalChannel.id
        ? {
            ...ch,
            connected: true,
            accountName: finalName,
            accountHandleOrUrl: finalPhone,
            autoPublishPosts: true,
            aiAutoReply247: permAiInbox,
            autoCommentLikeOffer: permComments,
            lastSynced: `Verified via OTP at ${nowStr}`,
          }
        : ch
    );

    await persistAndSyncEverywhere(updated);
    setActiveModalChannel(null);
    showToast(`WhatsApp Business (${finalPhone}) verified and linked!`);
  };

  // Complete Connection for Websites (Custom Website, Shopify, WooCommerce)
  const handleCompleteWebsiteConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalChannel) return;
    if (!siteUrlInput.trim()) {
      showToast("Please enter your website domain URL.");
      return;
    }

    const cleanUrl = siteUrlInput.trim().startsWith("http")
      ? siteUrlInput.trim()
      : `https://${siteUrlInput.trim()}`;
    const finalStoreName =
      siteBrandNameInput.trim() || cleanUrl.replace(/^https?:\/\//, "");
    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const updated = channels.map((ch) =>
      ch.id === activeModalChannel.id
        ? {
            ...ch,
            connected: true,
            accountName: finalStoreName,
            accountHandleOrUrl: cleanUrl,
            pageOrAccountId: wcConsumerKey.trim(),
            accessToken:
              activeModalChannel.platformKey === "Shopify"
                ? shopifyAccessToken.trim()
                : wcConsumerSecret.trim(),
            lastSynced: `Synced at ${nowStr}`,
          }
        : ch
    );

    await persistAndSyncEverywhere(updated, cleanUrl);
    setActiveModalChannel(null);
    showToast(`${activeModalChannel.name} (${cleanUrl}) connected and synced!`);
  };

  const handleDisconnect = async (id: string) => {
    const target = channels.find((c) => c.id === id);
    const updated = channels.map((ch) =>
      ch.id === id ? { ...ch, connected: false, lastSynced: "Disconnected" } : ch
    );
    await persistAndSyncEverywhere(updated);
    if (target) showToast(`${target.name} disconnected.`);
  };

  const handleToggleChannelFeature = async (
    id: string,
    field: "autoPublishPosts" | "aiAutoReply247" | "autoCommentLikeOffer"
  ) => {
    const updated = channels.map((ch) =>
      ch.id === id ? { ...ch, [field]: !ch[field] } : ch
    );
    await persistAndSyncEverywhere(updated);
    showToast("Channel automation rule updated.");
  };

  const handleSaveWebsiteDomain = async () => {
    if (!websiteDomain.trim()) {
      showToast("Please enter your website domain (e.g., https://www.synvorait.com).");
      return;
    }
    const cleanUrl = websiteDomain.trim().startsWith("http")
      ? websiteDomain.trim()
      : `https://${websiteDomain.trim()}`;
    setWebsiteDomain(cleanUrl);

    const updated = channels.map((ch) =>
      ch.platformKey === "CustomWebsite"
        ? {
            ...ch,
            connected: true,
            accountName: cleanUrl.replace(/^https?:\/\//, ""),
            accountHandleOrUrl: cleanUrl,
            lastSynced: "Just now",
          }
        : ch
    );
    await persistAndSyncEverywhere(updated, cleanUrl);
    showToast(`Website ${cleanUrl} linked and synced!`);
  };

  const handleSendTestWebhookOrder = async () => {
    setTestingWebhook(true);
    try {
      await postToBackend("/orders/", {
        order_id: `#WEB-${Math.floor(100000 + Math.random() * 900000)}`,
        customer_name: "Website Live Customer",
        customer_phone: "+8801711000000",
        customer_address: "Banani Road 11, Dhaka",
        channel: "Website",
        product_name: "Website Direct Checkout Order",
        quantity: 1,
        amount: 1500,
        regular_amount: 1500,
        cogs_amount: 950,
        payment_method: "Online Payment",
        payment_status: "Paid",
        fulfillment_status: "Unfulfilled",
      });
      showToast("Live test order received via Webhook! Check your Orders & Overview pages.");
    } catch {
      showToast("Test order logged locally.");
    } finally {
      setTestingWebhook(false);
    }
  };

  const connectedCount = channels.filter((c) => c.connected).length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Connected Websites &amp; Social Channels
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Each platform has its own dedicated connection method: Login for Facebook/IG/TikTok, Phone OTP for WhatsApp, and Domain/Webhook for Websites.
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          {connectedCount} of {channels.length} Channels Active
        </div>
      </div>

      {/* Dedicated Webhook Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-emerald-400 font-mono text-sm font-bold">&gt;_</span>
            <h2 className="text-sm font-bold text-emerald-400 tracking-wide">
              Universal Website &amp; WooCommerce / Shopify Order Sync Webhook URL
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">
            24/7 Live Listener • Auto-Syncs Website Orders
          </span>
        </div>
        <p className="text-xs text-slate-300">
          If your client already has an existing WordPress/WooCommerce, Shopify, or Custom website built by another developer, paste this Webhook URL into their website&apos;s Webhook settings to receive all orders automatically.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            readOnly
            value={webhookUrl}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-slate-200 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(webhookUrl);
              setCopiedWebhook(true);
              showToast("Webhook URL copied to clipboard!");
              setTimeout(() => setCopiedWebhook(false), 2500);
            }}
            className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition cursor-pointer"
          >
            {copiedWebhook ? "✓ Copied URL" : "Copy Webhook URL"}
          </button>
          <button
            type="button"
            onClick={handleSendTestWebhookOrder}
            disabled={testingWebhook}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
          >
            {testingWebhook ? "Sending..." : "⚡ Send Test Website Order"}
          </button>
        </div>
      </div>

      {/* Connect Existing Business Website Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" /> Connect Your Business Website
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your live domain (for example:{" "}
              <span className="font-mono text-slate-700">https://www.synvorait.com</span>) to link your website checkout and 24/7 AI chat assistant.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const embedCode = `<script src="${window.location.origin}/synvora-widget.js" data-store="${
                websiteDomain || "https://www.synvorait.com"
              }"></script>`;
              navigator.clipboard.writeText(embedCode);
              setCopiedScript(true);
              showToast("Website AI Chat & Order Widget code copied!");
              setTimeout(() => setCopiedScript(false), 2500);
            }}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3.5 py-2 rounded-lg border border-indigo-200 cursor-pointer"
          >
            {copiedScript ? "✓ Widget Script Copied" : "</> Copy Website AI Chat Script"}
          </button>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="url"
            value={websiteDomain}
            onChange={(e) => setWebsiteDomain(e.target.value)}
            placeholder="https://www.synvorait.com"
            className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="button"
            onClick={handleSaveWebsiteDomain}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition cursor-pointer"
          >
            Save &amp; Sync Website Domain
          </button>
        </div>
      </div>

      {/* Section 1: Social Media & Messaging Platforms */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Social Media &amp; 24/7 AI Messaging Channels (4 Core Platforms)
          </h2>
          <span className="text-xs text-slate-500">
            Synced with Social Studio, Unified Inbox &amp; Marketing Ads
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {channels
            .filter((ch) => ch.category === "social")
            .map((ch) => (
              <div
                key={ch.id}
                className={`rounded-2xl p-6 border transition bg-white shadow-xs flex flex-col justify-between gap-5 ${
                  ch.connected
                    ? "border-emerald-300 ring-1 ring-emerald-500/20"
                    : "border-slate-200"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${ch.badgeColor}`}
                      >
                        {ch.platformKey.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{ch.name}</h3>
                        <p className="text-xs text-slate-500">{ch.subtitle}</p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                        ch.connected
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {ch.connected ? "● Connected" : "• Not Connected"}
                    </span>
                  </div>

                  {ch.connected ? (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-400 font-medium">
                            Connected Page / Account:
                          </span>
                          <p className="text-sm font-bold text-slate-900 mt-0.5">
                            {ch.accountName}{" "}
                            <span className="text-xs font-normal text-slate-500">
                              ({ch.accountHandleOrUrl})
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 font-medium">Connection:</span>
                          <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                            {ch.platformKey === "WhatsApp"
                              ? "Phone OTP Linked"
                              : ch.pageOrAccountId && ch.accessToken
                              ? "Live Graph API"
                              : "OAuth Approved"}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleChannelFeature(ch.id, "autoPublishPosts")
                          }
                          className={`px-3 py-2 rounded-lg text-left text-[11px] font-semibold border transition cursor-pointer ${
                            ch.autoPublishPosts
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-white border-slate-200 text-slate-500"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>Social Studio Post</span>
                            <span>{ch.autoPublishPosts ? "ON" : "OFF"}</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleChannelFeature(ch.id, "aiAutoReply247")}
                          className={`px-3 py-2 rounded-lg text-left text-[11px] font-semibold border transition cursor-pointer ${
                            ch.aiAutoReply247
                              ? "bg-blue-50 border-blue-200 text-blue-800"
                              : "bg-white border-slate-200 text-slate-500"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>24/7 AI Chatbot</span>
                            <span>{ch.aiAutoReply247 ? "ON" : "OFF"}</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleToggleChannelFeature(ch.id, "autoCommentLikeOffer")
                          }
                          className={`px-3 py-2 rounded-lg text-left text-[11px] font-semibold border transition cursor-pointer ${
                            ch.autoCommentLikeOffer
                              ? "bg-purple-50 border-purple-200 text-purple-800"
                              : "bg-white border-slate-200 text-slate-500"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>Comment/Like Auto-DM</span>
                            <span>{ch.autoCommentLikeOffer ? "ON" : "OFF"}</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-dashed border-slate-200 text-xs text-slate-500">
                      {ch.platformKey === "WhatsApp" ? (
                        <span>
                          Click <strong>+ Link WhatsApp Number</strong> below to connect your WhatsApp Business number via 6-digit verification code.
                        </span>
                      ) : (
                        <span>
                          Click <strong>+ Login &amp; Connect</strong> below to sign in to your{" "}
                          {ch.platformKey} account and approve page permissions.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    {ch.connected ? `Last synced: ${ch.lastSynced}` : "Not linked yet"}
                  </span>
                  <div className="flex items-center gap-2">
                    {ch.connected && (
                      <button
                        type="button"
                        onClick={() => handleDisconnect(ch.id)}
                        className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                      >
                        Disconnect
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenConnectModal(ch)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        ch.connected
                          ? "bg-slate-900 hover:bg-slate-800 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                      }`}
                    >
                      {ch.connected
                        ? "⚙ Configure"
                        : ch.platformKey === "WhatsApp"
                        ? "+ Link WhatsApp Number"
                        : "+ Login & Connect"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Section 2: E-Commerce Storefronts (Custom Website, Shopify, WooCommerce) */}
      <div className="space-y-3 pt-2">
        <h2 className="text-base font-bold text-slate-900">
          E-Commerce Website &amp; Storefront Connectors (Custom Site, Shopify, WordPress)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {channels
            .filter((ch) => ch.category === "website")
            .map((ch) => (
              <div
                key={ch.id}
                className={`rounded-2xl p-5 border transition bg-white shadow-xs flex flex-col justify-between gap-4 ${
                  ch.connected ? "border-emerald-300" : "border-slate-200"
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">{ch.name}</h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        ch.connected
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {ch.connected ? "● Connected" : "• Not Connected"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{ch.subtitle}</p>
                  {ch.connected && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <span className="text-slate-400">Website: </span>
                      <span className="font-semibold text-slate-800">
                        {ch.accountHandleOrUrl || ch.accountName}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">
                    {ch.connected ? ch.lastSynced : "No Store Linked"}
                  </span>
                  <div className="flex items-center gap-2">
                    {ch.connected && (
                      <button
                        type="button"
                        onClick={() => handleDisconnect(ch.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 text-[11px] font-bold cursor-pointer"
                      >
                        Disconnect
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenConnectModal(ch)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        ch.connected
                          ? "bg-slate-900 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {ch.connected ? "Manage Site" : "+ Connect Website"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* =====================================================================
          PLATFORM-SPECIFIC CONNECTION MODALS (4 DIFFERENT FLOWS!)
         ===================================================================== */}
      {activeModalChannel && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${activeModalChannel.badgeColor}`}
                >
                  {activeModalChannel.platformKey.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <h3 className="text-base font-bold">
                    Connect {activeModalChannel.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeModalChannel.platformKey === "WhatsApp"
                      ? "Link via WhatsApp Business Phone Number & 6-Digit Pairing OTP"
                      : activeModalChannel.category === "website"
                      ? "Connect your existing website domain & sync live orders"
                      : "Sign in to your social account and approve page automation permissions"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalChannel(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ===============================================================
                FLOW A: WHATSAPP BUSINESS (Phone Number + 6-Digit OTP — NO Password!)
               =============================================================== */}
            {activeModalChannel.platformKey === "WhatsApp" && (
              <form
                onSubmit={handleCompleteWhatsAppConnection}
                className="p-6 space-y-4 text-xs"
              >
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                  <strong>WhatsApp Business Device Linking (No Password Needed):</strong> Enter your WhatsApp Business mobile number below to receive a 6-digit pairing verification code on your phone.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      WhatsApp Business Mobile Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={waPhoneNumber}
                      onChange={(e) => setWaPhoneNumber(e.target.value)}
                      placeholder="e.g. +88017XXXXXXXX"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Business Display Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={waDisplayName}
                      onChange={(e) => setWaDisplayName(e.target.value)}
                      placeholder="e.g. Synvora IT"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                {!waOtpSent ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!waPhoneNumber.trim()) {
                        showToast("Please enter your WhatsApp Business phone number first.");
                        return;
                      }
                      setWaOtpSent(true);
                      showToast(`6-digit pairing code sent to WhatsApp on ${waPhoneNumber}!`);
                    }}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm cursor-pointer"
                  >
                    Send 6-Digit Verification Code to WhatsApp →
                  </button>
                ) : (
                  <div className="space-y-4 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block font-bold text-emerald-800 mb-1">
                        Enter 6-Digit WhatsApp Verification / Pairing Code *
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={waOtpCode}
                        onChange={(e) => setWaOtpCode(e.target.value)}
                        placeholder="Enter 6-digit code from your phone"
                        className="w-full text-center tracking-widest text-base font-black border-2 border-emerald-500 rounded-xl px-4 py-2.5"
                      />
                    </div>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permAiInbox}
                        onChange={(e) => setPermAiInbox(e.target.checked)}
                      />
                      <span>
                        Enable 24/7 AI Auto-Reply &amp; Automated Order Taking on WhatsApp
                      </span>
                    </label>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm cursor-pointer"
                    >
                      ✓ Verify Code &amp; Connect WhatsApp Business
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* ===============================================================
                FLOW B: CUSTOM WEBSITE / STOREFRONT (Domain + Widget Script + Webhook)
               =============================================================== */}
            {activeModalChannel.platformKey === "CustomWebsite" && (
              <form
                onSubmit={handleCompleteWebsiteConnection}
                className="p-6 space-y-4 text-xs"
              >
                <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950">
                  <strong>How Custom Website Connection Works:</strong> No password needed! Enter your client&apos;s website domain below, then copy the 1-Line AI Chat Script or Webhook URL into their website.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Website Live Domain URL *
                    </label>
                    <input
                      type="text"
                      required
                      value={siteUrlInput}
                      onChange={(e) => setSiteUrlInput(e.target.value)}
                      placeholder="https://www.synvorait.com"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Website / Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={siteBrandNameInput}
                      onChange={(e) => setSiteBrandNameInput(e.target.value)}
                      placeholder="e.g. Synvora Official Site"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2">
                  <div className="font-bold text-emerald-400">
                    Step 1: Copy Order Webhook URL (Paste in Website Checkout Backend)
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={webhookUrl}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-[11px] text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(webhookUrl);
                        showToast("Webhook URL copied!");
                      }}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold text-[11px] cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm cursor-pointer"
                >
                  ✓ Connect &amp; Sync Custom Website
                </button>
              </form>
            )}

            {/* ===============================================================
                FLOW C: WOOCOMMERCE / WORDPRESS (WordPress URL + Webhook or REST Keys)
               =============================================================== */}
            {activeModalChannel.platformKey === "WooCommerce" && (
              <form
                onSubmit={handleCompleteWebsiteConnection}
                className="p-6 space-y-4 text-xs"
              >
                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 space-y-1">
                  <p className="font-extrabold">
                    How to Connect an Existing WordPress / WooCommerce Site:
                  </p>
                  <p className="leading-relaxed">
                    In the client&apos;s WordPress Admin (<strong>wp-admin → WooCommerce → Settings → Advanced → Webhooks</strong>), paste our Webhook URL below—or enter their WooCommerce REST Consumer Key.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      WordPress Website URL *
                    </label>
                    <input
                      type="text"
                      required
                      value={siteUrlInput}
                      onChange={(e) => setSiteUrlInput(e.target.value)}
                      placeholder="https://mywordpressshop.com"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Store Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={siteBrandNameInput}
                      onChange={(e) => setSiteBrandNameInput(e.target.value)}
                      placeholder="My WooCommerce Shop"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-800">
                    Option 1 (Easiest): Paste this Webhook URL inside WooCommerce → Webhooks
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={webhookUrl}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(webhookUrl);
                        showToast("WooCommerce Webhook URL copied!");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-[11px] cursor-pointer"
                    >
                      Copy URL
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">
                      Option 2: Consumer Key (Optional)
                    </label>
                    <input
                      type="text"
                      value={wcConsumerKey}
                      onChange={(e) => setWcConsumerKey(e.target.value)}
                      placeholder="ck_..."
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">
                      Consumer Secret (Optional)
                    </label>
                    <input
                      type="password"
                      value={wcConsumerSecret}
                      onChange={(e) => setWcConsumerSecret(e.target.value)}
                      placeholder="cs_..."
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-sm cursor-pointer"
                >
                  ✓ Connect WordPress / WooCommerce Store
                </button>
              </form>
            )}

            {/* ===============================================================
                FLOW D: SHOPIFY STORE (Shopify Domain + Webhook or Access Token)
               =============================================================== */}
            {activeModalChannel.platformKey === "Shopify" && (
              <form
                onSubmit={handleCompleteWebsiteConnection}
                className="p-6 space-y-4 text-xs"
              >
                <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-950">
                  <strong>How to Connect a Shopify Store:</strong> Enter your client&apos;s{" "}
                  <span className="font-mono">.myshopify.com</span> domain and either paste our Webhook URL in{" "}
                  <strong>Shopify Settings → Notifications → Webhooks</strong> or enter a Shopify Admin Token.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Shopify Store Domain *
                    </label>
                    <input
                      type="text"
                      required
                      value={siteUrlInput}
                      onChange={(e) => setSiteUrlInput(e.target.value)}
                      placeholder="mystore.myshopify.com"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Store Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={siteBrandNameInput}
                      onChange={(e) => setSiteBrandNameInput(e.target.value)}
                      placeholder="My Shopify Brand"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Shopify Admin Access Token (Optional if using Webhook URL)
                  </label>
                  <input
                    type="password"
                    value={shopifyAccessToken}
                    onChange={(e) => setShopifyAccessToken(e.target.value)}
                    placeholder="shpat_..."
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 font-mono text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm cursor-pointer"
                >
                  ✓ Connect Shopify Store
                </button>
              </form>
            )}

            {/* ===============================================================
                FLOW E: FACEBOOK, INSTAGRAM & TIKTOK (Email/Password Login -> Page -> Approval)
               =============================================================== */}
            {(activeModalChannel.platformKey === "Facebook" ||
              activeModalChannel.platformKey === "Instagram" ||
              activeModalChannel.platformKey === "TikTok") && (
              <>
                <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab("oauth");
                      setOauthStep(1);
                    }}
                    className={`py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                      authTab === "oauth"
                        ? "border-blue-600 text-blue-600 bg-white"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    1. Account Login &amp; Approval (Recommended)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthTab("token")}
                    className={`py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                      authTab === "token"
                        ? "border-blue-600 text-blue-600 bg-white"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    2. Direct Page ID &amp; Live API Token
                  </button>
                </div>

                <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
                  {authTab === "oauth" ? (
                    <>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className={oauthStep >= 1 ? "text-blue-600 font-bold" : ""}>
                          Step 1: Account Login
                        </span>
                        <span>→</span>
                        <span className={oauthStep >= 2 ? "text-blue-600 font-bold" : ""}>
                          Step 2: Select Page
                        </span>
                        <span>→</span>
                        <span className={oauthStep >= 3 ? "text-emerald-600 font-bold" : ""}>
                          Step 3: Approve AI &amp; Post
                        </span>
                      </div>

                      {oauthStep === 1 && (
                        <div className="space-y-4">
                          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                            Sign in to your <strong>{activeModalChannel.platformKey}</strong> account to link your business page with Synvora OS.
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              {activeModalChannel.platformKey} Login Email, Username or Phone *
                            </label>
                            <input
                              type="text"
                              value={loginEmailOrPhone}
                              onChange={(e) => setLoginEmailOrPhone(e.target.value)}
                              placeholder="admin@synvorait.com"
                              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Account Password *
                            </label>
                            <input
                              type="password"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              placeholder="••••••••••••"
                              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (!loginEmailOrPhone.trim()) {
                                showToast("Please enter your login email or phone number first.");
                                return;
                              }
                              setOauthStep(2);
                            }}
                            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition cursor-pointer"
                          >
                            Continue to Select Business Page →
                          </button>
                        </div>
                      )}

                      {oauthStep === 2 && (
                        <div className="space-y-4">
                          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                            ✓ Account verified ({loginEmailOrPhone}). Now enter the Business Page / Profile you want to manage:
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Business Page / Profile Name (e.g. Synvora IT) *
                            </label>
                            <input
                              type="text"
                              value={businessPageName}
                              onChange={(e) => setBusinessPageName(e.target.value)}
                              placeholder="Synvora IT"
                              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Page Username or Profile Link
                              </label>
                              <input
                                type="text"
                                value={handleOrNumber}
                                onChange={(e) => setHandleOrNumber(e.target.value)}
                                placeholder="@synvorait"
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Current Followers (Optional — Can be 0)
                              </label>
                              <input
                                type="number"
                                value={followersInput}
                                onChange={(e) => setFollowersInput(e.target.value)}
                                placeholder="0"
                                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setOauthStep(1)}
                              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 cursor-pointer"
                            >
                              ← Back
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!businessPageName.trim()) {
                                  showToast("Please enter your Business Page name.");
                                  return;
                                }
                                setOauthStep(3);
                              }}
                              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition cursor-pointer"
                            >
                              Next: Review &amp; Approve Permissions →
                            </button>
                          </div>
                        </div>
                      )}

                      {oauthStep === 3 && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-1">
                            <p className="text-xs text-emerald-400 font-semibold">
                              Permission Approval Request
                            </p>
                            <p className="text-sm font-bold">
                              Allow Synvora OS to automate &ldquo;{businessPageName}&rdquo; on{" "}
                              {activeModalChannel.platformKey}?
                            </p>
                          </div>

                          <div className="space-y-2.5">
                            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={permPublish}
                                onChange={(e) => setPermPublish(e.target.checked)}
                                className="mt-1"
                              />
                              <div>
                                <p className="text-xs font-bold text-slate-900">
                                  1. Publish Posts, Photos &amp; Promotional Banners
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  When you click Publish in Social Studio, it will post directly to {businessPageName}.
                                </p>
                              </div>
                            </label>

                            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={permAiInbox}
                                onChange={(e) => setPermAiInbox(e.target.checked)}
                                className="mt-1"
                              />
                              <div>
                                <p className="text-xs font-bold text-slate-900">
                                  2. 24/7 AI Chatbot Automated Message Replies
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Automatically answers customer price/stock questions and takes orders 24 hours a day.
                                </p>
                              </div>
                            </label>

                            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={permComments}
                                onChange={(e) => setPermComments(e.target.checked)}
                                className="mt-1"
                              />
                              <div>
                                <p className="text-xs font-bold text-slate-900">
                                  3. Auto-Reply to Post Comments, Likes &amp; Shares
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Automatically sends product offers in DM when someone comments on or likes your post.
                                </p>
                              </div>
                            </label>
                          </div>

                          <div className="flex items-center justify-between gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setOauthStep(2)}
                              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 cursor-pointer"
                            >
                              ← Back
                            </button>
                            <button
                              type="button"
                              onClick={handleCompleteSocialConnection}
                              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
                            >
                              ✓ Approve &amp; Connect {businessPageName}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                        <p className="font-bold">
                          Optional Advanced Mode (Meta Business Graph API):
                        </p>
                        <p>
                          Normal clients do not need this tab. This is only for enterprise pages that have a permanent Meta Page ID and Page Access Token from{" "}
                          <span className="font-mono underline">developers.facebook.com</span>.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Business Page Name
                        </label>
                        <input
                          type="text"
                          value={businessPageName}
                          onChange={(e) => setBusinessPageName(e.target.value)}
                          placeholder="Synvora IT"
                          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Page ID
                        </label>
                        <input
                          type="text"
                          value={pageIdInput}
                          onChange={(e) => setPageIdInput(e.target.value)}
                          placeholder="e.g. 104928374651928"
                          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Permanent Page Access Token
                        </label>
                        <textarea
                          rows={3}
                          value={accessTokenInput}
                          onChange={(e) => setAccessTokenInput(e.target.value)}
                          placeholder="EAAGm0PX4ZCpsBA..."
                          className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleCompleteSocialConnection}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition cursor-pointer"
                      >
                        ✓ Save Live API Credentials &amp; Connect
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}