"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getPublicStore, submitPublicOrder } from "@/lib/api";
import {
  useCurrency,
  GLOBAL_CURRENCIES,
  printIsolatedOrderSlip,
  downloadOfficialOrderReceipt,
  compressImageFile,
} from "@/lib/currency";
import {
  ShoppingBag,
  CheckCircle2,
  Bot,
  UserCheck,
  Send,
  Tag,
  Package,
  Upload,
  Ruler,
  Palette,
  Globe,
  CreditCard,
  Truck,
  Printer,
  MessageCircle,
  ShieldCheck,
  AlertCircle,
  Lock,
  Download,
  ExternalLink,
} from "lucide-react";

interface StoreProduct {
  id: number;
  name: string;
  sku: string;
  category: string;
  available_sizes: string;
  available_colors: string;
  image_url: string;
  selling_price: number | string;
  offer_price: number | string | null;
  offer_label: string;
  is_on_offer: boolean;
  is_clearance: boolean;
  effective_price: number | string;
  stock: number;
  status: string;
}

interface ChatTurn {
  sender: "ai" | "buyer" | "system";
  text: string;
  matchedProducts?: StoreProduct[];
  showPaymentWidget?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  receiptOrder?: Record<string, any>;
}

// Multilingual Category & Product Synonym Dictionary + Typo-Tolerant Matcher
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  shoes: ["shoe", "shoes", "jota", "juta", "juto", "জুতা", "জুতো", "কেডস", "স্নিকার", "sneaker", "boot", "sandal", "loafers", "footwear", "air force", "airforce", "nike", "jordan"],
  dress: ["dress", "clothing", "cloth", "apparel", "jama", "kapoor", "kapor", "জামা", "কাপড়", "ড্রেস", "শার্ট", "টি-শার্ট", "টিশার্ট", "গেঞ্জি", "প্যান্ট", "পাঞ্জাবি", "shirt", "shart", "tshirt", "t-shirt", "t shirt", "genji", "pant", "panjabi", "pajama", "kurti", "saree", "hoodie", "jacket"],
  watch: ["watch", "watches", "ghori", "gori", "ঘড়ি", "ঘড়ি", "smartwatch", "clock", "rolex", "casio"],
  accessories: ["belt", "বেল্ট", "helmet", "হেলমেট", "bag", "ব্যাগ", "wallet", "মানিব্যাগ", "sunglass", "চশমা", "cap", "টুপি"],
};

