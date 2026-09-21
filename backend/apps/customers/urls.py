from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, CustomerTypeViewSet, ProductViewSet, ProductCategoryViewSet, EmployeeViewSet, DepartmentViewSet, UOMViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'customertypes', CustomerTypeViewSet, basename='customertype')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'productcategories', ProductCategoryViewSet, basename='productcategory')
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'uoms', UOMViewSet, basename='uom')

urlpatterns = [
    path("", include(router.urls)),
]