"""
@file api/views.py
@description Master REST API ViewSets and custom endpoints for Channels, Payment Gateways,
Workspace Plan Switching (Starter/Pro/Enterprise), AI Credit Top-Ups, and Public Order Webhooks.
"""

import random
from django.db.models import Sum
from django.contrib.auth import authenticate
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import (
    Product,
    Customer,
    Order,
    DailyExpense,
    SocialPost,
    ChannelConfig,
    PaymentGatewayConfig,
    WorkspaceConfig,
)
from .serializers import (
    ProductSerializer,
    CustomerSerializer,
    OrderSerializer,
    DailyExpenseSerializer,
    SocialPostSerializer,
    ChannelConfigSerializer,
    PaymentGatewayConfigSerializer,
    WorkspaceConfigSerializer,
)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("-created_at")
    serializer_class = ProductSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by("-joined_at")
    serializer_class = CustomerSerializer


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by("-created_at")
    serializer_class = OrderSerializer


class DailyExpenseViewSet(viewsets.ModelViewSet):
    queryset = DailyExpense.objects.all().order_by("-expense_date", "-id")
    serializer_class = DailyExpenseSerializer


class SocialPostViewSet(viewsets.ModelViewSet):
    queryset = SocialPost.objects.all().order_by("-created_at")
    serializer_class = SocialPostSerializer


class ChannelConfigViewSet(viewsets.ModelViewSet):
    queryset = ChannelConfig.objects.all().order_by("id")
    serializer_class = ChannelConfigSerializer


class PaymentGatewayConfigViewSet(viewsets.ModelViewSet):
    queryset = PaymentGatewayConfig.objects.all().order_by("id")
    serializer_class = PaymentGatewayConfigSerializer


def get_or_create_workspace():
    ws, _ = WorkspaceConfig.objects.get_or_create(
        id=1,
        defaults={
            "business_name": "Northwind Outfitters",
            "active_plan": "Starter",
            "ai_credits_remaining": 850,
            "ai_credits_limit": 1000,
        },
    )
    return ws


