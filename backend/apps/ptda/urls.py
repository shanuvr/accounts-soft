from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PTDATemplateViewSet, PTDAViewSet

router = DefaultRouter()
router.register(r'ptdatemplates', PTDATemplateViewSet, basename='ptdatemplate')
router.register(r'ptdas', PTDAViewSet, basename='ptda')

urlpatterns = [
    path("", include(router.urls)),
]