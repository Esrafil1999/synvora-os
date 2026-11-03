/* eslint-disable @typescript-eslint/no-explicit-any */
export const API_BASE = "http://127.0.0.1:8000/api/v1";
export const API_BASE_URL = API_BASE;

const INTERNAL_KEY =
  process.env.NEXT_PUBLIC_SYNVORA_API_KEY || "synvora_sec_live_99x8877665544332211_hq";

const authHeaders = {
  "Content-Type": "application/json",
  "X-Synvora-Api-Key": INTERNAL_KEY,
};

function normalizeEndpoint(endpoint: string): string {
  const withSlash = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const clean = withSlash.endsWith("/") ? withSlash : `${withSlash}/`;
  return clean.replace(/^\/gateways\//, "/payment-gateways/");
}

function getCacheKey(cleanEndpoint: string): string {
  const segment = cleanEndpoint.split("/").filter(Boolean)[0] || "root";
  return `synvora_db_${segment}`;
}

function readLocalCache(cleanEndpoint: string): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getCacheKey(cleanEndpoint));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalCache(cleanEndpoint: string, data: any): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getCacheKey(cleanEndpoint), JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

export async function fetchFromApi<T = any>(endpoint: string, fallback: any = null): Promise<T> {
  const cleanEndpoint = normalizeEndpoint(endpoint);
  try {
    const res = await fetch(`${API_BASE}${cleanEndpoint}`, {
      headers: authHeaders,
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        writeLocalCache(cleanEndpoint, data);
      }
      return data as T;
    }
  } catch {
    // Fall back to local cache if backend server is restarting
  }

  if (cleanEndpoint === "/public-store/") {
    const cachedProducts = readLocalCache("/products/");
    return {
      store_name: "Official Online Store",
      products: cachedProducts,
    } as unknown as T;
  }

  const cached = readLocalCache(cleanEndpoint);
  if (Array.isArray(fallback) || cached.length > 0) {
    return (cached.length > 0 ? cached : fallback) as T;
  }
  return fallback as T;
}

