from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from users.scoping import scoped_queryset
from .models import Renewal
from .serializers import RenewalSerializer


class RenewalViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = RenewalSerializer
    search_fields = ['type', 'name', 'customer']

    def get_queryset(self):
        return scoped_queryset(Renewal.objects.all(), self.request.user)

    def perform_create(self, serializer):
        serializer.save(company=getattr(self.request.user, 'company', None))