function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function findMatchingProductsFromQuery(query: string, catalog: StoreProduct[]): StoreProduct[] {
  const clean = query.toLowerCase().trim();
  if (!clean) return [];

  // 1. Direct name, SKU, or category substring match
  const direct = catalog.filter(
    (p) =>
      clean.includes(p.name.toLowerCase()) ||
      p.name.toLowerCase().includes(clean) ||
      clean.includes(p.sku.toLowerCase()) ||
      clean.includes(p.category.toLowerCase())
  );
  if (direct.length > 0) return direct;

  // 2. Multilingual Category Synonym Match (e.g. "amar akta jota lagbe" -> matches "Shoes" category!)
  for (const [catKey, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
    const mentionsSynonym = synonyms.some((syn) => clean.includes(syn));
    if (mentionsSynonym) {
      const catMatches = catalog.filter((p) => {
        const pCat = p.category.toLowerCase();
        const pName = p.name.toLowerCase();
        return (
          pCat.includes(catKey) ||
          synonyms.some((syn) => pCat.includes(syn) || pName.includes(syn))
        );
      });
      if (catMatches.length > 0) return catMatches;
    }
  }

  // 3. Fuzzy Typo-Tolerant Token Match (handles 1-2 character spelling mistakes)
  const words = clean.split(/[\s,.-]+/).filter((w) => w.length >= 3);
  const fuzzyMatches = catalog.filter((p) => {
    const targetTokens = [...p.name.toLowerCase().split(/\s+/), p.category.toLowerCase(), p.sku.toLowerCase()];
    return words.some((w) =>
      targetTokens.some((t) => t.length >= 3 && editDistance(w, t) <= 2)
    );
  });
  return fuzzyMatches;
}

export default function PublicCustomerOrderPage() {
  const { formatMoney, currency, symbol, changeCurrency } = useCurrency();
  const [storeName, setStoreName] = useState("Official Online Store");
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const [selectionType, setSelectionType] = useState<"catalog" | "ad_screenshot">("catalog");
  const [customDressNameOrCode, setCustomDressNameOrCode] = useState("");
  const [customPriceInput, setCustomPriceInput] = useState("");
  const [uploadedScreenshot, setUploadedScreenshot] = useState("");

  const [selectedSize, setSelectedSize] = useState("L");
  const [preferredColor, setPreferredColor] = useState("");
  const [howManyOrders, setHowManyOrders] = useState("1");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [cityDistrict, setCityDistrict] = useState("");
  const [areaThana, setAreaThana] = useState("");
  const [channelSource, setChannelSource] = useState("Facebook Ad");

  // Real Bank / Mobile Wallet Verification Flow (Customer enters OTP/Code sent to their phone by their Bank/Wallet)
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "Online Payment" | "Mobile Wallet">("COD");
  const [selectedBankOrWallet, setSelectedBankOrWallet] = useState<string>("");
  const [payerAccountOrCard, setPayerAccountOrCard] = useState<string>("");
  const [cardExpiry, setCardExpiry] = useState<string>("");
  const [cardCvv, setCardCvv] = useState<string>("");
  const [awaitingPhoneOtp, setAwaitingPhoneOtp] = useState<boolean>(false);
  const [customerPhoneOtpOrTrx, setCustomerPhoneOtpOrTrx] = useState<string>("");
  const [paymentTrxId, setPaymentTrxId] = useState<string>("");
  const [isPaymentVerified, setIsPaymentVerified] = useState<boolean>(true);
  const [paymentStepError, setPaymentStepError] = useState<string>("");

  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [deliveryZone, setDeliveryZone] = useState<"inside" | "outside" | "free">("inside");
  const [specialNotes, setSpecialNotes] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [checkoutError, setCheckoutError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orderReceipt, setOrderReceipt] = useState<Record<string, any> | null>(null);

  const [showChatBox, setShowChatBox] = useState(false);
  const [humanHandedOff, setHumanHandedOff] = useState(false);
  const [chatInput, setChatInput] = useState("");

  // In-Chat Payment State (No fake generated OTP displayed on screen!)
  const [chatPayAccount, setChatPayAccount] = useState("");
  const [chatAwaitingOtp, setChatAwaitingOtp] = useState(false);
  const [chatOtpInput, setChatOtpInput] = useState("");
  const [chatPayError, setChatPayError] = useState("");

  const [aiDraft, setAiDraft] = useState<{
    product: StoreProduct | null;
    size: string;
    color: string;
    qty: number;
    customerName: string;
    phone: string;
    address: string;
    paymentChoice: "" | "COD" | "Online" | "Wallet";
  }>({
    product: null,
    size: "",
    color: "",
    qty: 0,
    customerName: "",
    phone: "",
    address: "",
    paymentChoice: "",
  });

  const [chatMessages, setChatMessages] = useState<ChatTurn[]>([]);

  useEffect(() => {
    async function loadStore() {
      const data = await getPublicStore();
      if (data) {
        if (data.store_name) setStoreName(data.store_name);
        if (Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
          const first = data.products[0];
          setSelectedProductId(first.id);
          const sz = (first.available_sizes || "M, L, XL").split(",").map((s: string) => s.trim()).filter(Boolean);
          if (sz.length > 0) setSelectedSize(sz[0]);
          const cl = (first.available_colors || "").split(",").map((c: string) => c.trim()).filter(Boolean);
          if (cl.length > 0) setPreferredColor(cl[0]);

          const catalogSummary = data.products
            .map((p: StoreProduct) => `• ${p.name} (${p.category} — Code: ${p.sku})`)
            .join("\n");
          setChatMessages([
            {
              sender: "ai",
              text: `Hello! Welcome to ${data.store_name || "our store"}.\nAvailable products in stock:\n${catalogSummary}\n\nTell me which product or category you are looking for!`,
            },
          ]);
        } else {
          setSelectionType("ad_screenshot");
          setChatMessages([
            {
              sender: "ai",
              text: "Hello! Welcome to our store. Tell me which product you would like to order!",
            },
          ]);
        }
      }
    }
    loadStore();
  }, []);

  useEffect(() => {
    setAwaitingPhoneOtp(false);
    setCustomerPhoneOtpOrTrx("");
    setPaymentStepError("");
    if (paymentMethod === "Online Payment") {
      setSelectedBankOrWallet(currency.onlineBanks[0] || "Visa / Mastercard");
      setIsPaymentVerified(false);
    } else if (paymentMethod === "Mobile Wallet") {
      setSelectedBankOrWallet(currency.mobileWallets[0] || "Mobile Wallet");
      setIsPaymentVerified(false);
    } else {
      setIsPaymentVerified(true);
    }
  }, [currency, paymentMethod]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) || null,
    [products, selectedProductId]
  );

  const handleSelectCatalogProduct = (prod: StoreProduct) => {
    if (prod.stock <= 0) return;
    setSelectionType("catalog");
    setSelectedProductId(prod.id);
    setAppliedDiscount(0);
    setCouponCode("");
    setCouponMessage(null);
    setCheckoutError("");
    const sz = (prod.available_sizes || "M, L, XL").split(",").map((s) => s.trim()).filter(Boolean);
    if (sz.length > 0) setSelectedSize(sz[0]);
    const cl = (prod.available_colors || "").split(",").map((c) => c.trim()).filter(Boolean);
    setPreferredColor(cl.length > 0 ? cl[0] : "");
  };

  const availableSizeBadges = useMemo(() => {
    if (selectionType === "catalog" && selectedProduct && selectedProduct.available_sizes) {
      return selectedProduct.available_sizes.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return ["S", "M", "L", "XL", "XXL", "3XL", "5XL"];
  }, [selectionType, selectedProduct]);

  const availableColorBadges = useMemo(() => {
    if (selectionType === "catalog" && selectedProduct && selectedProduct.available_colors) {
      return selectedProduct.available_colors.split(",").map((c) => c.trim()).filter(Boolean);
    }
    return [];
  }, [selectionType, selectedProduct]);

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImageFile(file, 520);
    if (compressed) setUploadedScreenshot(compressed);
  };

  const qtyNum = Math.max(1, parseInt(howManyOrders, 10) || 1);
  const unitPrice =
    selectionType === "catalog" && selectedProduct
      ? Number(
          selectedProduct.is_on_offer &&
            selectedProduct.offer_price &&
            Number(selectedProduct.offer_price) > 0
            ? selectedProduct.offer_price
            : selectedProduct.selling_price
        )
      : parseFloat(customPriceInput) || 0;

  const subTotal = unitPrice * qtyNum;
  const deliveryCost =
    deliveryZone === "inside"
      ? currency.insideDelivery
      : deliveryZone === "outside"
      ? currency.outsideDelivery
      : 0;
  const grandTotal = Math.max(0, subTotal - appliedDiscount + deliveryCost);

  const handleApplyCoupon = () => {
    setCouponMessage(null);
    const code = couponCode.trim();
    if (!code) return;

    if (selectionType === "catalog" && selectedProduct) {
      const prodPromoCode = (selectedProduct.offer_label || "").trim();

      if (!selectedProduct.is_on_offer || !prodPromoCode) {
        setAppliedDiscount(0);
        setCouponMessage({
          type: "err",
          text: `No promo/coupon code is active for "${selectedProduct.name}".`,
        });
        return;
      }

      if (prodPromoCode.toLowerCase() !== code.toLowerCase()) {
        setAppliedDiscount(0);
        setCouponMessage({
          type: "err",
          text: `Invalid promo code "${code}"! This code does not match "${selectedProduct.name}".`,
        });
        return;
      }

      const regularTotal = Number(selectedProduct.selling_price) * qtyNum;
      const offerTotal = Number(selectedProduct.offer_price || selectedProduct.selling_price) * qtyNum;
      const diff = Math.max(0, regularTotal - offerTotal);
      const discountVal = diff > 0 ? 0 : Math.round(subTotal * 0.1);
      setAppliedDiscount(discountVal);
      setCouponMessage({
        type: "ok",
        text:
          diff > 0
            ? `Promo code "${prodPromoCode}" verified! Promotional price (${formatMoney(
                selectedProduct.offer_price
              )}/unit) is active.`
            : `Promo code "${prodPromoCode}" verified! Saved ${formatMoney(discountVal)}.`,
      });
    } else {
      setAppliedDiscount(0);
      setCouponMessage({
        type: "err",
        text: "Promo codes apply only to store catalog products with an active promo code.",
      });
    }
  };

  // Step 1: Request Bank / Mobile Wallet Gateway to send OTP to customer's registered phone
  const handleInitiateGatewayOtp = () => {
    setPaymentStepError("");
    if (paymentMethod === "Online Payment") {
      if (payerAccountOrCard.trim().length < 8) {
        setPaymentStepError("Please enter a valid Card or Bank Account Number.");
        return;
      }
      if (!cardExpiry.trim() || !cardCvv.trim()) {
        setPaymentStepError("Please enter Card Expiry (MM/YY) and CVV.");
        return;
      }
    } else if (paymentMethod === "Mobile Wallet") {
      if (payerAccountOrCard.trim().length < 8) {
        setPaymentStepError("Please enter your Mobile Wallet Account Number.");
        return;
      }
    }
    setAwaitingPhoneOtp(true);
    setCustomerPhoneOtpOrTrx("");
  };

  // Step 2: Customer enters the OTP / Verification Code received on their phone from their Bank/Wallet
  const handleConfirmPhoneOtp = () => {
    setPaymentStepError("");
    if (customerPhoneOtpOrTrx.trim().length < 4) {
      setPaymentStepError(
        "Please enter the verification OTP or Transaction Code sent to your phone by your Bank/Wallet."
      );
      return;
    }
    const last4 = payerAccountOrCard.trim().slice(-4);
    setPaymentTrxId(`••••${last4} / Ref:${customerPhoneOtpOrTrx.trim().toUpperCase()}`);
    setIsPaymentVerified(true);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError("");

    if (!customerName.trim() || !customerPhone.trim() || !streetAddress.trim() || !cityDistrict.trim()) {
      setCheckoutError("Please fill in your Full Name, Phone Number, Street Address, and City/District.");
      return;
    }

    if (selectionType === "catalog" && selectedProduct) {
      if (selectedProduct.stock < qtyNum) {
        setCheckoutError(
          `Sorry! Only ${selectedProduct.stock} pcs of "${selectedProduct.name}" are available in stock.`
        );
        return;
      }
      if (
        availableSizeBadges.length > 0 &&
        !availableSizeBadges.some((s) => s.toLowerCase() === selectedSize.trim().toLowerCase())
      ) {
        setCheckoutError(
          `Size "${selectedSize}" is not available for "${selectedProduct.name}". Available sizes: ${availableSizeBadges.join(", ")}`
        );
        return;
      }
      if (
        availableColorBadges.length > 0 &&
        !availableColorBadges.some((c) => c.toLowerCase() === preferredColor.trim().toLowerCase())
      ) {
        setCheckoutError(
          `Color "${preferredColor}" is NOT in stock for "${selectedProduct.name}"! Available color(s): ${availableColorBadges.join(", ")}`
        );
        return;
      }
    }

    if (paymentMethod !== "COD" && !isPaymentVerified) {
      setCheckoutError(
        `Please complete your ${paymentMethod} verification before placing the order.`
      );
      return;
    }

    const fullAddress = [streetAddress.trim(), areaThana.trim(), cityDistrict.trim()]
      .filter(Boolean)
      .join(", ");

    const paymentLabel =
      paymentMethod === "COD"
        ? "COD"
        : `Paid (${selectedBankOrWallet} • ${paymentTrxId})`;

    setSubmitting(true);
    const payload: Record<string, unknown> = {
      customer: customerName.trim(),
      customer_phone: customerPhone.trim(),
      delivery_address: fullAddress,
      selected_size: selectedSize.trim(),
      selected_color: preferredColor.trim() || (availableColorBadges[0] || "Standard"),
      order_image: uploadedScreenshot || (selectedProduct ? selectedProduct.image_url : ""),
      customer_notes: specialNotes.trim(),
      quantity: qtyNum,
      extra_discount: appliedDiscount - deliveryCost,
      channel: channelSource,
      order_source_type: "Customer Self-Checkout",
      payment: paymentLabel,
      status: "Confirmed",
    };

    if (selectionType === "catalog" && selectedProduct) {
      payload.product_id = selectedProduct.id;
      payload.product_name = selectedProduct.name;
      payload.product_sku = selectedProduct.sku;
    } else {
      payload.product_name = customDressNameOrCode.trim() || "Custom Order Item";
      payload.product_sku = customDressNameOrCode.trim().toUpperCase() || "CUSTOM";
      payload.amount = grandTotal;
    }

    const res = await submitPublicOrder(payload);
    setSubmitting(false);
    if (res && res.order) {
      setOrderReceipt({ ...res.order, amount: grandTotal });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isBengaliOrBanglish = (text: string): boolean => {
    if (/[\u0980-\u09FF]/.test(text)) return true;
    const lower = text.toLowerCase();
    const banglishWords = [
      "amar", "akta", "ekta", "jota", "juta", "chai", "lagbe", "koto",
      "dam", "order", "korbo", "kalo", "shada", "lal", "bhai", "vai",
      "taka", "pis", "jama", "ghori", "ache", "ase",
    ];
    return banglishWords.some((w) => new RegExp(`\\b${w}\\b`).test(lower));
  };

  // Intelligent Category, Synonym & Typo-Aware Conversational AI Assistant
  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { sender: "buyer", text: msg }]);

    const lower = msg.toLowerCase();
    const useBn = isBengaliOrBanglish(msg);

    if (lower.includes("human") || lower.includes("agent") || lower.includes("manush")) {
      setHumanHandedOff(true);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "system",
          text: useBn
            ? "আপনাকে আমাদের হিউম্যান সেলস এজেন্টের সাথে যুক্ত করা হয়েছে।"
            : "Connected to a Human Sales Agent. Our team member will assist you.",
        },
      ]);
      return;
    }

    // STEP 1: Search by Category, Synonyms (e.g. "jota" -> Shoes), Product Name, SKU, or Fuzzy Typo Match!
    if (!aiDraft.product) {
      const matchedList = findMatchingProductsFromQuery(msg, products);

      if (matchedList.length === 0) {
        const listStr =
          products.length > 0
            ? products
                .map((p) => `• ${p.name} (${p.category} — Code: ${p.sku}, Price: ${formatMoney(p.effective_price)})`)
                .join("\n")
            : "No products in stock";
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: useBn
              ? `দুঃখিত স্যার, এই নামে আমাদের স্টকে কোনো প্রোডাক্ট পাওয়া যায়নি।\nআমাদের স্টকে থাকা প্রোডাক্টগুলো হলো:\n${listStr}\n\nআপনি নিচের যেকোনো প্রোডাক্ট সিলেক্ট করতে পারেন অথবা প্রোডাক্টের নাম লিখুন:`
              : `Sorry sir, we couldn't find a matching product for that query.\nOur available products in stock are:\n${listStr}\n\nYou can click a product below to visit/select it or reply with the product name:`,
            matchedProducts: products,
          },
        ]);
        return;
      }

      // If multiple products match the category (e.g. customer asked for "Dress" or "Shoes"), show them all + clickable Order Now links!
      if (matchedList.length > 1) {
        const listStr = matchedList
          .map(
            (p) =>
              `• ${p.name} (Code: ${p.sku}, Price: ${formatMoney(p.effective_price)}, Sizes: ${p.available_sizes})`
          )
          .join("\n");
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: useBn
              ? `অবশ্যই স্যার! আপনার পছন্দের ক্যাটাগরিতে আমাদের নিচের প্রোডাক্টগুলো স্টকে আছে:\n${listStr}\n\nআপনি নিচের বাটনে ক্লিক করে সরাসরি অর্ডার পেজে প্রোডাক্টগুলো দেখতে পারেন, অথবা যে প্রোডাক্টটি নিবেন তার নাম লিখুন:`
              : `Of course! Here are the available products in that category:\n${listStr}\n\nYou can click any product below to view details on the Order Now page, or reply with the exact product name to order here:`,
            matchedProducts: matchedList,
          },
        ]);
        return;
      }

      // Exact 1 product matched (e.g. "amar akta jota lagbe" matched "Air Force" in Shoes!)
      const matched = matchedList[0];
      setAiDraft((prev) => ({ ...prev, product: matched }));
      handleSelectCatalogProduct(matched);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: useBn
            ? `অবশ্যই স্যার! আমাদের "${matched.category}" ক্যাটাগরিতে "${matched.name}" (Code: ${matched.sku}) স্টকে আছে।\nদাম: ${formatMoney(
                matched.effective_price
              )}\nস্টকে থাকা সাইজ: [${matched.available_sizes || "Standard"}]\nস্টকে থাকা কালার: [${
                matched.available_colors || "Standard"
              }]\n\nআপনি নিচের লিংকে ক্লিক করে বিস্তারিত দেখতে পারেন, অথবা এখানে অর্ডার করতে আপনার কোন সাইজ (Size) লাগবে তা লিখুন:`
            : `Of course! In our "${matched.category}" category, we have "${matched.name}" (Code: ${matched.sku}) in stock.\nPrice: ${formatMoney(
                matched.effective_price
              )}\nAvailable Sizes: [${matched.available_sizes || "Standard"}]\nAvailable Colors: [${
                matched.available_colors || "Standard"
              }]\n\nYou can click below to view it on the Order Page, or reply with your Size to order right here:`,
          matchedProducts: [matched],
        },
      ]);
      return;
    }

    const currentProd = aiDraft.product;

    // STEP 2: Size Verification (One-by-one)
    if (!aiDraft.size) {
      const validSizes = (currentProd.available_sizes || "Standard")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const matchedSize = validSizes.find(
        (s) => s.toLowerCase() === lower || new RegExp(`\\b${s.toLowerCase()}\\b`).test(lower)
      );

      if (!matchedSize) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: useBn
              ? `দুঃখিত স্যার, "${msg}" সাইজটি "${currentProd.name}"-এর জন্য স্টকে নেই।\nআমাদের স্টকে থাকা সাইজগুলো হলো: [${validSizes.join(
                  ", "
                )}]।\nএর মধ্যে কোন সাইজটি নিবেন?`
              : `No sir, Size "${msg}" is not available for "${currentProd.name}".\nOur available sizes in stock are: [${validSizes.join(
                  ", "
                )}].\nWhich size would you like?`,
          },
        ]);
        return;
      }

      const validColors = (currentProd.available_colors || "Standard")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      const matchedColorInSameMsg = validColors.find((c) => lower.includes(c.toLowerCase()));
      const numInSameMsg = msg
        .replace(new RegExp(matchedSize, "i"), "")
        .match(/\b(\d+)\b/);
      const parsedQty = numInSameMsg ? Math.max(1, parseInt(numInSameMsg[1], 10)) : 0;

      if (matchedColorInSameMsg && parsedQty > 0) {
        setAiDraft((prev) => ({
          ...prev,
          size: matchedSize,
          color: matchedColorInSameMsg,
          qty: parsedQty,
        }));
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: useBn
              ? `সাইজ (${matchedSize}), কালার (${matchedColorInSameMsg}) এবং পরিমাণ (${parsedQty} পিস) কনফার্ম হয়েছে!\nএবার আপনার নাম, ফোন নাম্বার এবং ডেলিভারি ঠিকানা লিখুন:`
              : `Confirmed: Size ${matchedSize}, Color ${matchedColorInSameMsg}, Quantity ${parsedQty} pcs!\nNow please reply with your Full Name, Phone Number, and Delivery Address:`,
          },
        ]);
        return;
      }

      setAiDraft((prev) => ({ ...prev, size: matchedSize }));
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: useBn
            ? `সাইজ [${matchedSize}] কনফার্ম হয়েছে! এবার বলুন কোন কালার (Color) নিবেন?\nআমাদের স্টকে থাকা কালার: [${validColors.join(
                ", "
              )}]`
            : `Size [${matchedSize}] confirmed! Now please tell me which Color you want.\nAvailable color(s) in stock: [${validColors.join(
                ", "
              )}]`,
        },
      ]);
      return;
    }

    // STEP 3: Color Verification
    if (!aiDraft.color) {
      const validColors = (currentProd.available_colors || "Standard")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      const matchedColor =
        validColors.length > 0
          ? validColors.find((c) => lower.includes(c.toLowerCase()))
          : msg;

      if (validColors.length > 0 && !matchedColor) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: useBn
              ? `দুঃখিত স্যার, "${msg}" কালারটি স্টকে নেই।\nআমাদের স্টকে এভেলেবেল কালার হলো: [${validColors.join(
                  ", "
                )}]।\nঅনুগ্রহ করে স্টকে থাকা কালারটি লিখুন।`
              : `No sir, Color "${msg}" is not in stock for "${currentProd.name}".\nOur available color(s) in stock: [${validColors.join(
                  ", "
                )}].\nPlease reply with an available color.`,
          },
        ]);
        return;
      }

      const finalColor = matchedColor || "Standard";
      setAiDraft((prev) => ({ ...prev, color: finalColor }));
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: useBn
            ? `কালার [${finalColor}] কনফার্ম হয়েছে! আপনি কয় পিস (Quantity) নিতে চান? (যেমন: 1, 2 বা 5 লিখুন)`
            : `Color [${finalColor}] confirmed! How many pieces (Quantity) would you like to order? (Reply e.g. 1, 2, or 5)`,
        },
      ]);
      return;
    }

    // STEP 4: Quantity Verification
    if (!aiDraft.qty || aiDraft.qty <= 0) {
      const qtyMatch = msg.match(/\b(\d+)\b/);
      const parsedQty = qtyMatch ? parseInt(qtyMatch[1], 10) : 0;
      if (!parsedQty || parsedQty <= 0) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: useBn
              ? "অনুগ্রহ করে সংখ্যায় লিখুন কয় পিস অর্ডার করতে চান (যেমন: 1, 2 বা 5)।"
              : "Please enter how many pieces you want to order (e.g. 1, 2, or 5).",
          },
        ]);
        return;
      }
      if (parsedQty > currentProd.stock) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: useBn
              ? `দুঃখিত স্যার, আমাদের স্টকে মাত্র ${currentProd.stock} পিস আছে। অনুগ্রহ করে ${currentProd.stock} বা তার কম সংখ্যা লিখুন।`
              : `No sir, only ${currentProd.stock} pcs are available in stock. Please enter a quantity up to ${currentProd.stock}.`,
          },
        ]);
        return;
      }

      setAiDraft((prev) => ({ ...prev, qty: parsedQty }));
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: useBn
            ? `পরিমাণ [${parsedQty} পিস] কনফার্ম হয়েছে! এবার আপনার নাম, মোবাইল নাম্বার এবং ডেলিভারি ঠিকানা লিখুন:`
            : `Quantity [${parsedQty} pcs] confirmed! Now please reply with your Full Name, Phone Number, and Delivery Address:`,
        },
      ]);
      return;
    }

    // STEP 5: Customer Name, Phone & Address
    if (!aiDraft.phone || !aiDraft.address) {
      const phoneMatch = msg.match(/(\+?\d[\d\s-]{7,14}\d)/);
      if (!phoneMatch) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: useBn
              ? "অনুগ্রহ করে আপনার মোবাইল নাম্বার, নাম এবং ডেলিভারি ঠিকানা লিখুন।"
              : "Please include your Phone Number along with your Name and Delivery Address.",
          },
        ]);
        return;
      }
      const extractedPhone = phoneMatch[1].trim();
      const restText = msg.replace(extractedPhone, "").replace(/^[,\s-]+|[,\s-]+$/g, "");
      const parts = restText.split(",").map((p) => p.trim()).filter(Boolean);
      const cName = parts[0] || customerName || "Customer";
      const cAddr = parts.slice(1).join(", ") || restText || "City Delivery";

      setAiDraft((prev) => ({
        ...prev,
        customerName: cName,
        phone: extractedPhone,
        address: cAddr,
      }));

      const totalBill = Number(currentProd.effective_price) * aiDraft.qty;
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: useBn
            ? `ধন্যবাদ ${cName}! মোট বিল: ${formatMoney(
                totalBill
              )}।\nআপনি কীভাবে পেমেন্ট করতে চান?\n1) "COD" (ক্যাশ অন ডেলিভারি)\n2) "Online Payment" (${
                currency.onlineBanks[0]
              })\n3) "Mobile Wallet" (${currency.mobileWallets[0]})`
            : `Thank you, ${cName}! Total payable is ${formatMoney(
                totalBill
              )}.\nHow would you like to pay?\n1) "COD" (Cash on Delivery)\n2) "Online Payment" (${
                currency.onlineBanks[0]
              })\n3) "Mobile Wallet" (${currency.mobileWallets[0]})`,
        },
      ]);
      return;
    }

    // STEP 6: Payment Method
    if (!aiDraft.paymentChoice) {
      if (lower.includes("cod") || lower.includes("cash") || lower === "1" || lower.includes("ক্যাশ")) {
        const res = await submitPublicOrder({
          product_id: currentProd.id,
          product_name: currentProd.name,
          product_sku: currentProd.sku,
          selected_size: aiDraft.size,
          selected_color: aiDraft.color,
          quantity: aiDraft.qty,
          customer: aiDraft.customerName,
          customer_phone: aiDraft.phone,
          delivery_address: aiDraft.address,
          channel: "AI Chat Assistant",
          order_source_type: "AI Assistant Auto-Order",
          payment: "COD",
          status: "Confirmed",
        });

        if (res && res.order) {
          setOrderReceipt(res.order);
          setChatMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text: `Order Confirmed! Order ID: ${res.order.order_id} (${aiDraft.qty}x ${currentProd.name}, Size: ${aiDraft.size}, Color: ${aiDraft.color}). Payment: Cash on Delivery (${formatMoney(res.order.amount)}). Download or print your official receipt below:`,
              receiptOrder: res.order,
            },
          ]);
          setAiDraft({
            product: null,
            size: "",
            color: "",
            qty: 0,
            customerName: "",
            phone: "",
            address: "",
            paymentChoice: "",
          });
        }
        return;
      }

      if (
        lower.includes("online") ||
        lower.includes("bank") ||
        lower.includes("card") ||
        lower.includes("wallet") ||
        lower.includes("bkash") ||
        lower.includes("nagad") ||
        lower.includes("paypal") ||
        lower === "2" ||
        lower === "3"
      ) {
        const isWallet =
          lower.includes("wallet") ||
          lower.includes("bkash") ||
          lower.includes("nagad") ||
          lower.includes("paypal") ||
          lower === "3";
        setAiDraft((prev) => ({
          ...prev,
          paymentChoice: isWallet ? "Wallet" : "Online",
        }));
        setChatPayAccount("");
        setChatAwaitingOtp(false);
        setChatOtpInput("");
        setChatPayError("");

        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: `Please enter your ${
              isWallet ? currency.mobileWallets[0] : currency.onlineBanks[0]
            } Account/Card Number below, then enter the OTP sent by your provider to your phone to complete payment of ${formatMoney(
              Number(currentProd.effective_price) * aiDraft.qty
            )}:`,
            showPaymentWidget: true,
          },
        ]);
        return;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: 'Please reply with "1" (COD), "2" (Online Bank/Card), or "3" (Mobile Wallet).',
        },
      ]);
    }
  };

  const handleChatInitiateGateway = () => {
    setChatPayError("");
    if (chatPayAccount.trim().length < 6) {
      setChatPayError("Please enter a valid Card or Wallet Number.");
      return;
    }
    setChatAwaitingOtp(true);
  };

  const handleChatVerifyOtpAndOrder = async () => {
    setChatPayError("");
    if (chatOtpInput.trim().length < 4) {
      setChatPayError("Please enter the OTP or Transaction ID received on your phone from your bank/wallet.");
      return;
    }
    const currentProd = aiDraft.product;
    if (!currentProd) return;

    const last4 = chatPayAccount.trim().slice(-4);
    const provider =
      aiDraft.paymentChoice === "Wallet" ? currency.mobileWallets[0] : currency.onlineBanks[0];

    const res = await submitPublicOrder({
      product_id: currentProd.id,
      product_name: currentProd.name,
      product_sku: currentProd.sku,
      selected_size: aiDraft.size,
      selected_color: aiDraft.color,
      quantity: aiDraft.qty,
      customer: aiDraft.customerName,
      customer_phone: aiDraft.phone,
      delivery_address: aiDraft.address,
      channel: "AI Chat Assistant",
      order_source_type: "AI Assistant Auto-Order",
      payment: `Paid (${provider} ••••${last4})`,
      status: "Confirmed",
    });

    if (res && res.order) {
      setOrderReceipt(res.order);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `Payment Verified! Order Confirmed: ${res.order.order_id} (${aiDraft.qty}x ${currentProd.name}, Size: ${aiDraft.size}, Color: ${aiDraft.color}). Download or print your official customer receipt below:`,
          receiptOrder: res.order,
        },
      ]);
      setAiDraft({
        product: null,
        size: "",
        color: "",
        qty: 0,
        customerName: "",
        phone: "",
        address: "",
        paymentChoice: "",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 pb-16">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-extrabold shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-extrabold text-slate-900">{storeName}</div>
              <div className="text-[11px] text-slate-500">Official Online Order &amp; Checkout</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
              <Globe className="w-3.5 h-3.5 text-orange-600" />
              <select
                value={currency.code}
                onChange={(e) => changeCurrency(e.target.value)}
                aria-label="Select Market Currency"
                className="bg-transparent text-slate-800 font-extrabold focus:outline-none cursor-pointer"
              >
                {GLOBAL_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowChatBox(!showChatBox)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {showChatBox ? "Close Chat" : "Order via AI / Human Chat"}
            </button>
          </div>
        </div>
      </header>

      <div id="store-catalog-top" className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900">Checkout</h1>
          <p className="text-xs text-slate-500">
            Market: <strong>{currency.country}</strong> ({currency.code})
          </p>
        </div>

        {orderReceipt && (
          <div className="bg-white rounded-2xl p-6 border-2 border-emerald-500 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-extrabold uppercase">
                <CheckCircle2 className="w-4 h-4" /> Official Order Confirmation &amp; Customer Proof
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Order ID: {String(orderReceipt.order_id)} — {String(orderReceipt.product_name)} (Qty:{" "}
                {String(orderReceipt.quantity)})
              </h2>
              <p className="text-xs text-slate-600">
                Size: <strong>{String(orderReceipt.selected_size)}</strong> • Color:{" "}
                <strong>{String(orderReceipt.selected_color)}</strong> • Payment:{" "}
                <strong>{String(orderReceipt.payment)}</strong> • Total:{" "}
                <strong>{formatMoney(Number(orderReceipt.amount))}</strong>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  downloadOfficialOrderReceipt(
                    {
                      order_id: String(orderReceipt.order_id),
                      customer: String(orderReceipt.customer),
                      customer_phone: String(orderReceipt.customer_phone || ""),
                      delivery_address: String(orderReceipt.delivery_address || ""),
                      channel: String(orderReceipt.channel || "Online Store"),
                      product_name: String(orderReceipt.product_name),
                      product_sku: String(orderReceipt.product_sku || ""),
                      selected_size: String(orderReceipt.selected_size || ""),
                      selected_color: String(orderReceipt.selected_color || ""),
                      quantity: Number(orderReceipt.quantity || 1),
                      discount_amount: Number(orderReceipt.discount_amount || 0),
                      amount: Number(orderReceipt.amount || 0),
                      payment: String(orderReceipt.payment || "COD"),
                      created_at: String(orderReceipt.created_at || ""),
                    },
                    symbol
                  )
                }
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download Official Receipt
              </button>
              <button
                type="button"
                onClick={() =>
                  printIsolatedOrderSlip(
                    {
                      order_id: String(orderReceipt.order_id),
                      customer: String(orderReceipt.customer),
                      customer_phone: String(orderReceipt.customer_phone || ""),
                      delivery_address: String(orderReceipt.delivery_address || ""),
                      channel: String(orderReceipt.channel || "Online Store"),
                      product_name: String(orderReceipt.product_name),
                      product_sku: String(orderReceipt.product_sku || ""),
                      selected_size: String(orderReceipt.selected_size || ""),
                      selected_color: String(orderReceipt.selected_color || ""),
                      quantity: Number(orderReceipt.quantity || 1),
                      discount_amount: Number(orderReceipt.discount_amount || 0),
                      amount: Number(orderReceipt.amount || 0),
                      payment: String(orderReceipt.payment || "COD"),
                      created_at: String(orderReceipt.created_at || ""),
                    },
                    symbol
                  )
                }
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Order Slip
              </button>
            </div>
          </div>
        )}

        {/* Store Catalog Showcase */}
        {products.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 border-l-4 border-orange-500 pl-2.5">
                Select Product to Order
              </h2>
              <button
                type="button"
                onClick={() =>
                  setSelectionType(selectionType === "catalog" ? "ad_screenshot" : "catalog")
                }
                className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
              >
                {selectionType === "catalog"
                  ? "Or Type Custom Dress Code / Upload Ad Screenshot"
                  : "Back to Store Products"}
              </button>
            </div>

            {selectionType === "catalog" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {products.map((prod) => {
                  const isSelected = prod.id === selectedProductId;
                  const hasOffer = prod.is_on_offer && prod.offer_price && Number(prod.offer_price) > 0;
                  const displayPrice = hasOffer ? prod.offer_price : prod.selling_price;
                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleSelectCatalogProduct(prod)}
                      className={`rounded-2xl border p-3.5 flex flex-col justify-between transition cursor-pointer ${
                        isSelected
                          ? "border-orange-500 bg-orange-50/20 ring-2 ring-orange-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div>
                        <div className="relative h-36 w-full rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden mb-3">
                          {hasOffer && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-orange-500 text-white text-[10px] font-extrabold">
                              Promo: {prod.offer_label || "Offer"}
                            </span>
                          )}
                          {prod.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="w-10 h-10 text-slate-300" />
                          )}
                        </div>
                        <div className="text-xs font-extrabold text-slate-900 line-clamp-2">
                          {prod.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {prod.category} • Code: {prod.sku} • Colors:{" "}
                          <strong>{prod.available_colors || "Standard"}</strong>
                        </div>
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-extrabold text-orange-600">
                            {formatMoney(displayPrice)}
                          </span>
                          {hasOffer && (
                            <span className="text-[11px] line-through text-slate-400">
                              {formatMoney(prod.selling_price)}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          className={`mt-2 w-full py-1.5 rounded-lg text-xs font-bold border transition ${
                            isSelected
                              ? "bg-orange-500 text-white border-orange-500"
                              : "border-orange-300 text-orange-600 hover:bg-orange-50"
                          }`}
                        >
                          {isSelected ? "✓ Selected for Order" : "Select Item"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {checkoutError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-extrabold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{checkoutError}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 border-l-4 border-orange-500 pl-2.5">
                Order Review &amp; Stock Specifications
              </h2>

              {selectionType === "catalog" && selectedProduct ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    {selectedProduct.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedProduct.image_url}
                        alt={selectedProduct.name}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">
                        {selectedProduct.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        Code: {selectedProduct.sku} • In Stock: {selectedProduct.stock} pcs
                      </div>
                      <div className="text-xs font-extrabold text-orange-600 mt-0.5">
                        {formatMoney(unitPrice)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Qty:</span>
                    <button
                      type="button"
                      onClick={() => setHowManyOrders(String(Math.max(1, qtyNum - 1)))}
                      className="w-8 h-8 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={selectedProduct.stock || 99}
                      value={howManyOrders}
                      onChange={(e) => setHowManyOrders(e.target.value)}
                      aria-label="Quantity"
                      className="w-14 text-center py-1 rounded-lg border border-slate-300 text-xs font-extrabold bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setHowManyOrders(String(qtyNum + 1))}
                      className="w-8 h-8 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Product Name or Dress Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={customDressNameOrCode}
                      onChange={(e) => setCustomDressNameOrCode(e.target.value)}
                      placeholder="Type Product Name or Code"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={customPriceInput}
                      onChange={(e) => setCustomPriceInput(e.target.value)}
                      placeholder="Price shown on ad"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="flex items-center gap-1 text-xs font-extrabold text-slate-800 mb-1">
                    <Ruler className="w-3.5 h-3.5 text-orange-600" /> Available Size *
                  </label>
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {availableSizeBadges.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`px-2.5 py-1 rounded text-xs font-extrabold border cursor-pointer ${
                          selectedSize === sz
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-slate-50 text-slate-700 border-slate-300"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                  <div className="text-[11px] font-bold text-slate-600">
                    Selected Size: <span className="text-orange-600">{selectedSize}</span>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1 text-xs font-extrabold text-slate-800 mb-1">
                    <Palette className="w-3.5 h-3.5 text-orange-600" /> Available Color in Stock *
                  </label>
                  {availableColorBadges.length > 0 ? (
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        {availableColorBadges.map((cl) => (
                          <button
                            key={cl}
                            type="button"
                            onClick={() => setPreferredColor(cl)}
                            className={`px-3 py-1 rounded-lg text-xs font-extrabold border cursor-pointer ${
                              preferredColor.toLowerCase() === cl.toLowerCase()
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-slate-50 text-slate-700 border-slate-300"
                            }`}
                          >
                            ✓ {cl}
                          </button>
                        ))}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-bold">
                        Only in-stock color(s) can be ordered
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      value={preferredColor}
                      onChange={(e) => setPreferredColor(e.target.value)}
                      placeholder="Type Color"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    How Many Orders? *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={howManyOrders}
                    onChange={(e) => setHowManyOrders(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-extrabold"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Upload className="w-3.5 h-3.5 text-orange-600" />
                  Attach Ad Screenshot / Product Photo (Optional):
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-700 cursor-pointer"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 border-l-4 border-orange-500 pl-2.5">
                Shipping Address ({currency.country})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your Full Name *"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone / Mobile Number *"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="example@gmail.com (Optional)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
              />

              <input
                type="text"
                required
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="House no. / building / street / area *"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  value={cityDistrict}
                  onChange={(e) => setCityDistrict(e.target.value)}
                  placeholder="City / District / State *"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
                <input
                  type="text"
                  value={areaThana}
                  onChange={(e) => setAreaThana(e.target.value)}
                  placeholder="Area / Thana / Postal Zip Code"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Delivery Zone ({currency.country})
                  </label>
                  <select
                    value={deliveryZone}
                    onChange={(e) => setDeliveryZone(e.target.value as "inside" | "outside" | "free")}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                  >
                    <option value="inside">
                      Inside City / Metro ({formatMoney(currency.insideDelivery)})
                    </option>
                    <option value="outside">
                      Outside City / Nationwide ({formatMoney(currency.outsideDelivery)})
                    </option>
                    <option value="free">Free Promotional Delivery ({formatMoney(0)})</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Order Source
                  </label>
                  <select
                    value={channelSource}
                    onChange={(e) => setChannelSource(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Facebook Ad">Facebook Ad</option>
                    <option value="Instagram Ad">Instagram Ad</option>
                    <option value="TikTok Campaign">TikTok Campaign</option>
                    <option value="Website Store">Website Store</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Real Bank/Wallet Verification (Customer enters OTP sent to their phone by their Bank/Wallet) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-900 border-l-4 border-orange-500 pl-2.5">
                  Payment Method ({currency.country})
                </h2>
                <span className="text-[11px] font-bold text-slate-500">{currency.code}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("COD")}
                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                    paymentMethod === "COD"
                      ? "border-orange-500 bg-orange-50/40 ring-2 ring-orange-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                    <Truck className="w-4 h-4 text-orange-600" /> Cash On Delivery
                  </span>
                  {paymentMethod === "COD" && (
                    <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("Online Payment")}
                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                    paymentMethod === "Online Payment"
                      ? "border-orange-500 bg-orange-50/40 ring-2 ring-orange-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                    <CreditCard className="w-4 h-4 text-indigo-600" /> Online Bank / Card
                  </span>
                  {paymentMethod === "Online Payment" && (
                    <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("Mobile Wallet")}
                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer sm:col-span-2 ${
                    paymentMethod === "Mobile Wallet"
                      ? "border-orange-500 bg-orange-50/40 ring-2 ring-orange-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                    <Tag className="w-4 h-4 text-pink-600" />
                    Mobile Wallet ({currency.mobileWallets.slice(0, 3).join(" / ")})
                  </span>
                  {paymentMethod === "Mobile Wallet" && (
                    <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  )}
                </button>
              </div>

              {paymentMethod !== "COD" && (
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-orange-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      {paymentMethod === "Online Payment"
                        ? `Select Bank / Card (${currency.country})`
                        : `Select Mobile Wallet (${currency.country})`}
                    </span>
                    <span className="font-extrabold">{formatMoney(grandTotal)}</span>
                  </div>

                  <select
                    value={selectedBankOrWallet}
                    onChange={(e) => {
                      setSelectedBankOrWallet(e.target.value);
                      setAwaitingPhoneOtp(false);
                      setIsPaymentVerified(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white"
                  >
                    {(paymentMethod === "Online Payment"
                      ? currency.onlineBanks
                      : currency.mobileWallets
                    ).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={payerAccountOrCard}
                      onChange={(e) => {
                        setPayerAccountOrCard(e.target.value);
                        setIsPaymentVerified(false);
                      }}
                      placeholder={
                        paymentMethod === "Online Payment"
                          ? "Enter Card or Bank Account Number *"
                          : "Enter Registered Wallet Number (e.g. 017XXXXXXXX) *"
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                    />

                    {paymentMethod === "Online Payment" && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="Expiry MM/YY *"
                          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                        />
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="CVV *"
                          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                        />
                      </div>
                    )}
                  </div>

                  {paymentStepError && (
                    <div className="text-[11px] font-bold text-rose-400">{paymentStepError}</div>
                  )}

                  {!awaitingPhoneOtp && !isPaymentVerified && (
                    <button
                      type="button"
                      onClick={handleInitiateGatewayOtp}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition cursor-pointer"
                    >
                      Proceed to {selectedBankOrWallet} Verification
                    </button>
                  )}

                  {/* Step 2: Customer enters the OTP / Code sent by their Bank / Mobile Wallet to their phone */}
                  {awaitingPhoneOtp && !isPaymentVerified && (
                    <div className="p-3 rounded-xl bg-slate-800 border border-indigo-500/40 space-y-2.5">
                      <div className="text-[11px] text-slate-200 leading-relaxed">
                        Please enter the <strong>OTP / Verification Code</strong> sent by{" "}
                        <strong>{selectedBankOrWallet}</strong> to your registered mobile phone:
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customerPhoneOtpOrTrx}
                          onChange={(e) => setCustomerPhoneOtpOrTrx(e.target.value)}
                          placeholder="Enter Phone OTP / Trx Code *"
                          className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-xs text-white font-mono font-bold"
                        />
                        <button
                          type="button"
                          onClick={handleConfirmPhoneOtp}
                          className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs cursor-pointer"
                        >
                          Confirm &amp; Pay
                        </button>
                      </div>
                    </div>
                  )}

                  {isPaymentVerified && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      Payment Verified ({selectedBankOrWallet} • {paymentTrxId})
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="text-xs font-extrabold text-slate-800">
                Have a Product Promo / Coupon Code?
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter exact product promo code"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold cursor-pointer"
                >
                  Apply coupon
                </button>
              </div>

              {couponMessage && (
                <div
                  className={`text-xs font-bold p-2.5 rounded-xl ${
                    couponMessage.type === "ok"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {couponMessage.text}
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Sub total ({qtyNum} items)</span>
                  <span className="font-bold text-slate-900">{formatMoney(subTotal)}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Promo Discount</span>
                    <span>-{formatMoney(appliedDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Delivery cost</span>
                  <span className="font-bold text-slate-900">{formatMoney(deliveryCost)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span>{formatMoney(grandTotal)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 border-l-4 border-orange-500 pl-2.5">
                Special notes <span className="text-xs font-normal text-slate-400">(Optional)</span>
              </h2>
              <textarea
                rows={2}
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="Any special delivery instruction..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />

              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="rounded text-orange-500"
                />
                <span>
                  I confirm Size (<strong>{selectedSize}</strong>), Color (
                  <strong>{preferredColor || "In Stock"}</strong>), and Quantity (
                  <strong>{qtyNum}</strong>).
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting || !agreedTerms || (paymentMethod !== "COD" && !isPaymentVerified)}
                className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-extrabold text-sm shadow-md transition cursor-pointer"
              >
                {submitting
                  ? "PLACING ORDER..."
                  : paymentMethod !== "COD" && !isPaymentVerified
                  ? "VERIFY PAYMENT ABOVE FIRST"
                  : `PLACE ORDER (${formatMoney(grandTotal)})`}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* AI Instant Order Assistant with Smart Category Search & Direct Order Page Links */}
      {showChatBox && (
        <div className="fixed bottom-5 right-5 z-50 w-96 max-w-[92vw] bg-white rounded-2xl border border-slate-300 shadow-2xl overflow-hidden">
          <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {humanHandedOff ? (
                <UserCheck className="w-4 h-4 text-amber-400" />
              ) : (
                <Bot className="w-4 h-4 text-indigo-400" />
              )}
              <span className="text-xs font-extrabold">
                {humanHandedOff ? "Human Sales Agent" : "AI Instant Order Assistant"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHumanHandedOff(!humanHandedOff)}
                className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold cursor-pointer"
              >
                {humanHandedOff ? "Use AI" : "Human Agent"}
              </button>
              <button
                type="button"
                onClick={() => setShowChatBox(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="h-80 overflow-y-auto p-3.5 space-y-2.5 bg-slate-50 text-xs">
            {chatMessages.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  m.sender === "buyer" ? "items-end" : m.sender === "system" ? "items-center" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 whitespace-pre-line ${
                    m.sender === "buyer"
                      ? "bg-indigo-600 text-white"
                      : m.sender === "system"
                      ? "bg-amber-100 text-amber-900 font-bold"
                      : "bg-white border border-slate-200 text-slate-800"
                  }`}
                >
                  {m.text}
                </div>

                {/* Clickable Category / Product Order Links inside Chat */}
                {m.matchedProducts && m.matchedProducts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 max-w-[88%]">
                    {m.matchedProducts.map((mp) => (
                      <button
                        key={mp.id}
                        type="button"
                        onClick={() => {
                          handleSelectCatalogProduct(mp);
                          setAiDraft((prev) => ({ ...prev, product: mp }));
                          document.getElementById("store-catalog-top")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" /> Visit &amp; Order: {mp.name} ({formatMoney(mp.effective_price)})
                      </button>
                    ))}
                  </div>
                )}

                {m.showPaymentWidget && aiDraft.product && (
                  <div className="mt-2 w-[88%] p-3 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
                    <div className="text-[11px] font-bold text-orange-400">
                      {aiDraft.paymentChoice === "Wallet"
                        ? currency.mobileWallets[0]
                        : currency.onlineBanks[0]}{" "}
                      — {formatMoney(Number(aiDraft.product.effective_price) * aiDraft.qty)}
                    </div>
                    <input
                      type="text"
                      value={chatPayAccount}
                      onChange={(e) => setChatPayAccount(e.target.value)}
                      placeholder="Enter Card or Wallet Number *"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-xs text-white"
                    />
                    {!chatAwaitingOtp ? (
                      <button
                        type="button"
                        onClick={handleChatInitiateGateway}
                        className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
                      >
                        Proceed to OTP Verification
                      </button>
                    ) : (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[10px] text-slate-300">
                          Enter the OTP sent by your bank/wallet to your phone:
                        </div>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={chatOtpInput}
                            onChange={(e) => setChatOtpInput(e.target.value)}
                            placeholder="Enter Phone OTP *"
                            className="flex-1 px-2.5 py-1 rounded bg-slate-800 border border-slate-600 text-xs text-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleChatVerifyOtpAndOrder}
                            className="px-3 py-1 rounded bg-emerald-500 text-slate-950 font-extrabold text-xs cursor-pointer"
                          >
                            Confirm &amp; Pay
                          </button>
                        </div>
                      </div>
                    )}
                    {chatPayError && (
                      <div className="text-[10px] text-rose-400 font-bold">{chatPayError}</div>
                    )}
                  </div>
                )}

                {m.receiptOrder && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        downloadOfficialOrderReceipt(
                          {
                            order_id: String(m.receiptOrder!.order_id),
                            customer: String(m.receiptOrder!.customer),
                            customer_phone: String(m.receiptOrder!.customer_phone || ""),
                            delivery_address: String(m.receiptOrder!.delivery_address || ""),
                            channel: String(m.receiptOrder!.channel || "AI Chat"),
                            product_name: String(m.receiptOrder!.product_name),
                            product_sku: String(m.receiptOrder!.product_sku || ""),
                            selected_size: String(m.receiptOrder!.selected_size || ""),
                            selected_color: String(m.receiptOrder!.selected_color || ""),
                            quantity: Number(m.receiptOrder!.quantity || 1),
                            discount_amount: Number(m.receiptOrder!.discount_amount || 0),
                            amount: Number(m.receiptOrder!.amount || 0),
                            payment: String(m.receiptOrder!.payment || "COD"),
                            created_at: String(m.receiptOrder!.created_at || ""),
                          },
                          symbol
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> Download Official Receipt
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        printIsolatedOrderSlip(
                          {
                            order_id: String(m.receiptOrder!.order_id),
                            customer: String(m.receiptOrder!.customer),
                            customer_phone: String(m.receiptOrder!.customer_phone || ""),
                            delivery_address: String(m.receiptOrder!.delivery_address || ""),
                            channel: String(m.receiptOrder!.channel || "AI Chat"),
                            product_name: String(m.receiptOrder!.product_name),
                            product_sku: String(m.receiptOrder!.product_sku || ""),
                            selected_size: String(m.receiptOrder!.selected_size || ""),
                            selected_color: String(m.receiptOrder!.selected_color || ""),
                            quantity: Number(m.receiptOrder!.quantity || 1),
                            discount_amount: Number(m.receiptOrder!.discount_amount || 0),
                            amount: Number(m.receiptOrder!.amount || 0),
                            payment: String(m.receiptOrder!.payment || "COD"),
                            created_at: String(m.receiptOrder!.created_at || ""),
                          },
                          symbol
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-extrabold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3 h-3" /> Print Slip
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleChatSend} className="p-2.5 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={
                !aiDraft.product
                  ? "Search product or category (e.g. Shoes / জুতা / Shirt)..."
                  : !aiDraft.size
                  ? "Enter Size (e.g. 41 or XL)..."
                  : !aiDraft.color
                  ? "Enter Color (e.g. White)..."
                  : !aiDraft.qty
                  ? "Enter Quantity (e.g. 1 or 2)..."
                  : !aiDraft.phone
                  ? "Enter Name, Phone & Address..."
                  : "Enter COD, Online Payment, or Wallet..."
              }
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}