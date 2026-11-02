"""
@file api/serializers.py
@description Complete REST serializers for all SYNVORA OS models.
"""

from django.utils.html import strip_tags
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
    unit_profit = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = "__all__"


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = "__all__"


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = "__all__"


class DailyExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyExpense
        fields = "__all__"


class SocialPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialPost
        fields = "__all__"


class ChannelConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChannelConfig
        fields = "__all__"


class PaymentGatewayConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentGatewayConfig
        fields = "__all__"


class WorkspaceConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkspaceConfig
        fields = "__all__"