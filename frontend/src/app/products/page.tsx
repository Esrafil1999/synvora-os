"use client";

import React, { useState, useEffect } from "react";
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/lib/api";
import { useCurrency, compressImageFile } from "@/lib/currency";
import {
  Package,
  Plus,
  Tag,
  TrendingUp,
  TrendingDown,
  Trash2,
  ExternalLink,
  Percent,
  CheckCircle2,
  Upload,
  Ruler,
  Palette,
} from "lucide-react";
import Link from "next/link";

export interface ProductItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  available_sizes: string;
  available_colors: string;
  image_url: string;
  cost_price: number | string;
  selling_price: number | string;
  offer_price: number | string | null;
  offer_label: string;
  is_on_offer: boolean;
  is_clearance: boolean;
  effective_price: number | string;
  unit_profit: number | string;
  unit_margin_percent: number;
  stock: number;
  status: string;
}

const SIZE_PRESET_GROUPS = [
  { label: "Clothing / Apparel", sizes: ["S", "M", "L", "XL", "XXL", "3XL", "5XL", "Free Size"] },
  { label: "Shoes / Footwear", sizes: ["38", "39", "40", "41", "42", "43", "44", "45"] },
  { label: "Weight / Volume", sizes: ["250g", "500g", "1kg", "250ml", "500ml", "1L", "Standard"] },
];

