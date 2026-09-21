from rest_framework import serializers
from .models import Order, OrderService

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = "__all__"

class OrderServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderService
        fields = "__all__"
