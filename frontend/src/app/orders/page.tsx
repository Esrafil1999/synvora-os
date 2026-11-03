"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getOrders, getProducts, createOrder, updateOrderStatus } from "@/lib/api";
import { useCurrency, printIsolatedOrderSlip } from "@/lib/currency";
import {
  ShoppingBag,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Truck,
  CheckCircle2,
  RotateCcw,
  Search,
  Upload,
  Ruler,
  Palette,
  Printer,
  Package,
  Store,
  Globe,
  Download,
  Clock,
  XCircle,
} from "lucide-react";
import Link from "next/link";

export interface DbOrder {
  id: number;
  order_id: string;
  order_code?: string;
  customer: string;
  customer_name?: string;
  customer_phone: string;
  delivery_address: string;
  shipping_address?: string;
  channel: string;
  order_source_type: string;
  product_name: string;
  product_sku: string;
  selected_size?: string;
  selected_color?: string;
  order_image?: string;
  customer_notes?: string;
  quantity: number;
  regular_amount: number | string;
  discount_amount: number | string;
  amount: number | string;
  total_amount?: number | string;
  cogs_amount: number | string;
  net_profit: number | string;
  offer_applied: string;
  stock_deducted: boolean;
  payment: string;
  payment_method?: string;
  payment_status?: string;
  courier_partner?: string;
  tracking_code?: string;
  status: string;
  order_status?: string;
  created_at: string;
}

interface CatalogProduct {
  id: number;
  name: string;
  sku: string;
  available_sizes: string;
  available_colors: string;
  image_url: string;
  effective_price: number | string;
  stock: number;
}