export async function postToApi<T = any>(
  endpoint: string,
  payload: Record<string, any>,
  fallback: any = null
): Promise<T> {
  const cleanEndpoint = normalizeEndpoint(endpoint);
  const method = cleanEndpoint.startsWith("/workspace/") ? "PATCH" : "POST";

  try {
    const res = await fetch(`${API_BASE}${cleanEndpoint}`, {
      method,
      headers: authHeaders,
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const saved = await res.json();
      return saved as T;
    }
  } catch {
    // Offline fallback handled below
  }

  if (cleanEndpoint === "/customers/") {
    const existing = readLocalCache("/customers/");
    const newCustomer = {
      id: Date.now(),
      name: String(payload.name || "Customer"),
      email: String(payload.email || ""),
      phone: String(payload.phone || ""),
      address: String(payload.address || ""),
      channel: String(payload.channel || "Direct Store"),
      orders_count: Number(payload.orders_count ?? 1),
      total_spent: Number(payload.total_spent ?? 0),
      created_at: new Date().toISOString(),
    };
    writeLocalCache("/customers/", [newCustomer, ...existing]);
    return newCustomer as unknown as T;
  }

  if (cleanEndpoint === "/products/") {
    const existing = readLocalCache("/products/");
    const cost = Number(payload.cost_price || 0);
    const selling = Number(payload.selling_price || 0);
    const offer = payload.is_on_offer && payload.offer_price ? Number(payload.offer_price) : null;
    const effective = offer && offer > 0 ? offer : selling;
    const profit = effective - cost;
    const margin = effective > 0 ? Number((((effective - cost) / effective) * 100).toFixed(1)) : 0;
    const stock = Number(payload.stock ?? 50);

    const newItem = {
      id: Date.now(),
      name: String(payload.name || "Product"),
      sku: String(payload.sku || `SKU-${Math.floor(100 + Math.random() * 900)}`),
      category: String(payload.category || "General"),
      available_sizes: String(payload.available_sizes || "M, L, XL, XXL"),
      available_colors: String(payload.available_colors || ""),
      image_url: String(payload.image_url || ""),
      cost_price: cost,
      selling_price: selling,
      offer_price: offer,
      offer_label: String(payload.offer_label || ""),
      is_on_offer: Boolean(payload.is_on_offer),
      is_clearance: Boolean(payload.is_clearance),
      effective_price: effective,
      unit_profit: profit,
      unit_margin_percent: margin,
      stock,
      status: stock === 0 ? "Out of Stock" : stock <= 15 ? "Low Stock" : "In Stock",
      created_at: new Date().toISOString(),
    };
    writeLocalCache("/products/", [newItem, ...existing]);
    return newItem as unknown as T;
  }

  if (cleanEndpoint === "/orders/" || cleanEndpoint === "/public-store/") {
    const existingOrders = readLocalCache("/orders/");
    const existingProducts = readLocalCache("/products/");
    const qty = Math.max(1, Number(payload.quantity || 1));
    const matchedProd = existingProducts.find(
      (p: any) =>
        String(p.id) === String(payload.product_id) ||
        String(p.sku).toLowerCase() === String(payload.product_sku || "").toLowerCase()
    );

    let unitEffective = Number(payload.amount || 0);
    let unitCost = Number(payload.cogs_amount || 0);
    let prodName = String(payload.product_name || "Custom Order");
    let prodSku = String(payload.product_sku || "CUSTOM");

    if (matchedProd) {
      prodName = matchedProd.name;
      prodSku = matchedProd.sku;
      unitEffective = Number(matchedProd.effective_price || matchedProd.selling_price || 0);
      unitCost = Number(matchedProd.cost_price || 0);
      matchedProd.stock = Math.max(0, Number(matchedProd.stock || 0) - qty);
      writeLocalCache("/products/", existingProducts);
    }

    const totalAmt = payload.product_id || payload.is_unit_price ? unitEffective * qty : unitEffective;
    const totalCogs = unitCost > 0 ? unitCost * qty : Math.round(totalAmt * 0.55);

    const newOrder = {
      id: Date.now(),
      order_id: String(payload.order_id || `#SYN-${Math.floor(10000 + Math.random() * 90000)}`),
      customer: String(payload.customer || payload.customer_name || "Customer"),
      customer_phone: String(payload.customer_phone || ""),
      delivery_address: String(payload.delivery_address || ""),
      channel: String(payload.channel || "Facebook Ad"),
      order_source_type: String(payload.order_source_type || "Self-Checkout"),
      product_name: prodName,
      product_sku: prodSku,
      selected_size: String(payload.selected_size || "Standard"),
      selected_color: String(payload.selected_color || "Standard"),
      order_image: String(payload.order_image || (matchedProd ? matchedProd.image_url : "")),
      quantity: qty,
      regular_amount: totalAmt,
      discount_amount: Number(payload.extra_discount || 0),
      amount: totalAmt,
      cogs_amount: totalCogs,
      net_profit: totalAmt - totalCogs,
      offer_applied: "",
      stock_deducted: true,
      payment: String(payload.payment || "COD"),
      status: String(payload.status || "Confirmed"),
      created_at: new Date().toISOString(),
    };
    writeLocalCache("/orders/", [newOrder, ...existingOrders]);
    if (cleanEndpoint === "/public-store/") {
      return { success: true, order: newOrder } as unknown as T;
    }
    return newOrder as unknown as T;
  }

  return fallback as T;
}

export async function patchToApi<T = any>(
  endpoint: string,
  idOrPayload: number | string | Record<string, any>,
  maybePayload?: Record<string, any>,
  fallback: any = null
): Promise<T> {
  let targetEndpoint = endpoint;
  let bodyPayload: Record<string, any> = {};

  if (typeof idOrPayload === "number" || typeof idOrPayload === "string") {
    const base = endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;
    targetEndpoint = `${base}/${idOrPayload}/`;
    bodyPayload = maybePayload || {};
  } else {
    bodyPayload = idOrPayload || {};
  }

  const cleanEndpoint = normalizeEndpoint(targetEndpoint);
  try {
    const res = await fetch(`${API_BASE}${cleanEndpoint}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify(bodyPayload),
    });
    if (res.ok) {
      return (await res.json()) as T;
    }
  } catch {
    // Update local cache if offline
  }

  const parts = cleanEndpoint.split("/").filter(Boolean);
  if (parts.length === 2) {
    const collectionPath = `/${parts[0]}/`;
    const targetId = parts[1];
    const items = readLocalCache(collectionPath);
    const updatedItems = items.map((item: any) =>
      String(item.id) === String(targetId) ? { ...item, ...bodyPayload } : item
    );
    writeLocalCache(collectionPath, updatedItems);
    const found = updatedItems.find((item: any) => String(item.id) === String(targetId));
    if (found) return found as T;
  }

  return fallback as T;
}

export async function deleteFromApi(endpoint: string): Promise<boolean> {
  const cleanEndpoint = normalizeEndpoint(endpoint);
  try {
    const res = await fetch(`${API_BASE}${cleanEndpoint}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    if (res.ok) return true;
  } catch {
    // Fallback below
  }

  const parts = cleanEndpoint.split("/").filter(Boolean);
  if (parts.length === 2) {
    const collectionPath = `/${parts[0]}/`;
    const targetId = parts[1];
    const items = readLocalCache(collectionPath);
    writeLocalCache(
      collectionPath,
      items.filter((item: any) => String(item.id) !== String(targetId))
    );
    return true;
  }
  return false;
}

export const fetchFromBackend = fetchFromApi;
export const postToBackend = postToApi;
export const patchToBackend = patchToApi;

export const getDashboardSummary = () => fetchFromApi<any>("/summary/");
export const getProducts = () => fetchFromApi<any[]>("/products/", []);
export const createProduct = (data: Record<string, any>) => postToApi<any>("/products/", data);
export const updateProduct = (id: number, data: Record<string, any>) => patchToApi<any>(`/products/${id}/`, data);
export const updateProductStock = (id: number, stock: number) => patchToApi<any>(`/products/${id}/`, { stock });
export const deleteProduct = (id: number) => deleteFromApi(`/products/${id}/`);

export const getOrders = () => fetchFromApi<any[]>("/orders/", []);
export const createOrder = (data: Record<string, any>) => postToApi<any>("/orders/", data);
export const updateOrderStatus = (id: number, status: string) => patchToApi<any>(`/orders/${id}/`, { status });

export const getCustomers = () => fetchFromApi<any[]>("/customers/", []);
export const createCustomer = (data: Record<string, any>) => postToApi<any>("/customers/", data);
export const deleteCustomer = (id: number) => deleteFromApi(`/customers/${id}/`);

export const getExpenses = () => fetchFromApi<any[]>("/expenses/", []);
export const createExpense = (data: Record<string, any>) => postToApi<any>("/expenses/", data);

export const getSocialPosts = () => fetchFromApi<any[]>("/social-posts/", []);
export const createSocialPost = (data: Record<string, any>) => postToApi<any>("/social-posts/", data);

export const getChannels = () => fetchFromApi<any[]>("/channels/", []);
export const updateChannel = (id: number, data: Record<string, any>) => patchToApi<any>(`/channels/${id}/`, data);

export const getPaymentGateways = () => fetchFromApi<any[]>("/payment-gateways/", []);
export const updatePaymentGateway = (id: number, data: Record<string, any>) =>
  patchToApi<any>(`/payment-gateways/${id}/`, data);

export const getWorkspaceConfig = () => fetchFromApi<Record<string, any>>("/workspace/", {});
export const updateWorkspaceConfig = (data: Record<string, any>) => patchToApi<any>("/workspace/", data);

export const getPublicStore = () => fetchFromApi<any>("/public-store/");
export const submitPublicOrder = (data: Record<string, any>) => postToApi<any>("/public-store/", data);