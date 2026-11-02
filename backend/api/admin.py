from django.contrib import admin
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

admin.site.register(Product)
admin.site.register(Customer)
admin.site.register(Order)
admin.site.register(DailyExpense)
admin.site.register(SocialPost)
admin.site.register(ChannelConfig)
admin.site.register(PaymentGatewayConfig)
admin.site.register(WorkspaceConfig)