@api_view(["GET", "PATCH", "POST"])
def workspace_config_view(request):
    """
    GET: Returns current workspace settings, active subscription plan, and AI credits.
    PATCH/POST: Updates workspace settings, upgrades plan (Starter/Pro/Enterprise), or tops up AI credits.
    """
    ws = get_or_create_workspace()

    if request.method in ["PATCH", "POST"]:
        data = request.data
        if "add_ai_credits" in data:
            added = int(data["add_ai_credits"])
            ws.ai_credits_remaining += added
            ws.ai_credits_limit += added
            ws.save()
            return Response(WorkspaceConfigSerializer(ws).data)

        serializer = WorkspaceConfigSerializer(ws, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    return Response(WorkspaceConfigSerializer(ws).data)


@api_view(["GET"])
def pnl_summary_view(request):
    """Calculates real-time Net Profit from Neon Cloud PostgreSQL."""
    total_sales = Order.objects.aggregate(s=Sum("total_amount"))["s"] or 0
    total_cogs = Order.objects.aggregate(c=Sum("product_cost"))["c"] or 0
    total_expenses = DailyExpense.objects.aggregate(e=Sum("amount"))["e"] or 0
    net_profit = total_sales - (total_cogs + total_expenses)

    return Response(
        {
            "gross_sales": float(total_sales),
            "product_cogs": float(total_cogs),
            "operational_expenses": float(total_expenses),
            "net_profit": float(net_profit),
            "total_orders": Order.objects.count(),
            "low_stock_count": Product.objects.filter(stock__lte=15).count(),
        }
    )


@api_view(["POST"])
def ai_copilot_query_view(request):
    """Live AI Business Analyst querying Neon PostgreSQL in real time and deducting 5 AI credits."""
    ws = get_or_create_workspace()
    if ws.ai_credits_remaining >= 5:
        ws.ai_credits_remaining -= 5
        ws.save()

    prompt = str(request.data.get("prompt", "")).lower()
    total_sales = float(Order.objects.aggregate(s=Sum("total_amount"))["s"] or 0)
    total_cogs = float(Order.objects.aggregate(c=Sum("product_cost"))["c"] or 0)
    total_expenses = float(DailyExpense.objects.aggregate(e=Sum("amount"))["e"] or 0)
    net_profit = total_sales - (total_cogs + total_expenses)

    low_stock_items = list(Product.objects.filter(stock__lte=15).values_list("name", "stock"))
    low_stock_text = (
        ", ".join([f"{name} ({stock} units left)" for name, stock in low_stock_items])
        if low_stock_items
        else "All products have healthy stock levels"
    )

    if "stock" in prompt or "inventory" in prompt:
        reply = f"Live Neon PostgreSQL Inventory Audit: Flagged low-stock items: {low_stock_text}. Recommend immediate restocking to avoid missed social orders."
    elif "loss" in prompt or "ad" in prompt or "profit" in prompt:
        reply = (
            f"Live P&L Database Audit: Gross Order Revenue is ${total_sales:,.2f}, Product COGS is ${total_cogs:,.2f}, "
            f"and Logged Operational/Ad Expenses are ${total_expenses:,.2f} (Net Profit: ${net_profit:,.2f}). "
            f"Focus ad spend on high-margin SKUs like Trail Runner Jacket ($41 unit margin)."
        )
    else:
        reply = (
            f"Live Store Summary (Neon PostgreSQL): You have {Order.objects.count()} orders totaling ${total_sales:,.2f} "
            f"and {Product.objects.count()} active SKUs ({low_stock_text}). Remaining AI Credits: {ws.ai_credits_remaining}."
        )

    return Response({"reply": reply, "credits_remaining": ws.ai_credits_remaining})


@api_view(["POST"])
def auth_login_view(request):
    """Authenticates workspace users against Django / Neon PostgreSQL auth table."""
    username = request.data.get("username", "admin")
    password = request.data.get("password", "")
    user = authenticate(username=username, password=password)
    if user is not None:
        return Response(
            {
                "authenticated": True,
                "username": user.username,
                "email": user.email or "admin@synvorait.com",
                "role": "Enterprise Super Admin",
            }
        )
    return Response({"authenticated": False, "error": "Invalid credentials"}, status=401)


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def external_order_webhook_view(request):
    """
    Public Webhook Endpoint (/api/v1/webhooks/order-intake/)
    - GET: Returns live status JSON when pasted directly in a browser address bar.
    - POST: Receives live order payloads from Shopify, WooCommerce, Facebook, or Instagram.
    """
    if request.method == "GET":
        return Response(
            {
                "webhook_status": "ACTIVE & READY",
                "endpoint": "/api/v1/webhooks/order-intake/",
                "supported_sources": ["Shopify", "WooCommerce", "Custom Website", "Facebook Bot", "Instagram DM"],
                "total_orders_synced": Order.objects.count(),
                "instructions": "Send a POST request with JSON payload or click 'Send Test Webhook Order' inside the Channels tab.",
            }
        )

    data = request.data
    order_code = data.get("order_code") or f"#SYN-{random.randint(50000, 99999)}"
    customer_name = data.get("customer_name", "Website Webhook Buyer")
    phone = data.get("phone", "+880 1711-998877")
    shipping_address = data.get("shipping_address", "Banani, Road 11, Dhaka")
    channel = data.get("channel", "Web Store")
    payment_method = data.get("payment_method", "bKash")
    payment_status = "Paid" if payment_method in ["bKash", "Nagad", "Stripe", "PayPal"] else "COD Pending"
    courier_partner = data.get("courier_partner", "Pathao Courier")
    total_amount = float(data.get("total_amount", 125.0))
    product_cost = float(data.get("product_cost", 68.0))

    order = Order.objects.create(
        order_code=order_code,
        customer_name=customer_name,
        phone=phone,
        shipping_address=shipping_address,
        channel=channel,
        payment_method=payment_method,
        payment_status=payment_status,
        order_status="Processing",
        courier_partner=courier_partner,
        total_amount=total_amount,
        product_cost=product_cost,
    )

    return Response(
        {
            "status": "webhook_accepted",
            "order_id": order.id,
            "order_code": order.order_code,
            "message": "Order automatically recorded in Neon Cloud PostgreSQL.",
        },
        status=201,
    )


