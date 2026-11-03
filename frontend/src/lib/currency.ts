"use client";

import { useState, useEffect } from "react";

export interface MarketCurrency {
  code: string;
  symbol: string;
  country: string;
  label: string;
  insideDelivery: number;
  outsideDelivery: number;
  onlineBanks: string[];
  mobileWallets: string[];
}

export const GLOBAL_CURRENCIES: MarketCurrency[] = [
  {
    code: "BDT",
    symbol: "৳",
    country: "Bangladesh",
    label: "Bangladesh (৳ BDT)",
    insideDelivery: 60,
    outsideDelivery: 120,
    onlineBanks: [
      "SSLCOMMERZ (Visa / Mastercard / DBBL Nexus)",
      "City Bank (Citytouch / Amex)",
      "BRAC Bank (Astha / Visa)",
      "Dutch-Bangla Bank (NexusPay)",
      "Islami Bank (CellFin / mCash)",
      "Eastern Bank (EBL Skybanking)",
    ],
    mobileWallets: ["bKash Merchant Checkout", "Nagad Instant PGW", "Rocket (DBBL)", "Upay Wallet"],
  },
  {
    code: "USD",
    symbol: "$",
    country: "United States",
    label: "USA / Global ($ USD)",
    insideDelivery: 5,
    outsideDelivery: 12,
    onlineBanks: [
      "Stripe (Visa / Mastercard / Amex / Discover)",
      "JPMorgan Chase Bank",
      "Bank of America (ACH / Card)",
      "Citibank Online",
      "Wells Fargo Bank",
    ],
    mobileWallets: ["PayPal Express Checkout", "Apple Pay", "Google Pay (GPay)", "Venmo Business"],
  },
  {
    code: "INR",
    symbol: "₹",
    country: "India",
    label: "India (₹ INR)",
    insideDelivery: 50,
    outsideDelivery: 100,
    onlineBanks: [
      "Razorpay (RuPay / Visa / Mastercard)",
      "HDFC Bank NetBanking",
      "ICICI Bank Online",
      "State Bank of India (SBI YONO)",
      "Axis Bank NetBanking",
    ],
    mobileWallets: ["PhonePe (UPI Instant)", "Google Pay (GPay UPI)", "Paytm Wallet & UPI", "BHIM UPI"],
  },
  {
    code: "AED",
    symbol: "AED ",
    country: "UAE / Middle East",
    label: "Middle East — UAE (AED)",
    insideDelivery: 15,
    outsideDelivery: 30,
    onlineBanks: [
      "Emirates NBD Online & Card",
      "Abu Dhabi Commercial Bank (ADCB)",
      "First Abu Dhabi Bank (FAB)",
      "Dubai Islamic Bank (DIB)",
      "Visa / Mastercard Middle East",
    ],
    mobileWallets: ["Apple Pay UAE", "PayBy Wallet", "Tabby (Split in 4)", "Tamara Checkout"],
  },
  {
    code: "SAR",
    symbol: "SAR ",
    country: "Saudi Arabia",
    label: "Middle East — Saudi (SAR)",
    insideDelivery: 18,
    outsideDelivery: 35,
    onlineBanks: [
      "Mada Debit / Credit Card",
      "Al Rajhi Bank Direct",
      "SNB (Saudi National Bank)",
      "Riyad Bank Online",
    ],
    mobileWallets: ["STC Pay", "Apple Pay KSA", "Tamara / Tabby", "Urpay Wallet"],
  },
  {
    code: "EUR",
    symbol: "€",
    country: "Europe",
    label: "Europe (€ EUR)",
    insideDelivery: 5,
    outsideDelivery: 10,
    onlineBanks: [
      "Stripe Europe (Visa / Mastercard)",
      "SEPA Instant Bank Transfer",
      "Revolut Business Pay",
      "Deutsche Bank / Santander",
      "iDEAL / Bancontact",
    ],
    mobileWallets: ["PayPal Europe", "Apple Pay", "Google Pay", "Klarna Pay Now"],
  },
  {
    code: "GBP",
    symbol: "£",
    country: "United Kingdom",
    label: "UK (£ GBP)",
    insideDelivery: 4,
    outsideDelivery: 8,
    onlineBanks: [
      "Barclays UK Faster Payments",
      "HSBC UK / Lloyds Bank",
      "NatWest / Monzo Instant",
      "Visa / Mastercard UK",
    ],
    mobileWallets: ["PayPal UK", "Apple Pay", "Google Pay", "Revolut Pay"],
  },
  {
    code: "SGD",
    symbol: "S$",
    country: "Singapore",
    label: "Singapore (S$ SGD)",
    insideDelivery: 4,
    outsideDelivery: 8,
    onlineBanks: ["DBS / POSB digibank", "OCBC Online", "UOB Mighty", "Stripe SG Card"],
    mobileWallets: ["PayNow QR", "GrabPay", "ShopeePay", "Apple Pay SG"],
  },
  {
    code: "CNY",
    symbol: "¥",
    country: "China",
    label: "China (¥ CNY)",
    insideDelivery: 10,
    outsideDelivery: 25,
    onlineBanks: [
      "China UnionPay Card",
      "ICBC (Industrial & Commercial Bank)",
      "Bank of China / China Construction Bank",
    ],
    mobileWallets: ["Alipay (Zhifubao)", "WeChat Pay (Weixin)"],
  },
];

