import json
import random
import urllib.parse
import urllib.request
from decimal import Decimal
from django.db import connection, transaction
from django.db.models import Sum
from django.contrib.auth import authenticate
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

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
from .security import HasSynvoraSecurityKeyOrAdmin

_SCHEMA_VERIFIED = False


def ensure_database_schema():
    global _SCHEMA_VERIFIED
    if _SCHEMA_VERIFIED:
        return
    try:
        with connection.cursor() as cursor:
            if connection.vendor == "postgresql":
                statements = [
                    "ALTER TABLE api_product ADD COLUMN IF NOT EXISTS available_sizes VARCHAR(255) DEFAULT 'M, L, XL, XXL';",
                    "ALTER TABLE api_product ADD COLUMN IF NOT EXISTS available_colors VARCHAR(255) DEFAULT '';",
                    "ALTER TABLE api_product ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';",
                    "ALTER TABLE api_product ADD COLUMN IF NOT EXISTS offer_price NUMERIC(12,2) NULL;",
                    "ALTER TABLE api_product ADD COLUMN IF NOT EXISTS offer_label VARCHAR(120) DEFAULT '';",
                    "ALTER TABLE api_product ADD COLUMN IF NOT EXISTS is_on_offer BOOLEAN DEFAULT FALSE;",
                    "ALTER TABLE api_product ADD COLUMN IF NOT EXISTS is_clearance BOOLEAN DEFAULT FALSE;",
                    "ALTER TABLE api_order ADD COLUMN IF NOT EXISTS selected_size VARCHAR(100) DEFAULT '';",
                    "ALTER TABLE api_order ADD COLUMN IF NOT EXISTS selected_color VARCHAR(100) DEFAULT '';",
                    "ALTER TABLE api_order ADD COLUMN IF NOT EXISTS order_image TEXT DEFAULT '';",
                    "ALTER TABLE api_order ADD COLUMN IF NOT EXISTS customer_notes TEXT DEFAULT '';",
                    "ALTER TABLE api_order ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50) DEFAULT '';",
                    "ALTER TABLE api_order ADD COLUMN IF NOT EXISTS delivery_address TEXT DEFAULT '';",
                    "ALTER TABLE api_order ADD COLUMN IF NOT EXISTS order_source_type VARCHAR(80) DEFAULT 'Self-Checkout';",
                    "ALTER TABLE api_order ADD COLUMN IF NOT EXISTS product_sku VARCHAR(100) DEFAULT '';",
                    "ALTER TABLE api_order ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;",
                    "ALTER TABLE api_order ADD COLUMN IF NOT EXISTS regular_amount NUMERIC(12,2) DEFAULT 0.00;",
                    "ALTER TABLE api_order ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) DEFAULT 0.00;",
                    "ALTER TABLE api_order ADD COLUMN IF NOT EXISTS cogs_amount NUMERIC(12,2) DEFAULT 0.00;",
                    "ALTER TABLE api_order ADD COLUMN IF NOT EXISTS net_profit NUMERIC(12,2) DEFAULT 0.00;",
                    "ALTER TABLE api_order ADD COLUMN IF NOT EXISTS offer_applied VARCHAR(120) DEFAULT '';",
                    "ALTER TABLE api_order ADD COLUMN IF NOT EXISTS stock_deducted BOOLEAN DEFAULT FALSE;",
                    "ALTER TABLE api_socialpost ADD COLUMN IF NOT EXISTS banner_url TEXT DEFAULT '';",
                    "ALTER TABLE api_socialpost ADD COLUMN IF NOT EXISTS product_name VARCHAR(255) DEFAULT '';",
                    "ALTER TABLE api_socialpost ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 120;",
                    "ALTER TABLE api_socialpost ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT FALSE;",
                    "ALTER TABLE api_workspaceconfig ADD COLUMN IF NOT EXISTS advanced_settings JSONB DEFAULT '{}'::jsonb;",
                ]
                for sql in statements:
                    cursor.execute(sql)
        _SCHEMA_VERIFIED = True
    except Exception:
        pass


