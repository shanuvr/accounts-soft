from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import ReportConfig
from .serializers import ReportConfigSerializer

class ReportConfigViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = ReportConfig.objects.all()
    serializer_class = ReportConfigSerializer
