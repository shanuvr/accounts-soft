from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, OrderServiceViewSet

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'orderservices', OrderServiceViewSet, basename='orderservice')

urlpatterns = [
    path("", include(router.urls)),
]