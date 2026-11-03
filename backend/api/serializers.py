from rest_framework import serializers
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


class ProductSerializer(serializers.ModelSerializer):
    effective_price = serializers.ReadOnlyField()
    unit_profit = serializers.ReadOnlyField()
    unit_margin_percent = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'sku',
            'category',
            'available_sizes',
            'available_colors',
            'image_url',
            'cost_price',
            'selling_price',
            'offer_price',
            'offer_label',
            'is_on_offer',
            'is_clearance',
            'effective_price',
            'unit_profit',
            'unit_margin_percent',
            'stock',
            'status',
            'created_at',
        ]


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'


class DailyExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyExpense
        fields = '__all__'


class SocialPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialPost
        fields = '__all__'


class ChannelConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChannelConfig
        fields = '__all__'


class PaymentGatewayConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentGatewayConfig
        fields = '__all__'


class WorkspaceConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkspaceConfig
        fields = '__all__'