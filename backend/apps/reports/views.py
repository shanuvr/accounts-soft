from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from users.permissions import require_permission
from .models import ReportConfig
from .serializers import ReportConfigSerializer

class ReportConfigViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, require_permission('accounts.reports.view', 'accounts.reports.export')]
    queryset = ReportConfig.objects.all()
    serializer_class = ReportConfigSerializer
