"""
@file api/models.py
@description Complete production database schema for SYNVORA OS stored in Neon Cloud PostgreSQL:
- Product, Customer, Order, DailyExpense, SocialPost
- ChannelConfig: Stores client's Shopify, WooCommerce, Facebook, Instagram, TikTok API credentials.
- PaymentGatewayConfig: Stores client's bKash, Nagad, SSLCOMMERZ, Stripe, PayPal & Courier keys.
- WorkspaceConfig: Stores active subscription tier (Starter/Pro/Enterprise), AI credits, and company settings.
"""

from django.db import models


class Product(models.Model):
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=100, default="General")
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    reorder_point = models.IntegerField(default=15)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def unit_profit(self):
        return self.selling_price - self.cost_price

    def __str__(self):
        return f"{self.name} ({self.sku})"


class Customer(models.Model):
    name = models.CharField(max_length=255)
    contact = models.CharField(max_length=255)
    source_channel = models.CharField(max_length=100, default="Web Store")
    segment = models.CharField(max_length=100, default="Regular")
    total_orders = models.IntegerField(default=0)
    lifetime_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Order(models.Model):
    order_code = models.CharField(max_length=50, unique=True)
    customer_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50)
    shipping_address = models.TextField()
    channel = models.CharField(max_length=100, default="Web Store")
    payment_method = models.CharField(max_length=100, default="Cash on Delivery (COD)")
    payment_status = models.CharField(max_length=50, default="COD Pending")
    order_status = models.CharField(max_length=50, default="Processing")
    courier_partner = models.CharField(max_length=100, default="Pathao Courier")
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    product_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.order_code} - {self.customer_name}"


class DailyExpense(models.Model):
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    expense_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} (-${self.amount})"


class SocialPost(models.Model):
    caption = models.TextField()
    platforms = models.CharField(max_length=255)
    auto_reply_keyword = models.CharField(max_length=50, blank=True, default="PRICE")
    is_scheduled = models.BooleanField(default=False)
    status = models.CharField(max_length=50, default="Published")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Post on {self.platforms} ({self.status})"


class ChannelConfig(models.Model):
    name = models.CharField(max_length=100, unique=True)
    channel_type = models.CharField(max_length=100, default="Storefront")
    domain_or_handle = models.CharField(max_length=255, blank=True, default="")
    api_key = models.CharField(max_length=255, blank=True, default="")
    api_secret_or_token = models.CharField(max_length=255, blank=True, default="")
    is_connected = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({'Connected' if self.is_connected else 'Disconnected'})"


class PaymentGatewayConfig(models.Model):
    provider_name = models.CharField(max_length=100, unique=True)
    region = models.CharField(max_length=100, default="Bangladesh / Global")
    merchant_id = models.CharField(max_length=255, blank=True, default="")
    api_key = models.CharField(max_length=255, blank=True, default="")
    secret_key = models.CharField(max_length=255, blank=True, default="")
    settlement_account = models.CharField(max_length=255, blank=True, default="")
    is_active = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.provider_name} ({'Active' if self.is_active else 'Inactive'})"


class WorkspaceConfig(models.Model):
    business_name = models.CharField(max_length=255, default="Northwind Outfitters")
    support_email = models.CharField(max_length=255, default="contact@synvorait.com")
    business_phone = models.CharField(max_length=100, default="+880 1353-523193")
    business_address = models.TextField(default="South Ibrahimpur Shimultala, Dhaka 1206")
    currency = models.CharField(max_length=20, default="USD")
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    invoice_prefix = models.CharField(max_length=20, default="#SYN-")
    active_plan = models.CharField(max_length=50, default="Starter")  # Starter, Pro, Enterprise
    ai_credits_remaining = models.IntegerField(default=850)
    ai_credits_limit = models.IntegerField(default=1000)
    custom_ai_provider = models.CharField(max_length=50, default="Google Gemini")
    custom_ai_api_key = models.CharField(max_length=255, blank=True, default="")
    auto_comment_reply = models.BooleanField(default=True)
    auto_courier_dispatch = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.business_name} - {self.active_plan} Plan"