def ensure_seed_data():
    ensure_database_schema()
    if not WorkspaceConfig.objects.exists():
        WorkspaceConfig.objects.create(
            workspace_name="My Business Store",
            active_plan="Pro",
            ai_credits_remaining=4200,
            ai_credits_total=5000,
            monthly_staff_cost=Decimal("1200.00"),
        )

    if not ChannelConfig.objects.exists():
        default_channels = [
            ("Custom Website / Storefront", "Website Webhook", True, "https://www.synvorait.com"),
            ("Shopify Store", "E-Commerce API", False, ""),
            ("WooCommerce / WordPress", "E-Commerce API", False, ""),
            ("Facebook Page & Messenger", "Meta Graph API", True, "https://facebook.com/mybusiness"),
            ("Instagram Business DM", "Meta Graph API", True, "https://instagram.com/mybusiness"),
            ("WhatsApp Business API", "Meta Cloud API", True, "+8801700000000"),
            ("TikTok Shop & Business", "TikTok API", False, ""),
        ]
        for name, cat, conn, url in default_channels:
            ChannelConfig.objects.create(name=name, category=cat, connected=conn, store_url=url)

    if not PaymentGatewayConfig.objects.exists():
        default_gateways = [
            ("bKash Tokenized Checkout", "Bangladesh (MFS)", True),
            ("Nagad Merchant PGW", "Bangladesh (MFS)", True),
            ("SSLCOMMERZ Payment Gateway", "Bangladesh (Cards & MFS)", False),
            ("Stripe Global Checkout", "Global (Cards & Apple Pay)", True),
            ("PayPal Commerce Platform", "Global Wallet", False),
            ("Pathao & Steadfast Courier COD", "Logistics & Cash on Delivery", True),
        ]
        for prov, reg, conn in default_gateways:
            PaymentGatewayConfig.objects.create(provider=prov, region=reg, connected=conn)


def to_decimal(val, default="0.00") -> Decimal:
    try:
        if val is None or val == "":
            return Decimal(default)
        return Decimal(str(val))
    except Exception:
        return Decimal(default)


