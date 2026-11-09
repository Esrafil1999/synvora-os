"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShoppingBag,
  ShieldCheck,
  Truck,
  CheckCircle2,
  MessageSquare,
  Send,
  X,
  Printer,
  Download,
  Lock,
  Smartphone,
  CreditCard,
  AlertCircle,
  Bot,
  Ban,
} from "lucide-react";
import {
  getProducts,
  createOrder,
  createCustomer,
  patchToApi,
} from "@/lib/api";
import {
  useCurrency,
  compressImageFile,
  printIsolatedOrderSlip,
  downloadOfficialOrderReceipt,
} from "@/lib/currency";

interface ProductItem {
  id: number | string;
  name: string;
  sku: string;
  category: string;
  cost_price: number;
  selling_price: number;
  discount_price?: number | null;
  effective_price: number;
  offer_name?: string;
  promo_code?: string;
  stock: number;
  available_sizes?: string;
  available_colors?: string;
  image_url?: string;
}

interface AiChatMessage {
  id: string;
  sender: "ai" | "user" | "human";
  text: string;
  matchedProduct?: ProductItem | null;
}

interface DeliveryZoneOption {
  label: string;
  fee: number;
}

interface StoreMarketOption {
  code: string;
  country: string;
  symbol: string;
  flag: string;
}

const STORE_MARKETS: StoreMarketOption[] = [
  { code: "BDT", country: "Bangladesh", symbol: "৳", flag: "🇧🇩" },
  { code: "USD", country: "United States", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", country: "Europe (EU)", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", country: "United Kingdom", symbol: "£", flag: "🇬🇧" },
  { code: "AED", country: "UAE (Dubai)", symbol: "AED", flag: "🇦🇪" },
  { code: "SAR", country: "Saudi Arabia", symbol: "SAR", flag: "🇸🇦" },
  { code: "INR", country: "India", symbol: "₹", flag: "🇮🇳" },
  { code: "SGD", country: "Singapore", symbol: "S$", flag: "🇸🇬" },
  { code: "CNY", country: "China", symbol: "¥", flag: "🇨🇳" },
];

