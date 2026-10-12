from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from users.scoping import scoped_queryset
from users.permissions import require_permission
from .models import ReportConfig
from .serializers import ReportConfigSerializer

class ReportConfigViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, require_permission('accounts.reports.view', 'accounts.reports.export')]
    serializer_class = ReportConfigSerializer

    def get_queryset(self):
        return scoped_queryset(ReportConfig.objects.all(), self.request.user)

    def perform_create(self, serializer):
        serializer.save(company=getattr(self.request.user, 'company', None))