const STORAGE_KEY = "synvora_active_currency";
const EVENT_NAME = "synvora-currency-updated";

export function getSavedCurrency(): MarketCurrency {
  if (typeof window === "undefined") return GLOBAL_CURRENCIES[0];
  const savedCode = localStorage.getItem(STORAGE_KEY) || "BDT";
  return GLOBAL_CURRENCIES.find((c) => c.code === savedCode) || GLOBAL_CURRENCIES[0];
}

export function setGlobalCurrency(code: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, code);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: code }));
}

export function useCurrency() {
  const [currency, setCurrency] = useState<MarketCurrency>(GLOBAL_CURRENCIES[0]);

  useEffect(() => {
    setCurrency(getSavedCurrency());
    const handler = () => setCurrency(getSavedCurrency());
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  const formatMoney = (amount: number | string | null | undefined) => {
    const num = Number(amount || 0);
    return `${currency.symbol}${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return {
    currency,
    symbol: currency.symbol,
    code: currency.code,
    changeCurrency: setGlobalCurrency,
    formatMoney,
  };
}

export function compressImageFile(file: File, maxSize = 520): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const resultStr = typeof e.target?.result === "string" ? e.target.result : "";
      if (!resultStr) {
        resolve("");
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        } else {
          resolve(resultStr);
        }
      };
      img.onerror = () => resolve(resultStr);
      img.src = resultStr;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

export interface PrintableOrderSlipData {
  order_id: string;
  customer: string;
  customer_phone?: string;
  delivery_address?: string;
  channel?: string;
  product_name: string;
  product_sku?: string;
  selected_size?: string;
  selected_color?: string;
  quantity?: number | string;
  discount_amount?: number | string;
  amount: number | string;
  payment?: string;
  created_at?: string;
}

function buildReceiptHtml(order: PrintableOrderSlipData, currencySymbol: string, autoPrint: boolean): string {
  const dateStr = order.created_at
    ? String(order.created_at).slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const amt = Number(order.amount || 0).toFixed(2);
  const disc = Number(order.discount_amount || 0);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Official Receipt ${order.order_id}</title>
  <style>
    @page { margin: 8mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f1f5f9;
      margin: 0;
      padding: 24px;
      color: #0f172a;
    }
    .receipt-card {
      max-width: 380px;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid #10b981;
      border-radius: 20px;
      padding: 22px;
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
    }
    .top-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px;
      margin-bottom: 12px;
    }
    .brand { display: flex; align-items: center; gap: 10px; }
    .logo {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: #059669;
      color: #ffffff;
      font-weight: 900;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .store-title { font-size: 15px; font-weight: 900; color: #0f172a; }
    .price-big { font-size: 16px; font-weight: 900; color: #0f172a; text-align: right; }
    .sub-box {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 12px 14px;
      margin-bottom: 10px;
      font-size: 12px;
    }
    .row { display: flex; justify-content: space-between; align-items: center; margin: 5px 0; }
    .label { color: #64748b; font-weight: 600; }
    .val { color: #0f172a; font-weight: 800; text-align: right; }
    .status-pill {
      display: inline-block;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      padding: 2px 8px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 800;
    }
    .footer { text-align: center; font-size: 11px; color: #64748b; padding-top: 8px; }
    .no-print { text-align: center; margin-top: 16px; }
    .btn { background: #0f172a; color: #fff; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 800; font-size: 12px; cursor: pointer; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .receipt-card { box-shadow: none; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="top-box">
      <div class="brand">
        <div class="logo">S</div>
        <div>
          <div class="store-title">Official Store Receipt</div>
          <div style="font-size:11px;color:#64748b;font-weight:700;">${order.order_id}</div>
        </div>
      </div>
      <div class="price-big">${currencySymbol}${amt}</div>
    </div>

    <div class="sub-box">
      <div class="row">
        <span class="label">Product &amp; Code</span>
        <span class="val">${order.product_name} (${order.product_sku || "ITEM"})</span>
      </div>
      <div class="row">
        <span class="label">Size &amp; Color</span>
        <span class="val">Size: ${order.selected_size || "Standard"} • Color: ${order.selected_color || "Standard"}</span>
      </div>
      <div class="row">
        <span class="label">Quantity Ordered</span>
        <span class="val">${order.quantity || 1} pcs</span>
      </div>
      ${
        disc > 0
          ? `<div class="row"><span class="label">Promo Discount</span><span class="val" style="color:#e11d48;">-${currencySymbol}${disc.toFixed(2)}</span></div>`
          : ""
      }
    </div>

    <div class="sub-box">
      <div class="row">
        <span class="label">Order Date</span>
        <span class="val">${dateStr}</span>
      </div>
      <div class="row">
        <span class="label">Payment Method</span>
        <span class="status-pill">${order.payment || "Cash on Delivery"}</span>
      </div>
      <div class="row">
        <span class="label">Order Channel</span>
        <span class="val">${order.channel || "Online Checkout"}</span>
      </div>
    </div>

    <div class="sub-box">
      <div class="row">
        <span class="label">Customer</span>
        <span class="val">${order.customer}</span>
      </div>
      <div class="row">
        <span class="label">Contact Phone</span>
        <span class="val">${order.customer_phone || "N/A"}</span>
      </div>
      <div class="row">
        <span class="label">Delivery Location</span>
        <span class="val">${order.delivery_address || "Direct Handover"}</span>
      </div>
    </div>

    <div class="footer">
      Verified Official Customer Receipt • Keep for your records
    </div>
    <div class="no-print">
      <button class="btn" onclick="window.print()">Print Official Receipt</button>
    </div>
  </div>
  ${
    autoPrint
      ? `<script>
          window.onload = function() {
            setTimeout(function() { window.focus(); window.print(); }, 250);
          };
        </script>`
      : ""
  }
</body>
</html>`;
}

export function printIsolatedOrderSlip(order: PrintableOrderSlipData, currencySymbol: string) {
  if (typeof window === "undefined") return;
  const win = window.open("", "_blank", "width=960,height=740");
  if (!win) {
    window.print();
    return;
  }
  win.document.write(buildReceiptHtml(order, currencySymbol, true));
  win.document.close();
}

export function downloadOfficialOrderReceipt(order: PrintableOrderSlipData, currencySymbol: string) {
  if (typeof window === "undefined") return;
  const html = buildReceiptHtml(order, currencySymbol, false);
  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Official_Receipt_${String(order.order_id).replace("#", "")}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}