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
    WorkspaceConfigAPIView,
    OrderIntakeWebhookView,
    PublicStorefrontAPIView,
    DashboardSummaryAPIView,
    AuthLoginAPIView,
)

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'expenses', DailyExpenseViewSet)
router.register(r'social-posts', SocialPostViewSet)
router.register(r'channels', ChannelConfigViewSet)
router.register(r'payment-gateways', PaymentGatewayConfigViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/summary/', DashboardSummaryAPIView.as_view(), name='dashboard-summary'),
    path('api/v1/workspace/', WorkspaceConfigAPIView.as_view(), name='workspace-config'),
    path('api/v1/webhooks/order-intake/', OrderIntakeWebhookView.as_view(), name='webhook-order-intake'),
    path('api/v1/public-store/', PublicStorefrontAPIView.as_view(), name='public-store'),
    path('api/v1/auth-login/', AuthLoginAPIView.as_view(), name='auth-login'),
    path('api/v1/', include(router.urls)),
]