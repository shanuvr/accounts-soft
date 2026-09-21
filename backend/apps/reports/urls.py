from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportConfigViewSet

router = DefaultRouter()
router.register(r'reportconfigs', ReportConfigViewSet, basename='reportconfig')

urlpatterns = [
    path("", include(router.urls)),
]