export default function OrdersPage() {
  const { formatMoney, symbol } = useCurrency();
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<DbOrder | null>(null);
  const [formError, setFormError] = useState<string>("");

  const [saleOrigin, setSaleOrigin] = useState<"online" | "outlet">("online");
  const [outletName, setOutletName] = useState("Main Branch Outlet");
  const [handledByManager, setHandledByManager] = useState("Outlet Manager");

  const [orderInputMode, setOrderInputMode] = useState<"catalog" | "custom">("catalog");
  const [selectedProdId, setSelectedProdId] = useState<string>("");
  const [customProdName, setCustomProdName] = useState("");
  const [customProdCode, setCustomProdCode] = useState("");
  const [customUnitPrice, setCustomUnitPrice] = useState("");
  const [customBuyingCost, setCustomBuyingCost] = useState("");
  const [selectedSize, setSelectedSize] = useState("L");
  const [selectedColor, setSelectedColor] = useState("");
  const [howManyOrders, setHowManyOrders] = useState("1");
  const [orderImage, setOrderImage] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [channel, setChannel] = useState("Facebook Ad");
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const loadAll = async () => {
    setLoading(true);
    const [ordData, prodData] = await Promise.all([getOrders(), getProducts()]);
    if (Array.isArray(ordData)) setOrders(ordData);
    if (Array.isArray(prodData)) {
      setProducts(prodData);
      if (prodData.length > 0 && !selectedProdId) {
        const first = prodData[0];
        setSelectedProdId(String(first.id));
        const firstSizes = (first.available_sizes || "L").split(",").map((s: string) => s.trim()).filter(Boolean);
        if (firstSizes.length > 0) setSelectedSize(firstSizes[0]);
        const firstColors = (first.available_colors || "").split(",").map((c: string) => c.trim()).filter(Boolean);
        if (firstColors.length > 0) setSelectedColor(firstColors[0]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const activeCatalogProduct = useMemo(
    () => products.find((p) => String(p.id) === selectedProdId) || null,
    [products, selectedProdId]
  );

  const catalogSizeList = useMemo(() => {
    if (!activeCatalogProduct || !activeCatalogProduct.available_sizes) return [];
    return activeCatalogProduct.available_sizes.split(",").map((s) => s.trim()).filter(Boolean);
  }, [activeCatalogProduct]);

  const catalogColorList = useMemo(() => {
    if (!activeCatalogProduct || !activeCatalogProduct.available_colors) return [];
    return activeCatalogProduct.available_colors.split(",").map((c) => c.trim()).filter(Boolean);
  }, [activeCatalogProduct]);

  const handleOrderImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") setOrderImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const publicStoreUrl =
    typeof window !== "undefined" ? `${window.location.origin}/store` : "http://localhost:3000/store";

  const copyOrderButtonLink = () => {
    navigator.clipboard.writeText(publicStoreUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    await updateOrderStatus(orderId, newStatus);
    loadAll();
  };

  const toggleSelectOrder = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const qty = Math.max(1, parseInt(howManyOrders, 10) || 1);

    // Strict stock, size & color validation when ordering a catalog product
    if (orderInputMode === "catalog" && activeCatalogProduct) {
      if (activeCatalogProduct.stock < qty) {
        setFormError(
          `Insufficient stock! "${activeCatalogProduct.name}" only has ${activeCatalogProduct.stock} pcs in stock.`
        );
        return;
      }
      if (
        catalogSizeList.length > 0 &&
        !catalogSizeList.some((s) => s.toLowerCase() === selectedSize.trim().toLowerCase())
      ) {
        setFormError(
          `Size "${selectedSize}" is not in stock for ${activeCatalogProduct.name}. Available sizes: ${catalogSizeList.join(", ")}`
        );
        return;
      }
      if (
        catalogColorList.length > 0 &&
        !catalogColorList.some((c) => c.toLowerCase() === selectedColor.trim().toLowerCase())
      ) {
        setFormError(
          `Color "${selectedColor}" is not in stock for ${activeCatalogProduct.name}. Available colors: ${catalogColorList.join(", ")}`
        );
        return;
      }
    }

    const isOutlet = saleOrigin === "outlet";
    const finalChannel = isOutlet ? `Outlet: ${outletName.trim() || "Main Outlet"}` : channel;
    const finalSourceType = isOutlet
      ? `Outlet POS (${handledByManager.trim() || "Manager"})`
      : "Online / Social Order";

    const payload: Record<string, unknown> = {
      customer: customerName.trim() || (isOutlet ? "Walk-in Outlet Customer" : "Customer"),
      customer_phone: customerPhone.trim(),
      delivery_address: isOutlet
        ? `Purchased at ${outletName.trim() || "Outlet"} (${deliveryAddress.trim() || "Direct Handover"})`
        : deliveryAddress.trim(),
      channel: finalChannel,
      order_source_type: finalSourceType,
      selected_size: selectedSize.trim() || "Standard",
      selected_color: selectedColor.trim() || (catalogColorList[0] || "Standard"),
      order_image: orderImage,
      quantity: qty,
      status: isOutlet ? "Delivered" : "Confirmed",
      payment: isOutlet ? "Paid (Outlet Counter)" : paymentMethod,
    };

    if (orderInputMode === "catalog" && activeCatalogProduct) {
      payload.product_id = activeCatalogProduct.id;
    } else {
      payload.product_name = customProdName.trim() || "Custom Item";
      payload.product_sku = customProdCode.trim().toUpperCase() || "ITEM";
      payload.amount = parseFloat(customUnitPrice) || 0;
      payload.cogs_amount = parseFloat(customBuyingCost) || 0;
      payload.is_unit_price = true;
    }

    const res = await createOrder(payload);
    if (res) {
      setShowOrderModal(false);
      setCustomerName("");
      setCustomerPhone("");
      setDeliveryAddress("");
      setOrderImage("");
      setHowManyOrders("1");
      await loadAll();
      if (isOutlet) {
        setInvoiceOrder(res);
      }
    }
  };

  // Consistent Unfulfilled vs Fulfilled classification:
  // Unfulfilled = Pending, Confirmed, or Shipped (still in transit / awaiting Done)
  // Fulfilled = Delivered (Done clicked or completed at Outlet POS)
  // Returns = Returned or Cancelled
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter === "Outlet") {
        if (
          !String(o.channel).toLowerCase().includes("outlet") &&
          !String(o.order_source_type).toLowerCase().includes("outlet")
        ) {
          return false;
        }
      } else if (statusFilter === "Unfulfilled") {
        if (o.status === "Delivered" || o.status === "Returned" || o.status === "Cancelled") {
          return false;
        }
      } else if (statusFilter === "Fulfilled") {
        if (o.status !== "Delivered") return false;
      } else if (statusFilter === "Returns") {
        if (o.status !== "Returned" && o.status !== "Cancelled") return false;
      } else if (statusFilter !== "All" && o.status !== statusFilter) {
        return false;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.order_id.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        (o.customer_phone || "").toLowerCase().includes(q) ||
        o.product_name.toLowerCase().includes(q) ||
        (o.product_sku || "").toLowerCase().includes(q) ||
        (o.channel || "").toLowerCase().includes(q);
      return matchesSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  // Exact Mathematical Counts so Top Cards == Filtered Rows == 'Done' Buttons
  const kpiStats = useMemo(() => {
    const total = orders.length;
    const fulfilledCount = orders.filter((o) => o.status === "Delivered").length;
    const returnsCount = orders.filter(
      (o) => o.status === "Returned" || o.status === "Cancelled"
    ).length;
    const unfulfilledCount = orders.filter(
      (o) => o.status !== "Delivered" && o.status !== "Returned" && o.status !== "Cancelled"
    ).length;
    const outletCount = orders.filter(
      (o) =>
        String(o.channel).toLowerCase().includes("outlet") ||
        String(o.order_source_type).toLowerCase().includes("outlet")
    ).length;
    const totalItems = orders.reduce((s, o) => s + Number(o.quantity || 1), 0);

    return {
      total,
      unfulfilledCount,
      fulfilledCount,
      returnsCount,
      outletCount,
      totalItems,
    };
  }, [orders]);

  // Fixed Excel / CSV Export using Blob + UTF-8 BOM (prevents '#' in #SYN-... from cutting off rows!)
  const exportCsv = () => {
    const sourceList =
      selectedIds.length > 0
        ? orders.filter((o) => selectedIds.includes(o.id))
        : filteredOrders;

    const escapeCsvCell = (val: unknown) => {
      const str = String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      "Order ID",
      "Date",
      "Customer Name",
      "Phone Number",
      "Delivery Address / Outlet",
      "Channel / Source",
      "Product Name",
      "Product Code (SKU)",
      "Size",
      "Color",
      "Quantity",
      "Total Amount",
      "Buying Cost (COGS)",
      "Net Profit",
      "Payment Status",
      "Fulfillment Status",
    ];

    const dataRows = sourceList.map((o) => [
      o.order_id,
      o.created_at ? String(o.created_at).slice(0, 10) : new Date().toISOString().slice(0, 10),
      o.customer,
      o.customer_phone || "N/A",
      o.delivery_address || o.channel,
      o.channel,
      o.product_name,
      o.product_sku || "STD",
      o.selected_size || "Standard",
      o.selected_color || "Standard",
      String(o.quantity || 1),
      String(o.amount || 0),
      String(o.cogs_amount || 0),
      String(o.net_profit || 0),
      o.payment,
      o.status === "Delivered" ? "Fulfilled" : o.status,
    ]);

    const csvString =
      "\uFEFF" +
      [headers.map(escapeCsvCell).join(","), ...dataRows.map((r) => r.map(escapeCsvCell).join(","))].join(
        "\r\n"
      );

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `synvora_orders_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage online customer orders, social ad orders, and physical Outlet / Branch POS sales with 1-click slip printing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Excel / CSV ({filteredOrders.length})
          </button>

          <button
            onClick={copyOrderButtonLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-indigo-600" />}
            {copiedLink ? "Order Link Copied!" : "Copy Customer Order Link"}
          </button>

          <Link
            href="/store"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Customer Order Page
          </Link>

          <button
            onClick={() => {
              setSaleOrigin("outlet");
              setFormError("");
              setShowOrderModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition cursor-pointer"
          >
            <Store className="w-3.5 h-3.5 text-emerald-400" /> + Outlet POS Sale
          </button>

          <button
            onClick={() => {
              setSaleOrigin("online");
              setFormError("");
              setShowOrderModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Create Order
          </button>
        </div>
      </div>

      {/* 4 KPI Cards with Exact Synchronized Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter("All")}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex items-center justify-between cursor-pointer hover:border-indigo-300 transition"
        >
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-500">Total Orders</div>
            <div className="text-3xl font-extrabold text-slate-900">{kpiStats.total}</div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
              ↑ {kpiStats.totalItems} total items ordered
            </div>
          </div>
          <svg className="w-20 h-10 text-indigo-500" viewBox="0 0 80 36" fill="none">
            <path d="M2 28L18 20L34 24L50 10L66 14L78 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        <div
          onClick={() => setStatusFilter("Unfulfilled")}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex items-center justify-between cursor-pointer hover:border-amber-300 transition"
        >
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-500">Pending / Unfulfilled</div>
            <div className="text-3xl font-extrabold text-slate-900">{kpiStats.unfulfilledCount}</div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
              <Clock className="w-3 h-3" /> Awaiting completion
            </div>
          </div>
          <svg className="w-20 h-10 text-amber-500" viewBox="0 0 80 36" fill="none">
            <path d="M2 24L20 26L36 16L54 20L68 10L78 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        <div
          onClick={() => setStatusFilter("Fulfilled")}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex items-center justify-between cursor-pointer hover:border-emerald-300 transition"
        >
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-500">Fulfilled / Delivered</div>
            <div className="text-3xl font-extrabold text-slate-900">{kpiStats.fulfilledCount}</div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
              ✓ Completed &amp; Delivered
            </div>
          </div>
          <svg className="w-20 h-10 text-emerald-500" viewBox="0 0 80 36" fill="none">
            <path d="M2 30L18 24L34 18L52 14L66 8L78 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        <div
          onClick={() => setStatusFilter("Returns")}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex items-center justify-between cursor-pointer hover:border-rose-300 transition"
        >
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-500">Returns / Cancelled</div>
            <div className="text-3xl font-extrabold text-slate-900">{kpiStats.returnsCount}</div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
              <XCircle className="w-3 h-3" /> Stock auto-restored
            </div>
          </div>
          <svg className="w-20 h-10 text-rose-500" viewBox="0 0 80 36" fill="none">
            <path d="M2 14L20 18L36 12L54 22L68 20L78 26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Filter Tabs with Live Count Badges */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "All", label: `All Orders (${kpiStats.total})` },
            { key: "Unfulfilled", label: `Unfulfilled / Pending (${kpiStats.unfulfilledCount})` },
            { key: "Fulfilled", label: `Fulfilled / Delivered (${kpiStats.fulfilledCount})` },
            { key: "Outlet", label: `Outlet POS Sales (${kpiStats.outletCount})` },
            { key: "Returns", label: `Returns & Cancelled (${kpiStats.returnsCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                statusFilter === tab.key
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order ID, customer, outlet, code..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 pl-5 pr-2 w-8">
                  <input
                    type="checkbox"
                    checked={
                      filteredOrders.length > 0 &&
                      selectedIds.length === filteredOrders.length
                    }
                    onChange={(e) =>
                      setSelectedIds(
                        e.target.checked ? filteredOrders.map((o) => o.id) : []
                      )
                    }
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="py-3.5 px-3">Order</th>
                <th className="py-3.5 px-3">Date &amp; Channel / Outlet</th>
                <th className="py-3.5 px-3">Customer</th>
                <th className="py-3.5 px-3">Product, Size &amp; Color</th>
                <th className="py-3.5 px-3">Items</th>
                <th className="py-3.5 px-3">Total</th>
                <th className="py-3.5 px-3">Payment</th>
                <th className="py-3.5 px-3">Fulfillment</th>
                <th className="py-3.5 px-4 text-right">Action &amp; Print</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-14 text-center space-y-2">
                    <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="text-sm font-bold text-slate-800">No Matching Orders in This Tab</div>
                    <p className="text-xs text-slate-500">
                      Switch tabs above or click &quot;Create Order&quot; to add a new order.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const isChecked = selectedIds.includes(ord.id);
                  const isOutletOrder =
                    String(ord.channel).toLowerCase().includes("outlet") ||
                    String(ord.order_source_type).toLowerCase().includes("outlet");
                  const formattedDate = ord.created_at
                    ? new Date(ord.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Today";
                  const isPaid =
                    String(ord.payment).toLowerCase().includes("paid") ||
                    String(ord.payment).toLowerCase().includes("success");

                  return (
                    <tr
                      key={ord.id}
                      className={`transition ${
                        isChecked ? "bg-indigo-50/50" : "hover:bg-slate-50/90"
                      }`}
                    >
                      <td className="py-3.5 pl-5 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOrder(ord.id)}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="py-3.5 px-3 font-extrabold text-slate-900">
                        {ord.order_id}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800">{formattedDate}</div>
                        <span
                          className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isOutletOrder
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          }`}
                        >
                          {isOutletOrder ? <Store className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                          {ord.channel}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                            {ord.customer.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{ord.customer}</div>
                            <div className="text-[11px] text-slate-500">
                              {ord.customer_phone || "Walk-in"} •{" "}
                              <span className="truncate max-w-36 inline-block align-bottom">
                                {ord.delivery_address || "Direct"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          {ord.order_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={ord.order_image}
                              alt={ord.product_name}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900">{ord.product_name}</div>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {ord.selected_size && (
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                                  Size: {ord.selected_size}
                                </span>
                              )}
                              {ord.selected_color && (
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                                  Color: {ord.selected_color}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-700">
                        {ord.quantity || 1} {Number(ord.quantity || 1) > 1 ? "Items" : "Item"}
                      </td>
                      <td className="py-3.5 px-3 font-extrabold text-slate-900">
                        {formatMoney(ord.amount)}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isPaid ? "bg-emerald-600" : "bg-amber-500"
                            }`}
                          />
                          {ord.payment}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            ord.status === "Delivered"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : ord.status === "Shipped"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : ord.status === "Cancelled" || ord.status === "Returned"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {ord.status === "Delivered"
                            ? "Fulfilled"
                            : ord.status === "Shipped"
                            ? "In Transit (Shipped)"
                            : ord.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => setInvoiceOrder(ord)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer"
                          title="View & Print Compact Order Slip"
                        >
                          <Printer className="w-3.5 h-3.5 text-indigo-600" /> Print
                        </button>
                        {ord.status !== "Shipped" &&
                          ord.status !== "Delivered" &&
                          ord.status !== "Cancelled" &&
                          ord.status !== "Returned" && (
                            <button
                              onClick={() => handleStatusChange(ord.id, "Shipped")}
                              className="px-2 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Truck className="w-3 h-3" /> Ship
                            </button>
                          )}
                        {ord.status !== "Delivered" &&
                          ord.status !== "Cancelled" &&
                          ord.status !== "Returned" && (
                            <button
                              onClick={() => handleStatusChange(ord.id, "Delivered")}
                              className="px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Done
                            </button>
                          )}
                        {ord.status !== "Cancelled" && ord.status !== "Returned" && (
                          <button
                            onClick={() => handleStatusChange(ord.id, "Cancelled")}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold inline-flex items-center cursor-pointer"
                            title="Cancel / Return Order"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white border border-slate-300 shadow-xl rounded-2xl px-5 py-2.5 flex items-center gap-4 text-xs">
            <span className="font-extrabold text-indigo-700">{selectedIds.length} Selected</span>
            <button
              onClick={exportCsv}
              className="px-3 py-1.5 rounded-lg hover:bg-slate-100 font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export Selected to Excel
            </button>
            <button
              onClick={async () => {
                for (const id of selectedIds) {
                  await updateOrderStatus(id, "Delivered");
                }
                setSelectedIds([]);
                loadAll();
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold cursor-pointer"
            >
              Mark Fulfilled
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-extrabold text-slate-900">
                {saleOrigin === "outlet"
                  ? "Physical Outlet / Branch POS Order"
                  : "Create Online / Social Customer Order"}
              </h2>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateOrderSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSaleOrigin("online")}
                  className={`py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    saleOrigin === "online" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-600"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" /> Online / Social Ad Order
                </button>
                <button
                  type="button"
                  onClick={() => setSaleOrigin("outlet")}
                  className={`py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    saleOrigin === "outlet" ? "bg-slate-900 text-white shadow-2xs" : "text-slate-600"
                  }`}
                >
                  <Store className="w-3.5 h-3.5 text-emerald-400" /> Physical Outlet / Shop POS
                </button>
              </div>

              {saleOrigin === "outlet" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div>
                    <label className="block text-xs font-extrabold text-emerald-950 mb-1">
                      Outlet / Branch Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={outletName}
                      onChange={(e) => setOutletName(e.target.value)}
                      placeholder="e.g. Main Branch Outlet"
                      className="w-full px-3 py-2 rounded-lg border border-emerald-300 text-xs bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-emerald-950 mb-1">
                      Handled By (Manager Name) *
                    </label>
                    <input
                      type="text"
                      required
                      value={handledByManager}
                      onChange={(e) => setHandledByManager(e.target.value)}
                      placeholder="e.g. Branch Manager"
                      className="w-full px-3 py-2 rounded-lg border border-emerald-300 text-xs bg-white font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setOrderInputMode("catalog")}
                  className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    orderInputMode === "catalog" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-600"
                  }`}
                >
                  Select from Catalog
                </button>
                <button
                  type="button"
                  onClick={() => setOrderInputMode("custom")}
                  className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    orderInputMode === "custom" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-600"
                  }`}
                >
                  Type Custom Product + Photo
                </button>
              </div>

              {orderInputMode === "catalog" ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Choose Product *
                  </label>
                  <select
                    value={selectedProdId}
                    onChange={(e) => {
                      setSelectedProdId(e.target.value);
                      const found = products.find((p) => String(p.id) === e.target.value);
                      if (found) {
                        const sz = (found.available_sizes || "L").split(",").map((s) => s.trim()).filter(Boolean);
                        if (sz.length > 0) setSelectedSize(sz[0]);
                        const cl = (found.available_colors || "").split(",").map((c) => c.trim()).filter(Boolean);
                        setSelectedColor(cl.length > 0 ? cl[0] : "Standard");
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.name} (Code: {p.sku}) — {formatMoney(p.effective_price)} [Stock: {p.stock} | Colors: {p.available_colors || "All"}]
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customProdName}
                      onChange={(e) => setCustomProdName(e.target.value)}
                      placeholder="Type product name"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Product Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={customProdCode}
                      onChange={(e) => setCustomProdCode(e.target.value)}
                      placeholder="e.g. CODE-101"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Unit Selling Price ({symbol}) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={customUnitPrice}
                      onChange={(e) => setCustomUnitPrice(e.target.value)}
                      placeholder="e.g. 1200"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Unit Buying Cost ({symbol})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={customBuyingCost}
                      onChange={(e) => setCustomBuyingCost(e.target.value)}
                      placeholder="e.g. 750"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Size, Color (Strict to Stock!) & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                <div>
                  <label className="flex items-center gap-1 text-xs font-extrabold text-slate-800 mb-1">
                    <Ruler className="w-3.5 h-3.5 text-indigo-600" /> Size *
                  </label>
                  {orderInputMode === "catalog" && catalogSizeList.length > 0 ? (
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white font-bold"
                    >
                      {catalogSizeList.map((sz) => (
                        <option key={sz} value={sz}>
                          {sz}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      placeholder="e.g. M, L, XL"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white font-bold"
                    />
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-1 text-xs font-extrabold text-slate-800 mb-1">
                    <Palette className="w-3.5 h-3.5 text-indigo-600" /> Color (In Stock) *
                  </label>
                  {orderInputMode === "catalog" && catalogColorList.length > 0 ? (
                    <select
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white font-bold"
                    >
                      {catalogColorList.map((cl) => (
                        <option key={cl} value={cl}>
                          {cl} (In Stock)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      placeholder="e.g. Black"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    How Many Orders (Qty) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={howManyOrders}
                    onChange={(e) => setHowManyOrders(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white font-extrabold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <Upload className="w-4 h-4 text-indigo-600 shrink-0" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleOrderImageUpload}
                  className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Full Name *"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone Number *"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              {saleOrigin === "online" && (
                <textarea
                  rows={2}
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Full Delivery Address *"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold cursor-pointer"
                >
                  {saleOrigin === "outlet"
                    ? "Complete Outlet Sale & Print Slip"
                    : "Confirm Order & Deduct Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compact Slip Preview Modal — Prints ONLY the Small Order Slip */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-2xl space-y-5 font-mono">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 font-sans">
              <span className="text-xs font-extrabold text-slate-900">
                Compact Order Receipt Slip (80mm)
              </span>
              <button
                onClick={() => setInvoiceOrder(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-800 border border-dashed border-slate-300 rounded-xl p-4">
              <div className="text-center border-b border-dashed border-slate-300 pb-2.5 space-y-0.5">
                <div className="text-sm font-extrabold text-slate-900">SYNVORA ORDER RECEIPT</div>
                <div className="text-[11px] text-slate-500">{invoiceOrder.channel}</div>
                <div className="text-[11px] text-slate-500">
                  ID: <strong>{invoiceOrder.order_id}</strong> •{" "}
                  {invoiceOrder.created_at ? String(invoiceOrder.created_at).slice(0, 10) : "Today"}
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div>
                  <strong>Customer:</strong> {invoiceOrder.customer}
                </div>
                <div>
                  <strong>Phone:</strong> {invoiceOrder.customer_phone || "N/A"}
                </div>
                <div>
                  <strong>Address:</strong> {invoiceOrder.delivery_address || invoiceOrder.channel}
                </div>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
                <div className="font-extrabold text-slate-900">{invoiceOrder.product_name}</div>
                <div className="text-[10px] text-slate-500">
                  Code: {invoiceOrder.product_sku || "STD"} • Size:{" "}
                  {invoiceOrder.selected_size || "Standard"} • Color:{" "}
                  {invoiceOrder.selected_color || "Standard"}
                </div>
                <div className="flex justify-between font-bold pt-1">
                  <span>Qty: {invoiceOrder.quantity || 1} pcs</span>
                  <span>{formatMoney(invoiceOrder.amount)}</span>
                </div>
              </div>

              <div className="flex justify-between text-xs font-extrabold text-slate-900">
                <span>TOTAL ({invoiceOrder.payment}):</span>
                <span>{formatMoney(invoiceOrder.amount)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 font-sans">
              <button
                onClick={() => setInvoiceOrder(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold"
              >
                Close
              </button>
              <button
                onClick={() => printIsolatedOrderSlip(invoiceOrder, symbol)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Small Order Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}