from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PTDATemplateViewSet, PTDAViewSet, ExternalPtdRequestsView, ExternalPtdDecisionView

router = DefaultRouter()
router.register(r'ptdatemplates', PTDATemplateViewSet, basename='ptdatemplate')
router.register(r'ptdas', PTDAViewSet, basename='ptda')

urlpatterns = [
    path('external-requests/', ExternalPtdRequestsView.as_view(), name='ptda-external-requests'),
    path('external-decision/', ExternalPtdDecisionView.as_view(), name='ptda-external-decision'),
    path("", include(router.urls)),
]