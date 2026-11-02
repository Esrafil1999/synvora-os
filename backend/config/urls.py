"""
@file config/urls.py
@description Master URL router exposing all REST API & Webhook endpoints under /api/v1/
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    ProductViewSet,
    CustomerViewSet,
    OrderViewSet,
    DailyExpenseViewSet,
    SocialPostViewSet,
    ChannelConfigViewSet,
    PaymentGatewayConfigViewSet,
    workspace_config_view,
    pnl_summary_view,
    ai_copilot_query_view,
    auth_login_view,
    external_order_webhook_view,
)

router = DefaultRouter()
router.register(r"products", ProductViewSet)
router.register(r"customers", CustomerViewSet)
router.register(r"orders", OrderViewSet)
router.register(r"expenses", DailyExpenseViewSet)
router.register(r"social-posts", SocialPostViewSet)
router.register(r"channels", ChannelConfigViewSet)
router.register(r"gateways", PaymentGatewayConfigViewSet)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(router.urls)),
    path("api/v1/workspace/", workspace_config_view, name="workspace-config"),
    path("api/v1/pnl-summary/", pnl_summary_view, name="pnl-summary"),
    path("api/v1/ai-copilot/", ai_copilot_query_view, name="ai-copilot"),
    path("api/v1/auth-login/", auth_login_view, name="auth-login"),
    path("api/v1/webhooks/order-intake/", external_order_webhook_view, name="order-webhook"),
]