def process_order_creation(payload: dict) -> Order:
    ensure_database_schema()
    with transaction.atomic():
        customer_name = (
            str(payload.get("customer") or payload.get("customer_name") or "Customer").strip()
            or "Customer"
        )
        customer_phone = str(payload.get("customer_phone") or payload.get("phone") or "").strip()
        delivery_address = str(
            payload.get("delivery_address") or payload.get("shipping_address") or payload.get("address") or ""
        ).strip()
        channel = str(payload.get("channel") or "Website Checkout").strip()
        order_source_type = str(payload.get("order_source_type") or "Self-Checkout Button").strip()
        payment_method = str(payload.get("payment") or payload.get("payment_method") or "COD").strip()
        order_status = str(payload.get("status") or payload.get("order_status") or "Confirmed").strip()
        selected_size = str(payload.get("selected_size") or payload.get("size") or "Standard").strip()
        selected_color = str(payload.get("selected_color") or payload.get("color") or "Standard").strip()
        order_image = str(payload.get("order_image") or "").strip()
        customer_notes = str(payload.get("customer_notes") or "").strip()

        try:
            quantity = max(1, int(payload.get("quantity", 1)))
        except (ValueError, TypeError):
            quantity = 1

        custom_discount = to_decimal(payload.get("extra_discount"), "0.00")

        product_id = payload.get("product_id")
        product_sku = str(payload.get("product_sku", "")).strip()
        product_name_input = str(payload.get("product_name", "")).strip()

        matched_product = None
        if product_id:
            try:
                matched_product = Product.objects.select_for_update().filter(id=int(product_id)).first()
            except (ValueError, TypeError):
                matched_product = None
        if not matched_product and product_sku:
            matched_product = Product.objects.select_for_update().filter(sku__iexact=product_sku).first()
        if not matched_product and product_name_input:
            matched_product = Product.objects.select_for_update().filter(name__iexact=product_name_input).first()

        stock_deducted = False
        offer_applied = str(payload.get("offer_applied", "")).strip()

        if matched_product:
            product_name = matched_product.name
            product_sku = matched_product.sku
            if not order_image and matched_product.image_url:
                order_image = matched_product.image_url
            if not selected_size and matched_product.available_sizes:
                selected_size = matched_product.available_sizes.split(",")[0].strip()

            unit_regular = matched_product.selling_price
            unit_cost = matched_product.cost_price

            if matched_product.is_on_offer and matched_product.offer_price and matched_product.offer_price > 0:
                unit_effective = matched_product.offer_price
                if not offer_applied:
                    offer_applied = matched_product.offer_label or (
                        "Stock Clearance" if matched_product.is_clearance else "Promotional Offer"
                    )
            else:
                unit_effective = matched_product.selling_price

            regular_amount = unit_regular * quantity
            subtotal_effective = unit_effective * quantity
            final_amount = max(Decimal("0.00"), subtotal_effective - custom_discount)
            discount_amount = max(Decimal("0.00"), regular_amount - final_amount)
            cogs_amount = unit_cost * quantity
            net_profit = final_amount - cogs_amount

            if order_status not in ["Cancelled", "Returned"]:
                matched_product.stock = max(0, matched_product.stock - quantity)
                if matched_product.stock == 0:
                    matched_product.status = "Out of Stock"
                elif matched_product.stock <= 15:
                    matched_product.status = "Low Stock"
                else:
                    matched_product.status = "In Stock"
                matched_product.save()
                stock_deducted = True
        else:
            product_name = product_name_input or "Custom Product Order"
            raw_amt = payload.get("amount") or payload.get("total_amount") or "0.00"
            raw_cost = payload.get("cogs_amount") or payload.get("product_cost") or "0.00"
            unit_or_total = to_decimal(raw_amt, "0.00")
            provided_cost = to_decimal(raw_cost, "0.00")
            regular_amount = unit_or_total * quantity if payload.get("is_unit_price") else unit_or_total
            final_amount = max(Decimal("0.00"), regular_amount - custom_discount)
            discount_amount = max(Decimal("0.00"), regular_amount - final_amount)
            cogs_amount = (
                provided_cost * quantity
                if (provided_cost > 0 and payload.get("is_unit_price"))
                else (provided_cost if provided_cost > 0 else (final_amount * Decimal("0.55")).quantize(Decimal("0.01")))
            )
            net_profit = final_amount - cogs_amount

        order_id_str = (
            payload.get("order_id")
            or payload.get("order_code")
            or f"#SYN-{random.randint(10000, 99999)}"
        )
        if Order.objects.filter(order_id=order_id_str).exists():
            order_id_str = f"#SYN-{random.randint(10000, 99999)}"

        new_order = Order.objects.create(
            order_id=order_id_str,
            customer=customer_name,
            customer_phone=customer_phone,
            delivery_address=delivery_address,
            channel=channel,
            order_source_type=order_source_type,
            product_name=product_name,
            product_sku=product_sku,
            selected_size=selected_size,
            selected_color=selected_color,
            order_image=order_image,
            customer_notes=customer_notes,
            quantity=quantity,
            regular_amount=regular_amount,
            discount_amount=discount_amount,
            amount=final_amount,
            cogs_amount=cogs_amount,
            net_profit=net_profit,
            offer_applied=offer_applied,
            stock_deducted=stock_deducted,
            payment=payment_method,
            status=order_status,
        )

        crm_customer = None
        if customer_phone:
            crm_customer = Customer.objects.filter(phone=customer_phone).first()
        if not crm_customer:
            crm_customer = Customer.objects.filter(name__iexact=customer_name).first()

        if crm_customer:
            crm_customer.orders_count += 1
            crm_customer.total_spent += final_amount
            if delivery_address:
                crm_customer.address = delivery_address
            if customer_phone:
                crm_customer.phone = customer_phone
            crm_customer.channel = channel
            crm_customer.save()
        else:
            Customer.objects.create(
                name=customer_name,
                phone=customer_phone or "N/A",
                address=delivery_address,
                channel=channel,
                orders_count=1,
                total_spent=final_amount,
            )

        return new_order


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [HasSynvoraSecurityKeyOrAdmin]

    def get_queryset(self):
        ensure_database_schema()
        return Product.objects.all().order_by('-created_at')

    def create(self, request, *args, **kwargs):
        ensure_database_schema()
        data = request.data.copy() if isinstance(request.data, dict) else {}

        name = str(data.get("name", "New Product")).strip() or "New Product"
        raw_sku = str(data.get("sku", "")).strip().upper()
        if not raw_sku:
            raw_sku = f"PRD-{random.randint(100, 999)}"
        if Product.objects.filter(sku__iexact=raw_sku).exists():
            raw_sku = f"{raw_sku}-{random.randint(10, 99)}"

        category = str(data.get("category", "General")).strip() or "General"
        available_sizes = str(data.get("available_sizes", "M, L, XL, XXL")).strip() or "Standard"
        available_colors = str(data.get("available_colors", "")).strip()
        image_url = str(data.get("image_url", "")).strip()
        cost_price = to_decimal(data.get("cost_price"), "0.00")
        selling_price = to_decimal(data.get("selling_price"), "0.00")
        is_on_offer = bool(data.get("is_on_offer", False))
        offer_price_raw = data.get("offer_price")
        offer_price = to_decimal(offer_price_raw, "0.00") if (is_on_offer and offer_price_raw) else None
        offer_label = str(data.get("offer_label", "")).strip()
        is_clearance = bool(data.get("is_clearance", False))

        try:
            stock = max(0, int(data.get("stock", 0)))
        except (ValueError, TypeError):
            stock = 0

        status_val = "Out of Stock" if stock == 0 else ("Low Stock" if stock <= 15 else "In Stock")

        product = Product.objects.create(
            name=name,
            sku=raw_sku,
            category=category,
            available_sizes=available_sizes,
            available_colors=available_colors,
            image_url=image_url,
            cost_price=cost_price,
            selling_price=selling_price,
            offer_price=offer_price,
            offer_label=offer_label,
            is_on_offer=is_on_offer,
            is_clearance=is_clearance,
            stock=stock,
            status=status_val,
        )
        return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        ensure_database_schema()
        instance = serializer.save()
        if instance.stock == 0:
            instance.status = 'Out of Stock'
        elif instance.stock <= 15:
            instance.status = 'Low Stock'
        else:
            instance.status = 'In Stock'
        instance.save()


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('-total_spent')
    serializer_class = CustomerSerializer
    permission_classes = [HasSynvoraSecurityKeyOrAdmin]


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [HasSynvoraSecurityKeyOrAdmin]

    def get_queryset(self):
        ensure_database_schema()
        return Order.objects.all().order_by('-created_at')

    def create(self, request, *args, **kwargs):
        order = process_order_creation(request.data)
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        ensure_database_schema()
        with transaction.atomic():
            order = self.get_object()
            old_status = order.status
            new_status = request.data.get("status") or request.data.get("order_status") or old_status

            if new_status in ["Cancelled", "Returned"] and order.stock_deducted:
                prod = Product.objects.select_for_update().filter(sku__iexact=order.product_sku).first()
                if not prod and order.product_name:
                    prod = Product.objects.select_for_update().filter(name__iexact=order.product_name).first()
                if prod:
                    prod.stock += order.quantity
                    prod.status = 'Out of Stock' if prod.stock == 0 else ('Low Stock' if prod.stock <= 15 else 'In Stock')
                    prod.save()
                order.stock_deducted = False

            elif old_status in ["Cancelled", "Returned"] and new_status not in ["Cancelled", "Returned"] and not order.stock_deducted:
                prod = Product.objects.select_for_update().filter(sku__iexact=order.product_sku).first()
                if not prod and order.product_name:
                    prod = Product.objects.select_for_update().filter(name__iexact=order.product_name).first()
                if prod:
                    prod.stock = max(0, prod.stock - order.quantity)
                    prod.status = 'Out of Stock' if prod.stock == 0 else ('Low Stock' if prod.stock <= 15 else 'In Stock')
                    prod.save()
                order.stock_deducted = True

            order.status = new_status
            for field in ["payment", "delivery_address", "customer_phone", "selected_size", "selected_color"]:
                if field in request.data:
                    setattr(order, field, request.data[field])
            order.save()
            return Response(OrderSerializer(order).data)


class PublicStorefrontAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        ensure_seed_data()
        ws = WorkspaceConfig.objects.first()
        products = Product.objects.all().order_by('-created_at')
        return Response({
            "store_name": ws.workspace_name if ws else "Official Online Store",
            "products": ProductSerializer(products, many=True).data,
        })

    def post(self, request):
        order = process_order_creation(request.data)
        return Response({
            "success": True,
            "message": "Order confirmed! Inventory deducted and CRM updated.",
            "order": OrderSerializer(order).data,
        }, status=status.HTTP_201_CREATED)


class DailyExpenseViewSet(viewsets.ModelViewSet):
    queryset = DailyExpense.objects.all().order_by('-created_at')
    serializer_class = DailyExpenseSerializer
    permission_classes = [HasSynvoraSecurityKeyOrAdmin]


class SocialPostViewSet(viewsets.ModelViewSet):
    queryset = SocialPost.objects.all().order_by('-created_at')
    serializer_class = SocialPostSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        ensure_database_schema()
        return SocialPost.objects.all().order_by('-created_at')

    def create(self, request, *args, **kwargs):
        ensure_database_schema()
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)

        page_id = data.pop('meta_page_id', None)
        access_token = data.pop('meta_access_token', None)
        platform = str(data.get('platform', '')).lower()
        status_val = str(data.get('status', 'Published'))

        live_api_result = None
        if status_val == 'Published' and page_id and access_token and platform == 'facebook':
            try:
                fb_url = f"https://graph.facebook.com/v19.0/{page_id}/feed"
                payload = urllib.parse.urlencode({
                    'message': data.get('content', ''),
                    'access_token': access_token
                }).encode('utf-8')
                req = urllib.request.Request(fb_url, data=payload, method='POST')
                with urllib.request.urlopen(req, timeout=10) as resp:
                    live_api_result = json.loads(resp.read().decode('utf-8'))
            except Exception as e:
                live_api_result = {'warning': str(e)}

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        response_data = dict(serializer.data)
        if live_api_result:
            response_data['live_api_result'] = live_api_result
        return Response(response_data, status=status.HTTP_201_CREATED)