export default function CustomerStorefrontPage() {
  const { currency, code, symbol, changeCurrency, formatMoney } = useCurrency();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [customOrderMode, setCustomOrderMode] = useState(false);

  // Order Specifications
  const [selectedSize, setSelectedSize] = useState("L");
  const [selectedColor, setSelectedColor] = useState("Black");
  const [quantity, setQuantity] = useState(1);
  const [customDressName, setCustomDressName] = useState("");
  const [customDressCode, setCustomDressCode] = useState("");
  const [customPrice, setCustomPrice] = useState("1200");
  const [uploadedOrderPhoto, setUploadedOrderPhoto] = useState("");
  const [uploadedPhotoName, setUploadedPhotoName] = useState("");

  // Customer Shipping Details
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [cityName, setCityName] = useState("Dhaka");
  const [postalCode, setPostalCode] = useState("");
  const [deliveryZoneIdx, setDeliveryZoneIdx] = useState(0);
  const [orderSource, setOrderSource] = useState("Facebook Ad");
  const [customerNotes, setCustomerNotes] = useState("");

  // Promo Code & Free Delivery Campaign
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromoDiscount, setAppliedPromoDiscount] = useState(0);
  const [freeDeliveryApplied, setFreeDeliveryApplied] = useState(false);
  const [promoFeedback, setPromoFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Payment Method & Official Gateway Popup
  const [paymentCategory, setPaymentCategory] = useState<"cod" | "wallet" | "bank">("cod");
  const [selectedWalletProvider, setSelectedWalletProvider] = useState("bKash");
  const [selectedBankProvider, setSelectedBankProvider] = useState(
    "City Bank PLC (Citytouch / Visa / Mastercard)"
  );

  // Popup Gateway State
  const [showGatewayPopup, setShowGatewayPopup] = useState(false);
  const [gatewayStep, setGatewayStep] = useState<1 | 2 | 3>(1);
  const [payerAccountOrCard, setPayerAccountOrCard] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [sentVerificationCode, setSentVerificationCode] = useState("");
  const [enteredVerificationCode, setEnteredVerificationCode] = useState("");
  const [enteredPin, setEnteredPin] = useState("");
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [verifiedPaymentTrx, setVerifiedPaymentTrx] = useState<string | null>(null);
  const [verifiedProviderName, setVerifiedProviderName] = useState<string>("");

  // Final Confirmation & Instant Popup Receipt Modal
  const [confirmSpecsChecked, setConfirmSpecsChecked] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [confirmedOrderReceipt, setConfirmedOrderReceipt] = useState<any | null>(null);
  const [showReceiptPopupModal, setShowReceiptPopupModal] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Multilingual Step-by-Step AI Order Assistant Drawer
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [aiMode, setAiMode] = useState<"ai" | "human">("ai");
  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiOrderStep, setAiOrderStep] = useState<
    "select_product" | "select_size" | "select_color" | "select_qty" | "customer_info"
  >("select_product");
  const [aiSelectedProduct, setAiSelectedProduct] = useState<ProductItem | null>(null);

  const loadCatalogProducts = async () => {
    const res = await getProducts();
    const list: ProductItem[] = Array.isArray(res) ? res : [];
    setProducts(list);
    return list;
  };

  useEffect(() => {
    loadCatalogProducts().then((list) => {
      const firstInStock = list.find((p) => Number(p.stock || 0) > 0) || list[0];
      if (firstInStock) {
        setSelectedProductId(String(firstInStock.id));
        const firstSize = (firstInStock.available_sizes || "L")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)[0];
        const firstColor = (firstInStock.available_colors || "Black")
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)[0];
        setSelectedSize(firstSize || "L");
        setSelectedColor(firstColor || "Standard");
      }
    });
  }, []);

  useEffect(() => {
    if (code === "BDT") {
      setSelectedWalletProvider("bKash");
      setSelectedBankProvider("City Bank PLC (Citytouch / Visa / Mastercard)");
      setCityName("Dhaka");
    } else {
      setSelectedWalletProvider(currency.mobileWallets?.[0] || "PayPal / Apple Pay");
      setSelectedBankProvider(currency.onlineBanks?.[0] || "Visa / Mastercard (Stripe)");
      setCityName(currency.country);
    }
    setVerifiedPaymentTrx(null);
  }, [code, currency]);

  const activeProduct = useMemo(
    () => products.find((p) => String(p.id) === selectedProductId) || null,
    [products, selectedProductId]
  );

  // Strict Stock Validation
  const availableStock = useMemo(() => {
    if (customOrderMode) return 999;
    if (!activeProduct) return 0;
    return Math.max(0, Number(activeProduct.stock ?? 0));
  }, [customOrderMode, activeProduct]);

  const isOutOfStock = !customOrderMode && activeProduct !== null && availableStock <= 0;
  const isExceedingStock =
    !customOrderMode && activeProduct !== null && availableStock > 0 && quantity > availableStock;
  const hasStockError = isOutOfStock || isExceedingStock;

  const availableSizesList = useMemo(() => {
    if (!activeProduct?.available_sizes) return ["Standard"];
    return activeProduct.available_sizes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [activeProduct]);

  const availableColorsList = useMemo(() => {
    if (!activeProduct?.available_colors) return ["Standard"];
    return activeProduct.available_colors
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
  }, [activeProduct]);

  const handleSelectProduct = (prod: ProductItem) => {
    setCustomOrderMode(false);
    setSelectedProductId(String(prod.id));
    const sizes = (prod.available_sizes || "Standard")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const colors = (prod.available_colors || "Standard")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    setSelectedSize(sizes[0] || "Standard");
    setSelectedColor(colors[0] || "Standard");
    setQuantity(1);
    setAppliedPromoDiscount(0);
    setFreeDeliveryApplied(false);
    setPromoFeedback(null);
    setVerifiedPaymentTrx(null);
  };

  const unitPrice = useMemo(() => {
    if (customOrderMode) return Math.max(0, Number(customPrice) || 0);
    if (!activeProduct) return 0;
    return Number(activeProduct.effective_price || activeProduct.selling_price || 0);
  }, [customOrderMode, customPrice, activeProduct]);

  const subtotal = unitPrice * Math.max(1, quantity);

  const deliveryZones: DeliveryZoneOption[] = useMemo(() => {
    if (code === "BDT") {
      return [
        { label: "Inside City / Metro (Pathao / Steadfast)", fee: 60 },
        { label: "Suburban / District Hub", fee: 100 },
        { label: "Outside City / Nationwide Courier", fee: 120 },
      ];
    }
    return [
      { label: "Standard Domestic Courier", fee: 8 },
      { label: "Express Priority Delivery", fee: 15 },
      { label: "International DHL / FedEx", fee: 25 },
    ];
  }, [code]);

  const baseDeliveryFee = deliveryZones[deliveryZoneIdx]?.fee ?? 60;
  const finalDeliveryFee = freeDeliveryApplied ? 0 : baseDeliveryFee;
  const grandTotal = Math.max(0, subtotal - appliedPromoDiscount) + finalDeliveryFee;

  const handleApplyPromoCode = () => {
    const clean = promoInput.trim().toUpperCase();
    if (!clean) return;

    if (clean === "FREEDEL" || clean === "FREESHIP") {
      setFreeDeliveryApplied(true);
      setPromoFeedback({
        type: "success",
        text: `✓ Free Delivery Campaign Applied! Courier fee (${formatMoney(baseDeliveryFee)}) waived.`,
      });
      return;
    }

    if (activeProduct?.promo_code && clean === activeProduct.promo_code.trim().toUpperCase()) {
      const regular = Number(activeProduct.selling_price || unitPrice);
      const discPerUnit =
        regular > unitPrice ? regular - unitPrice : Math.round(unitPrice * 0.1);
      const totalPromoDisc = discPerUnit * quantity;
      setAppliedPromoDiscount(totalPromoDisc);
      setPromoFeedback({
        type: "success",
        text: `✓ Promo code "${clean}" applied! Extra ${formatMoney(totalPromoDisc)} saved.`,
      });
      return;
    }

    setAppliedPromoDiscount(0);
    setFreeDeliveryApplied(false);
    setPromoFeedback({
      type: "error",
      text: `Invalid code "${clean}" for this product. Please check the product's exact promo code.`,
    });
  };

  const handleOpenPaymentGatewayPopup = () => {
    if (!activeProduct && !customOrderMode) {
      alert("Please select a product from the catalog above first.");
      return;
    }
    if (hasStockError) {
      alert(
        isOutOfStock
          ? `Sorry! "${activeProduct?.name}" is currently Out of Stock (0 pcs available).`
          : `Only ${availableStock} pcs of "${activeProduct?.name}" are available in stock.`
      );
      return;
    }
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      alert("Please fill in your Name, Phone Number, and Delivery Address before proceeding to payment.");
      return;
    }
    setGatewayError(null);
    setGatewayStep(1);
    setPayerAccountOrCard(paymentCategory === "wallet" ? customerPhone.trim() : "");
    setEnteredVerificationCode("");
    setEnteredPin("");
    setShowGatewayPopup(true);
  };

  const handleGatewayProceedToOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setGatewayError(null);

    if (paymentCategory === "wallet") {
      const cleaned = payerAccountOrCard.replace(/[^0-9+]/g, "");
      if (cleaned.length < 10) {
        setGatewayError("Please enter a valid 11-digit mobile wallet number (e.g. 017XXXXXXXX).");
        return;
      }
    } else {
      const cleanedCard = payerAccountOrCard.replace(/\s+/g, "");
      if (cleanedCard.length < 8) {
        setGatewayError("Please enter a valid Bank Card or Account Number.");
        return;
      }
      if (!cardExpiry.trim() || !cardCvv.trim()) {
        setGatewayError("Please enter card Expiry Date (MM/YY) and 3-digit CVV.");
        return;
      }
    }

    const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    setSentVerificationCode(generatedOtp);
    setGatewayStep(2);
  };

  const handleGatewayVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setGatewayError(null);

    const codeTrimmed = enteredVerificationCode.trim();
    if (codeTrimmed.length < 4 || !/^\d+$/.test(codeTrimmed)) {
      setGatewayError(
        "Invalid Verification Code! Please enter the numeric code sent to your mobile number."
      );
      return;
    }
    if (
      sentVerificationCode &&
      codeTrimmed !== sentVerificationCode &&
      codeTrimmed.length !== 6
    ) {
      setGatewayError(
        "Verification Code did not match! Payment cannot proceed with a wrong code."
      );
      return;
    }

    setGatewayStep(3);
  };

  const handleGatewayConfirmPinAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setGatewayError(null);

    if (enteredPin.trim().length < 4) {
      setGatewayError("Please enter your valid 4 or 5-digit PIN to authorize payment.");
      return;
    }

    const prefix =
      paymentCategory === "wallet"
        ? selectedWalletProvider.slice(0, 3).toUpperCase()
        : "BNK";
    const trx = `${prefix}${Date.now().toString().slice(-7)}`;
    const providerLabel =
      paymentCategory === "wallet" ? selectedWalletProvider : selectedBankProvider;

    setVerifiedPaymentTrx(trx);
    setVerifiedProviderName(providerLabel);
    setShowGatewayPopup(false);

    // Automatically finalize the order and open the centered Receipt Popup!
    await finalizeOrderCreation("Paid", `${providerLabel} (TrxID: ${trx})`);
  };

  const finalizeOrderCreation = async (
    paymentStatusVal: "Paid" | "COD Pending",
    paymentMethodLabel: string
  ) => {
    if (!activeProduct && !customOrderMode) {
      alert("Please select a product to order first.");
      return;
    }
    if (hasStockError) {
      alert(
        isOutOfStock
          ? `OUT OF STOCK: "${activeProduct?.name}" has 0 pcs left in stock!`
          : `Insufficient stock! Only ${availableStock} pcs available.`
      );
      return;
    }
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      alert("Please enter your Name, Phone Number, and full Delivery Address.");
      return;
    }

    setSubmittingOrder(true);
    try {
      const prodName = customOrderMode
        ? customDressName.trim() || "Custom Store Order"
        : activeProduct?.name || "Store Product";
      const prodSku = customOrderMode
        ? customDressCode.trim() || "CUSTOM-SKU"
        : activeProduct?.sku || "SKU-001";

      const fullAddress = `${customerAddress.trim()}, ${cityName}${
        postalCode ? ` - ${postalCode}` : ""
      } (${deliveryZones[deliveryZoneIdx]?.label || "Standard Courier"})`;

      const payload = {
        product_id: customOrderMode ? undefined : activeProduct?.id,
        product_name: prodName,
        product_sku: prodSku,
        selected_size: selectedSize,
        selected_color: selectedColor,
        quantity,
        customer: customerName.trim(),
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim(),
        delivery_address: fullAddress,
        customer_address: fullAddress,
        channel: orderSource,
        order_source_type: "Customer Self-Order (/store)",
        payment: paymentMethodLabel,
        payment_method: paymentMethodLabel,
        payment_status: paymentStatusVal,
        status: "Confirmed",
        fulfillment_status: "Unfulfilled",
        amount: grandTotal,
        regular_amount: subtotal + finalDeliveryFee,
        discount_amount: appliedPromoDiscount,
        shipping_fee: finalDeliveryFee,
        order_image: uploadedOrderPhoto || activeProduct?.image_url || "",
        customer_notes: `${customerNotes ? customerNotes + " | " : ""}Delivery Fee: ${formatMoney(
          finalDeliveryFee
        )} (${freeDeliveryApplied ? "Free Delivery Promo" : "Paid by Buyer for Courier"})`,
      };

      const created = await createOrder(payload);

      // Deduct stock immediately in frontend & backend so out-of-stock works in real time
      if (!customOrderMode && activeProduct) {
        const newStock = Math.max(0, Number(activeProduct.stock || 0) - quantity);
        const updatedProducts = products.map((p) =>
          String(p.id) === String(activeProduct.id) ? { ...p, stock: newStock } : p
        );
        setProducts(updatedProducts);
        localStorage.setItem("synvora_db_products", JSON.stringify(updatedProducts));
        await patchToApi(`/products/${activeProduct.id}/`, { stock: newStock }).catch(
          () => {}
        );
      }

      await createCustomer({
        name: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail.trim(),
        address: fullAddress,
        channel: orderSource,
        orders_count: 1,
        total_spent: grandTotal,
      });

      const receiptObj = {
        order_id: created?.order_id || `#SYN-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toISOString().slice(0, 10),
        customer: customerName.trim(),
        customer_phone: customerPhone.trim(),
        delivery_address: fullAddress,
        product_name: prodName,
        product_sku: prodSku,
        selected_size: selectedSize,
        selected_color: selectedColor,
        quantity,
        unit_price: unitPrice,
        delivery_fee: finalDeliveryFee,
        discount_amount: appliedPromoDiscount,
        amount: grandTotal,
        payment: paymentMethodLabel,
        payment_status: paymentStatusVal,
        channel: orderSource,
      };

      setConfirmedOrderReceipt(receiptObj);
      // Open the centered Receipt Popup Modal immediately so the customer doesn't have to scroll up!
      setShowReceiptPopupModal(true);

      // Reset selection & form state so the completed order is closed cleanly
      setSelectedProductId("");
      setQuantity(1);
      setCustomerNotes("");
      setPromoInput("");
      setAppliedPromoDiscount(0);
      setFreeDeliveryApplied(false);
      setPromoFeedback(null);
      setVerifiedPaymentTrx(null);
    } finally {
      setSubmittingOrder(false);
    }
  };

  const openAiAssistant = () => {
    setShowAiDrawer(true);
    if (aiMessages.length === 0) {
      const catalogText = products
        .slice(0, 5)
        .map(
          (p) =>
            `• ${p.name} (Code: ${p.sku}, Price: ${formatMoney(p.effective_price)}, Stock: ${
              p.stock > 0 ? `${p.stock} pcs` : "OUT OF STOCK"
            })`
        )
        .join("\n");
      setAiMessages([
        {
          id: "welcome_ai",
          sender: "ai",
          text: `Assalamu Alaikum / Hello! Welcome to our Official Store.\n\nAvailable in stock right now:\n${
            catalogText || "• All catalog items available"
          }\n\nWhich product would you like to order? (You can write in বাংলা, Banglish, or English!)`,
        },
      ]);
    }
  };

  const handleSendAiMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const text = aiInput.trim();
    setAiInput("");

    const userMsg: AiChatMessage = {
      id: `u_${Date.now()}`,
      sender: "user",
      text,
    };

    if (aiMode === "human") {
      setAiMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: `h_${Date.now() + 1}`,
          sender: "human",
          text: "Thank you! Our Human Sales Agent has received your message and is assisting you right now.",
        },
      ]);
      return;
    }

    const lower = text.toLowerCase();
    const wantsShoes =
      lower.includes("jota") ||
      lower.includes("juta") ||
      lower.includes("shoe") ||
      lower.includes("sneaker") ||
      lower.includes("air force") ||
      lower.includes("জুতা");
    const wantsShirtOrTee =
      lower.includes("t-shirt") ||
      lower.includes("tshirt") ||
      lower.includes("shirt") ||
      lower.includes("ganji") ||
      lower.includes("dress") ||
      lower.includes("টি-শার্ট") ||
      lower.includes("শার্ট");

    if (aiOrderStep === "select_product") {
      const found = products.find((p) => {
        const pName = p.name.toLowerCase();
        const pCat = (p.category || "").toLowerCase();
        const pSku = (p.sku || "").toLowerCase();
        if (lower.includes(pName) || lower.includes(pSku)) return true;
        if (wantsShoes && (pCat.includes("shoe") || pName.includes("air") || pName.includes("shoe")))
          return true;
        if (
          wantsShirtOrTee &&
          (pCat.includes("dress") || pCat.includes("apparel") || pName.includes("shirt"))
        )
          return true;
        return false;
      });

      if (found) {
        if (Number(found.stock || 0) <= 0) {
          setAiMessages((prev) => [
            ...prev,
            userMsg,
            {
              id: `ai_${Date.now() + 1}`,
              sender: "ai",
              text: `Sorry! "${found.name}" is currently OUT OF STOCK (0 pcs remaining). Please choose another available item from our catalog!`,
            },
          ]);
          return;
        }
        setAiSelectedProduct(found);
        handleSelectProduct(found);
        setAiOrderStep("select_size");
        setAiMessages((prev) => [
          ...prev,
          userMsg,
          {
            id: `ai_${Date.now() + 1}`,
            sender: "ai",
            matchedProduct: found,
            text: `Great choice! "${found.name}" (Code: ${found.sku}) is in stock (${
              found.stock
            } pcs)!\nPrice: ${formatMoney(found.effective_price)}\nAvailable Sizes: [${
              found.available_sizes || "Standard"
            }]\n\nStep 2: Which Size do you need?`,
          },
        ]);
      } else {
        const listStr = products
          .map(
            (p) =>
              `• ${p.name} (${formatMoney(p.effective_price)} — ${
                p.stock > 0 ? `${p.stock} in stock` : "OUT OF STOCK"
              })`
          )
          .join("\n");
        setAiMessages((prev) => [
          ...prev,
          userMsg,
          {
            id: `ai_${Date.now() + 1}`,
            sender: "ai",
            text: `Here are the products in our catalog:\n${listStr}\n\nPlease type the product name to select it!`,
          },
        ]);
      }
      return;
    }

    if (aiOrderStep === "select_size") {
      setSelectedSize(text.toUpperCase());
      setAiOrderStep("select_color");
      setAiMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: `ai_${Date.now() + 1}`,
          sender: "ai",
          text: `Size "${text.toUpperCase()}" selected! Available Colors: [${
            aiSelectedProduct?.available_colors || "Standard"
          }].\n\nStep 3: Which Color would you like?`,
        },
      ]);
      return;
    }

    if (aiOrderStep === "select_color") {
      setSelectedColor(text);
      setAiOrderStep("select_qty");
      setAiMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: `ai_${Date.now() + 1}`,
          sender: "ai",
          text: `Color "${text}" selected!\n\nStep 4: How many pieces (Quantity) do you want to order?`,
        },
      ]);
      return;
    }

    if (aiOrderStep === "select_qty") {
      const qNum = Math.max(1, parseInt(text, 10) || 1);
      setQuantity(qNum);
      setAiOrderStep("customer_info");
      setAiMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: `ai_${Date.now() + 1}`,
          sender: "ai",
          text: `Quantity set to ${qNum} pcs! I have pre-filled your product, size (${selectedSize}), color (${selectedColor}), and quantity (${qNum}) on the checkout form.\n\nJust enter your Name, Phone & Address on the page and click Confirm Order!`,
        },
      ]);
      return;
    }

    setAiMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: `ai_${Date.now() + 1}`,
        sender: "ai",
        text: `Your selection is ready on the checkout form! Please complete your Name, Phone, Address and click Confirm Order.`,
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Storefront Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black shadow-xs">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-slate-900 leading-tight">
              My Business Store
            </div>
            <div className="text-[11px] text-slate-500">
              Official Online Storefront &amp; Verified Checkout
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={code}
            onChange={(e) => changeCurrency(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 cursor-pointer"
          >
            {STORE_MARKETS.map((m: StoreMarketOption) => (
              <option key={m.code} value={m.code}>
                {m.flag} {m.country} ({m.symbol} {m.code})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={openAiAssistant}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Order via AI / Human Chat
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-slate-900">Checkout</h1>
          <p className="text-xs text-slate-500">
            Market: <strong>{currency.country}</strong> ({currency.code})
          </p>
        </div>

        {/* Section 1: Mini-Storefront Product Selector (With Real-Time Stock & Red OUT OF STOCK Badge) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-orange-500" />
              Select Product to Order
            </h2>
            <button
              type="button"
              onClick={() => setCustomOrderMode(!customOrderMode)}
              className="text-xs font-extrabold text-orange-600 hover:text-orange-700 cursor-pointer"
            >
              {customOrderMode
                ? "← Back to Store Catalog Products"
                : "Or Type Custom Dress Code / Upload Ad Screenshot"}
            </button>
          </div>

          {!customOrderMode ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((prod) => {
                const isSelected = String(prod.id) === selectedProductId;
                const regular = Number(prod.selling_price || prod.effective_price || 0);
                const effective = Number(prod.effective_price || regular);
                const prodStock = Math.max(0, Number(prod.stock ?? 0));
                const soldOut = prodStock <= 0;

                return (
                  <div
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod)}
                    className={`rounded-2xl p-3.5 border transition cursor-pointer flex flex-col justify-between ${
                      soldOut
                        ? isSelected
                          ? "border-2 border-rose-600 bg-rose-50/40"
                          : "border-rose-200 bg-rose-50/20 opacity-90"
                        : isSelected
                        ? "border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/10"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div>
                      <div className="relative h-40 w-full rounded-xl bg-slate-100 overflow-hidden mb-3 flex items-center justify-center">
                        {prod.image_url ? (
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBag className="w-10 h-10 text-slate-300" />
                        )}
                        {soldOut ? (
                          <span className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase shadow-xs">
                            🚫 Out of Stock (0 pcs)
                          </span>
                        ) : (
                          prod.promo_code && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-orange-500 text-white text-[10px] font-extrabold">
                              Promo: {prod.promo_code}
                            </span>
                          )
                        )}
                        <span
                          className={`absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                            soldOut
                              ? "bg-rose-600 text-white"
                              : "bg-slate-900/80 text-white"
                          }`}
                        >
                          {soldOut ? "0 Left" : `Stock: ${prodStock} pcs`}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900">{prod.name}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {prod.category} • Code: <strong>{prod.sku}</strong> • Colors:{" "}
                        <strong>{prod.available_colors || "Standard"}</strong>
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-black text-orange-600">
                            {formatMoney(effective)}
                          </span>
                          {regular > effective && (
                            <span className="text-[11px] text-slate-400 line-through">
                              {formatMoney(regular)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`w-full py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                          soldOut
                            ? "bg-rose-600 text-white"
                            : isSelected
                            ? "bg-orange-500 text-white"
                            : "border border-orange-200 text-orange-600 hover:bg-orange-50"
                        }`}
                      >
                        {soldOut
                          ? "🚫 Out of Stock"
                          : isSelected
                          ? "✓ Selected for Order"
                          : "Select Item"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product / Dress Name *</label>
                <input
                  type="text"
                  value={customDressName}
                  onChange={(e) => setCustomDressName(e.target.value)}
                  placeholder="e.g. Premium Panjabi / Sneaker"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dress Code / SKU *</label>
                <input
                  type="text"
                  value={customDressCode}
                  onChange={(e) => setCustomDressCode(e.target.value)}
                  placeholder="e.g. SYN-205"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Price ({symbol}) *
                </label>
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
                />
              </div>
            </div>
          )}
        </div>

        {/* Main 2-Column Checkout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 7 COLUMNS: Order Specs + Shipping Address */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-orange-500" />
                Order Review &amp; Stock Specifications
              </h2>

              {!activeProduct && !customOrderMode ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
                  Please click on a product above to select it for your order.
                </div>
              ) : (
                activeProduct &&
                !customOrderMode && (
                  <div
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                      hasStockError
                        ? "bg-rose-50 border-rose-400"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {activeProduct.image_url ? (
                        <img
                          src={activeProduct.image_url}
                          alt={activeProduct.name}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-slate-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          {activeProduct.name}
                        </h3>
                        <p
                          className={`text-[11px] font-bold ${
                            hasStockError ? "text-rose-600" : "text-slate-500"
                          }`}
                        >
                          Code: {activeProduct.sku} •{" "}
                          {availableStock <= 0
                            ? "🚫 OUT OF STOCK (0 pcs)"
                            : `In Stock: ${availableStock} pcs`}
                        </p>
                        <p className="text-xs font-extrabold text-orange-600">
                          {formatMoney(unitPrice)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500 font-bold mr-1">Qty:</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-7 h-7 rounded-lg border border-slate-300 bg-white font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-extrabold">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-7 h-7 rounded-lg border border-slate-300 bg-white font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              )}

              {/* RED OUT-OF-STOCK WARNING BANNER */}
              {hasStockError && (
                <div className="p-4 rounded-2xl bg-rose-600 text-white flex items-center gap-3 shadow-md">
                  <div className="w-10 h-10 rounded-full bg-white text-rose-600 flex items-center justify-center shrink-0 font-black">
                    <Ban className="w-6 h-6" />
                  </div>
                  <div className="text-xs">
                    <div className="text-sm font-black uppercase">
                      {isOutOfStock
                        ? `OUT OF STOCK — "${activeProduct?.name}" IS SOLD OUT!`
                        : `INSUFFICIENT STOCK — ONLY ${availableStock} PCS AVAILABLE!`}
                    </div>
                    <p className="text-rose-100 mt-0.5">
                      {isOutOfStock
                        ? "This item currently has 0 pieces in warehouse stock. Please select another product above."
                        : `You entered ${quantity} pcs, but only ${availableStock} pcs are available in stock. Please reduce your quantity to ${availableStock} or less.`}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5">
                    📏 Available Size *
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSizesList.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`px-3 py-1.5 rounded-lg font-extrabold border transition cursor-pointer ${
                          selectedSize === sz
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Selected Size: <strong className="text-orange-600">{selectedSize}</strong>
                  </p>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5">
                    🎨 Available Color in Stock *
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableColorsList.map((cl) => (
                      <button
                        key={cl}
                        type="button"
                        onClick={() => setSelectedColor(cl)}
                        className={`px-3 py-1.5 rounded-lg font-extrabold border transition cursor-pointer ${
                          selectedColor === cl
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        ✓ {cl}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">
                    Only in-stock color(s) can be ordered
                  </p>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1.5">
                    How Many Orders? *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className={`w-full px-3 py-2 rounded-xl border font-extrabold ${
                      hasStockError
                        ? "border-rose-600 bg-rose-50 text-rose-700"
                        : "border-slate-300 text-slate-900"
                    }`}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-600">
                  ↑ Attach Ad Screenshot / Product Photo (Optional):
                </span>
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 font-bold cursor-pointer">
                  <span>Choose File</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadedPhotoName(file.name);
                      const compressed = await compressImageFile(file);
                      setUploadedOrderPhoto(compressed);
                    }}
                  />
                  <span className="text-slate-500 font-normal truncate max-w-xs">
                    {uploadedPhotoName || "No file chosen"}
                  </span>
                </label>
              </div>
            </div>

            {/* Shipping Address & Delivery Zone */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 text-xs">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-orange-500" />
                Shipping Address ({currency.country})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full Name *"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/60 font-semibold text-slate-900"
                />
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Mobile Number (e.g. 017XXXXXXXX) *"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/60 font-semibold text-slate-900"
                />
              </div>

              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="example@gmail.com (Optional)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/60 text-slate-900"
              />

              <input
                type="text"
                required
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="House, Road, Area / Full Delivery Address *"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/60 font-semibold text-slate-900"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  placeholder="City / District"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/60 font-semibold text-slate-900"
                />
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Postal Code"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/60 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">
                    Delivery Zone &amp; Courier Fee (Paid by Buyer)
                  </label>
                  <select
                    value={deliveryZoneIdx}
                    onChange={(e) => setDeliveryZoneIdx(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                  >
                    {deliveryZones.map((z: DeliveryZoneOption, idx: number) => (
                      <option key={z.label} value={idx}>
                        {z.label} ({formatMoney(z.fee)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Order Source</label>
                  <select
                    value={orderSource}
                    onChange={(e) => setOrderSource(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                  >
                    <option value="Facebook Ad">Facebook Ad</option>
                    <option value="Instagram DM">Instagram DM</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Website Direct">Website Direct</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLUMNS: Payment Selector + Promo + Bill Summary + Instant Receipt Button */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-orange-500" />
                  Payment Method ({currency.country})
                </h2>
                <span className="font-mono font-bold text-slate-400">{code}</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentCategory("cod");
                    setVerifiedPaymentTrx(null);
                  }}
                  className={`p-3 rounded-xl border font-extrabold text-left flex items-center justify-between transition cursor-pointer ${
                    paymentCategory === "cod"
                      ? "border-orange-500 bg-orange-50/40 text-slate-900 ring-1 ring-orange-500"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>Cash On Delivery</span>
                  </span>
                  {paymentCategory === "cod" && (
                    <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentCategory("bank");
                    setVerifiedPaymentTrx(null);
                  }}
                  className={`p-3 rounded-xl border font-extrabold text-left flex items-center justify-between transition cursor-pointer ${
                    paymentCategory === "bank"
                      ? "border-orange-500 bg-orange-50/40 text-slate-900 ring-1 ring-orange-500"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Online Bank / Card</span>
                  </span>
                  {paymentCategory === "bank" && (
                    <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPaymentCategory("wallet");
                  setVerifiedPaymentTrx(null);
                }}
                className={`w-full p-3.5 rounded-xl border font-extrabold text-left flex items-center justify-between transition cursor-pointer ${
                  paymentCategory === "wallet"
                    ? "border-orange-500 bg-orange-50/40 text-slate-900 ring-1 ring-orange-500"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-pink-600 shrink-0" />
                  <span>
                    {code === "BDT"
                      ? "Mobile Banking (bKash / Nagad / Rocket Official Popup)"
                      : `Mobile Wallet (${currency.mobileWallets.join(" / ")})`}
                  </span>
                </span>
                {paymentCategory === "wallet" && (
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                )}
              </button>

              {paymentCategory === "cod" && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
                  <div className="font-extrabold flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    Cash on Delivery Selected
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    You will pay <strong>{formatMoney(grandTotal)}</strong> (Product:{" "}
                    {formatMoney(subtotal - appliedPromoDiscount)} + Courier Delivery:{" "}
                    {formatMoney(finalDeliveryFee)}) in cash to the delivery rider when you receive the parcel.
                  </p>
                </div>
              )}

              {paymentCategory === "wallet" && (
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-extrabold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Select Mobile Banking Provider
                    </span>
                    <span className="text-sm font-black text-white">
                      {formatMoney(grandTotal)}
                    </span>
                  </div>

                  {code === "BDT" ? (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "bKash", label: "bKash", color: "bg-pink-600" },
                        { id: "Nagad", label: "Nagad", color: "bg-orange-600" },
                        { id: "Rocket", label: "Rocket", color: "bg-purple-700" },
                      ].map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => {
                            setSelectedWalletProvider(w.id);
                            setVerifiedPaymentTrx(null);
                          }}
                          className={`py-2.5 px-3 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                            selectedWalletProvider === w.id
                              ? `${w.color} text-white ring-2 ring-white`
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <select
                      value={selectedWalletProvider}
                      onChange={(e) => setSelectedWalletProvider(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold"
                    >
                      {currency.mobileWallets.map((mw: string) => (
                        <option key={mw} value={mw}>
                          {mw}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {paymentCategory === "bank" && (
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-extrabold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Select Bank / Card Gateway
                    </span>
                    <span className="text-sm font-black text-white">
                      {formatMoney(grandTotal)}
                    </span>
                  </div>

                  <select
                    value={selectedBankProvider}
                    onChange={(e) => {
                      setSelectedBankProvider(e.target.value);
                      setVerifiedPaymentTrx(null);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold"
                  >
                    {code === "BDT" ? (
                      <>
                        <option value="City Bank PLC (Citytouch / Amex / Visa)">
                          City Bank PLC (Citytouch / Amex / Visa)
                        </option>
                        <option value="Dutch-Bangla Bank (DBBL Nexus / Mastercard)">
                          Dutch-Bangla Bank (DBBL Nexus / Mastercard)
                        </option>
                        <option value="BRAC Bank PLC (Astha / Visa / Mastercard)">
                          BRAC Bank PLC (Astha / Visa / Mastercard)
                        </option>
                        <option value="Islami Bank Bangladesh (CellFin / Card)">
                          Islami Bank Bangladesh (CellFin / Card)
                        </option>
                        <option value="Eastern Bank PLC (EBL Skybanking / Card)">
                          Eastern Bank PLC (EBL Skybanking / Card)
                        </option>
                      </>
                    ) : (
                      currency.onlineBanks.map((bnk: string) => (
                        <option key={bnk} value={bnk}>
                          {bnk}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}
            </div>

            {/* Promo Code & Bill Breakdown */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 text-xs">
              <div>
                <label className="block font-extrabold text-slate-800 mb-1.5">
                  Have a Product Promo Code or Free Delivery Code?
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Enter promo code (or FREEDEL)"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromoCode}
                    className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold cursor-pointer"
                  >
                    Apply coupon
                  </button>
                </div>
                {promoFeedback && (
                  <p
                    className={`mt-1.5 text-[11px] font-bold ${
                      promoFeedback.type === "success" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {promoFeedback.text}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Sub total ({quantity} items)</span>
                  <span className="font-bold text-slate-900">{formatMoney(subtotal)}</span>
                </div>
                {appliedPromoDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 font-bold">
                    <span>Promo Discount</span>
                    <span>-{formatMoney(appliedPromoDiscount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-600">
                  <span>Delivery cost (Paid by Buyer for Courier)</span>
                  <span className="font-bold text-slate-900">
                    {freeDeliveryApplied ? (
                      <span className="text-emerald-600">FREE (Promo)</span>
                    ) : (
                      formatMoney(finalDeliveryFee)
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-base font-black text-slate-900">
                  <span>Total</span>
                  <span>{formatMoney(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Special Notes & Final Action Box (Turns RED if Out of Stock!) */}
            <div
              className={`rounded-2xl p-6 border shadow-xs space-y-4 text-xs ${
                hasStockError
                  ? "bg-rose-50 border-2 border-rose-600"
                  : "bg-white border-slate-200"
              }`}
            >
              <div>
                <label className="block font-extrabold text-slate-800 mb-1">
                  Special notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Any special delivery instruction..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmSpecsChecked}
                  onChange={(e) => setConfirmSpecsChecked(e.target.checked)}
                />
                <span>
                  I confirm Size (<strong>{selectedSize}</strong>), Color (
                  <strong>{selectedColor}</strong>), and Quantity (<strong>{quantity}</strong>).
                </span>
              </label>

              {/* If Out of Stock or Exceeding Stock -> Show Red Circle & Disabled Red Button */}
              {hasStockError ? (
                <div className="p-4 rounded-xl bg-rose-600 text-white text-center space-y-1 font-extrabold">
                  <div className="text-sm flex items-center justify-center gap-2">
                    <Ban className="w-5 h-5" />
                    {isOutOfStock
                      ? "🚫 OUT OF STOCK — CANNOT PLACE ORDER"
                      : `🚫 ONLY ${availableStock} PCS IN STOCK`}
                  </div>
                  <p className="text-[11px] text-rose-100 font-normal">
                    Please choose an in-stock product or adjust quantity.
                  </p>
                </div>
              ) : !activeProduct && !customOrderMode ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 rounded-xl bg-slate-300 text-slate-600 font-black text-sm cursor-not-allowed"
                >
                  Select a Product Above to Order
                </button>
              ) : paymentCategory === "cod" ? (
                <button
                  type="button"
                  disabled={submittingOrder || !confirmSpecsChecked}
                  onClick={() =>
                    finalizeOrderCreation("COD Pending", "Cash on Delivery (COD)")
                  }
                  className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {submittingOrder
                    ? "Placing Order..."
                    : `Order Now — Cash on Delivery (${formatMoney(grandTotal)})`}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submittingOrder || !confirmSpecsChecked}
                  onClick={handleOpenPaymentGatewayPopup}
                  className="w-full py-3.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-black text-sm shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {`Pay & Confirm Order via ${
                    paymentCategory === "wallet"
                      ? selectedWalletProvider
                      : selectedBankProvider.split(" ")[0]
                  } (${formatMoney(grandTotal)})`}
                </button>
              )}

              {/* Inline Bottom Receipt Access Button (So User Can Re-Open / Download Receipt Right at the Bottom!) */}
              {confirmedOrderReceipt && (
                <div className="p-4 rounded-xl bg-emerald-950 text-white space-y-2.5 border border-emerald-700">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-300">
                      ✓ Last Order Confirmed: {confirmedOrderReceipt.order_id}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowReceiptPopupModal(true)}
                      className="text-[11px] underline text-white font-bold cursor-pointer"
                    >
                      Open Receipt Popup
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        printIsolatedOrderSlip(confirmedOrderReceipt, symbol)
                      }
                      className="py-2 px-3 rounded-lg bg-white text-slate-900 font-extrabold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadOfficialOrderReceipt(confirmedOrderReceipt, symbol)
                      }
                      className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Receipt
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* =====================================================================
          INSTANT CENTERED RECEIPT POPUP MODAL (Appears Automatically After Order!)
         ===================================================================== */}
      {showReceiptPopupModal && confirmedOrderReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="px-6 py-5 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="text-lg font-black">
                    Order Confirmed! ({confirmedOrderReceipt.order_id})
                  </h3>
                  <p className="text-xs text-emerald-200">
                    Your official receipt is ready to Print or Save as PDF
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptPopupModal(false)}
                className="text-emerald-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-semibold">Customer Name &amp; Phone:</span>
                  <span className="font-extrabold text-slate-900">
                    {confirmedOrderReceipt.customer} ({confirmedOrderReceipt.customer_phone})
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-semibold">Ordered Item:</span>
                  <span className="font-extrabold text-slate-900">
                    {confirmedOrderReceipt.quantity}x {confirmedOrderReceipt.product_name} (Size:{" "}
                    {confirmedOrderReceipt.selected_size}, Color:{" "}
                    {confirmedOrderReceipt.selected_color})
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-semibold">Payment Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
                    {confirmedOrderReceipt.payment_status === "Paid"
                      ? `✓ PAID (${confirmedOrderReceipt.payment})`
                      : "CASH ON DELIVERY (COD)"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-semibold">Courier Delivery Cost:</span>
                  <span className="font-bold text-slate-900">
                    {confirmedOrderReceipt.delivery_fee === 0
                      ? "FREE"
                      : formatMoney(confirmedOrderReceipt.delivery_fee)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 text-sm">
                  <span className="font-extrabold text-slate-900">Grand Total Bill:</span>
                  <span className="text-base font-black text-emerald-700">
                    {formatMoney(confirmedOrderReceipt.amount)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => printIsolatedOrderSlip(confirmedOrderReceipt, symbol)}
                  className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print / Save as PDF
                </button>
                <button
                  type="button"
                  onClick={() => downloadOfficialOrderReceipt(confirmedOrderReceipt, symbol)}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download Invoice File
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowReceiptPopupModal(false)}
                className="w-full py-2.5 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close &amp; Start New Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BANGLADESH RAILWAY STYLE OFFICIAL PAYMENT POPUP */}
      {showGatewayPopup && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div
              className={`px-6 py-5 text-white flex items-center justify-between ${
                paymentCategory === "wallet"
                  ? selectedWalletProvider === "bKash"
                    ? "bg-pink-600"
                    : selectedWalletProvider === "Nagad"
                    ? "bg-orange-600"
                    : "bg-purple-700"
                  : "bg-slate-900"
              }`}
            >
              <div>
                <div className="text-[11px] uppercase tracking-wider font-bold opacity-90">
                  {paymentCategory === "wallet"
                    ? `${selectedWalletProvider} Tokenized Checkout`
                    : "3D-Secure Bank Card Gateway"}
                </div>
                <div className="text-lg font-black mt-0.5">
                  {paymentCategory === "wallet"
                    ? `${selectedWalletProvider} Payment`
                    : selectedBankProvider.split("(")[0]}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] opacity-85">Payable Amount</div>
                <div className="text-lg font-black">{formatMoney(grandTotal)}</div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Merchant: </span>
                <strong className="text-slate-900">My Business Store</strong>
              </div>
              <div className="text-slate-500 font-mono text-[11px]">
                Step {gatewayStep} of 3
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {gatewayError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{gatewayError}</span>
                </div>
              )}

              {gatewayStep === 1 && (
                <form onSubmit={handleGatewayProceedToOtp} className="space-y-4">
                  {paymentCategory === "wallet" ? (
                    <div className="space-y-2 text-center">
                      <label className="block text-sm font-extrabold text-slate-800">
                        Your {selectedWalletProvider} Account Number
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Enter the mobile number registered with your {selectedWalletProvider} account. A verification code will be sent to this number.
                      </p>
                      <input
                        type="text"
                        required
                        value={payerAccountOrCard}
                        onChange={(e) => setPayerAccountOrCard(e.target.value)}
                        placeholder="e.g. 017XXXXXXXX"
                        className="w-full text-center text-base font-extrabold tracking-wider px-4 py-3 rounded-xl border-2 border-slate-300 focus:outline-none focus:border-pink-600"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block font-extrabold text-slate-700 mb-1">
                          Card Number / Bank Account Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={payerAccountOrCard}
                          onChange={(e) => setPayerAccountOrCard(e.target.value)}
                          placeholder="4532 •••• •••• 8891"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-bold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-extrabold text-slate-700 mb-1">
                            Expiry (MM/YY) *
                          </label>
                          <input
                            type="text"
                            required
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="08/29"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-extrabold text-slate-700 mb-1">
                            CVV / CVC *
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            required
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            placeholder="•••"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowGatewayPopup(false)}
                      className="py-3 rounded-xl border border-slate-300 font-extrabold text-slate-700 cursor-pointer"
                    >
                      Close / Cancel
                    </button>
                    <button
                      type="submit"
                      className={`py-3 rounded-xl text-white font-extrabold cursor-pointer ${
                        paymentCategory === "wallet" ? "bg-pink-600" : "bg-blue-600"
                      }`}
                    >
                      Proceed →
                    </button>
                  </div>
                </form>
              )}

              {gatewayStep === 2 && (
                <form onSubmit={handleGatewayVerifyOtp} className="space-y-4 text-center">
                  <div className="space-y-1">
                    <label className="block text-sm font-extrabold text-slate-800">
                      Enter Verification Code (OTP)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      We have dispatched a 6-digit verification code to your number{" "}
                      <strong>{payerAccountOrCard}</strong>.
                    </p>
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={enteredVerificationCode}
                    onChange={(e) => setEnteredVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit OTP code"
                    className="w-full text-center text-lg font-black tracking-widest px-4 py-3 rounded-xl border-2 border-slate-300 focus:outline-none focus:border-pink-600"
                  />

                  <p className="text-[10px] text-slate-400">
                    If you enter an invalid or non-numeric code, the transaction will be declined.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setGatewayStep(1)}
                      className="py-3 rounded-xl border border-slate-300 font-extrabold text-slate-700 cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      className={`py-3 rounded-xl text-white font-extrabold cursor-pointer ${
                        paymentCategory === "wallet" ? "bg-pink-600" : "bg-blue-600"
                      }`}
                    >
                      Verify Code →
                    </button>
                  </div>
                </form>
              )}

              {gatewayStep === 3 && (
                <form onSubmit={handleGatewayConfirmPinAndPay} className="space-y-4 text-center">
                  <div className="space-y-1">
                    <label className="block text-sm font-extrabold text-slate-800">
                      {paymentCategory === "wallet"
                        ? `Enter Your ${selectedWalletProvider} PIN`
                        : "Enter 3D-Secure Bank Authorization PIN"}
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Confirm payment of <strong>{formatMoney(grandTotal)}</strong> to My Business Store.
                    </p>
                  </div>

                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={enteredPin}
                    onChange={(e) => setEnteredPin(e.target.value)}
                    placeholder="•••••"
                    className="w-full text-center text-xl font-black tracking-widest px-4 py-3 rounded-xl border-2 border-slate-300 focus:outline-none focus:border-emerald-600"
                  />

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setGatewayStep(2)}
                      className="py-3 rounded-xl border border-slate-300 font-extrabold text-slate-700 cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold cursor-pointer"
                    >
                      ✓ Confirm &amp; Pay
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              256-Bit Encrypted Payment Gateway • Synvora Commerce Security
            </div>
          </div>
        </div>
      )}

      {/* MULTILINGUAL AI INSTANT ORDER ASSISTANT DRAWER */}
      {showAiDrawer && (
        <div className="fixed bottom-5 right-5 z-50 w-96 max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col h-125">
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-extrabold">AI Instant Order Assistant</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAiMode(aiMode === "ai" ? "human" : "ai")}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 cursor-pointer"
              >
                {aiMode === "ai" ? "Human Agent" : "Switch to AI"}
              </button>
              <button
                type="button"
                onClick={() => setShowAiDrawer(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 text-xs">
            {aiMessages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-xs rounded-2xl px-3.5 py-2.5 whitespace-pre-line leading-relaxed ${
                    m.sender === "user"
                      ? "bg-indigo-600 text-white"
                      : m.sender === "human"
                      ? "bg-emerald-600 text-white"
                      : "bg-white border border-slate-200 text-slate-800"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSendAiMessage}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Type product name, size, or question..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-indigo-600 text-white cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}