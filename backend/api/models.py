from django.db import models


class Product(models.Model):
    name = models.CharField(max_length=255, default='General Product')
    sku = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=120, default='General')
    available_sizes = models.CharField(max_length=255, blank=True, default='M, L, XL, XXL')
    available_colors = models.CharField(max_length=255, blank=True, default='')
    image_url = models.TextField(blank=True, default='')
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    offer_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, default=None)
    offer_label = models.CharField(max_length=120, blank=True, default='')
    is_on_offer = models.BooleanField(default=False)
    is_clearance = models.BooleanField(default=False)
    stock = models.IntegerField(default=0)
    status = models.CharField(max_length=50, default='In Stock')
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def effective_price(self):
        if self.is_on_offer and self.offer_price is not None and self.offer_price > 0:
            return self.offer_price
        return self.selling_price

    @property
    def unit_profit(self):
        return self.effective_price - self.cost_price

    @property
    def unit_margin_percent(self):
        price = self.effective_price
        if price and price > 0:
            return round(((price - self.cost_price) / price) * 100, 1)
        return 0.0

    def __str__(self):
        return f"{self.name} ({self.sku})"


class Customer(models.Model):
    name = models.CharField(max_length=255, default='Customer')
    email = models.EmailField(blank=True, null=True, default='')
    phone = models.CharField(max_length=50, blank=True, default='')
    address = models.TextField(blank=True, default='')
    channel = models.CharField(max_length=100, default='Facebook DM')
    orders_count = models.IntegerField(default=1)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.phone}"


class Order(models.Model):
    order_id = models.CharField(max_length=50, unique=True)
    customer = models.CharField(max_length=255, default='Walk-in Customer')
    customer_phone = models.CharField(max_length=50, blank=True, default='')
    delivery_address = models.TextField(blank=True, default='')
    channel = models.CharField(max_length=100, default='Facebook Ad')
    order_source_type = models.CharField(max_length=80, default='Self-Checkout Button')
    product_name = models.CharField(max_length=255, default='Standard Order')
    product_sku = models.CharField(max_length=100, blank=True, default='')
    selected_size = models.CharField(max_length=100, blank=True, default='')
    selected_color = models.CharField(max_length=100, blank=True, default='')
    order_image = models.TextField(blank=True, default='')
    customer_notes = models.TextField(blank=True, default='')
    quantity = models.IntegerField(default=1)
    regular_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    cogs_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    net_profit = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    offer_applied = models.CharField(max_length=120, blank=True, default='')
    stock_deducted = models.BooleanField(default=False)
    payment = models.CharField(max_length=50, default='COD')
    status = models.CharField(max_length=50, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.order_id} - {self.customer}"


class DailyExpense(models.Model):
    date = models.DateField(auto_now_add=True)
    title = models.CharField(max_length=255, default='Daily Expense')
    category = models.CharField(max_length=100, default='Marketing / Ads')
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    notes = models.TextField(blank=True, null=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.amount}"


class SocialPost(models.Model):
    caption = models.TextField(default='')
    banner_url = models.TextField(blank=True, default='')
    product_name = models.CharField(max_length=255, blank=True, default='')
    platforms = models.CharField(max_length=255, default='Facebook, Instagram')
    status = models.CharField(max_length=50, default='Published')
    scheduled_for = models.CharField(max_length=100, default='Published Immediately')
    auto_dm_trigger = models.CharField(max_length=100, default='PRICE')
    views_count = models.IntegerField(default=120)
    likes_count = models.IntegerField(default=18)
    comments_count = models.IntegerField(default=6)
    shares_count = models.IntegerField(default=4)
    is_boosted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class ChannelConfig(models.Model):
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=100, default='Social Commerce')
    connected = models.BooleanField(default=False)
    store_url = models.CharField(max_length=255, blank=True, default='')
    api_key = models.CharField(max_length=255, blank=True, default='')
    webhook_secret = models.CharField(max_length=255, blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)


class PaymentGatewayConfig(models.Model):
    provider = models.CharField(max_length=100, unique=True)
    region = models.CharField(max_length=100, default='Bangladesh & Global')
    connected = models.BooleanField(default=False)
    merchant_id = models.CharField(max_length=255, blank=True, default='')
    public_key = models.CharField(max_length=255, blank=True, default='')
    secret_key = models.CharField(max_length=255, blank=True, default='')
    sandbox_mode = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)


class WorkspaceConfig(models.Model):
    workspace_name = models.CharField(max_length=255, default='My Business Store')
    active_plan = models.CharField(max_length=50, default='Pro')
    ai_credits_remaining = models.IntegerField(default=4200)
    ai_credits_total = models.IntegerField(default=5000)
    custom_openai_key = models.CharField(max_length=255, blank=True, default='')
    webhook_token = models.CharField(max_length=255, default='syn_wh_live_9981234x')
    monthly_staff_cost = models.DecimalField(max_digits=12, decimal_places=2, default=1200.00)
    advanced_settings = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)