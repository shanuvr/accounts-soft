from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Order, OrderService
from .serializers import OrderSerializer, OrderServiceSerializer

class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class OrderServiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = OrderService.objects.all()
    serializer_class = OrderServiceSerializer
