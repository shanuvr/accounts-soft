from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import AuditLog
from .serializers import AuditLogSerializer

class AuditLogViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
