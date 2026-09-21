from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentMethodViewSet, PaymentTermViewSet, TaxViewSet, DeliveryTypeViewSet, OrderStatusViewSet, PTDAStatusViewSet, AssignmentStatusViewSet, DeliveryStatusViewSet, PaymentStatusViewSet, CategoryViewSet, SubcategoryViewSet

router = DefaultRouter()
router.register(r'paymentmethods', PaymentMethodViewSet, basename='paymentmethod')
router.register(r'paymentterms', PaymentTermViewSet, basename='paymentterm')
router.register(r'taxes', TaxViewSet, basename='tax')
router.register(r'deliverytypes', DeliveryTypeViewSet, basename='deliverytype')
router.register(r'orderstatuses', OrderStatusViewSet, basename='orderstatus')
router.register(r'ptdastatuses', PTDAStatusViewSet, basename='ptdastatus')
router.register(r'assignmentstatuses', AssignmentStatusViewSet, basename='assignmentstatus')
router.register(r'deliverystatuses', DeliveryStatusViewSet, basename='deliverystatus')
router.register(r'paymentstatuses', PaymentStatusViewSet, basename='paymentstatus')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'subcategories', SubcategoryViewSet, basename='subcategory')

urlpatterns = [
    path("", include(router.urls)),
]