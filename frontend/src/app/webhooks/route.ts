import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-SYNVORA-KEY, X-WC-Webhook-Topic, X-Shopify-Topic",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const storeId = url.searchParams.get("store") || "default-workspace";

  return NextResponse.json(
    {
      status: "Active & Listening 24/7",
      workspace_store: storeId,
      webhook_endpoint: `${url.origin}/api/webhooks/order-intake?store=${storeId}`,
      supported_platforms: [
        "WordPress / WooCommerce (Order Created Webhook)",
        "Shopify (Order Creation Webhook)",
        "Custom Website (Next.js, PHP, Laravel, HTML)",
      ],
      message:
        "Paste this URL into your website's Webhook settings (HTTP POST). All incoming orders automatically sync to your Synvora OS workspace.",
    },
    { status: 200, headers: corsHeaders }
  );
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const storeId = url.searchParams.get("store") || "default-workspace";
    const payload = await request.json().catch(() => ({}));

    // Automatically parse WooCommerce, Shopify, or Custom Website JSON format
    const customerName =
      payload.customer ||
      payload.customer_name ||
      (payload.billing ? `${payload.billing.first_name || ""} ${payload.billing.last_name || ""}`.trim() : "") ||
      "Website Customer";

    const customerPhone =
      payload.customer_phone ||
      payload.phone ||
      payload.billing?.phone ||
      payload.shipping_address?.phone ||
      "";

    const deliveryAddress =
      payload.delivery_address ||
      payload.address ||
      (payload.billing ? `${payload.billing.address_1 || ""}, ${payload.billing.city || ""}`.trim() : "") ||
      "";

    const firstLineItem = Array.isArray(payload.line_items) ? payload.line_items[0] : null;
    const productName =
      payload.product_name ||
      payload.product ||
      firstLineItem?.name ||
      "Website Checkout Order";

    const quantity = Number(payload.quantity || firstLineItem?.quantity || 1);
    const amount = Number(payload.amount || payload.total || payload.total_price || 0);

    const createdOrder = {
      order_id: payload.order_id || `#WEB-${ payload.id || Math.floor(100000 + Math.random() * 900000) }`,
      store_id: storeId,
      customer: customerName || "Website Customer",
      customer_phone: customerPhone,
      delivery_address: deliveryAddress,
      product_name: productName,
      quantity,
      amount,
      payment: payload.payment || payload.payment_method_title || "Online / COD",
      channel: "Website Webhook",
      status: "Confirmed",
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        status: "Order Captured & Synced to Synvora OS",
        workspace_store: storeId,
        order: createdOrder,
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Invalid webhook payload" },
      { status: 400, headers: corsHeaders }
    );
  }
}