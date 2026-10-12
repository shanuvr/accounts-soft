from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, PaymentScheduleViewSet, ExternalPaymentSyncView

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'paymentschedules', PaymentScheduleViewSet, basename='paymentschedule')

urlpatterns = [
    path('external-sync/', ExternalPaymentSyncView.as_view(), name='payment-external-sync'),
    path("", include(router.urls)),
]