SocialPostListCreateView = SocialPostViewSet


class ChannelConfigViewSet(viewsets.ModelViewSet):
    queryset = ChannelConfig.objects.all().order_by('id')
    serializer_class = ChannelConfigSerializer
    permission_classes = [HasSynvoraSecurityKeyOrAdmin]


class PaymentGatewayConfigViewSet(viewsets.ModelViewSet):
    queryset = PaymentGatewayConfig.objects.all().order_by('id')
    serializer_class = PaymentGatewayConfigSerializer
    permission_classes = [HasSynvoraSecurityKeyOrAdmin]


class WorkspaceConfigAPIView(APIView):
    permission_classes = [HasSynvoraSecurityKeyOrAdmin]

    def get(self, request):
        ensure_seed_data()
        config = WorkspaceConfig.objects.first()
        data = WorkspaceConfigSerializer(config).data
        if isinstance(config.advanced_settings, dict):
            data.update(config.advanced_settings)
        return Response(data)

    def patch(self, request):
        ensure_seed_data()
        config = WorkspaceConfig.objects.first()
        adv = dict(config.advanced_settings) if isinstance(config.advanced_settings, dict) else {}
        for k, v in request.data.items():
            if not hasattr(config, k):
                adv[k] = v
        payload = dict(request.data)
        payload["advanced_settings"] = adv
        if "business_name" in request.data and "workspace_name" not in request.data:
            payload["workspace_name"] = request.data["business_name"]

        serializer = WorkspaceConfigSerializer(config, data=payload, partial=True)
        if serializer.is_valid():
            saved = serializer.save()
            resp = WorkspaceConfigSerializer(saved).data
            resp.update(adv)
            return Response(resp)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderIntakeWebhookView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        ensure_database_schema()
        return Response({
            "status": "Active",
            "webhook_endpoint": "/api/v1/webhooks/order-intake/",
            "supported_platforms": ["Custom Website", "WooCommerce / WordPress", "Shopify"],
            "method": "Send HTTP POST with JSON order payload (customer, phone, address, product_name, quantity, amount, payment) to automatically create order, deduct inventory stock, and update CRM.",
            "total_orders_synced": Order.objects.count(),
        }, status=status.HTTP_200_OK)

    def post(self, request):
        payload = request.data.copy() if isinstance(request.data, dict) else {}
        payload.setdefault("order_source_type", "Website Webhook")
        order = process_order_creation(payload)
        return Response({
            "status": "Order Captured, Stock Deducted & Synced to CRM",
            "order": OrderSerializer(order).data,
        }, status=status.HTTP_201_CREATED)


