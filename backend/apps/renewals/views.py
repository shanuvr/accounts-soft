from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Renewal
from .serializers import RenewalSerializer


class RenewalViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Renewal.objects.all()
    serializer_class = RenewalSerializer
    search_fields = ['type', 'name', 'customer']