export default function ProductsPage() {
  const { formatMoney, symbol } = useCurrency();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sizeCategoryTab, setSizeCategoryTab] = useState(0);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [availableSizes, setAvailableSizes] = useState("M, L, XL, XXL");
  const [availableColors, setAvailableColors] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stock, setStock] = useState("50");

  // Accurate Offer / Discount Calculation (Supports Discount % OR Fixed Offer Price!)
  const [isOnOffer, setIsOnOffer] = useState(false);
  const [offerMode, setOfferMode] = useState<"percent" | "fixed_price">("percent");
  const [offerInputVal, setOfferInputVal] = useState("");
  const [promoCodeLabel, setPromoCodeLabel] = useState("");

  const loadCatalog = async () => {
    setLoading(true);
    const data = await getProducts();
    if (Array.isArray(data)) {
      setProducts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImageFile(file, 520);
    if (compressed) setImageUrl(compressed);
  };

  const toggleQuickSize = (sz: string) => {
    const current = availableSizes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (current.includes(sz)) {
      setAvailableSizes(current.filter((s) => s !== sz).join(", "));
    } else {
      setAvailableSizes([...current, sz].join(", "));
    }
  };

  // Accurate P&L math:
  // If offerMode === 'percent', typing 15 means 15% OFF the regular selling price!
  // If offerMode === 'fixed_price', typing 5500 means the final selling price is 5500!
  const numCost = parseFloat(costPrice) || 0;
  const numRegular = parseFloat(sellingPrice) || 0;
  const rawOfferInput = parseFloat(offerInputVal) || 0;

  let calculatedOfferSellingPrice = numRegular;
  let discountPercentApplied = 0;

  if (isOnOffer && rawOfferInput > 0 && numRegular > 0) {
    if (offerMode === "percent") {
      discountPercentApplied = Math.min(99, Math.max(0, rawOfferInput));
      calculatedOfferSellingPrice = Number(
        (numRegular * (1 - discountPercentApplied / 100)).toFixed(2)
      );
    } else {
      calculatedOfferSellingPrice = rawOfferInput;
      discountPercentApplied = Number(
        (((numRegular - calculatedOfferSellingPrice) / numRegular) * 100).toFixed(1)
      );
    }
  }

  const activeSalePrice =
    isOnOffer && rawOfferInput > 0 ? calculatedOfferSellingPrice : numRegular;
  const previewProfit = activeSalePrice - numCost;
  const previewMargin =
    activeSalePrice > 0 ? Number(((previewProfit / activeSalePrice) * 100).toFixed(1)) : 0;

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) return;

    const finalOfferPrice =
      isOnOffer && rawOfferInput > 0 ? calculatedOfferSellingPrice : null;
    const finalOfferLabel =
      isOnOffer && rawOfferInput > 0
        ? promoCodeLabel.trim() || `${discountPercentApplied}% OFF`
        : "";

    const payload = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category: category.trim() || "General",
      available_sizes: availableSizes.trim() || "Standard",
      available_colors: availableColors.trim() || "Standard",
      image_url: imageUrl,
      cost_price: numCost,
      selling_price: numRegular,
      offer_price: finalOfferPrice,
      offer_label: finalOfferLabel,
      is_on_offer: Boolean(isOnOffer && finalOfferPrice && finalOfferPrice > 0),
      is_clearance: Boolean(finalOfferPrice && finalOfferPrice < numCost),
      stock: parseInt(stock, 10) || 0,
    };

    const created = await createProduct(payload);
    if (created) {
      setName("");
      setSku("");
      setCategory("");
      setAvailableSizes("M, L, XL, XXL");
      setAvailableColors("");
      setImageUrl("");
      setCostPrice("");
      setSellingPrice("");
      setOfferInputVal("");
      setPromoCodeLabel("");
      setIsOnOffer(false);
      setShowModal(false);
      loadCatalog();
    }
  };

  const handleToggleOffer = async (prod: ProductItem) => {
    if (!prod.is_on_offer) {
      const pctStr = prompt(
        `Enter Discount Percentage (%) for "${prod.name}" (Regular Selling Price: ${symbol}${prod.selling_price}, Buying Cost: ${symbol}${prod.cost_price})\nExample: Type 15 for 15% OFF:`,
        "15"
      );
      if (!pctStr) return;
      const pct = parseFloat(pctStr);
      if (isNaN(pct) || pct <= 0 || pct >= 100) {
        alert("Please enter a valid percentage between 1 and 99.");
        return;
      }
      const reg = Number(prod.selling_price);
      const newOfferPrice = Number((reg * (1 - pct / 100)).toFixed(2));
      const code = prompt(
        `Discounted Price will be ${symbol}${newOfferPrice} (${pct}% OFF).\nEnter a Product Promo / Coupon Code (e.g. SAVE15):`,
        `SAVE${Math.round(pct)}`
      );
      await updateProduct(prod.id, {
        is_on_offer: true,
        offer_price: newOfferPrice,
        offer_label: (code || `${pct}% OFF`).trim(),
        is_clearance: newOfferPrice < Number(prod.cost_price),
      });
    } else {
      await updateProduct(prod.id, { is_on_offer: false, offer_price: null, offer_label: "" });
    }
    loadCatalog();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product from your catalog?")) return;
    await deleteProduct(id);
    loadCatalog();
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Product Catalog, Sizes &amp; Profit / Loss Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Add clothing, shoes, or any product with custom sizes, colors, buying cost, selling price, and percentage discounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/store"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold transition"
          >
            <ExternalLink className="w-4 h-4" /> Preview Customer &quot;Order Now&quot; Page
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Product, Code &amp; Photo</th>
                <th className="py-3.5 px-4">Available Sizes &amp; Colors</th>
                <th className="py-3.5 px-4">Buying Cost</th>
                <th className="py-3.5 px-4">Regular Price</th>
                <th className="py-3.5 px-4">Offer Price &amp; Promo Code</th>
                <th className="py-3.5 px-4">Net Profit / Loss per Unit</th>
                <th className="py-3.5 px-4">Live Stock</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Loading your product catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center space-y-3">
                    <Package className="w-8 h-8 text-slate-400 mx-auto" />
                    <div className="font-bold text-slate-800">Your Product Catalog is Empty</div>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Click &quot;Add New Product&quot; above to add your products, sizes (M, L, XL or Shoe sizes 40, 41, 42), colors, buying cost, and selling price.
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const effPrice =
                    prod.is_on_offer && prod.offer_price && Number(prod.offer_price) > 0
                      ? Number(prod.offer_price)
                      : Number(prod.selling_price);
                  const costVal = Number(prod.cost_price);
                  const unitProfit = effPrice - costVal;
                  const marginPct =
                    effPrice > 0 ? ((unitProfit / effPrice) * 100).toFixed(1) : "0.0";
                  const isLoss = unitProfit < 0;

                  const sizeList = (prod.available_sizes || "Standard")
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                  const colorList = (prod.available_colors || "")
                    .split(",")
                    .map((c) => c.trim())
                    .filter(Boolean);

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          {prod.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <div className="font-extrabold text-slate-900">{prod.name}</div>
                            <div className="text-xs text-slate-500">
                              Code: <span className="font-bold text-indigo-600">{prod.sku}</span> • {prod.category}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {sizeList.map((sz, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200"
                            >
                              {sz}
                            </span>
                          ))}
                        </div>
                        {colorList.length > 0 && (
                          <div className="text-[11px] text-slate-500 mt-1">
                            Colors: <span className="font-semibold text-slate-800">{colorList.join(", ")}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 font-semibold text-slate-600">
                        {formatMoney(prod.cost_price)}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900">
                        {formatMoney(prod.selling_price)}
                      </td>
                      <td className="py-4 px-4">
                        {prod.is_on_offer && prod.offer_price ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
                              <Tag className="w-3 h-3" /> {formatMoney(prod.offer_price)}
                            </span>
                            <div className="text-[11px] font-extrabold text-indigo-600">
                              Promo Code: {prod.offer_label || "OFFER"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">No Active Offer</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold ${
                            isLoss
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {isLoss ? (
                            <>
                              <TrendingDown className="w-3.5 h-3.5" />
                              -{formatMoney(Math.abs(unitProfit))} Loss
                            </>
                          ) : (
                            <>
                              <TrendingUp className="w-3.5 h-3.5" />
                              +{formatMoney(unitProfit)} Profit ({marginPct}%)
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            prod.stock === 0
                              ? "bg-rose-100 text-rose-700"
                              : prod.stock <= 15
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {prod.stock} pcs
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right space-x-2">
                        <button
                          onClick={() => handleToggleOffer(prod)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            prod.is_on_offer
                              ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                              : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                          }`}
                        >
                          {prod.is_on_offer ? "Remove Offer" : "Set % Discount"}
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-extrabold text-slate-900">
                Add New Product (With Photo, Sizes, Colors &amp; Profit Calculator)
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-xl object-cover border border-slate-300"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-white border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                    <Upload className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <label className="block text-xs font-extrabold text-slate-800">
                    Upload Product Photo / Banner Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Air Force / Cotton Shirt"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Product Code / SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. DFS-8506"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Shoes / Apparel / Belt"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              {/* Multi-Industry Size Selector (Clothing, Shoes 38-45, Weight/Volume, or Custom Typed) */}
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                    <Ruler className="w-3.5 h-3.5 text-indigo-600" />
                    Available Product Sizes (Select Preset or Type Custom Sizes) *
                  </label>
                  <div className="flex gap-1">
                    {SIZE_PRESET_GROUPS.map((grp, idx) => (
                      <button
                        key={grp.label}
                        type="button"
                        onClick={() => {
                          setSizeCategoryTab(idx);
                          setAvailableSizes(grp.sizes.slice(0, 4).join(", "));
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          sizeCategoryTab === idx
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-slate-600 border border-slate-200"
                        }`}
                      >
                        {grp.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {SIZE_PRESET_GROUPS[sizeCategoryTab].sizes.map((sz) => {
                    const active = availableSizes
                      .split(",")
                      .map((s) => s.trim())
                      .includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleQuickSize(sz)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border transition cursor-pointer ${
                          active
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  required
                  value={availableSizes}
                  onChange={(e) => setAvailableSizes(e.target.value)}
                  placeholder="Type any sizes separated by comma: e.g. 40, 41, 42 or M, L, XL, XXL"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white font-semibold"
                />

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 mb-1">
                    <Palette className="w-3.5 h-3.5 text-indigo-600" />
                    Available Colors in Stock (Type Your Product Colors) *
                  </label>
                  <input
                    type="text"
                    required
                    value={availableColors}
                    onChange={(e) => setAvailableColors(e.target.value)}
                    placeholder="e.g. White, Black, Navy Blue"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Buying Cost ({symbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="e.g. 4500"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Regular Selling Price ({symbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="e.g. 6500"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              {/* Accurate Percentage Discount OR Fixed Offer Price Section */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOnOffer}
                    onChange={(e) => setIsOnOffer(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-rose-600" />
                    Enable Promotional Discount (%) or Stock Clearance Offer
                  </span>
                </label>

                {isOnOffer && (
                  <div className="space-y-3 pt-1">
                    <div className="inline-flex rounded-lg bg-slate-200 p-1 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setOfferMode("percent")}
                        className={`px-3 py-1 rounded-md cursor-pointer ${
                          offerMode === "percent" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600"
                        }`}
                      >
                        Discount Percentage (% OFF)
                      </button>
                      <button
                        type="button"
                        onClick={() => setOfferMode("fixed_price")}
                        className={`px-3 py-1 rounded-md cursor-pointer ${
                          offerMode === "fixed_price" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-600"
                        }`}
                      >
                        Fixed Offer Price ({symbol})
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          {offerMode === "percent"
                            ? "Discount Percentage (e.g. Type 15 for 15% OFF)"
                            : `Offer Selling Price (${symbol})`}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={offerInputVal}
                          onChange={(e) => setOfferInputVal(e.target.value)}
                          placeholder={offerMode === "percent" ? "e.g. 15 (means 15% OFF)" : "e.g. 5525"}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Product Promo / Coupon Code (Exact Code Required at Checkout)
                        </label>
                        <input
                          type="text"
                          value={promoCodeLabel}
                          onChange={(e) => setPromoCodeLabel(e.target.value)}
                          placeholder="e.g. SAVE15 / EID15"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-bold"
                        />
                      </div>
                    </div>

                    {rawOfferInput > 0 && numRegular > 0 && (
                      <div className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-200">
                        Regular Price: {formatMoney(numRegular)} &rarr; After {discountPercentApplied}% Discount, Final Selling Price ={" "}
                        <strong>{formatMoney(calculatedOfferSellingPrice)}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Accurate Live Profit / Loss Banner */}
              {(numCost > 0 || numRegular > 0) && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
                    previewProfit < 0
                      ? "bg-rose-50 border-rose-200 text-rose-800"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}
                >
                  <div>
                    <div>
                      {previewProfit < 0
                        ? "Selling Below Buying Cost — Net Loss Per Unit:"
                        : "Net Profit Per Unit Sold (Selling minus Buying Cost):"}
                    </div>
                    <div className="text-[11px] font-normal opacity-80">
                      Selling at {formatMoney(activeSalePrice)} vs Buying Cost {formatMoney(numCost)}
                    </div>
                  </div>
                  <span className="text-sm font-extrabold">
                    {previewProfit < 0
                      ? `-${formatMoney(Math.abs(previewProfit))} Loss / unit`
                      : `+${formatMoney(previewProfit)} Profit / unit (${previewMargin}%)`}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save Product to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}