class DashboardSummaryAPIView(APIView):
    permission_classes = [HasSynvoraSecurityKeyOrAdmin]

    def get(self, request):
        ensure_seed_data()
        active_orders = Order.objects.exclude(status__in=['Cancelled', 'Returned'])
        gross_revenue = active_orders.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        total_cogs = active_orders.aggregate(total=Sum('cogs_amount'))['total'] or Decimal('0.00')
        total_discounts = active_orders.aggregate(total=Sum('discount_amount'))['total'] or Decimal('0.00')
        order_net_profit = active_orders.aggregate(total=Sum('net_profit'))['total'] or Decimal('0.00')
        total_expenses = DailyExpense.objects.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        ws = WorkspaceConfig.objects.first()
        staff_cost = ws.monthly_staff_cost if ws else Decimal('1200.00')
        final_net_profit = order_net_profit - total_expenses - staff_cost

        return Response({
            "total_revenue": float(gross_revenue),
            "total_cogs": float(total_cogs),
            "total_discounts": float(total_discounts),
            "order_net_profit": float(order_net_profit),
            "total_expenses": float(total_expenses),
            "staff_cost": float(staff_cost),
            "net_profit": float(final_net_profit),
            "total_orders": Order.objects.count(),
            "active_customers": Customer.objects.count(),
            "low_stock_count": Product.objects.filter(stock__lte=15).count(),
            "recent_orders": OrderSerializer(Order.objects.all().order_by('-created_at')[:10], many=True).data,
            "products": ProductSerializer(Product.objects.all().order_by('stock')[:10], many=True).data,
            "workspace": WorkspaceConfigSerializer(ws).data if ws else {},
        })


class AuthLoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username", "")
        password = request.data.get("password", "")
        user = authenticate(username=username, password=password)
        if user is not None:
            return Response({
                "authenticated": True,
                "username": user.username,
                "email": user.email,
                "is_superuser": user.is_superuser,
            })
        return Response({"authenticated": False, "error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)