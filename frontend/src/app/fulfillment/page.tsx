"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Truck,
  CheckCircle2,
  RotateCcw,
  Printer,
  PackageCheck,
  AlertTriangle,
  Search,
  X,
} from "lucide-react";
import {
  getOrders,
  getProducts,
  patchToApi,
  postToBackend,
} from "@/lib/api";
import { useCurrency, printIsolatedOrderSlip } from "@/lib/currency";

interface FulfillmentOrder {
  id: number | string;
  order_id: string;
  customer: string;
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  customer_address?: string;
  product_name: string;
  product_sku?: string;
  selected_size?: string;
  selected_color?: string;
  quantity: number;
  amount: number;
  shipping_fee?: number;
  payment?: string;
  payment_method?: string;
  payment_status?: string;
  status?: string;
  fulfillment_status?: string;
  courier_name?: string;
  tracking_code?: string;
  return_condition?: string;
  created_at?: string;
}

export default function FulfillmentPage() {
  const { formatMoney, symbol } = useCurrency();
  const [orders, setOrders] = useState<FulfillmentOrder[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCarrierByOrder, setSelectedCarrierByOrder] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "dispatched" | "delivered" | "returned"
  >("all");
  const [toast, setToast] = useState<string | null>(null);

  // 3-Way Return Inspection Modal State
  const [inspectingReturnOrder, setInspectingReturnOrder] = useState<FulfillmentOrder | null>(null);
  const [returnOutcome, setReturnOutcome] = useState<
    "good_restock" | "damaged_lot_sale" | "total_damage"
  >("good_restock");
  const [lotRecoveryAmount, setLotRecoveryAmount] = useState("0");
  const [deductCourierReturnFee, setDeductCourierReturnFee] = useState(true);
  const [courierReturnFeeAmount, setCourierReturnFeeAmount] = useState("70");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4500);
  };

  const loadData = async () => {
    const [ordData, prodData] = await Promise.all([getOrders(), getProducts()]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawOrders: any[] = Array.isArray(ordData) ? ordData : [];
    const normalizedOrders: FulfillmentOrder[] = rawOrders.map((o) => ({
      ...o,
      customer: String(o.customer || o.customer_name || "Customer"),
      quantity: Number(o.quantity || 1),
      amount: Number(o.amount || 0),
    }));
    const prodList = Array.isArray(prodData) ? prodData : [];
    setOrders(normalizedOrders);
    setProducts(prodList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const persistOrdersList = (nextOrders: FulfillmentOrder[]) => {
    setOrders(nextOrders);
    localStorage.setItem("synvora_db_orders", JSON.stringify(nextOrders));
  };

  const handleDispatchToCourier = async (ord: FulfillmentOrder) => {
    const carrier =
      selectedCarrierByOrder[ord.order_id] || ord.courier_name || "Pathao Courier";
    const tracking = `${carrier.slice(0, 3).toUpperCase()}-${Math.floor(
      1000000 + Math.random() * 9000000
    )}`;

    const nextOrders = orders.map((o) =>
      o.order_id === ord.order_id
        ? {
            ...o,
            status: "In-Transit",
            fulfillment_status: "Dispatched",
            courier_name: carrier,
            tracking_code: tracking,
          }
        : o
    );
    persistOrdersList(nextOrders);

    if (ord.id) {
      await patchToApi(`/orders/${ord.id}/`, {
        status: "In-Transit",
        fulfillment_status: "Dispatched",
      }).catch(() => {});
    }

    showToast(
      `Parcel ${ord.order_id} dispatched to ${carrier} (Tracking ID: ${tracking})!`
    );
  };

  const handleMarkDelivered = async (ord: FulfillmentOrder) => {
    const isCod =
      String(ord.payment || ord.payment_method || "")
        .toLowerCase()
        .includes("cod") ||
      String(ord.payment || ord.payment_method || "")
        .toLowerCase()
        .includes("cash");

    const updatedPaymentStatus = isCod ? "Paid (COD Collected)" : "Paid";

    const nextOrders = orders.map((o) =>
      o.order_id === ord.order_id
        ? {
            ...o,
            status: "Delivered",
            fulfillment_status: "Delivered",
            payment_status: updatedPaymentStatus,
          }
        : o
    );
    persistOrdersList(nextOrders);

    if (ord.id) {
      await patchToApi(`/orders/${ord.id}/`, {
        status: "Delivered",
        fulfillment_status: "Delivered",
        payment_status: updatedPaymentStatus,
      }).catch(() => {});
    }

    showToast(
      `Order ${ord.order_id} marked Delivered! ${
        isCod
          ? `${formatMoney(ord.amount)} COD cash collected and added to Analytics & P&L.`
          : "Synced with P&L."
      }`
    );
  };

  const openReturnInspectionModal = (ord: FulfillmentOrder) => {
    setInspectingReturnOrder(ord);
    setReturnOutcome("good_restock");
    setLotRecoveryAmount("0");
    setDeductCourierReturnFee(true);
    setCourierReturnFeeAmount(String(ord.shipping_fee || 70));
  };

  const handleConfirmReturnInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingReturnOrder) return;

    const ord = inspectingReturnOrder;
    const qty = Math.max(1, Number(ord.quantity) || 1);
    const matchedProd = products.find(
      (p) =>
        String(p.name || "").toLowerCase().trim() ===
        String(ord.product_name || "").toLowerCase().trim()
    );
    const unitBuyingCost = Number(matchedProd?.cost_price || 0);
    const totalProductCogs = unitBuyingCost * qty;
    const courierFeeLoss = deductCourierReturnFee ? Number(courierReturnFeeAmount) || 0 : 0;

    let outcomeLabel = "";
    let totalDamageLossToLog = courierFeeLoss;

    if (returnOutcome === "good_restock") {
      outcomeLabel = "Returned (Good Condition — Restocked)";
      if (matchedProd) {
        const nextStock = Number(matchedProd.stock || 0) + qty;
        const updatedProducts = products.map((p) =>
          p.id === matchedProd.id ? { ...p, stock: nextStock } : p
        );
        setProducts(updatedProducts);
        localStorage.setItem("synvora_db_products", JSON.stringify(updatedProducts));
        await patchToApi(`/products/${matchedProd.id}/`, { stock: nextStock }).catch(() => {});
      }
    } else if (returnOutcome === "damaged_lot_sale") {
      const recovered = Math.max(0, Number(lotRecoveryAmount) || 0);
      const netProductLoss = Math.max(0, totalProductCogs - recovered);
      totalDamageLossToLog += netProductLoss;
      outcomeLabel = `Returned (Damaged • Lot Recovery: ${formatMoney(
        recovered
      )} • Net Loss: ${formatMoney(netProductLoss)})`;
    } else {
      totalDamageLossToLog += totalProductCogs;
      outcomeLabel = `Returned (100% Damaged Write-Off • Loss: ${formatMoney(totalProductCogs)})`;
    }

    if (totalDamageLossToLog > 0) {
      const expenseEntry = {
        id: Date.now(),
        title: `Return Loss (${ord.order_id} - ${ord.product_name}): ${outcomeLabel}`,
        category: "Courier & Shipping Fees",
        amount: totalDamageLossToLog,
        date: new Date().toISOString().slice(0, 10),
        created_at: new Date().toISOString(),
      };
      try {
        const existingExp = JSON.parse(localStorage.getItem("synvora_db_expenses_v2") || "[]");
        const nextExp = [expenseEntry, ...(Array.isArray(existingExp) ? existingExp : [])];
        localStorage.setItem("synvora_db_expenses_v2", JSON.stringify(nextExp));
      } catch {}

      await postToBackend("/expenses/", {
        title: expenseEntry.title,
        category: expenseEntry.category,
        amount: expenseEntry.amount,
      }).catch(() => {});
    }

    const nextOrders = orders.map((o) =>
      o.order_id === ord.order_id
        ? {
            ...o,
            status: "Returned",
            fulfillment_status: "Returned",
            payment_status: "Returned / Refunded",
            return_condition: outcomeLabel,
          }
        : o
    );
    persistOrdersList(nextOrders);

    if (ord.id) {
      await patchToApi(`/orders/${ord.id}/`, {
        status: "Returned",
        fulfillment_status: "Returned",
      }).catch(() => {});
    }

    setInspectingReturnOrder(null);
    showToast(`${ord.order_id} processed: ${outcomeLabel}`);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const st = `${o.status || ""} ${o.fulfillment_status || ""}`.toLowerCase();
      if (
        statusFilter === "pending" &&
        (st.includes("deliver") ||
          st.includes("return") ||
          st.includes("dispatch") ||
          st.includes("transit"))
      )
        return false;
      if (statusFilter === "dispatched" && !st.includes("dispatch") && !st.includes("transit"))
        return false;
      if (statusFilter === "delivered" && !st.includes("deliver")) return false;
      if (statusFilter === "returned" && !st.includes("return")) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(o.order_id || "").toLowerCase().includes(q) ||
        String(o.customer || o.customer_name || "").toLowerCase().includes(q) ||
        String(o.product_name || "").toLowerCase().includes(q)
      );
    });
  }, [orders, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    let unfulfilled = 0;
    let inTransit = 0;
    let delivered = 0;
    let returned = 0;

    orders.forEach((o) => {
      const st = `${o.status || ""} ${o.fulfillment_status || ""}`.toLowerCase();
      if (st.includes("return")) returned++;
      else if (st.includes("deliver")) delivered++;
      else if (st.includes("dispatch") || st.includes("transit")) inTransit++;
      else unfulfilled++;
    });

    return { unfulfilled, inTransit, delivered, returned };
  }, [orders]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Courier Fulfillment, COD Settlement &amp; Return Inspection
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Dispatch parcels to Pathao, Steadfast, or RedX in 1 click, auto-collect COD revenue on delivery, and inspect returned parcels (Good Restock vs. Damaged Lot Sale).
          </p>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500">Ready to Dispatch</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats.unfulfilled}</p>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting courier handover</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500">In Courier Transit</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{stats.inTransit}</p>
          <p className="text-[11px] text-slate-400 mt-1">With Pathao / Steadfast / RedX</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500">Delivered &amp; Settled</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.delivered}</p>
          <p className="text-[11px] text-slate-400 mt-1">Synced with Analytics &amp; P&amp;L</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500">Returned Parcels</p>
          <p className="text-2xl font-black text-rose-600 mt-1">{stats.returned}</p>
          <p className="text-[11px] text-slate-400 mt-1">Inspected for Stock / Damage</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          {[
            { id: "all", label: "All Parcels" },
            { id: "pending", label: "Ready for Courier" },
            { id: "dispatched", label: "In Transit" },
            { id: "delivered", label: "Delivered" },
            { id: "returned", label: "Returned / Damaged" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order ID, buyer, product..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Fulfillment Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase">
                <th className="py-3.5 px-4">Order ID &amp; Buyer</th>
                <th className="py-3.5 px-4">Product &amp; Specs</th>
                <th className="py-3.5 px-4">Payment &amp; Rider Collection</th>
                <th className="py-3.5 px-4">Courier Selection</th>
                <th className="py-3.5 px-4">Fulfillment Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No parcels found in this view.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const payStr = String(ord.payment || ord.payment_method || "COD");
                  const isPaidOnline =
                    String(ord.payment_status || "").toLowerCase() === "paid" ||
                    (!payStr.toLowerCase().includes("cod") &&
                      !payStr.toLowerCase().includes("cash"));
                  const st = `${ord.status || ""} ${ord.fulfillment_status || ""}`.toLowerCase();
                  const isDelivered = st.includes("deliver");
                  const isReturned = st.includes("return");

                  return (
                    <tr key={ord.order_id} className="hover:bg-slate-50/70">
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-slate-900">{ord.order_id}</div>
                        <div className="font-bold text-slate-700 mt-0.5">
                          {ord.customer || ord.customer_name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {ord.customer_phone} • {ord.delivery_address || ord.customer_address}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">
                          {ord.quantity}x {ord.product_name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Size: {ord.selected_size || "Standard"} • Color:{" "}
                          {ord.selected_color || "Standard"}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-extrabold text-slate-900">
                          Total: {formatMoney(ord.amount)}
                        </div>
                        {isPaidOnline ? (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                            ✓ Paid Online • Rider Collects: {symbol}0
                          </span>
                        ) : (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold">
                            COD • Rider Collects: {formatMoney(ord.amount)}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <select
                          value={
                            selectedCarrierByOrder[ord.order_id] ||
                            ord.courier_name ||
                            "Pathao Courier"
                          }
                          onChange={(e) =>
                            setSelectedCarrierByOrder({
                              ...selectedCarrierByOrder,
                              [ord.order_id]: e.target.value,
                            })
                          }
                          className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                        >
                          <option value="Pathao Courier">Pathao Courier</option>
                          <option value="Steadfast Courier">Steadfast Courier</option>
                          <option value="RedX Logistics">RedX Logistics</option>
                          <option value="Paperfly / Sundarban">Paperfly / Sundarban</option>
                          <option value="DHL / FedEx Express">DHL / FedEx Express</option>
                        </select>
                        {ord.tracking_code && (
                          <div className="text-[10px] font-mono text-blue-600 font-bold mt-1">
                            Tracking: {ord.tracking_code}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                            isReturned
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : isDelivered
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : st.includes("dispatch") || st.includes("transit")
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {isReturned
                            ? "Returned"
                            : isDelivered
                            ? "Delivered"
                            : st.includes("dispatch") || st.includes("transit")
                            ? "Dispatched"
                            : "Unfulfilled"}
                        </span>
                        {ord.return_condition && (
                          <div className="text-[10px] text-rose-600 font-semibold mt-1 max-w-48">
                            {ord.return_condition}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDispatchToCourier(ord)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Truck className="w-3 h-3" /> Send to Courier
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMarkDelivered(ord)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Delivered
                          </button>

                          <button
                            type="button"
                            onClick={() => openReturnInspectionModal(ord)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" /> Return / Damage
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              printIsolatedOrderSlip(
                                {
                                  ...ord,
                                  customer: String(
                                    ord.customer || ord.customer_name || "Customer"
                                  ),
                                },
                                symbol
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3 h-3" /> Slip
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3-WAY RETURN & DAMAGE INSPECTION MODAL */}
      {inspectingReturnOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  Inspect Returned Parcel ({inspectingReturnOrder.order_id})
                </h3>
                <p className="text-xs text-slate-400">
                  Product: {inspectingReturnOrder.quantity}x {inspectingReturnOrder.product_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingReturnOrder(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReturnInspection} className="p-6 space-y-4 text-xs">
              <div className="space-y-2.5">
                <label className="block font-extrabold text-slate-800">
                  Select Returned Product Condition &amp; Accounting Action:
                </label>

                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer ${
                    returnOutcome === "good_restock"
                      ? "border-emerald-500 bg-emerald-50/50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="returnOutcome"
                    checked={returnOutcome === "good_restock"}
                    onChange={() => setReturnOutcome("good_restock")}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <PackageCheck className="w-4 h-4 text-emerald-600" />
                      1. Good Condition — Add Back to Main Inventory Stock
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Product is intact and sellable. Automatically adds +{inspectingReturnOrder.quantity} pcs back to your main catalog stock.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer ${
                    returnOutcome === "damaged_lot_sale"
                      ? "border-amber-500 bg-amber-50/50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="returnOutcome"
                    checked={returnOutcome === "damaged_lot_sale"}
                    onChange={() => setReturnOutcome("damaged_lot_sale")}
                    className="mt-1"
                  />
                  <div className="w-full space-y-2">
                    <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      2. Damaged / Defective — Sold to Secondary / Lot Seller
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Does NOT return to fresh customer stock. Enter how much you recovered from a secondary/lot buyer, and the remaining difference is deducted in Analytics &amp; P&amp;L.
                    </p>
                    {returnOutcome === "damaged_lot_sale" && (
                      <div className="pt-1">
                        <label className="block font-bold text-amber-900 mb-1">
                          Amount Recovered from Secondary / Lot Seller ({symbol}):
                        </label>
                        <input
                          type="number"
                          value={lotRecoveryAmount}
                          onChange={(e) => setLotRecoveryAmount(e.target.value)}
                          placeholder="e.g. 1500"
                          className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white font-bold"
                        />
                      </div>
                    )}
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer ${
                    returnOutcome === "total_damage"
                      ? "border-rose-500 bg-rose-50/50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="returnOutcome"
                    checked={returnOutcome === "total_damage"}
                    onChange={() => setReturnOutcome("total_damage")}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-rose-600" />
                      3. Total Damage / Unusable — 100% Loss Write-Off
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Product is completely ruined. Does not add back to stock and records 100% of Buying Cost (COGS) as a loss in Analytics &amp; P&amp;L.
                    </p>
                  </div>
                </label>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deductCourierReturnFee}
                    onChange={(e) => setDeductCourierReturnFee(e.target.checked)}
                  />
                  <span>Deduct Courier Return Delivery Charge in P&amp;L</span>
                </label>
                {deductCourierReturnFee && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Courier Return Fee ({symbol}):</span>
                    <input
                      type="number"
                      value={courierReturnFeeAmount}
                      onChange={(e) => setCourierReturnFeeAmount(e.target.value)}
                      className="w-28 px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-bold"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInspectingReturnOrder(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold cursor-pointer"
                >
                  Confirm Return &amp; Update P&amp;L
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}