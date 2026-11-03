"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getProducts, updateProductStock, getOrders, updateOrderStatus } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import {
  Boxes,
  Package,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Search,
  DollarSign,
} from "lucide-react";

interface InventoryProduct {
  id: number;
  name: string;
  sku: string;
  category: string;
  available_sizes: string;
  available_colors: string;
  image_url: string;
  cost_price: number | string;
  selling_price: number | string;
  effective_price: number | string;
  stock: number;
  status: string;
}

export default function InventoryPage() {
  const { formatMoney } = useCurrency();
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Return Product to Stock Modal
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnProductId, setReturnProductId] = useState<string>("");
  const [returnOrderId, setReturnOrderId] = useState<string>("");
  const [returnQty, setReturnQty] = useState<string>("1");
  const [returnCondition, setReturnCondition] = useState<"resellable" | "damaged">("resellable");
  const [returnReason, setReturnReason] = useState("Customer Size Exchange / Unreachable");
  const [bannerMsg, setBannerMsg] = useState("");

  const loadInventory = async () => {
    setLoading(true);
    const [prodData, ordData] = await Promise.all([getProducts(), getOrders()]);
    if (Array.isArray(prodData)) {
      setProducts(prodData);
      if (prodData.length > 0 && !returnProductId) {
        setReturnProductId(String(prodData[0].id));
      }
    }
    if (Array.isArray(ordData)) setOrders(ordData);
    setLoading(false);
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleQuickRestock = async (prod: InventoryProduct, addUnits: number) => {
    const newStock = Math.max(0, Number(prod.stock || 0) + addUnits);
    await updateProductStock(prod.id, newStock);
    setBannerMsg(`Added +${addUnits} units to "${prod.name}" (New Stock: ${newStock} units).`);
    setTimeout(() => setBannerMsg(""), 4000);
    loadInventory();
  };

  const handleCustomRestock = async (prod: InventoryProduct) => {
    const val = prompt(
      `Enter exact stock quantity to ADD to "${prod.name}" (Current Stock: ${prod.stock} units):`,
      "20"
    );
    if (!val) return;
    const add = parseInt(val, 10);
    if (isNaN(add) || add <= 0) return;
    await handleQuickRestock(prod, add);
  };

  const handleProcessProductReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Math.max(1, parseInt(returnQty, 10) || 1);
    const prod = products.find((p) => String(p.id) === returnProductId);

    if (returnOrderId) {
      const targetOrder = orders.find((o) => String(o.id) === returnOrderId);
      if (targetOrder) {
        await updateOrderStatus(targetOrder.id, "Returned");
      }
    } else if (prod && returnCondition === "resellable") {
      await updateProductStock(prod.id, Number(prod.stock || 0) + qty);
    }

    setShowReturnModal(false);
    setBannerMsg(
      returnCondition === "resellable"
        ? `Return processed! +${qty} units added back to sellable warehouse stock (${returnReason}).`
        : `Damaged return logged (${qty} units quarantined — not added to sellable stock).`
    );
    setTimeout(() => setBannerMsg(""), 5000);
    loadInventory();
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const metrics = useMemo(() => {
    const totalUnits = products.reduce((s, p) => s + Number(p.stock || 0), 0);
    const totalCostValue = products.reduce(
      (s, p) => s + Number(p.stock || 0) * Number(p.cost_price || 0),
      0
    );
    const lowStock = products.filter((p) => Number(p.stock) <= 15).length;
    const returnedOrdersCount = orders.filter(
      (o) => o.status === "Returned" || o.status === "Cancelled"
    ).length;
    return { totalUnits, totalCostValue, lowStock, returnedOrdersCount };
  }, [products, orders]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Inventory, Warehouse Stock &amp; Returns Control
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track live product quantities, warehouse asset value, instant restocks, and returned merchandise.
          </p>
        </div>

        <button
          onClick={() => setShowReturnModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-xs transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" /> + Log Product Return to Stock
        </button>
      </div>

      {bannerMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{bannerMsg}</span>
        </div>
      )}

      {/* 4 Warehouse KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Catalog SKUs</span>
            <Package className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{products.length}</div>
          <div className="text-[11px] text-slate-500">Active product lines</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Available Warehouse Units</span>
            <Boxes className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{metrics.totalUnits} units</div>
          <div className="text-[11px] text-emerald-600 font-semibold">Auto-synced on every order</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Inventory Asset Value (Cost)</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {formatMoney(metrics.totalCostValue)}
          </div>
          <div className="text-[11px] text-slate-500">Buying Cost × Available Stock</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Returned / Restocked Orders</span>
            <RotateCcw className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {metrics.returnedOrdersCount}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold">
            Low stock alerts: {metrics.lowStock}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
        <div className="text-xs font-extrabold text-slate-800">
          Warehouse Stock Ledger ({filteredProducts.length} Products)
        </div>
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU, product, category..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">SKU &amp; Product</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Sizes &amp; Colors in Stock</th>
                <th className="py-3.5 px-4">Stock Value (Cost)</th>
                <th className="py-3.5 px-4">Available Units</th>
                <th className="py-3.5 px-4">Stock Status</th>
                <th className="py-3.5 px-5 text-right">Quick Restock Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Loading inventory...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    No matching products in warehouse.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const stockVal = Number(prod.stock || 0) * Number(prod.cost_price || 0);
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          {prod.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <div className="font-extrabold text-slate-900">{prod.name}</div>
                            <div className="text-xs font-mono text-indigo-600 font-bold">
                              {prod.sku}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-slate-600">
                        {prod.category}
                      </td>
                      <td className="py-4 px-4 text-xs">
                        <div className="font-bold text-slate-800">
                          Sizes: {prod.available_sizes || "Standard"}
                        </div>
                        <div className="text-slate-500">
                          Colors: {prod.available_colors || "Standard"}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-800 text-xs">
                        {formatMoney(stockVal)}
                      </td>
                      <td className="py-4 px-4 font-extrabold text-slate-900">
                        {prod.stock} units
                      </td>
                      <td className="py-4 px-4">
                        {prod.stock === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3.5 h-3.5" /> Out of Stock
                          </span>
                        ) : prod.stock <= 15 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Healthy Stock
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right space-x-2">
                        <button
                          onClick={() => handleQuickRestock(prod, 20)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold cursor-pointer"
                        >
                          + Restock +20 Units
                        </button>
                        <button
                          onClick={() => handleCustomRestock(prod)}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 inline mr-0.5" /> Custom Qty
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-extrabold text-slate-900">
                Log Product Return &amp; Restock Inventory
              </h2>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessProductReturn} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Link to Existing Order (Optional — Auto-Restores Order Stock)
                </label>
                <select
                  value={returnOrderId}
                  onChange={(e) => setReturnOrderId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">-- Manual Counter / Courier Return (Select Product Below) --</option>
                  {orders
                    .filter((o) => o.status !== "Returned" && o.status !== "Cancelled")
                    .map((o) => (
                      <option key={o.id} value={String(o.id)}>
                        {o.order_id} — {o.customer} ({o.product_name}, Qty: {o.quantity || 1})
                      </option>
                    ))}
                </select>
              </div>

              {!returnOrderId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Select Returned Product *
                    </label>
                    <select
                      value={returnProductId}
                      onChange={(e) => setReturnProductId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={String(p.id)}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Returned Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={returnQty}
                      onChange={(e) => setReturnQty(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Return Reason *</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Customer Size Exchange">Customer Size / Color Exchange</option>
                  <option value="Courier Unreachable (RTO)">Courier Unreachable / Customer Unavailable (RTO)</option>
                  <option value="Customer Changed Mind">Customer Changed Mind at Delivery</option>
                  <option value="Defective / Damaged Item">Defective or Damaged in Transit</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Returned Item Condition &amp; Stock Action *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReturnCondition("resellable")}
                    className={`p-3 rounded-xl border font-bold text-left cursor-pointer ${
                      returnCondition === "resellable"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    ✓ Good Condition (Add Back to Sellable Stock)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnCondition("damaged")}
                    className={`p-3 rounded-xl border font-bold text-left cursor-pointer ${
                      returnCondition === "damaged"
                        ? "border-rose-600 bg-rose-50 text-rose-900"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    ✕ Damaged (Do Not Add to Sellable Stock)
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold cursor-pointer"
                >
                  Confirm Return &amp; Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}