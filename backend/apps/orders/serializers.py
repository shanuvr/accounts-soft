from rest_framework import serializers
from .models import Order, OrderService

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = "__all__"
        extra_kwargs = {'company': {'required': False, 'allow_null': True}}

class OrderServiceSerializer(serializers.ModelSerializer):
    order_id = serializers.CharField(source='order.order_id', read_only=True)

    class Meta:
        model = OrderService
        fields = "__all__"
