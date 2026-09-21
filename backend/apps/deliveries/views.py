from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Delivery
from .serializers import DeliverySerializer

class DeliveryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer
