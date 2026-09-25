from rest_framework import serializers
from .models import Assignment

class AssignmentSerializer(serializers.ModelSerializer):
    order_id = serializers.CharField(source='order_service.order.order_id', read_only=True)
    service_name = serializers.CharField(source='order_service.service_name', read_only=True, default='')
    customer_name = serializers.CharField(source='order_service.order.customer', read_only=True, default='')

    class Meta:
        model = Assignment
        fields = "__all__"
